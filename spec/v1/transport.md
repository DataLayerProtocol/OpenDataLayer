# OpenDataLayer Protocol Specification v1 — Transport

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-02-23

---

## 1. Introduction

This document defines how events are pushed to the OpenDataLayer, how consumers subscribe to and receive events, and how the middleware pipeline processes events between production and consumption. The transport layer is the mechanism by which ODL events flow from producers to consumers.

## 2. Push Model

ODL uses a **push-based** model for event production. Producers push events to the data layer; the data layer does not poll producers.

### 2.1 Push Semantics

Producers emit events by calling a `push` operation on the data layer. The push operation accepts a single event envelope (as defined in [data-model.md](data-model.md)) and places it into the processing pipeline.

```javascript
// Conceptual push operation
odl.push({
  event: "page.view",
  data: {
    title: "Homepage",
    url: "https://www.example.com/"
  }
});
```

The data layer implementation is responsible for:

1. Assigning an `id` (UUID v4) if the producer did not provide one.
2. Setting the `timestamp` to the current time if the producer did not provide one.
3. Setting the `specVersion` to the current version if the producer did not provide one.
4. Merging the current context objects into the event's `context` field.
5. Passing the event through the middleware pipeline.
6. Delivering the event to all matching consumers.

### 2.2 Push Guarantees

The push operation provides the following guarantees:

- **At-least-once delivery.** Every pushed event MUST be delivered to all matching consumers at least once. In the presence of errors, an event MAY be delivered more than once. Consumers SHOULD use the `id` field for deduplication.
- **Ordered delivery.** Events pushed by a single producer MUST be delivered to consumers in the order they were pushed. Events from different producers MAY be interleaved.
- **Non-blocking.** The push operation MUST NOT block the producer. Event processing (validation, enrichment, delivery) happens asynchronously from the producer's perspective.

### 2.3 Push Before Ready

In browser environments, producers may attempt to push events before the data layer is fully initialized (e.g., inline scripts that fire before the ODL library loads). To handle this, implementations SHOULD support a **queue pattern**:

1. Before the data layer is initialized, `odl` (or the equivalent global) is an array.
2. Producers push event objects onto this array using `Array.prototype.push`.
3. When the data layer initializes, it processes all queued events and replaces the array with the full data layer object.

```javascript
// Before ODL initializes
window.odl = window.odl || [];
window.odl.push({
  event: "page.view",
  data: { title: "Homepage", url: "https://www.example.com/" }
});

// After ODL initializes, the queued event is processed
// and future pushes go through the full pipeline
```

This pattern is borrowed from Google Tag Manager's `dataLayer` approach and is well-understood in the industry.

## 3. Consumer Subscription Model

Consumers receive events by subscribing to the data layer. Subscriptions are pattern-based, allowing consumers to receive only the events they are interested in.

### 3.1 Subscription Patterns

Consumers subscribe using **event name patterns**. The following pattern types are supported:

| Pattern | Matches | Example |
|---|---|---|
| Exact name | A single event | `"ecommerce.purchase"` |
| Category wildcard | All events in a category | `"ecommerce.*"` |
| Universal wildcard | All events | `"*"` |

#### 3.1.1 Exact Name Subscription

The consumer receives only events whose `event` field exactly matches the pattern.

```javascript
odl.subscribe("ecommerce.purchase", (event) => {
  // Only receives ecommerce.purchase events
});
```

#### 3.1.2 Category Wildcard Subscription

The consumer receives all events whose category matches the pattern's category. The `*` wildcard replaces the action segment.

```javascript
odl.subscribe("ecommerce.*", (event) => {
  // Receives all ecommerce events:
  // ecommerce.product_viewed, ecommerce.purchase, etc.
});
```

#### 3.1.3 Universal Wildcard Subscription

The consumer receives all events regardless of category or action.

```javascript
odl.subscribe("*", (event) => {
  // Receives every event
});
```

### 3.2 Subscription Lifecycle

#### 3.2.1 Subscribe

A consumer subscribes by providing a pattern and a callback function. The subscription is active immediately after registration.

```javascript
const unsubscribe = odl.subscribe("page.*", (event) => {
  console.log("Page event:", event);
});
```

#### 3.2.2 Unsubscribe

The subscribe operation MUST return an unsubscribe function (or equivalent mechanism). Calling the unsubscribe function removes the subscription and stops event delivery to the consumer.

