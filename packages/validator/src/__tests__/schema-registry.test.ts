import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SchemaRegistry } from '../schema-registry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemasDir = join(__dirname, '..', '..', '..', '..', 'schemas', 'v1');

// ---------------------------------------------------------------------------
// SchemaRegistry
// ---------------------------------------------------------------------------

describe('SchemaRegistry', () => {
  // ------------------------------------------------------------------
  // Constructor
  // ------------------------------------------------------------------

  describe('constructor', () => {
    it('creates an empty registry with size === 0', () => {
      const registry = new SchemaRegistry();
      expect(registry.size).toBe(0);
    });

    it('getAll() returns an empty array on a fresh registry', () => {
      const registry = new SchemaRegistry();
      expect(registry.getAll()).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // loadFile()
  // ------------------------------------------------------------------

  describe('loadFile()', () => {
    it('loads a JSON schema file and returns an entry with $id', () => {
      const registry = new SchemaRegistry();
      const filePath = join(schemasDir, 'core', 'event.schema.json');
      const entry = registry.loadFile(filePath);
      expect(entry).toBeDefined();
      expect(entry.$id).toBe('https://opendatalayer.org/schemas/v1/core/event.schema.json');
      expect(entry.filePath).toBe(filePath);
      expect(entry.schema).toBeDefined();
      expect(typeof entry.schema).toBe('object');
    });

    it('increases registry size after loading a file', () => {
      const registry = new SchemaRegistry();
      expect(registry.size).toBe(0);
      registry.loadFile(join(schemasDir, 'core', 'event.schema.json'));
      expect(registry.size).toBe(1);
    });

    it('uses filePath as $id fallback when schema has no $id', () => {
      // Create a temporary schema file without $id
      const tmpDir = join(__dirname, '__tmp_schema_test__');
      mkdirSync(tmpDir, { recursive: true });
      const tmpFilePath = join(tmpDir, 'no-id.schema.json');
      writeFileSync(
        tmpFilePath,
        JSON.stringify({ type: 'object', properties: { a: { type: 'string' } } }),
      );

      try {
        const registry = new SchemaRegistry();
        const entry = registry.loadFile(tmpFilePath);
        expect(entry.$id).toBe(tmpFilePath);
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('throws for an invalid JSON file', () => {
      const tmpDir = join(__dirname, '__tmp_bad_json__');
      mkdirSync(tmpDir, { recursive: true });
      const tmpFilePath = join(tmpDir, 'bad.schema.json');
      writeFileSync(tmpFilePath, '{ not valid json }');

      try {
        const registry = new SchemaRegistry();
        expect(() => registry.loadFile(tmpFilePath)).toThrow();
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('throws for a non-existent file', () => {
      const registry = new SchemaRegistry();
      expect(() => registry.loadFile('/nonexistent/path/schema.json')).toThrow();
    });
  });

  // ------------------------------------------------------------------
  // get()
  // ------------------------------------------------------------------

  describe('get()', () => {
    it('retrieves a schema by $id after loading', () => {
      const registry = new SchemaRegistry();
      const filePath = join(schemasDir, 'core', 'event.schema.json');
      registry.loadFile(filePath);
      const entry = registry.get('https://opendatalayer.org/schemas/v1/core/event.schema.json');
      expect(entry).toBeDefined();
      expect(entry?.$id).toBe('https://opendatalayer.org/schemas/v1/core/event.schema.json');
    });

    it('returns undefined for unknown $id', () => {
      const registry = new SchemaRegistry();
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('returns the same entry object reference for the same $id', () => {
      const registry = new SchemaRegistry();
      const filePath = join(schemasDir, 'core', 'event.schema.json');
      registry.loadFile(filePath);
      const id = 'https://opendatalayer.org/schemas/v1/core/event.schema.json';
      const entry1 = registry.get(id);
      const entry2 = registry.get(id);
      expect(entry1).toBe(entry2);
    });
  });

  // ------------------------------------------------------------------
  // getAll()
  // ------------------------------------------------------------------

  describe('getAll()', () => {
    it('returns all loaded entries', () => {
      const registry = new SchemaRegistry();
      registry.loadFile(join(schemasDir, 'core', 'event.schema.json'));
      registry.loadFile(join(schemasDir, 'core', 'common.schema.json'));
      const all = registry.getAll();
      expect(all).toHaveLength(2);
    });

    it('returns entries as an array (not the internal map)', () => {
      const registry = new SchemaRegistry();
      registry.loadFile(join(schemasDir, 'core', 'event.schema.json'));
      const all = registry.getAll();
      expect(Array.isArray(all)).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // findEventSchema()
  // ------------------------------------------------------------------

  describe('findEventSchema()', () => {
    let registry: SchemaRegistry;

    beforeAll(() => {
      registry = new SchemaRegistry();
      registry.loadDirectory(schemasDir);
    });

    it('maps dot-namespaced event names to schemas (ecommerce.purchase)', () => {
      const entry = registry.findEventSchema('ecommerce.purchase');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/ecommerce/purchase.schema.json');
    });

    it('maps page.view to events/page/view.schema.json', () => {
      const entry = registry.findEventSchema('page.view');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/page/view.schema.json');
    });

    it('maps page.leave to events/page/leave.schema.json', () => {
      const entry = registry.findEventSchema('page.leave');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/page/leave.schema.json');
    });

    it('maps consent.given to events/consent/given.schema.json', () => {
      const entry = registry.findEventSchema('consent.given');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/consent/given.schema.json');
    });

    it('handles underscore-to-kebab conversion (page.virtual_view -> events/page/virtual-view.schema.json)', () => {
      const entry = registry.findEventSchema('page.virtual_view');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/page/virtual-view.schema.json');
    });

    it('handles underscore-to-kebab for user.signed_in', () => {
      const entry = registry.findEventSchema('user.signed_in');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/user/signed-in.schema.json');
    });

    it('handles underscore-to-kebab for user.signed_up', () => {
      const entry = registry.findEventSchema('user.signed_up');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/user/signed-up.schema.json');
    });

    it('handles underscore-to-kebab for ecommerce.product_viewed', () => {
      const entry = registry.findEventSchema('ecommerce.product_viewed');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/ecommerce/product-viewed.schema.json');
    });

    it('handles underscore-to-kebab for ecommerce.product_added', () => {
      const entry = registry.findEventSchema('ecommerce.product_added');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/ecommerce/product-added.schema.json');
    });

    it('handles underscore-to-kebab for ecommerce.checkout_started', () => {
      const entry = registry.findEventSchema('ecommerce.checkout_started');
      expect(entry).toBeDefined();
      expect(entry?.$id).toContain('events/ecommerce/checkout-started.schema.json');
    });

    it('returns undefined for a single-segment event name', () => {
      const entry = registry.findEventSchema('purchase');
      expect(entry).toBeUndefined();
    });

    it('returns undefined for an unknown event name', () => {
      const entry = registry.findEventSchema('unknown.nonexistent_event');
      expect(entry).toBeUndefined();
    });

    it('returns undefined for an empty string', () => {
      const entry = registry.findEventSchema('');
      expect(entry).toBeUndefined();
    });
  });

  // ------------------------------------------------------------------
  // loadDirectory()
  // ------------------------------------------------------------------

  describe('loadDirectory()', () => {
    it('loads all .schema.json files recursively from a directory', () => {
      const registry = new SchemaRegistry();
      registry.loadDirectory(schemasDir);
      // The schemas directory contains many schemas across subdirectories
      expect(registry.size).toBeGreaterThan(10);
    });

    it('loads schemas from nested subdirectories', () => {
      const registry = new SchemaRegistry();
      registry.loadDirectory(schemasDir);
      // Check that schemas from multiple levels were loaded
      const all = registry.getAll();
      const coreSchemas = all.filter((e) => e.$id.includes('/core/'));
      const eventSchemas = all.filter((e) => e.$id.includes('/events/'));
      expect(coreSchemas.length).toBeGreaterThan(0);
      expect(eventSchemas.length).toBeGreaterThan(0);
    });

    it('handles a non-existent directory gracefully', () => {
      const registry = new SchemaRegistry();
      // Should not throw -- the implementation catches the error
      expect(() => registry.loadDirectory('/nonexistent/directory')).not.toThrow();
      expect(registry.size).toBe(0);
    });

    it('can load the same directory twice without duplicating entries', () => {
      const registry = new SchemaRegistry();
      registry.loadDirectory(schemasDir);
      const sizeAfterFirst = registry.size;
      registry.loadDirectory(schemasDir);
      const sizeAfterSecond = registry.size;
      // Since schemas have the same $id, they should overwrite, not duplicate
      expect(sizeAfterSecond).toBe(sizeAfterFirst);
    });

    it('only loads files ending with .schema.json', () => {
      const registry = new SchemaRegistry();
      registry.loadDirectory(schemasDir);
      const all = registry.getAll();
      for (const entry of all) {
        // Either the $id or the filePath should indicate it was a .schema.json file
        expect(entry.filePath.endsWith('.schema.json')).toBe(true);
      }
    });
  });

  // ------------------------------------------------------------------
  // size property
  // ------------------------------------------------------------------

  describe('size property', () => {
    it('reflects the number of loaded schemas', () => {
      const registry = new SchemaRegistry();
      expect(registry.size).toBe(0);

      registry.loadFile(join(schemasDir, 'core', 'event.schema.json'));
      expect(registry.size).toBe(1);

      registry.loadFile(join(schemasDir, 'core', 'common.schema.json'));
      expect(registry.size).toBe(2);
    });

    it('does not increase when re-loading the same schema (same $id)', () => {
      const registry = new SchemaRegistry();
      const filePath = join(schemasDir, 'core', 'event.schema.json');
      registry.loadFile(filePath);
      expect(registry.size).toBe(1);
      registry.loadFile(filePath);
      expect(registry.size).toBe(1);
    });
  });
});
