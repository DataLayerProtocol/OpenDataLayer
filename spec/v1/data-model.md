# OpenDataLayer Protocol Specification v1 — Data Model

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-02-23

---

## 1. Introduction

This document defines the core data model of the OpenDataLayer (ODL) protocol. The data model consists of three primary constructs:

1. **Event Envelope** — the standard structure that wraps every event.
2. **Context Objects** — ambient state that persists across events.
3. **Data Payloads** — event-specific data that varies per event type.

Together, these constructs define the shape of every piece of data that flows through an ODL-conformant data layer.

## 2. Event Envelope

The event envelope is the **atomic unit** of the ODL protocol. Every trackable action, state change, or measurement is represented as an event envelope. Producers MUST emit events in this format, and consumers MUST be able to parse it.

### 2.1 Envelope Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `event` | `string` | **Yes** | The dot-namespaced event name (e.g., `page.view`, `ecommerce.purchase`). MUST conform to the naming conventions defined in [events.md](events.md). |
| `id` | `string` | **Yes** | A globally unique identifier for this event instance. MUST be a UUID v4 string. Used for deduplication and traceability. |
| `timestamp` | `string` | **Yes** | ISO 8601 timestamp with timezone offset indicating when the event occurred. MUST include millisecond precision. Example: `2026-02-23T14:30:00.000Z`. |
| `context` | `object` | **Yes** | An object containing context objects that describe the ambient state at the time of the event. See [Section 3](#3-context-objects). |
| `data` | `object` | No | Event-specific data payload. The shape of this object varies per event type and is defined in [events.md](events.md). MAY be omitted for events that carry no additional data. |
| `customDimensions` | `object` | No | An escape hatch for implementation-specific key-value pairs that do not fit into the core schema. See [Section 5](#5-customdimensions). |
| `source` | `object` | No | Metadata about the producer that emitted this event. See [Section 6](#6-source). |
| `specVersion` | `string` | **Yes** | The version of the ODL specification this event conforms to. MUST follow semantic versioning. For this specification: `"1.0.0"`. |

### 2.2 Field Details

#### 2.2.1 `event`

The `event` field contains the canonical name of the event. Event names follow a strict `category.action` dot-namespaced convention.

- MUST be a non-empty string.
- MUST contain exactly one dot (`.`) separating the category from the action.
- MUST use `snake_case` for both category and action.
- MUST correspond to a defined event in the ODL taxonomy or a valid `custom.*` extension event.

Examples of valid event names:
- `page.view`
- `ecommerce.purchase`
- `media.play`
- `custom.quiz_completed`

Examples of invalid event names:
- `pageView` (missing dot separator)
- `ecommerce.product.viewed` (too many dots — use `ecommerce.product_viewed`)
- `Page.View` (must be snake_case)
- `purchase` (missing category prefix)

#### 2.2.2 `id`

The `id` field provides a unique identifier for each event instance. This identifier is critical for:

- **Deduplication.** If an event is accidentally emitted twice (e.g., due to a retry), consumers can deduplicate by `id`.
- **Traceability.** The `id` allows events to be traced through the entire pipeline from producer to consumer.
- **Correlation.** Related events can reference each other by `id` in their data payloads.

The `id` MUST be a UUID v4 string in the standard 8-4-4-4-12 format (e.g., `"f47ac10b-58cc-4372-a567-0e02b2c3d479"`).

Implementations MUST generate a new `id` for each event. Reusing `id` values across events is a protocol violation.

#### 2.2.3 `timestamp`

The `timestamp` field records when the event occurred, not when it was processed or delivered. This distinction matters for offline events, batched events, and events with network latency.

- MUST be an ISO 8601 string.
- MUST include a timezone offset or `Z` for UTC.
- MUST include millisecond precision.
- SHOULD represent the actual time the user action occurred, not the time the event was pushed to the data layer.

Example: `"2026-02-23T14:30:45.123Z"`

#### 2.2.4 `specVersion`

The `specVersion` field declares which version of the ODL specification this event conforms to. This allows consumers to handle events from different spec versions gracefully.

- MUST be a semantic version string (e.g., `"1.0.0"`).
- MUST correspond to a published version of the ODL specification.
- See [versioning.md](versioning.md) for full versioning rules.

## 3. Context Objects

Context objects represent **ambient state** — information that is true for the current session, page, user, or device and that applies to every event emitted during that state. Rather than repeating user ID, page URL, and consent state on every event, ODL maintains context objects that are automatically merged into the event's `context` field.

### 3.1 Context Object Inventory

The ODL protocol defines 15 context objects:

| Context | Key | Description |
|---|---|---|
| Page | `page` | Current page or screen state. |
| User | `user` | Authenticated or anonymous user state. |
| Consent | `consent` | User's privacy consent state. |
| Session | `session` | Current session metadata. |
| Device | `device` | Device and browser information. |
| App | `app` | Application or site metadata. |
| Campaign | `campaign` | Marketing attribution parameters. |
| Location | `location` | Geographic location context. |
| Account | `account` | Organizational account context for multi-tenant products. |
| Cart | `cart` | Shopping cart state and contents. |
| Experiment | `experiment` | A/B test and feature flag experiment state. |
| Loyalty | `loyalty` | Loyalty program membership and points state. |
| Order | `order` | Active order or most recent order context. |
| Organization | `organization` | B2B organization context (industry, plan, ARR/MRR). |
| Subscription | `subscription` | Active subscription plan and billing context. |

Each context object is fully defined in [context-objects.md](context-objects.md).

### 3.2 Context in the Event Envelope

The `context` field of the event envelope is an object whose keys correspond to the context object names above. Not all context objects are required — the required set depends on the conformance level (see [conformance.md](conformance.md)).

> **Note:** Not all context objects need to be present on every event. Only include the contexts that are relevant to the current state. The required set depends on the conformance level (see [conformance.md](conformance.md)).

```json
{
  "context": {
    "page": { ... },
    "user": { ... },
    "consent": { ... },
    "session": { ... },
    "device": { ... },
    "app": { ... },
    "campaign": { ... },
    "location": { ... },
    "account": { ... },
    "cart": { ... },
    "experiment": { ... },
    "loyalty": { ... },
    "order": { ... },
    "organization": { ... },
    "subscription": { ... }
  }
}
```

### 3.3 Context Lifecycle

Context objects are **set once and persist** until explicitly updated. When a producer sets the `user` context (e.g., after login), that user context is included in every subsequent event until it is updated (e.g., after logout) or the session ends.

Context objects are **merged, not replaced**, when updated. If the `user` context contains `{ "id": "123", "email": "user@example.com" }` and a producer updates it with `{ "loyaltyTier": "gold" }`, the resulting context is `{ "id": "123", "email": "user@example.com", "loyaltyTier": "gold" }`. See [context-objects.md](context-objects.md) for detailed merge semantics.

## 4. Data Payloads

The `data` field of the event envelope contains **event-specific data** that varies per event type. Unlike context objects (which persist across events), data payloads are specific to a single event instance.

### 4.1 Schema Per Event

Each event type in the ODL taxonomy defines its own data payload schema. For example:

- `page.view` data includes `title`, `url`, `referrer`, `type`.
- `ecommerce.purchase` data includes `orderId`, `revenue`, `tax`, `shipping`, `currency`, `products`.
- `media.play` data includes `mediaId`, `title`, `duration`, `position`.

The full data schemas for each event type are defined in [events.md](events.md).

### 4.2 Optional Data

The `data` field is OPTIONAL on the event envelope. Some events may carry no additional data beyond what is in the context (e.g., `page.leave` may rely entirely on the `page` context). However, when a data payload is provided, it MUST conform to the schema defined for that event type.

### 4.3 Data Typing

All data payload fields use standard JSON types:

| JSON Type | Usage |
|---|---|
| `string` | Text values. MUST be UTF-8 encoded. |
| `number` | Numeric values. Monetary values MUST use decimal notation (e.g., `29.99`), not integer cents. |
| `boolean` | True/false flags. |
| `array` | Ordered lists (e.g., list of products in a purchase). |
| `object` | Nested structures (e.g., a product object within a purchase). |
| `null` | Explicitly absent values. Fields that are not applicable SHOULD be omitted rather than set to `null`. |

## 5. customDimensions

The `customDimensions` field is an **escape hatch** for implementation-specific key-value pairs that do not fit into the core ODL schema. This field allows organizations to attach additional metadata to events without violating the protocol or extending the core schema.

### 5.1 Purpose

While ODL's core schema covers common tracking scenarios, every organization has unique data needs. Rather than forcing all data into the core schema (which would bloat it) or requiring formal extensions for every custom field (which would slow adoption), `customDimensions` provides a lightweight way to attach additional data.

### 5.2 Structure

`customDimensions` is a flat key-value object where:

- Keys MUST be strings.
- Values MUST be strings, numbers, or booleans. Nested objects and arrays are NOT permitted in `customDimensions`.
- Keys SHOULD use `camelCase`.
- Keys MUST NOT conflict with any field names in the core event envelope or context objects.

```json
{
  "customDimensions": {
    "experimentId": "exp-2026-homepage-v2",
    "experimentVariant": "treatment",
    "internalCampaignId": "spring-sale-2026",
    "customerSegment": "high-value"
  }
}
```

### 5.3 When to Use customDimensions vs. Extensions

- Use `customDimensions` for **ad-hoc, implementation-specific** key-value pairs that are unlikely to be standardized.
- Use the **extension mechanism** (see [extensions.md](extensions.md)) for structured, reusable data that should have its own schema and could benefit the broader community.

## 6. Source

The `source` field provides metadata about the producer that emitted the event. This is useful in systems where multiple producers (e.g., a website, a mobile app, and a server) all feed into the same data layer.

### 6.1 Source Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `source.name` | `string` | No | Human-readable name of the producing system (e.g., `"marketing-website"`, `"ios-app"`). |
| `source.version` | `string` | No | Version of the producing system or its ODL integration. |
| `source.environment` | `string` | No | Runtime environment. RECOMMENDED values: `"production"`, `"staging"`, `"development"`, `"testing"`. |

```json
{
  "source": {
    "name": "marketing-website",
    "version": "2.4.1",
    "environment": "production"
  }
}
```

## 7. Type System and Validation

### 7.1 JSON Schema Foundation

ODL uses [JSON Schema](https://json-schema.org/) (draft 2020-12) as its schema language. Every event type, context object, and data payload has a corresponding JSON Schema definition that specifies:

- Required fields.
- Field types and formats.
- Allowed values (enums).
- String patterns (regex).
- Numeric ranges.
- Array item schemas.

### 7.2 Validation Rules

1. **Envelope validation.** Every event MUST pass validation against the core event envelope schema. This ensures the presence of `event`, `id`, `timestamp`, `context`, and `specVersion`.

2. **Event name validation.** The `event` field MUST match a known event name in the taxonomy or the `custom.*` namespace.

3. **Data payload validation.** If a `data` field is present, it MUST pass validation against the schema defined for that event type.

4. **Context validation.** Each context object in the `context` field MUST pass validation against its corresponding context schema.

5. **Strict mode.** Implementations MAY support a strict validation mode that rejects events with unknown fields. In non-strict mode, unknown fields SHOULD be preserved but MAY be flagged with warnings.

### 7.3 Validation Timing

Validation SHOULD occur at the earliest possible point in the pipeline — ideally at the point of event emission. The middleware pipeline (see [transport.md](transport.md)) provides a `validate` middleware stage specifically for this purpose.

Events that fail validation MUST NOT be silently dropped. Implementations MUST either:

- Reject the event and notify the producer (preferred in development).
- Log a validation error and forward the event with a validation warning (acceptable in production).

## 8. Complete Event Example

The following is a complete, valid ODL event envelope for an ecommerce purchase:

```json
{
  "event": "ecommerce.purchase",
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-02-23T14:30:45.123Z",
  "specVersion": "1.0.0",
  "context": {
    "page": {
      "url": "https://www.example.com/checkout/confirmation",
      "title": "Order Confirmation — Example Store",
      "path": "/checkout/confirmation",
      "referrer": "https://www.example.com/checkout/payment",
      "type": "checkout"
    },
    "user": {
      "id": "user-789",
      "isAuthenticated": true,
      "traits": {
        "email": "jane.doe@example.com",
        "firstName": "Jane",
        "lastName": "Doe",
        "loyaltyTier": "gold"
      }
    },
    "consent": {
      "analytics": true,
      "marketing": false,
      "personalization": true,
      "method": "explicit",
      "updatedAt": "2026-02-20T09:15:00.000Z"
    },
    "session": {
      "id": "sess-abc123",
      "isNew": false,
      "count": 5,
      "startedAt": "2026-02-23T14:10:00.000Z"
    },
    "device": {
      "type": "desktop",
      "browser": "Chrome",
      "browserVersion": "122.0",
      "os": "macOS",
      "osVersion": "15.3",
      "screenResolution": "2560x1440",
      "viewport": "1440x900",
      "language": "en-US"
    },
    "app": {
      "name": "Example Store",
      "version": "3.2.0",
      "environment": "production"
    },
    "campaign": {
      "source": "google",
      "medium": "cpc",
      "name": "spring-sale-2026",
      "term": "running shoes",
      "content": "ad-variant-b"
    },
    "location": {
      "country": "US",
      "region": "CA",
      "city": "San Francisco",
      "postalCode": "94102",
      "timezone": "America/Los_Angeles"
    }
  },
  "data": {
    "orderId": "ORD-2026-78901",
    "affiliation": "Example Store Online",
    "revenue": 149.97,
    "tax": 12.37,
    "shipping": 0.00,
    "discount": 15.00,
    "currency": "USD",
    "coupon": "SPRING15",
    "products": [
      {
        "id": "SKU-001",
        "name": "Trail Runner Pro",
        "brand": "ExampleBrand",
        "category": "Shoes/Running",
        "variant": "Blue/Size-10",
        "price": 89.99,
        "quantity": 1,
        "position": 1
      },
      {
        "id": "SKU-042",
        "name": "Performance Running Socks (3-pack)",
        "brand": "ExampleBrand",
        "category": "Accessories/Socks",
        "variant": "White/Large",
        "price": 24.99,
        "quantity": 2,
        "position": 2,
        "coupon": "SOCKDEAL"
      }
    ]
  },
  "customDimensions": {
    "experimentId": "checkout-flow-v2",
    "experimentVariant": "streamlined",
    "paymentMethod": "credit_card",
    "storeRegion": "west-coast"
  },
  "source": {
    "name": "example-store-web",
    "version": "3.2.0",
    "environment": "production"
  }
}
```

## 9. Minimal Event Example

The following is a **minimal** valid ODL event envelope, including only required fields:

```json
{
  "event": "page.view",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-23T14:30:45.123Z",
  "specVersion": "1.0.0",
  "context": {
    "page": {
      "url": "https://www.example.com/",
      "title": "Example Store — Home"
    }
  }
}
```

This event conforms to the **Minimal** conformance level (see [conformance.md](conformance.md)), which requires only the event envelope fields and the `page` context.