```javascript
// Later, when the consumer no longer needs events
unsubscribe();
```

#### 3.2.3 Late Subscription

Consumers that subscribe after events have already been pushed SHOULD have the option to receive historical events (replay). This is controlled by a subscription option:

```javascript
odl.subscribe("ecommerce.*", (event) => {
  // Process event
}, { replay: true }); // Receive all previously pushed ecommerce events
```

The `replay` option is OPTIONAL. Implementations MAY choose not to support it. If supported, replayed events SHOULD be delivered in their original order.

### 3.3 Multiple Subscriptions

A single consumer MAY have multiple active subscriptions. Events that match multiple subscriptions MUST be delivered once per matching subscription, not deduplicated across subscriptions.

```javascript
// This consumer receives ecommerce.purchase events twice:
// once from the exact subscription, once from the wildcard
odl.subscribe("ecommerce.purchase", handler1);
odl.subscribe("ecommerce.*", handler2);
// Both handler1 and handler2 fire for ecommerce.purchase
```

### 3.4 Subscription Ordering

When multiple consumers subscribe to the same event, the delivery order is determined by subscription registration order. Consumers that subscribe first receive events first.

However, implementations SHOULD NOT depend on this ordering for correctness. Consumers SHOULD be independent and not assume they will see an event before or after another consumer.

## 4. Middleware Pipeline

The middleware pipeline is the processing layer between event emission and event delivery. Middleware functions intercept events as they flow through the pipeline, enabling validation, enrichment, transformation, and routing.

### 4.1 Pipeline Stages

The middleware pipeline consists of four ordered stages. Each stage has a specific purpose and runs in sequence:

```
Producer Push
     │
     ▼
┌──────────┐
│ Validate  │  Stage 1: Schema validation
└──────────┘
     │
     ▼
┌──────────┐
│  Enrich   │  Stage 2: Add/compute additional data
└──────────┘
     │
     ▼
┌──────────┐
│ Transform │  Stage 3: Modify event shape/content
└──────────┘
     │
     ▼
┌──────────┐
│   Route   │  Stage 4: Determine which consumers receive the event
└──────────┘
     │
     ▼
Consumer Delivery
```

#### 4.1.1 Validate Stage

The validate stage checks that the event conforms to the ODL schema. Middleware in this stage:

- Validates the event envelope structure.
- Validates the event name against the taxonomy.
- Validates the data payload against the event-specific schema.
- Validates context objects against their schemas.

If validation fails, the middleware MUST decide whether to:
- **Reject** the event (prevent it from proceeding through the pipeline).
- **Warn** (log a validation error but allow the event to proceed).
- **Fix** (correct minor issues, e.g., coercing a string to a number, and allow the event to proceed).

The behavior is implementation-defined and SHOULD be configurable.

#### 4.1.2 Enrich Stage

The enrich stage adds additional data to the event that was not present at emission time. Common enrichment operations:

- Parsing UTM parameters from the page URL and populating the campaign context.
- Looking up geographic location from the user's IP address.
- Computing derived fields (e.g., cart total from product prices and quantities).
- Adding A/B testing variant assignments to `customDimensions`.
- Populating device context from the User-Agent string or Client Hints.

Enrichment middleware MUST NOT change the `event` name or remove existing fields. It MAY add new fields or update fields that were previously empty.

#### 4.1.3 Transform Stage

The transform stage modifies the event's shape or content for downstream consumption. Common transformations:

- **PII hashing.** Replacing email addresses with SHA-256 hashes.
- **PII redaction.** Removing user traits that are not needed by downstream consumers.
- **Field mapping.** Renaming fields to match a consumer's expected format.
- **Data truncation.** Trimming long strings (e.g., search queries) to a maximum length.
- **Currency conversion.** Converting monetary values to a standard currency.

Transform middleware MAY modify any field in the event, including the `event` name (though this should be done with caution).

#### 4.1.4 Route Stage

The route stage determines which consumers receive the event. Common routing decisions:

- **Consent-based routing.** Suppressing events for consumers that require marketing consent when the user has not granted it.
- **Environment-based routing.** Sending events to different consumers based on `source.environment` (e.g., production events go to the analytics platform; staging events go to a debug console).
- **Event-type routing.** Sending ecommerce events to the marketing platform but not to the error monitoring service.
- **Sampling.** Only forwarding a percentage of events (e.g., 10% of page views) to reduce volume.

Route middleware controls event delivery by either allowing or suppressing the event for specific consumers.

