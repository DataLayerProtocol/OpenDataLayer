/**
 * Generates markdown documentation from JSON schemas.
 * Creates event and context reference pages for the docs site.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCHEMA_DIR = join(__dirname, '..', 'schemas', 'v1');
const DOCS_DIR = join(__dirname, '..', 'docs', 'reference');

function main() {
  mkdirSync(DOCS_DIR, { recursive: true });

  // Generate event reference
  const eventDir = join(SCHEMA_DIR, 'events');
  const lines: string[] = ['# Event Reference\n', 'Auto-generated from JSON schemas.\n'];

  try {
    for (const category of readdirSync(eventDir).sort()) {
      const categoryPath = join(eventDir, category);
      if (!statSync(categoryPath).isDirectory()) continue;

      lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} Events\n`);

      for (const file of readdirSync(categoryPath).sort()) {
        if (!file.endsWith('.schema.json')) continue;

        try {
          const schema = JSON.parse(readFileSync(join(categoryPath, file), 'utf-8'));
          const eventName = file.replace('.schema.json', '');
          lines.push(`### \`${category}.${eventName.replace(/-/g, '_')}\`\n`);
          if (schema.description) {
            lines.push(`${schema.description}\n`);
          }

          if (schema.properties && Object.keys(schema.properties).length > 0) {
            lines.push('| Property | Type | Required | Description |');
            lines.push('|----------|------|----------|-------------|');
            const required = new Set((schema.required ?? []) as string[]);
            for (const [prop, propSchema] of Object.entries(
              schema.properties as Record<string, Record<string, unknown>>,
            )) {
              const type = (propSchema.type ?? 'object') as string;
              const req = required.has(prop) ? 'Yes' : 'No';
              const desc = (propSchema.description ?? '') as string;
              lines.push(`| \`${prop}\` | ${type} | ${req} | ${desc} |`);
            }
            lines.push('');
          }
        } catch {
          // Skip unparseable files
        }
      }
    }
  } catch {
    lines.push('No event schemas found.\n');
  }

  writeFileSync(join(DOCS_DIR, 'events.md'), lines.join('\n'), 'utf-8');
  console.log('Generated docs/reference/events.md');

  // Generate context reference
  const contextDir = join(SCHEMA_DIR, 'context');
  const contextLines: string[] = ['# Context Reference\n', 'Auto-generated from JSON schemas.\n'];

  try {
    for (const file of readdirSync(contextDir).sort()) {
      if (!file.endsWith('.schema.json')) continue;

      try {
        const schema = JSON.parse(readFileSync(join(contextDir, file), 'utf-8'));
        const name = basename(file, '.schema.json');
        contextLines.push(`## ${name.charAt(0).toUpperCase() + name.slice(1)} Context\n`);
        if (schema.description) {
          contextLines.push(`${schema.description}\n`);
        }

        if (schema.properties) {
          contextLines.push('| Property | Type | Required | Description |');
          contextLines.push('|----------|------|----------|-------------|');
          const required = new Set((schema.required ?? []) as string[]);
          for (const [prop, propSchema] of Object.entries(
            schema.properties as Record<string, Record<string, unknown>>,
          )) {
            const type = (propSchema.type ?? 'object') as string;
            const req = required.has(prop) ? 'Yes' : 'No';
            const desc = (propSchema.description ?? '') as string;
            contextLines.push(`| \`${prop}\` | ${type} | ${req} | ${desc} |`);
          }
          contextLines.push('');
        }
      } catch {
        // Skip
      }
    }
  } catch {
    contextLines.push('No context schemas found.\n');
  }

  writeFileSync(join(DOCS_DIR, 'contexts.md'), contextLines.join('\n'), 'utf-8');
  console.log('Generated docs/reference/contexts.md');
  console.log('Done! ✓');
}

main();
