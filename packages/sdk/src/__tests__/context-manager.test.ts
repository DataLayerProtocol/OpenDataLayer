import { ContextManager } from '../core/context-manager.js';

describe('ContextManager', () => {
  let ctx: ContextManager;

  beforeEach(() => {
    ctx = new ContextManager();
  });

  // ---------------------------------------------------------------------------
  // set() and get()
  // ---------------------------------------------------------------------------

  describe('set() and get()', () => {
    it('stores and retrieves a value', () => {
      ctx.set('user', { id: '42' });
      expect(ctx.get()).toEqual({ user: { id: '42' } });
    });

    it('stores multiple keys', () => {
      ctx.set('user', { id: '42' });
      ctx.set('page', { url: '/home' });

      const result = ctx.get();
      expect(result).toEqual({
        user: { id: '42' },
        page: { url: '/home' },
      });
    });

    it('overwrites an existing key', () => {
      ctx.set('user', { id: '42' });
      ctx.set('user', { id: '99' });

      expect(ctx.get()).toEqual({ user: { id: '99' } });
    });

    it('stores primitive values', () => {
      ctx.set('version', 3);
      ctx.set('debug', true);
      ctx.set('label', 'test');

      expect(ctx.get()).toEqual({
        version: 3,
        debug: true,
        label: 'test',
      });
    });

    it('get() returns the live reference (mutations are reflected)', () => {
      ctx.set('user', { id: '42' });
      const ref = ctx.get();

      // Mutate through the reference
      ref.user = { id: '99' };

      expect(ctx.get().user).toEqual({ id: '99' });
    });
  });

  // ---------------------------------------------------------------------------
  // update() deep-merges into existing key
  // ---------------------------------------------------------------------------

  describe('update() deep-merges into existing key', () => {
    it('merges new properties into an existing object', () => {
      ctx.set('user', { id: '42', name: 'Alice' });
      ctx.update('user', { role: 'admin' });

      expect(ctx.get().user).toEqual({ id: '42', name: 'Alice', role: 'admin' });
    });

    it('deep-merges nested objects', () => {
      ctx.set('config', { theme: { color: 'blue', size: 'lg' } });
      ctx.update('config', { theme: { color: 'red' } } as Record<string, unknown>);

      expect(ctx.get().config).toEqual({
        theme: { color: 'red', size: 'lg' },
      });
    });

    it('overwrites non-object values at the same key', () => {
      ctx.set('user', { id: '42', name: 'Alice' });
      ctx.update('user', { name: 'Bob' });

      expect(ctx.get().user).toEqual({ id: '42', name: 'Bob' });
    });
  });

  // ---------------------------------------------------------------------------
  // update() on non-existent key creates it
  // ---------------------------------------------------------------------------

  describe('update() on non-existent key creates it', () => {
    it('creates a new key from the partial', () => {
      ctx.update('session', { token: 'abc123' });
      expect(ctx.get().session).toEqual({ token: 'abc123' });
    });
  });

  // ---------------------------------------------------------------------------
  // update() when existing value is not a plain object
  // ---------------------------------------------------------------------------

  describe('update() when existing value is not a plain object', () => {
    it('replaces a primitive with the partial', () => {
      ctx.set('count', 5);
      ctx.update('count', { value: 10 });

      expect(ctx.get().count).toEqual({ value: 10 });
    });

    it('replaces an array with the partial', () => {
      ctx.set('items', [1, 2, 3]);
      ctx.update('items', { list: [4, 5] });

      expect(ctx.get().items).toEqual({ list: [4, 5] });
    });

    it('replaces null with the partial', () => {
      ctx.set('data', null);
      ctx.update('data', { key: 'value' });

      expect(ctx.get().data).toEqual({ key: 'value' });
    });
  });

  // ---------------------------------------------------------------------------
  // remove() deletes a key
  // ---------------------------------------------------------------------------

  describe('remove() deletes a key', () => {
    it('removes the specified key', () => {
      ctx.set('user', { id: '42' });
      ctx.set('page', { url: '/home' });

      ctx.remove('user');

      expect(ctx.get()).toEqual({ page: { url: '/home' } });
      expect(ctx.get().user).toBeUndefined();
    });

    it('removing a non-existent key is a no-op', () => {
      ctx.set('user', { id: '42' });
      ctx.remove('nonexistent');

      expect(ctx.get()).toEqual({ user: { id: '42' } });
    });
  });

  // ---------------------------------------------------------------------------
  // reset() clears all context
  // ---------------------------------------------------------------------------

  describe('reset() clears all context', () => {
    it('clears all keys', () => {
      ctx.set('user', { id: '42' });
      ctx.set('page', { url: '/home' });

      ctx.reset();

      expect(ctx.get()).toEqual({});
    });

    it('subsequent get() returns empty object after reset', () => {
      ctx.set('key', 'value');
      ctx.reset();

      expect(Object.keys(ctx.get())).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // snapshot() returns a deep clone
  // ---------------------------------------------------------------------------

  describe('snapshot() returns a deep clone', () => {
    it('returns an object matching the current context', () => {
      ctx.set('user', { id: '42', preferences: { theme: 'dark' } });
      const snap = ctx.snapshot();

      expect(snap).toEqual({ user: { id: '42', preferences: { theme: 'dark' } } });
    });

    it('mutations to the snapshot do not affect the original context', () => {
      ctx.set('user', { id: '42', preferences: { theme: 'dark' } });
      const snap = ctx.snapshot();

      // Mutate the snapshot
      (snap.user as Record<string, unknown>).id = '99';
      ((snap.user as Record<string, unknown>).preferences as Record<string, unknown>).theme =
        'light';

      // Original context should be unchanged
      const original = ctx.get().user as Record<string, unknown>;
      expect(original.id).toBe('42');
      expect((original.preferences as Record<string, unknown>).theme).toBe('dark');
    });

    it('mutations to the original context do not affect a previous snapshot', () => {
      ctx.set('counter', { value: 1 });
      const snap = ctx.snapshot();

      ctx.set('counter', { value: 2 });

      expect((snap.counter as Record<string, unknown>).value).toBe(1);
    });

    it('snapshot of empty context returns empty object', () => {
      expect(ctx.snapshot()).toEqual({});
    });
  });
});