### 4.2 Middleware Function Interface

Each middleware function receives the event and a `next` function. Calling `next` passes the event to the next middleware in the pipeline. Not calling `next` suppresses the event.

```javascript
function loggingMiddleware(event, next) {
  console.log("Event:", event.event);
  next(event); // Pass to next middleware
}

function piiHashingMiddleware(event, next) {
  if (event.context.user?.traits?.email) {
    event.context.user.traits.email = sha256(event.context.user.traits.email);
  }
  next(event);
}

function consentRoutingMiddleware(event, next) {
  if (!event.context.consent?.marketing) {
    // Suppress event for marketing consumers using metadata.
    // _suppressFor is a transient routing hint — it is NOT persisted
    // in the event envelope and MUST be stripped before storage.
    event._suppressFor = ["marketing-platform"];
  }
  next(event);
}
```

### 4.3 Middleware Registration

Middleware is registered with a specific pipeline stage. Middleware within the same stage runs in registration order.

```javascript
odl.use("validate", schemaValidationMiddleware);
odl.use("enrich", campaignEnrichmentMiddleware);
odl.use("transform", piiHashingMiddleware);
odl.use("route", consentRoutingMiddleware);
```

### 4.4 Middleware Composition

Middleware functions are composable. Complex processing logic can be built by combining simple, single-purpose middleware functions:

```
validate: [schemaValidator, eventNameValidator]
enrich:   [utmParser, geoLookup, abTestEnricher]
transform: [piiHasher, fieldMapper]
route:    [consentRouter, environmentRouter, sampler]
```

### 4.5 Error Handling in Middleware

If a middleware function throws an error:

1. The error MUST be caught by the pipeline runtime.
2. The error MUST be logged.
3. The pipeline SHOULD continue processing with the next middleware (fail-open) unless the error is in the validate stage and strict mode is enabled.
4. The event SHOULD be tagged with an error indicator so downstream consumers can be aware of the processing error.

## 5. Server-Side Forwarding

### 5.1 Client-to-Server Forwarding

In many deployments, the ODL data layer runs in the browser and forwards events to a server-side endpoint for further processing and distribution. This architecture provides several benefits:

- **Privacy.** PII can be stripped or hashed server-side before reaching third-party consumers.
- **Reliability.** Server-side forwarding is not affected by ad blockers or browser restrictions.
- **Enrichment.** Server-side enrichment can access data not available in the browser (e.g., CRM data, backend user attributes).
- **Reduced client load.** A single HTTP request to the server replaces multiple requests to different consumer APIs.

### 5.2 Forwarding Protocol

When forwarding events from client to server, the event envelope is transmitted as a JSON payload over HTTPS. The transport details are implementation-defined, but implementations SHOULD:

- Use HTTPS with TLS 1.2 or higher.
- Use POST requests with a JSON body.
- Support batch transmission (multiple events per request).
- Include a `Content-Type: application/json` header.
- Authenticate requests using an API key or similar mechanism.

### 5.3 Server-Side Pipeline

The server-side endpoint runs its own middleware pipeline, which may include:

- Additional validation (rejecting events that were tampered with).
- Server-side enrichment (CRM lookup, backend data joins).
- PII processing (hashing, redaction, encryption).
- Fan-out to multiple consumer APIs (analytics, marketing, data warehouse).

### 5.4 Hybrid Architecture

ODL supports a hybrid architecture where some consumers receive events directly from the client-side data layer and others receive events via server-side forwarding:

```
┌───────────┐
│  Browser   │
│  (ODL)     │──────► Client-side consumers (e.g., analytics tag)
│            │
└─────┬──────┘
      │ HTTPS
      ▼
┌───────────┐
│  Server    │──────► Server-side consumers (e.g., data warehouse)
│  (ODL)     │──────► Server-side consumers (e.g., CRM)
│            │──────► Server-side consumers (e.g., marketing API)
└────────────┘
```

## 6. Batch vs. Real-Time Delivery

### 6.1 Real-Time Delivery

By default, events are delivered to consumers in **real time** — as soon as they pass through the middleware pipeline. Real-time delivery is appropriate for:

- Client-side analytics tags that need to fire immediately.
- Consent-triggered behaviors (e.g., showing a consent banner after a consent event).
- Interactive features that depend on event data (e.g., product recommendations).

### 6.2 Batch Delivery

