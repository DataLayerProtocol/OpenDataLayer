import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface SchemaEntry {
  $id: string;
  schema: Record<string, unknown>;
  filePath: string;
}

export class SchemaRegistry {
  private schemas = new Map<string, SchemaEntry>();

  /** Load all schemas from a directory recursively */
  loadDirectory(dir: string): void {
    this.walkDirectory(dir);
  }

  private walkDirectory(currentDir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        this.walkDirectory(fullPath);
      } else if (entry.endsWith('.schema.json')) {
        try {
          this.loadFile(fullPath);
        } catch {
          // Skip files that cannot be parsed
        }
      }
    }
  }

  /** Load a single schema file */
  loadFile(filePath: string): SchemaEntry {
    const content = readFileSync(filePath, 'utf-8');
    const schema = JSON.parse(content) as Record<string, unknown>;

    const $id = (schema.$id as string | undefined) ?? filePath;

    const entry: SchemaEntry = {
      $id,
      schema,
      filePath,
    };

    this.schemas.set($id, entry);
    return entry;
  }

  /** Get schema by $id */
  get(id: string): SchemaEntry | undefined {
    return this.schemas.get(id);
  }

  /** Get all loaded schemas */
  getAll(): SchemaEntry[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Find schema for a given event name.
   *
   * Maps dot-namespaced event names to schema $ids by convention.
   * For example:
   *   "ecommerce.purchase" -> looks for an $id ending with "events/ecommerce/purchase.schema.json"
   *   "page.view"          -> looks for an $id ending with "events/page/view.schema.json"
   *   "user.signed_in"     -> looks for an $id ending with "events/user/signed-in.schema.json"
   *
   * The method tries both the raw name and a kebab-cased version of the
   * last segment (underscores replaced with hyphens).
   */
  findEventSchema(eventName: string): SchemaEntry | undefined {
    const parts = eventName.split('.');
    if (parts.length < 2) {
      return undefined;
    }

    // The namespace is everything except the last part (e.g., "ecommerce")
    // The action is the last part (e.g., "purchase", "product_added")
    const namespace = parts.slice(0, -1).join('/');
    const action = parts[parts.length - 1]!;

    // Build candidate suffixes to search for
    const kebabAction = action.replace(/_/g, '-');

    const candidateSuffixes = [
      `events/${namespace}/${action}.schema.json`,
      `events/${namespace}/${kebabAction}.schema.json`,
    ];

    for (const entry of this.schemas.values()) {
      for (const suffix of candidateSuffixes) {
        if (entry.$id.endsWith(suffix) || entry.filePath.endsWith(suffix)) {
          return entry;
        }
      }
    }

    return undefined;
  }

  /** Get count */
  get size(): number {
    return this.schemas.size;
  }
}
