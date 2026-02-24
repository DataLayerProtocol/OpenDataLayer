import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import addFormats from 'ajv-formats';
import Ajv, { type ErrorObject } from 'ajv/dist/2020.js';
import { defaultRules } from './rules/index.js';
import { SchemaRegistry } from './schema-registry.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  event?: Record<string, unknown>;
}

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
  params?: Record<string, unknown>;
}

export interface ValidationWarning {
  rule: string;
  message: string;
}

export interface ValidatorOptions {
  schemaDir?: string;
  strict?: boolean;
  rules?: SemanticRule[];
}

export interface SemanticRule {
  name: string;
  description: string;
  validate(event: Record<string, unknown>, context?: Record<string, unknown>): ValidationWarning[];
}

/**
 * Convert an Ajv ErrorObject into our ValidationError shape.
 */
function toValidationError(err: ErrorObject): ValidationError {
  return {
    path: err.instancePath || '/',
    message: err.message ?? 'Unknown validation error',
    keyword: err.keyword,
    params: err.params as Record<string, unknown> | undefined,
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Attempt to locate the schemas/v1 directory relative to the package.
 * Falls back to undefined if not found.
 */
function findDefaultSchemaDir(): string | undefined {
  let dir = __dirname;

  // Try up to 6 levels up (packages/validator/src -> project root)
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'schemas', 'v1');
    try {
      if (statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      // not found at this level, keep going
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return undefined;
}

export class ODLValidator {
  private ajv: Ajv;
  private registry: SchemaRegistry;
  private rules: SemanticRule[];
  private strictMode: boolean;

  constructor(options?: ValidatorOptions) {
    this.strictMode = options?.strict ?? false;
    this.rules = options?.rules ?? [...defaultRules];

    // Create Ajv with Draft 2020-12 support
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
    });

    // Add standard formats (uri, email, date-time, uuid, etc.)
    addFormats(this.ajv);

    // Initialize schema registry
    this.registry = new SchemaRegistry();

    // Load schemas
    const schemaDir = options?.schemaDir ?? findDefaultSchemaDir();
    if (schemaDir) {
      this.registry.loadDirectory(schemaDir);

      // Register all schemas with Ajv
      for (const entry of this.registry.getAll()) {
        try {
          this.ajv.addSchema(entry.schema, entry.$id);
        } catch {
          // Schema may already be registered or have issues; skip
        }
      }
    }
  }

  /** Get the underlying schema registry (for testing / inspection) */
  getRegistry(): SchemaRegistry {
    return this.registry;
  }

  /**
   * Validate a single event against the base event envelope schema
   * and any event-specific schema.
   */
  validate(event: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Step 1: Validate against the base event envelope schema
    const envelopeResult = this.validateEnvelope(event);
    errors.push(...envelopeResult.errors);
    warnings.push(...envelopeResult.warnings);

    // Step 2: If the envelope is valid and has an event name, validate data
    // against the event-specific schema
    if (envelopeResult.valid && typeof event.event === 'string') {
      const eventName = event.event;
      const eventSchema = this.registry.findEventSchema(eventName);

      if (eventSchema) {
        const data = event.data;
        if (data !== undefined && typeof data === 'object' && data !== null) {
          const validate = this.ajv.getSchema(eventSchema.$id);
          if (validate) {
            const dataValid = validate(data);
            if (!dataValid && validate.errors) {
              for (const err of validate.errors) {
                errors.push(
                  toValidationError({
                    ...err,
                    instancePath: `/data${err.instancePath}`,
                  }),
                );
              }
            }
          }
        }
      }
    }

    // Step 3: Run semantic rules
    const context = (event.context as Record<string, unknown>) ?? undefined;
    for (const rule of this.rules) {
      try {
        const ruleWarnings = rule.validate(event, context);
        warnings.push(...ruleWarnings);
      } catch {
        // Rule execution failure should not prevent validation
      }
    }

    // In strict mode, warnings become errors
    if (this.strictMode) {
      for (const warning of warnings) {
        errors.push({
          path: '/',
          message: `[${warning.rule}] ${warning.message}`,
          keyword: 'semanticRule',
          params: { rule: warning.rule },
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: this.strictMode ? [] : warnings,
      event,
    };
  }

  /** Validate an array of events */
  validateBatch(events: Record<string, unknown>[]): ValidationResult[] {
    return events.map((event) => this.validate(event));
  }

  /**
   * Validate just the event envelope (no event-specific schema).
   */
  validateEnvelope(event: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const envelopeSchemaId = 'https://opendatalayer.org/schemas/v1/core/event.schema.json';
    const validate = this.ajv.getSchema(envelopeSchemaId);

    if (validate) {
      const valid = validate(event);
      if (!valid && validate.errors) {
        for (const err of validate.errors) {
          errors.push(toValidationError(err));
        }
      }
    } else {
      // No envelope schema loaded -- perform minimal structural validation
      if (typeof event.event !== 'string') {
        errors.push({
          path: '/event',
          message: "must have a string 'event' property",
          keyword: 'type',
        });
      }
      if (typeof event.id !== 'string') {
        errors.push({
          path: '/id',
          message: "must have a string 'id' property",
          keyword: 'type',
        });
      }
      if (typeof event.timestamp !== 'string') {
        errors.push({
          path: '/timestamp',
          message: "must have a string 'timestamp' property",
          keyword: 'type',
        });
      }
      if (typeof event.specVersion !== 'string') {
        errors.push({
          path: '/specVersion',
          message: "must have a string 'specVersion' property",
          keyword: 'type',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      event,
    };
  }

  /** Check if a schema object itself is valid JSON Schema */
  validateSchema(schema: Record<string, unknown>): boolean {
    try {
      this.ajv.validateSchema(schema);
      return true;
    } catch {
      return false;
    }
  }
}