For consumers that do not require real-time data (e.g., data warehouses, offline analytics), events MAY be batched and delivered periodically. Batch delivery reduces network overhead and is more efficient for high-volume event streams.

#### 6.2.1 Batch Configuration

Batching is configured per consumer and is controlled by two parameters:

| Parameter | Type | Description |
|---|---|---|
| `batchSize` | `number` | Maximum number of events per batch. |
| `batchInterval` | `number` | Maximum time (in milliseconds) between batch deliveries. |

A batch is delivered when either threshold is reached, whichever comes first.

#### 6.2.2 Batch Format

A batch is an array of event envelopes:

```json
{
  "batch": [
    { "event": "page.view", "id": "...", ... },
    { "event": "interaction.element_clicked", "id": "...", ... },
    { "event": "ecommerce.product_viewed", "id": "...", ... }
  ],
  "sentAt": "2026-02-23T14:30:45.123Z"
}
```

> **Clarification:** `sentAt` is the timestamp when the batch was transmitted, NOT the time of any individual event. Each event retains its own `timestamp` field (see [data-model.md](data-model.md)) indicating when the event occurred. `sentAt` enables receivers to calculate clock drift between the client and server.

#### 6.2.3 Flush on Unload

When the page is being unloaded (navigation, tab close), any pending batch MUST be flushed immediately. Implementations SHOULD use `navigator.sendBeacon()` or the `fetch()` API with `keepalive: true` to ensure reliable delivery during page unload.

### 6.3 Delivery Modes per Consumer

Different consumers on the same data layer MAY use different delivery modes:

| Consumer | Delivery Mode | Rationale |
|---|---|---|
| Client-side analytics tag | Real-time | Needs immediate page view tracking |
| Server-side data warehouse | Batch (100 events / 5s) | High volume, no real-time requirement |
| Consent management platform | Real-time | Must react to consent changes immediately |
| Marketing pixel | Real-time | Conversion tracking requires immediate fire |

## 7. Error Handling and Retry Strategies

### 7.1 Error Categories

Errors in the transport layer fall into three categories:

| Category | Examples | Handling |
|---|---|---|
| **Validation errors** | Invalid event schema, missing required fields | Reject or warn; do not retry |
| **Transient errors** | Network timeout, server 503, rate limit | Retry with backoff |
| **Permanent errors** | Invalid API key, consumer endpoint removed | Log and alert; do not retry |

### 7.2 Retry Strategy

For transient errors during event delivery, implementations SHOULD use an **exponential backoff** retry strategy:

1. **First retry**: After 1 second.
2. **Second retry**: After 2 seconds.
3. **Third retry**: After 4 seconds.
4. **Fourth retry**: After 8 seconds.
5. **Fifth retry**: After 16 seconds.
6. **Maximum retries**: 5 (configurable).
7. **Jitter**: Add random jitter (0-1 second) to each retry interval to prevent thundering herd.

After the maximum number of retries, the event is placed in a **dead letter queue** for manual inspection or later reprocessing.

### 7.3 Dead Letter Queue

Events that cannot be delivered after all retries SHOULD be stored in a dead letter queue (DLQ). The DLQ allows operators to:

- Inspect failed events.
- Diagnose delivery problems.
- Replay events after the underlying issue is resolved.

The DLQ format and storage mechanism are implementation-defined.

### 7.4 Circuit Breaker

If a consumer repeatedly fails (e.g., more than 50% failure rate over a 5-minute window), the data layer SHOULD trip a **circuit breaker** for that consumer. While the circuit is open:

- Events are not delivered to the consumer.
- Events MAY be queued for later delivery or dropped (configurable).
- The circuit breaker periodically tests the consumer with a single event (half-open state).
- If the test succeeds, the circuit closes and normal delivery resumes.

### 7.5 Delivery Acknowledgment

Consumers SHOULD acknowledge receipt of events. For HTTP-based delivery:

- **2xx response**: Event accepted.
- **4xx response**: Event rejected (permanent error; do not retry).
- **5xx response**: Server error (transient error; retry).
- **Timeout**: Transient error; retry.

### 7.6 Idempotency

Because at-least-once delivery means events MAY be delivered more than once, consumers MUST handle duplicate events gracefully. The `id` field on each event provides a natural deduplication key.

Consumers SHOULD maintain a set of recently seen event IDs and skip processing for duplicates. The retention window for deduplication SHOULD be at least as long as the maximum retry window (configurable, recommended at least 1 hour).
