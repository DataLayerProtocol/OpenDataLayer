/**
 * Tests for @opendatalayer/adapter-webhook
 */

import { webhookAdapter } from '../index.js';

function makeEvent(
  overrides: Partial<{
    event: string;
    id: string;
    timestamp: string;
    specVersion: string;
    context: Record<string, unknown>;
    data: Record<string, unknown>;
    customDimensions: Record<string, string | number | boolean>;
  }> = {},
) {
  return {
    event: 'test.event',
    id: 'test-id-123',
    timestamp: '2024-01-15T10:00:00.000Z',
    specVersion: '1.0.0',
    ...overrides,
  };
}

const TEST_URL = 'https://hooks.example.com/events';

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('webhookAdapter', () => {
  describe('plugin structure', () => {
    it('returns a plugin with name "webhook-adapter"', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      expect(plugin.name).toBe('webhook-adapter');
    });

    it('has initialize, afterEvent, and destroy methods', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      expect(typeof plugin.initialize).toBe('function');
      expect(typeof plugin.afterEvent).toBe('function');
      expect(typeof plugin.destroy).toBe('function');
    });
  });

  describe('initialize()', () => {
    it('throws if url is empty', () => {
      const plugin = webhookAdapter({ url: '' });
      expect(() => plugin.initialize?.(undefined)).toThrow(
        '[@opendatalayer/adapter-webhook] "url" option is required.',
      );
    });

    it('does not throw when url is provided', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      expect(() => plugin.initialize?.(undefined)).not.toThrow();
    });
  });

  describe('real-time mode (batch: false)', () => {
    it('calls fetch immediately with a single event', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      plugin.afterEvent?.(makeEvent());
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('sends event payload with event, id, timestamp, specVersion, and data', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      plugin.afterEvent?.(
        makeEvent({
          event: 'page.view',
          id: 'evt-1',
          timestamp: '2024-06-01T00:00:00.000Z',
          specVersion: '1.0.0',
          data: { url: '/home' },
        }),
      );
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(body.event).toBe('page.view');
      expect(body.id).toBe('evt-1');
      expect(body.timestamp).toBe('2024-06-01T00:00:00.000Z');
      expect(body.specVersion).toBe('1.0.0');
      expect(body.data).toEqual({ url: '/home' });
    });

    it('uses POST method by default', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      plugin.afterEvent?.(makeEvent());
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(call[1].method).toBe('POST');
    });

    it('includes Content-Type: application/json header by default', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      plugin.afterEvent?.(makeEvent());
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(call[1].headers['Content-Type']).toBe('application/json');
    });

    it('includes custom headers', () => {
      const plugin = webhookAdapter({
        url: TEST_URL,
        headers: { Authorization: 'Bearer tok123', 'X-Custom': 'value' },
      });
      plugin.afterEvent?.(makeEvent());
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(call[1].headers.Authorization).toBe('Bearer tok123');
      expect(call[1].headers['X-Custom']).toBe('value');
      expect(call[1].headers['Content-Type']).toBe('application/json');
    });

    it('supports PUT method', () => {
      const plugin = webhookAdapter({ url: TEST_URL, method: 'PUT' });
      plugin.afterEvent?.(makeEvent());
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(call[1].method).toBe('PUT');
    });

    it('supports PATCH method', () => {
      const plugin = webhookAdapter({ url: TEST_URL, method: 'PATCH' });
      plugin.afterEvent?.(makeEvent());
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(call[1].method).toBe('PATCH');
    });

    it('sends the request to the configured URL', () => {
      const plugin = webhookAdapter({ url: 'https://my-api.com/webhook' });
      plugin.afterEvent?.(makeEvent());
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(call[0]).toBe('https://my-api.com/webhook');
    });
  });

  describe('includeContext option', () => {
    it('includes context by default (includeContext: true)', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      plugin.afterEvent?.(
        makeEvent({
          context: { user: { id: 'u1' }, page: { path: '/home' } },
        }),
      );
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(body.context).toEqual({ user: { id: 'u1' }, page: { path: '/home' } });
    });

    it('excludes context when includeContext is false', () => {
      const plugin = webhookAdapter({ url: TEST_URL, includeContext: false });
      plugin.afterEvent?.(
        makeEvent({
          context: { user: { id: 'u1' } },
        }),
      );
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(body.context).toBeUndefined();
    });

    it('does not add context key when event has no context (includeContext: true)', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      plugin.afterEvent?.(makeEvent());
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(body.context).toBeUndefined();
    });
  });

  describe('customDimensions', () => {
    it('includes customDimensions in the payload when present', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      plugin.afterEvent?.(
        makeEvent({
          customDimensions: { dim1: 'v1', dim2: 42 },
        }),
      );
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(body.customDimensions).toEqual({ dim1: 'v1', dim2: 42 });
    });

    it('does not include customDimensions key when not present on event', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      plugin.afterEvent?.(makeEvent());
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(body.customDimensions).toBeUndefined();
    });
  });

  describe('transformPayload option', () => {
    it('uses the custom transformPayload function', () => {
      const plugin = webhookAdapter({
        url: TEST_URL,
        transformPayload: (event) => ({
          type: event.event,
          ts: event.timestamp,
          payload: event.data,
        }),
      });
      plugin.afterEvent?.(
        makeEvent({
          event: 'custom.event',
          timestamp: '2024-06-01T00:00:00.000Z',
          data: { key: 'value' },
        }),
      );
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({
        type: 'custom.event',
        ts: '2024-06-01T00:00:00.000Z',
        payload: { key: 'value' },
      });
    });

    it('transformPayload completely replaces the default payload format', () => {
      const plugin = webhookAdapter({
        url: TEST_URL,
        transformPayload: () => ({ custom: true }),
      });
      plugin.afterEvent?.(makeEvent({ data: { some: 'data' } }));
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(body).toEqual({ custom: true });
      expect(body.event).toBeUndefined();
      expect(body.data).toBeUndefined();
    });
  });

  describe('batch mode', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not call fetch immediately when batch is true', () => {
      const plugin = webhookAdapter({ url: TEST_URL, batch: true, batchSize: 5 });
      plugin.afterEvent?.(makeEvent());
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('flushes buffer when batchSize is reached', () => {
      const plugin = webhookAdapter({ url: TEST_URL, batch: true, batchSize: 3 });
      plugin.afterEvent?.(makeEvent({ id: 'e1' }));
      plugin.afterEvent?.(makeEvent({ id: 'e2' }));
      expect(globalThis.fetch).not.toHaveBeenCalled();
      plugin.afterEvent?.(makeEvent({ id: 'e3' }));
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('sends array of payloads when batch flushes', () => {
      const plugin = webhookAdapter({ url: TEST_URL, batch: true, batchSize: 2 });
      plugin.afterEvent?.(makeEvent({ id: 'e1', event: 'a.b' }));
      plugin.afterEvent?.(makeEvent({ id: 'e2', event: 'c.d' }));
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
      expect(body[0].id).toBe('e1');
      expect(body[1].id).toBe('e2');
    });

    it('timer flushes buffer after batchInterval', () => {
      const plugin = webhookAdapter({
        url: TEST_URL,
        batch: true,
        batchSize: 100,
        batchInterval: 3000,
      });
      plugin.afterEvent?.(makeEvent({ id: 'timer-e1' }));
      expect(globalThis.fetch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2999);
      expect(globalThis.fetch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('timer sends buffered events as a single-element payload when only one event', () => {
      const plugin = webhookAdapter({
        url: TEST_URL,
        batch: true,
        batchSize: 100,
        batchInterval: 1000,
      });
      plugin.afterEvent?.(makeEvent({ id: 'solo-event' }));
      vi.advanceTimersByTime(1000);
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      // When a single event is sent, the adapter sends it as a single payload (not array)
      expect(body.id).toBe('solo-event');
    });

    it('does not flush empty buffer on timer', () => {
      webhookAdapter({
        url: TEST_URL,
        batch: true,
        batchSize: 100,
        batchInterval: 1000,
      });
      vi.advanceTimersByTime(5000);
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('resets timer after batch size flush', () => {
      const plugin = webhookAdapter({
        url: TEST_URL,
        batch: true,
        batchSize: 2,
        batchInterval: 5000,
      });
      plugin.afterEvent?.(makeEvent({ id: 'e1' }));
      plugin.afterEvent?.(makeEvent({ id: 'e2' }));
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      // Add another event and wait for timer
      plugin.afterEvent?.(makeEvent({ id: 'e3' }));
      vi.advanceTimersByTime(5000);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('destroy()', () => {
    it('flushes remaining events in batch mode', () => {
      vi.useFakeTimers();
      const plugin = webhookAdapter({ url: TEST_URL, batch: true, batchSize: 100 });
      plugin.afterEvent?.(makeEvent({ id: 'remaining-1' }));
      plugin.afterEvent?.(makeEvent({ id: 'remaining-2' }));
      expect(globalThis.fetch).not.toHaveBeenCalled();

      plugin.destroy?.();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const body = JSON.parse(call[1].body);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
      vi.useRealTimers();
    });

    it('does not flush when buffer is empty in batch mode', () => {
      const plugin = webhookAdapter({ url: TEST_URL, batch: true, batchSize: 100 });
      plugin.destroy?.();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('can be called safely in real-time mode', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      expect(() => plugin.destroy?.()).not.toThrow();
    });

    it('clears the flush timer on destroy', () => {
      vi.useFakeTimers();
      const plugin = webhookAdapter({
        url: TEST_URL,
        batch: true,
        batchSize: 100,
        batchInterval: 5000,
      });
      plugin.afterEvent?.(makeEvent({ id: 'e1' }));
      plugin.destroy?.();
      // Timer should have been cleared; advancing should not cause a second fetch
      vi.advanceTimersByTime(10000);
      // destroy flushes once, no additional flushes from timer
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('calls onError callback on fetch failure', async () => {
      const error = new Error('Network error');
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);
      const onError = vi.fn();
      const plugin = webhookAdapter({ url: TEST_URL, onError });
      plugin.afterEvent?.(makeEvent());

      // Allow the async sendEvents to settle
      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
      expect(onError).toHaveBeenCalledWith(error, expect.any(Array));
    });

    it('calls onError with the events that failed', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('fail'));
      const onError = vi.fn();
      const plugin = webhookAdapter({ url: TEST_URL, onError });
      const event = makeEvent({ id: 'fail-event' });
      plugin.afterEvent?.(event);

      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
      const failedEvents = onError.mock.calls[0]?.[1];
      expect(failedEvents).toHaveLength(1);
      expect(failedEvents[0].id).toBe('fail-event');
    });

    it('calls onError when response is not ok', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      const onError = vi.fn();
      const plugin = webhookAdapter({ url: TEST_URL, onError });
      plugin.afterEvent?.(makeEvent());

      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
      const err = onError.mock.calls[0]?.[0] as Error;
      expect(err.message).toContain('500');
    });

    it('does not throw when no onError callback is provided and fetch fails', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('fail'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const plugin = webhookAdapter({ url: TEST_URL });

      // Should not throw
      expect(() => plugin.afterEvent?.(makeEvent())).not.toThrow();

      // Allow async settle
      await vi.waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });
      consoleError.mockRestore();
    });
  });

  describe('timeout via AbortController', () => {
    it('passes an AbortSignal to fetch', () => {
      const plugin = webhookAdapter({ url: TEST_URL, timeout: 5000 });
      plugin.afterEvent?.(makeEvent());
      const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(call[1].signal).toBeDefined();
      expect(call[1].signal).toBeInstanceOf(AbortSignal);
    });

    it('aborts the request after the timeout period', async () => {
      vi.useFakeTimers();
      let abortSignal: AbortSignal | undefined;
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        (_url: string, opts: { signal?: AbortSignal }) => {
          abortSignal = opts.signal;
          return new Promise((resolve) => {
            // Simulate a request that never resolves
            const timer = setTimeout(
              () => resolve({ ok: true, status: 200, statusText: 'OK' }),
              60000,
            );
            opts.signal?.addEventListener('abort', () => clearTimeout(timer));
          });
        },
      );

      const onError = vi.fn();
      const plugin = webhookAdapter({ url: TEST_URL, timeout: 3000, onError });
      plugin.afterEvent?.(makeEvent());

      expect(abortSignal).toBeDefined();
      expect(abortSignal?.aborted).toBe(false);

      vi.advanceTimersByTime(3000);
      expect(abortSignal?.aborted).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('multiple real-time events', () => {
    it('calls fetch once per event in real-time mode', () => {
      const plugin = webhookAdapter({ url: TEST_URL });
      plugin.afterEvent?.(makeEvent({ id: 'e1' }));
      plugin.afterEvent?.(makeEvent({ id: 'e2' }));
      plugin.afterEvent?.(makeEvent({ id: 'e3' }));
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
