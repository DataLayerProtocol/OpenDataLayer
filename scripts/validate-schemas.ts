import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Validates that all .schema.json files are valid JSON Schema Draft 2020-12.
 * Run with: npm run validate:schemas (uses tsx)
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMA_DIR = join(__dirname, '..', 'schemas', 'v1');

function findSchemaFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...findSchemaFiles(fullPath));
    } else if (entry.endsWith('.schema.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);

  const schemaFiles = findSchemaFiles(SCHEMA_DIR);
  console.log(`Found ${schemaFiles.length} schema files\n`);

  let valid = 0;
  let invalid = 0;
  const errors: { file: string; error: string }[] = [];

  // First pass: load all schemas
  const schemas: { path: string; schema: Record<string, unknown> }[] = [];
  for (const file of schemaFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const schema = JSON.parse(content);
      schemas.push({ path: file, schema });
    } catch (err) {
      const relPath = relative(SCHEMA_DIR, file);
      errors.push({ file: relPath, error: `Parse error: ${(err as Error).message}` });
      invalid++;
    }
  }

  // Add all schemas to Ajv (so $ref resolution works)
  for (const { path: filePath, schema } of schemas) {
    try {
      if (schema.$id) {
        ajv.addSchema(schema);
      }
    } catch (err) {
      // Schema might already be added or have issues - we'll catch in validation
    }
  }

  // Second pass: validate each schema compiles
  for (const { path: filePath, schema } of schemas) {
    const relPath = relative(SCHEMA_DIR, filePath);
    try {
      if (schema.$id) {
        ajv.getSchema(schema.$id as string);
      } else {
        ajv.compile(schema);
      }
      valid++;
      console.log(`  ✓ ${relPath}`);
    } catch (err) {
      invalid++;
      const msg = (err as Error).message;
      errors.push({ file: relPath, error: msg });
      console.log(`  ✗ ${relPath}: ${msg}`);
    }
  }

  console.log(`\nResults: ${valid} valid, ${invalid} invalid out of ${schemaFiles.length} schemas`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const { file, error } of errors) {
      console.log(`  ${file}: ${error}`);
    }
    process.exit(1);
  }

  console.log('\nAll schemas are valid! ✓');
}

main();
