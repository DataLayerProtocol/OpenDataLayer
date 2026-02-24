/**
 * @opendatalayer/adapter-webhook
 *
 * Sends OpenDataLayer events to a configurable webhook endpoint via fetch().
 * Supports both real-time and batched delivery modes.
 */

export interface WebhookAdapterOptions {
  /** The URL to send events to (required) */
  url: string;
  /** HTTP method (default: 'POST') */
  method?: 'POST' | 'PUT' | 'PATCH';
  /** Additional HTTP headers to include with each request */
  headers?: Record<string, string>;
  /** Whether to batch events (default: false) */
  batch?: boolean;
  /** Maximum batch size before auto-flush (default: 10) */
  batchSize?: number;
  /** Maximum time in ms to wait before flushing a batch (default: 5000) */
  batchInterval?: number;
  /** Timeout in ms for each fetch request (default: 10000) */
  timeout?: number;
  /** Whether to include ODL context in the payload (default: true) */
  includeContext?: boolean;
  /** Custom payload transformer. Receives the event, returns the body to send. */
  transformPayload?: (event: ODLEvent) => unknown;
  /** Callback invoked on send failure */
  onError?: (error: unknown, events: ODLEvent[]) => void;
}

// ODL event interface (minimal, to avoid SDK dependency)
interface ODLEvent {
  event: string;
  id: string;
  timestamp: string;
  specVersion: string;
  context?: Record<string, unknown>;
  data?: Record<string, unknown>;
  customDimensions?: Record<string, string | number | boolean>;
}

// Plugin interface (to avoid SDK dependency)
interface ODLPlugin {
  name: string;
  initialize?(odl: unknown): void;
  afterEvent?(event: ODLEvent): void;
  destroy?(): void;
}

function buildPayload(
  event: ODLEvent,
  includeContext: boolean,
  transformPayload?: (event: ODLEvent) => unknown,
): unknown {
  if (transformPayload) {
    return transformPayload(event);
  }

  const payload: Record<string, unknown> = {
    event: event.event,
    id: event.id,
    timestamp: event.timestamp,
    specVersion: event.specVersion,
    data: event.data,
  };

  if (event.customDimensions) {
    payload.customDimensions = event.customDimensions;
  }

  if (includeContext && event.context) {
    payload.context = event.context;
  }

  return payload;
}

async function sendEvents(
  events: ODLEvent[],
  options: Required<
    Pick<WebhookAdapterOptions, 'url' | 'method' | 'headers' | 'timeout' | 'includeContext'>
  > &
    Pick<WebhookAdapterOptions, 'transformPayload' | 'onError'>,
): Promise<void> {
  const first = events[0];
  const body =
    events.length === 1 && first
      ? buildPayload(first, options.includeContext, options.transformPayload)
      : events.map((e) => buildPayload(e, options.includeContext, options.transformPayload));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  try {
    const response = await fetch(options.url, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${String(response.status)} ${response.statusText}`);
    }
  } catch (error) {
    if (options.onError) {
      options.onError(error, events);
    } else {
      console.error('[@opendatalayer/adapter-webhook] Send failed:', error);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export function webhookAdapter(options: WebhookAdapterOptions): ODLPlugin {
  const {
    url,
    method = 'POST',
    headers = {},
    batch = false,
    batchSize = 10,
    batchInterval = 5000,
    timeout = 10000,
    includeContext = true,
    transformPayload,
    onError,
  } = options;

  let eventBuffer: ODLEvent[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | undefined;

  const resolvedOptions = {
    url,
    method,
    headers,
    timeout,
    includeContext,
    transformPayload,
    onError,
  } as const;

  function flush(): void {
    if (eventBuffer.length === 0) return;
    const eventsToSend = [...eventBuffer];
    eventBuffer = [];
    if (flushTimer !== undefined) {
      clearTimeout(flushTimer);
      flushTimer = undefined;
    }
    // Fire and forget -- errors handled by onError callback
    void sendEvents(eventsToSend, resolvedOptions);
  }

  function scheduleFlush(): void {
    if (flushTimer !== undefined) return;
    flushTimer = setTimeout(flush, batchInterval);
  }

  return {
    name: 'webhook-adapter',

    initialize() {
      if (!url) {
        throw new Error('[@opendatalayer/adapter-webhook] "url" option is required.');
      }
    },

    afterEvent(event: ODLEvent) {
      if (batch) {
        eventBuffer.push(event);
        if (eventBuffer.length >= batchSize) {
          flush();
        } else {
          scheduleFlush();
        }
      } else {
        void sendEvents([event], resolvedOptions);
      }
    },

    destroy() {
      // Flush any remaining events on destroy
      if (batch && eventBuffer.length > 0) {
        flush();
      }
      if (flushTimer !== undefined) {
        clearTimeout(flushTimer);
        flushTimer = undefined;
      }
    },
  };
}

export default webhookAdapter;
