/**
 * Check whether a value is a plain object (not an array, null, Date, RegExp, etc.).
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * Deep-merge one or more source objects into a target object.
 *
 * - Nested plain objects are merged recursively.
 * - Arrays are **replaced**, not concatenated.
 * - `null` and `undefined` source values overwrite the target value.
 * - Non-plain-object values (Date, RegExp, class instances) are assigned by reference.
 *
 * The original `target` object is **not** mutated; a new object is returned.
 */
export function deepMerge<T>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) {
    return target;
  }

  // Start from a shallow clone so we never mutate the original target
  const result: Record<string, unknown> = isPlainObject(target)
    ? { ...target }
    : ({} as Record<string, unknown>);

  for (const source of sources) {
    if (source === undefined || source === null) {
      continue;
    }

    if (!isPlainObject(source)) {
      continue;
    }

    for (const key of Object.keys(source)) {
      const srcVal = (source as Record<string, unknown>)[key];
      const tgtVal = result[key];

      if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
        // Recursively merge nested plain objects
        result[key] = deepMerge(
          tgtVal as Record<string, unknown>,
          srcVal as Record<string, unknown>,
        );
      } else {
        // Arrays, primitives, null, undefined, class instances — just assign
        result[key] = srcVal;
      }
    }
  }

  return result as T;
}
