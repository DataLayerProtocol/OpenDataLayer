/**
 * Bundles all JSON Schema files into a single compound document.
 * Useful for distributing schemas as a single file.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMA_DIR = join(__dirname, '..', 'schemas', 'v1');
const OUTPUT_FILE = join(__dirname, '..', 'dist', 'schemas-v1-bundle.json');

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
  const schemaFiles = findSchemaFiles(SCHEMA_DIR);
  console.log(`Bundling ${schemaFiles.length} schemas...`);

  const bundle: Record<string, unknown> = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://opendatalayer.org/schemas/v1/bundle.schema.json',
    title: 'OpenDataLayer Schema Bundle v1',
    description: 'All OpenDataLayer v1 schemas bundled into a single document',
    $defs: {} as Record<string, unknown>,
  };

  const defs = bundle.$defs as Record<string, unknown>;

  for (const file of schemaFiles) {
    const relPath = relative(SCHEMA_DIR, file);
    const key = relPath.replace(/\.schema\.json$/, '').replace(/\//g, '.');
    try {
      const schema = JSON.parse(readFileSync(file, 'utf-8'));
      defs[key] = schema;
      console.log(`  + ${relPath}`);
    } catch (err) {
      console.error(`  ✗ ${relPath}: ${(err as Error).message}`);
    }
  }

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(bundle, null, 2), 'utf-8');
  console.log(`\nBundle written to ${relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`Total schemas: ${Object.keys(defs).length}`);
}

main();
