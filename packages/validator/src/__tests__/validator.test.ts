import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ODLValidator } from '../validator.js';
import type { SemanticRule, ValidationWarning, ValidatorOptions } from '../validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, '..', '..', '..', '..', 'schemas', 'v1');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validEvent(overrides: Record<string, unknown> = {}) {
  return {
    event: 'page.view',
    id: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: '2024-01-15T10:30:00.000Z',
    specVersion: '1.0.0',
    context: {
      page: { url: 'https://example.com', title: 'Test', path: '/' },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ODLValidator
// ---------------------------------------------------------------------------

describe('ODLValidator', () => {
  // ------------------------------------------------------------------
  // Constructor
  // ------------------------------------------------------------------

  describe('constructor', () => {
    it('creates an instance without options', () => {
      const validator = new ODLValidator();
      expect(validator).toBeInstanceOf(ODLValidator);
    });

    it('creates an instance with explicit schemaDir', () => {
      const validator = new ODLValidator({ schemaDir: schemasDir });
      expect(validator).toBeInstanceOf(ODLValidator);
      // The registry should have loaded schemas from the directory
      expect(validator.getRegistry().size).toBeGreaterThan(0);
    });

    it('creates an instance with strict mode enabled', () => {
      const validator = new ODLValidator({ strict: true });
      expect(validator).toBeInstanceOf(ODLValidator);
    });

    it('accepts custom rules', () => {
      const customRule: SemanticRule = {
        name: 'custom-rule',
        description: 'A test custom rule',
        validate: () => [],
      };
      const validator = new ODLValidator({ rules: [customRule] });
      expect(validator).toBeInstanceOf(ODLValidator);
    });

    it('handles a non-existent schemaDir gracefully (empty registry)', () => {
      const validator = new ODLValidator({ schemaDir: '/nonexistent/path' });
      expect(validator).toBeInstanceOf(ODLValidator);
      expect(validator.getRegistry().size).toBe(0);
    });
  });

  // ------------------------------------------------------------------
  // validate() — valid events
  // ------------------------------------------------------------------

  describe('validate() with valid events', () => {
    let validator: ODLValidator;

    beforeAll(() => {
      // Construct without rules to isolate envelope + schema validation
      validator = new ODLValidator({ rules: [] });
    });

    it('returns valid result for a minimal valid event envelope', () => {
      const result = validator.validate(validEvent());
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.event).toBeDefined();
    });

    it('includes the original event in the result', () => {
      const evt = validEvent();
      const result = validator.validate(evt);
      expect(result.event).toBe(evt);
    });

    it('returns valid result for event with an empty data payload', () => {
      const result = validator.validate(
        validEvent({
          data: {},
        }),
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns valid result for event with data when no event-specific schema exists', () => {
      // Use an event name that has no corresponding schema so data is unchecked
      const result = validator.validate(
        validEvent({
          event: 'custom.unknown_action',
          data: { key: 'value', nested: { foo: 'bar' } },
        }),
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns valid result for event with source metadata', () => {
      const result = validator.validate(
        validEvent({
          source: { name: 'web-sdk', version: '1.0.0' },
        }),
      );
      expect(result.valid).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // validate() — missing required fields
  // ------------------------------------------------------------------

  describe('validate() with missing required fields', () => {
    let validator: ODLValidator;

    beforeAll(() => {
      validator = new ODLValidator({ rules: [] });
    });

    it('returns errors when event field is missing', () => {
      const result = validator.validate({
        id: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: '2024-01-15T10:30:00.000Z',
        specVersion: '1.0.0',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Ajv required errors have the missing property in path or params
      const eventError = result.errors.find(
        (e) =>
          e.path.includes('event') ||
          e.message.includes('event') ||
          (e.params as Record<string, unknown>)?.missingProperty === 'event',
      );
      expect(eventError).toBeDefined();
    });

    it('returns errors when id field is missing', () => {
      const result = validator.validate({
        event: 'page.view',
        timestamp: '2024-01-15T10:30:00.000Z',
        specVersion: '1.0.0',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const idError = result.errors.find(
        (e) =>
          e.path.includes('/id') ||
          e.message.includes("'id'") ||
          (e.params as Record<string, unknown>)?.missingProperty === 'id',
      );
      expect(idError).toBeDefined();
    });

    it('returns errors when timestamp field is missing', () => {
      const result = validator.validate({
        event: 'page.view',
        id: '550e8400-e29b-41d4-a716-446655440000',
        specVersion: '1.0.0',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const tsError = result.errors.find(
        (e) =>
          e.path.includes('timestamp') ||
          e.message.includes('timestamp') ||
          (e.params as Record<string, unknown>)?.missingProperty === 'timestamp',
      );
      expect(tsError).toBeDefined();
    });

    it('returns errors when specVersion field is missing', () => {
      const result = validator.validate({
        event: 'page.view',
        id: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: '2024-01-15T10:30:00.000Z',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const svError = result.errors.find(
        (e) =>
          e.path.includes('specVersion') ||
          e.message.includes('specVersion') ||
          (e.params as Record<string, unknown>)?.missingProperty === 'specVersion',
      );
      expect(svError).toBeDefined();
    });

    it('returns errors when all required fields are missing (empty object)', () => {
      const result = validator.validate({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('returns errors for non-string required fields', () => {
      const result = validator.validate({
        event: 123,
        id: true,
        timestamp: null,
        specVersion: {},
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------------------------------
  // validate() — semantic rule warnings
  // ------------------------------------------------------------------

  describe('validate() returns warnings from semantic rules', () => {
    it('returns warnings from the required-context rule', () => {
      // page.view event without context.page should trigger required-context
      const validator = new ODLValidator();
      const result = validator.validate(
        validEvent({
          context: {}, // missing page context
        }),
      );
      const rcWarnings = result.warnings.filter((w) => w.rule === 'required-context');
      expect(rcWarnings.length).toBeGreaterThan(0);
    });

    it('returns warnings from the consent-before-tracking rule', () => {
      const validator = new ODLValidator();
      const result = validator.validate(
        validEvent({
          event: 'ecommerce.purchase',
          context: {}, // no consent context
        }),
      );
      const consentWarnings = result.warnings.filter((w) => w.rule === 'consent-before-tracking');
      expect(consentWarnings.length).toBeGreaterThan(0);
    });

    it('returns warnings from the ecommerce-consistency rule', () => {
      const validator = new ODLValidator();
      const result = validator.validate(
        validEvent({
          event: 'ecommerce.purchase',
          data: { orderId: 'ORD-1', total: 99.99, products: [] },
          // no currency in data
        }),
      );
      const ecomWarnings = result.warnings.filter((w) => w.rule === 'ecommerce-consistency');
      expect(ecomWarnings.length).toBeGreaterThan(0);
    });

    it('returns warnings from a custom rule', () => {
      const customRule: SemanticRule = {
        name: 'always-warn',
        description: 'Always produces a warning',
        validate: () => [{ rule: 'always-warn', message: 'This is a custom warning' }],
      };
      const validator = new ODLValidator({ rules: [customRule] });
      const result = validator.validate(validEvent());
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            rule: 'always-warn',
            message: 'This is a custom warning',
          }),
        ]),
      );
    });

    it('does not crash when a custom rule throws an error', () => {
      const throwingRule: SemanticRule = {
        name: 'throw-rule',
        description: 'Always throws',
        validate: () => {
          throw new Error('Rule exploded');
        },
      };
      const validator = new ODLValidator({ rules: [throwingRule] });
      const result = validator.validate(validEvent());
      // Validation should still succeed; the throwing rule is silently caught
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  // ------------------------------------------------------------------
  // validateEnvelope()
  // ------------------------------------------------------------------

  describe('validateEnvelope()', () => {
    let validator: ODLValidator;

    beforeAll(() => {
      validator = new ODLValidator({ rules: [] });
    });

    it('returns valid for a correct event envelope', () => {
      const result = validator.validateEnvelope(validEvent());
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for an empty object', () => {
      const result = validator.validateEnvelope({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns errors when event is not a string', () => {
      const result = validator.validateEnvelope({
        event: 42,
        id: '550e8400-e29b-41d4-a716-446655440000',
        timestamp: '2024-01-15T10:30:00.000Z',
        specVersion: '1.0.0',
      });
      expect(result.valid).toBe(false);
    });

    it('includes event reference in the result', () => {
      const evt = validEvent();
      const result = validator.validateEnvelope(evt);
      expect(result.event).toBe(evt);
    });

    it('always returns an empty warnings array', () => {
      const result = validator.validateEnvelope(validEvent());
      expect(result.warnings).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // validateBatch()
  // ------------------------------------------------------------------

  describe('validateBatch()', () => {
    let validator: ODLValidator;

    beforeAll(() => {
      validator = new ODLValidator({ rules: [] });
    });

    it('returns an array of validation results', () => {
      const events = [validEvent(), validEvent({ event: 'page.leave' })];
      const results = validator.validateBatch(events);
      expect(results).toHaveLength(2);
    });

    it('validates each event independently', () => {
      const events = [
        validEvent(), // valid
        {}, // invalid — missing required fields
      ];
      const results = validator.validateBatch(events);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(false);
    });

    it('returns an empty array for an empty input array', () => {
      const results = validator.validateBatch([]);
      expect(results).toEqual([]);
    });

    it('preserves the order of results matching the input order', () => {
      const events = [
        validEvent({ event: 'page.view' }),
        validEvent({ event: 'page.leave' }),
        validEvent({ event: 'page.virtual_view' }),
      ];
      const results = validator.validateBatch(events);
      expect(results).toHaveLength(3);
      expect(results[0].event).toBe(events[0]);
      expect(results[1].event).toBe(events[1]);
      expect(results[2].event).toBe(events[2]);
    });
  });

  // ------------------------------------------------------------------
  // Strict mode
  // ------------------------------------------------------------------

  describe('strict mode', () => {
    it('promotes warnings to errors in strict mode', () => {
      const customRule: SemanticRule = {
        name: 'test-strict-rule',
        description: 'produces a warning',
        validate: () => [{ rule: 'test-strict-rule', message: 'should become error' }],
      };
      const validator = new ODLValidator({
        strict: true,
        rules: [customRule],
      });
      const result = validator.validate(validEvent());
      // In strict mode the result should be invalid due to the promoted warning
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      const promotedError = result.errors.find(
        (e) => e.keyword === 'semanticRule' && e.params?.rule === 'test-strict-rule',
      );
      expect(promotedError).toBeDefined();
      expect(promotedError?.message).toContain('should become error');
    });

    it('clears warnings array in strict mode (moved to errors)', () => {
      const customRule: SemanticRule = {
        name: 'strict-clear',
        description: 'produces a warning',
        validate: () => [{ rule: 'strict-clear', message: 'warning text' }],
      };
      const validator = new ODLValidator({
        strict: true,
        rules: [customRule],
      });
      const result = validator.validate(validEvent());
      expect(result.warnings).toHaveLength(0);
    });

    it('returns valid when there are no warnings in strict mode', () => {
      const validator = new ODLValidator({
        strict: true,
        rules: [], // no rules means no warnings
      });
      const result = validator.validate(validEvent());
      expect(result.valid).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // Custom rules
  // ------------------------------------------------------------------

  describe('custom rules', () => {
    it('replaces default rules when custom rules are provided', () => {
      const customRule: SemanticRule = {
        name: 'only-custom',
        description: 'The only rule',
        validate: () => [{ rule: 'only-custom', message: 'custom fired' }],
      };
      const validator = new ODLValidator({ rules: [customRule] });

      // An ecommerce event without consent context should NOT trigger
      // consent-before-tracking because default rules were replaced
      const result = validator.validate(validEvent({ event: 'ecommerce.purchase', context: {} }));

      const ruleNames = result.warnings.map((w) => w.rule);
      expect(ruleNames).toContain('only-custom');
      expect(ruleNames).not.toContain('consent-before-tracking');
      expect(ruleNames).not.toContain('required-context');
    });

    it('supports multiple custom rules', () => {
      const ruleA: SemanticRule = {
        name: 'rule-a',
        description: 'Rule A',
        validate: () => [{ rule: 'rule-a', message: 'a' }],
      };
      const ruleB: SemanticRule = {
        name: 'rule-b',
        description: 'Rule B',
        validate: () => [{ rule: 'rule-b', message: 'b' }],
      };
      const validator = new ODLValidator({ rules: [ruleA, ruleB] });
      const result = validator.validate(validEvent());
      const ruleNames = result.warnings.map((w) => w.rule);
      expect(ruleNames).toContain('rule-a');
      expect(ruleNames).toContain('rule-b');
    });

    it('passes event and context to custom rules', () => {
      const spy = vi
        .fn<
          (event: Record<string, unknown>, context?: Record<string, unknown>) => ValidationWarning[]
        >()
        .mockReturnValue([]);
      const customRule: SemanticRule = {
        name: 'spy-rule',
        description: 'Spy rule',
        validate: spy,
      };
      const validator = new ODLValidator({ rules: [customRule] });
      const evt = validEvent();
      validator.validate(evt);
      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(evt, evt.context);
    });
  });

  // ------------------------------------------------------------------
  // validateSchema()
  // ------------------------------------------------------------------

  describe('validateSchema()', () => {
    let validator: ODLValidator;

    beforeAll(() => {
      validator = new ODLValidator({ rules: [] });
    });

    it('returns true for a valid JSON Schema object', () => {
      const schema = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: { name: { type: 'string' } },
      };
      expect(validator.validateSchema(schema)).toBe(true);
    });

    it('returns true for a minimal schema', () => {
      expect(validator.validateSchema({ type: 'string' })).toBe(true);
    });
  });
});
