#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { type OutputFormat, formatResults } from './formatters/index.js';
import { ODLValidator } from './validator.js';

interface CliOptions {
  command: string;
  files: string[];
  schemaDir?: string;
  format: OutputFormat;
  strict: boolean;
  help: boolean;
}

const HELP_TEXT = `
Usage: odl <command> [options] [files...]

Commands:
  validate <file-or-glob...>   Validate event JSON files against ODL schemas

Options:
  --schema-dir <dir>           Custom schema directory (default: auto-detect)
  --format <format>            Output format: console, json, junit (default: console)
  --strict                     Strict mode: warnings become errors
  --help                       Show this help message

Examples:
  odl validate events.json
  odl validate events/*.json --format json
  odl validate data/ --strict --format junit
`.trim();

/**
 * Parse CLI arguments from process.argv.
 */
function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2); // skip node and script path

  const options: CliOptions = {
    command: '',
    files: [],
    schemaDir: undefined,
    format: 'console',
    strict: false,
    help: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i] ?? '';

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      i++;
      continue;
    }

    if (arg === '--strict') {
      options.strict = true;
      i++;
      continue;
    }

    if (arg === '--schema-dir') {
      i++;
      options.schemaDir = args[i];
      i++;
      continue;
    }

    if (arg === '--format') {
      i++;
      const fmt = args[i];
      if (fmt === 'console' || fmt === 'json' || fmt === 'junit') {
        options.format = fmt;
      } else {
        console.error(`Unknown format: ${fmt ?? '(missing)'}. Expected: console, json, junit`);
        process.exit(1);
      }
      i++;
      continue;
    }

    // First positional arg is the command
    if (!options.command) {
      options.command = arg;
      i++;
      continue;
    }

    // Remaining positional args are files
    options.files.push(arg);
    i++;
  }

  return options;
}

/**
 * Recursively collect all .json files from a path (file or directory).
 */
function collectJsonFiles(filePath: string): string[] {
  const resolved = resolve(filePath);
  let stat: ReturnType<typeof statSync> | undefined;
  try {
    stat = statSync(resolved);
  } catch {
    console.error(`File not found: ${filePath}`);
    return [];
  }

  if (stat.isFile()) {
    if (extname(resolved) === '.json') {
      return [resolved];
    }
    return [];
  }

  if (stat.isDirectory()) {
    const files: string[] = [];
    const entries = readdirSync(resolved);
    for (const entry of entries) {
      files.push(...collectJsonFiles(join(resolved, entry)));
    }
    return files;
  }

  return [];
}

/**
 * Load and parse event JSON from a file.
 * Handles both single event objects and arrays of events.
 */
function loadEvents(filePath: string): Record<string, unknown>[] {
  const content = readFileSync(filePath, 'utf-8');
  const parsed: unknown = JSON.parse(content);

  if (Array.isArray(parsed)) {
    return parsed as Record<string, unknown>[];
  }

  if (typeof parsed === 'object' && parsed !== null) {
    return [parsed as Record<string, unknown>];
  }

  throw new Error(`File ${filePath} does not contain a valid event object or array`);
}

/**
 * Main CLI entry point.
 */
function main(): void {
  const options = parseArgs(process.argv);

  if (options.help || !options.command) {
    console.log(HELP_TEXT);
    process.exit(options.help ? 0 : 1);
  }

  if (options.command !== 'validate') {
    console.error(`Unknown command: ${options.command}`);
    console.log('');
    console.log(HELP_TEXT);
    process.exit(1);
  }

  if (options.files.length === 0) {
    console.error('No files specified. Usage: odl validate <file-or-glob...>');
    process.exit(1);
  }

  // Initialize validator
  const validator = new ODLValidator({
    schemaDir: options.schemaDir,
    strict: options.strict,
  });

  // Collect all JSON files
  const jsonFiles: string[] = [];
  for (const fileArg of options.files) {
    jsonFiles.push(...collectJsonFiles(fileArg));
  }

  if (jsonFiles.length === 0) {
    console.error('No JSON files found in the specified paths.');
    process.exit(1);
  }

  // Validate all events
  const allResults = [];
  let hasError = false;

  for (const filePath of jsonFiles) {
    try {
      const events = loadEvents(filePath);
      const results = validator.validateBatch(events);
      allResults.push(...results);

      if (results.some((r) => !r.valid)) {
        hasError = true;
      }
    } catch (err) {
      console.error(
        `Error processing ${filePath}: ${err instanceof Error ? err.message : String(err)}`,
      );
      hasError = true;
    }
  }

  // Output results
  if (allResults.length > 0) {
    const output = formatResults(allResults, options.format);
    console.log(output);
  }

  process.exit(hasError ? 1 : 0);
}

main();
