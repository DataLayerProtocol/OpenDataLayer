# OpenDataLayer Protocol Specification v1 — Conformance

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-02-23

---

## 1. Introduction

This document defines the three conformance levels for the OpenDataLayer (ODL) protocol. Conformance levels provide a structured path for adoption: organizations can start with a minimal implementation and progressively adopt more of the protocol over time.

Conformance levels also serve as a communication tool. When an implementation declares its conformance level, producers and consumers know exactly what to expect.

## 2. Conformance Levels Overview

ODL defines three conformance levels, each building on the previous one:

| Level | Name | Summary |
|---|---|---|
| 1 | **Minimal** | Event envelope + specVersion + page context. The absolute minimum to be ODL-conformant. |
| 2 | **Standard** | Minimal + user, consent, session contexts + core event taxonomy. Suitable for most analytics implementations. |
| 3 | **Full** | Standard + all contexts + complete event taxonomy + schema validation. The complete ODL protocol. |

Each level is a strict superset of the previous level. A Full-conformant implementation is also Standard-conformant and Minimal-conformant.

## 3. Minimal Conformance (Level 1)

Minimal conformance represents the lowest barrier to entry. An implementation that achieves Minimal conformance emits valid ODL event envelopes with basic page context. This level is appropriate for:

- Initial adoption and proof-of-concept implementations.
- Simple websites that only need page view tracking.
- Legacy systems being gradually migrated to ODL.

### 3.1 Requirements

#### 3.1.1 Event Envelope

Every event MUST include the following envelope fields as defined in [data-model.md](data-model.md):

| Field | Requirement |
|---|---|
| `event` | MUST be present. MUST be a non-empty string. MUST contain a dot separator. |
| `id` | MUST be present. MUST be a UUID v4 string. |
| `timestamp` | MUST be present. MUST be an ISO 8601 string with timezone and millisecond precision. |
| `specVersion` | MUST be present. MUST be `"1.0.0"` (or the applicable version). |
| `context` | MUST be present. MUST be an object containing at least the `page` context. |

#### 3.1.2 Page Context

The `page` context MUST be present in every event and MUST include at least:

| Field | Requirement |
|---|---|
| `page.url` | MUST be present. MUST be the full URL of the current page. |
| `page.title` | MUST be present. MUST be the page title. |

Additional `page` fields (`path`, `hash`, `search`, `referrer`, `type`, `name`, `language`) are OPTIONAL at the Minimal level.

#### 3.1.3 Event Names

Events MUST use the dot-namespaced `category.action` naming convention. At the Minimal level, implementations are NOT required to use the standard taxonomy — any valid `category.action` name is acceptable.

#### 3.1.4 Data Payloads

Data payloads (`data` field) are OPTIONAL at the Minimal level. When provided, they are not required to conform to the standard event data schemas.

#### 3.1.5 Optional Fields

The following envelope fields are OPTIONAL at the Minimal level:

- `data`
- `customDimensions`
- `source`

### 3.2 Minimal Conformance Example

```json
{
  "event": "page.view",
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-23T14:30:45.123Z",
  "specVersion": "1.0.0",
  "context": {
    "page": {
      "url": "https://www.example.com/",
      "title": "Example — Home"
    }
  }
}
```

## 4. Standard Conformance (Level 2)

Standard conformance adds user identity, consent management, session tracking, and the core event taxonomy. This level is appropriate for:

- Production analytics implementations.
- Ecommerce sites that need conversion tracking.
- Organizations that need consent management.
- Multi-tool setups that benefit from a standardized event vocabulary.

### 4.1 Requirements

Standard conformance includes all Minimal requirements, plus the following:

#### 4.1.1 Additional Context Objects

The following context objects MUST be supported and populated when applicable:

| Context | When Required |
|---|---|
| `user` | MUST be populated when the user is authenticated. SHOULD include `anonymousId` for anonymous users. |
| `consent` | MUST be populated on every event. MUST reflect the current consent state. Default: all categories `false`. |
| `session` | MUST be populated on every event. MUST include at least `session.id`. |

All fields within these context objects follow the schemas defined in [context-objects.md](context-objects.md). Required fields within each context object MUST be present when the context is populated.

#### 4.1.2 Core Event Taxonomy

Implementations MUST use the standard event names from the ODL taxonomy (see [events.md](events.md)) for the following core events when they are tracked:

| Event | When Required |
|---|---|
| `page.view` | MUST be fired on every page navigation. |
| `page.leave` | SHOULD be fired when the user leaves a page. |
| `consent.given` | MUST be fired when the user grants consent. |
| `consent.revoked` | MUST be fired when the user revokes consent. |
| `user.signed_in` | MUST be fired when the user authenticates (if authentication is supported). |
| `user.signed_out` | MUST be fired when the user logs out (if authentication is supported). |
| `user.identified` | SHOULD be fired when an anonymous user is identified. |

If the implementation tracks ecommerce events, the following events MUST use the standard names:

| Event | When Required |
|---|---|
| `ecommerce.product_viewed` | When a product detail page is viewed. |
| `ecommerce.product_added` | When a product is added to cart. |
| `ecommerce.product_removed` | When a product is removed from cart. |
| `ecommerce.purchase` | When a transaction is completed. |

Implementations MAY track additional events from the taxonomy and SHOULD use the standard names when doing so.

#### 4.1.3 Data Payload Conformance

When a Standard-level implementation fires a core taxonomy event, the `data` payload MUST conform to the schema defined for that event in [events.md](events.md). Required fields in the data schema MUST be present.

#### 4.1.4 Consent-First Behavior

Implementations at the Standard level MUST:

- Initialize consent to the default state (all categories `false`).
- Evaluate consent before delivering events to consumers.
- Support consent-aware routing (suppressing events for consumers whose required consent is not granted).

#### 4.1.5 Event Naming Enforcement

At the Standard level, implementations MUST reject or warn on events that use non-standard names for actions covered by the core taxonomy. For example, if an implementation tracks page views, it MUST use `page.view`, not `pageview` or `page.loaded`.

### 4.2 Standard Conformance Example

```json
{
  "event": "ecommerce.purchase",
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-02-23T14:30:45.123Z",
  "specVersion": "1.0.0",
  "context": {
    "page": {
      "url": "https://www.example.com/checkout/confirmation",
      "title": "Order Confirmation",
      "path": "/checkout/confirmation",
      "type": "checkout"
    },
    "user": {
      "id": "user-789",
      "isAuthenticated": true
    },
    "consent": {
      "analytics": true,
      "marketing": false,
      "personalization": true,
      "functional": true,
      "method": "explicit"
    },
    "session": {
      "id": "sess-abc123",
      "isNew": false,
      "count": 5
    }
  },
  "data": {
    "orderId": "ORD-2026-78901",
    "revenue": 149.97,
    "currency": "USD",
    "products": [
      {
        "id": "SKU-001",
        "name": "Trail Runner Pro",
        "price": 89.99,
        "quantity": 1
      }
    ]
  }
}
```

## 5. Full Conformance (Level 3)

Full conformance represents the complete ODL protocol. This level is appropriate for:

- Enterprise analytics implementations.
- Organizations building a universal data layer across multiple platforms.
- Implementations that serve as the canonical data source for all downstream consumers.
- ODL reference implementations and conformance test suites.

### 5.1 Requirements

Full conformance includes all Standard requirements, plus the following:

#### 5.1.1 All Context Objects

All 15 context objects MUST be supported and populated when the relevant data is available:

| Context | Requirement |
|---|---|
| `page` | MUST be populated on every event (same as Minimal/Standard). |
| `user` | MUST be populated on every event (at least `anonymousId` for anonymous users). |
| `consent` | MUST be populated on every event (same as Standard). |
| `session` | MUST be populated on every event (same as Standard). |
| `device` | MUST be populated on every event when device information is available. |
| `app` | MUST be populated on every event. |
| `campaign` | MUST be populated when marketing attribution data is available (UTM parameters, click IDs). |
| `location` | MUST be populated when location data is available (at minimum, `country` and `timezone`). |
| `account` | MUST be populated when the user belongs to an organizational account. |
| `cart` | MUST be populated when cart state is available (ecommerce). |
| `experiment` | MUST be populated when the user is enrolled in an experiment. |
| `loyalty` | MUST be populated when loyalty program membership is active. |
| `order` | MUST be populated when an active order or recent order is available. |
| `organization` | MUST be populated when B2B organization data is available. |
| `subscription` | MUST be populated when an active subscription exists. |

#### 5.1.2 Complete Event Taxonomy

Implementations MUST use the standard event names for ALL events in the ODL taxonomy when those actions are tracked. This includes all events across all categories:

- Page events (3)
- Ecommerce events (21)
- Media events (12)
- Consent events (3)
- User events (5)
- Form events (6)
- Search events (4)
- Error events (2)
- Performance events (4)
- Interaction events (6)
- Subscription events (11)
- Payment events (9)
- Auth events (9)
- And all remaining categories as defined in [events.md](events.md)

The `custom.*` namespace remains available for organization-specific events.

#### 5.1.3 Schema Validation

Full-conformant implementations MUST validate all events against the ODL JSON Schema definitions:

- Event envelope validation (required fields, types).
- Event name validation (must be in the taxonomy or `custom.*` namespace).
- Data payload validation (must conform to the event-specific schema, when a schema exists).
- Context object validation (required fields, types).

**Custom events:** `custom.*` events that have a registered extension schema (see [extensions.md](extensions.md)) MUST be validated against that schema. Custom events without a registered schema are exempt from data payload validation, but their envelope and context objects MUST still be validated.

Validation failures MUST be handled according to the implementation's configured policy (reject, warn, or fix). The validation behavior MUST be documented.

#### 5.1.4 Middleware Pipeline

Full-conformant implementations MUST support the four-stage middleware pipeline defined in [transport.md](transport.md):

1. **Validate** — Schema validation middleware.
2. **Enrich** — At least one enrichment middleware (e.g., UTM parameter parsing).
3. **Transform** — At least PII handling middleware (hashing or redaction).
4. **Route** — Consent-aware routing middleware.

Implementations MUST support custom middleware registration at each stage.

#### 5.1.5 Source Metadata

Full-conformant implementations MUST include the `source` field on every event:

| Field | Requirement |
|---|---|
| `source.name` | MUST be present. |
| `source.version` | SHOULD be present. |
| `source.environment` | SHOULD be present. |

#### 5.1.6 customDimensions Support

Full-conformant implementations MUST support the `customDimensions` field on every event, including validation that:

- Keys are strings.
- Values are strings, numbers, or booleans (no nested objects or arrays).

### 5.2 Full Conformance Example

See the complete event example in [data-model.md](data-model.md), Section 8, which demonstrates a Full-conformant event with all context objects, a complete data payload, customDimensions, and source metadata.

## 6. Conformance Level Comparison

| Feature | Minimal | Standard | Full |
|---|---|---|---|
| Event envelope (event, id, timestamp, specVersion) | Required | Required | Required |
| Page context | Required | Required | Required |
| User context | Optional | Required | Required |
| Consent context | Optional | Required | Required |
| Session context | Optional | Required | Required |
| Device context | Optional | Optional | Required |
| App context | Optional | Optional | Required |
| Campaign context | Optional | Optional | Required |
| Location context | Optional | Optional | Required |
| Account context | Optional | Optional | Required |
| Cart context | Optional | Optional | Required |
| Experiment context | Optional | Optional | Required |
| Loyalty context | Optional | Optional | Required |
| Order context | Optional | Optional | Required |
| Organization context | Optional | Optional | Required |
| Subscription context | Optional | Optional | Required |
| Core event taxonomy | Optional | Required (subset) | Required (complete) |
| Data payload schemas | Optional | Required (core events) | Required (all events) |
| Schema validation | Optional | Optional | Required |
| Middleware pipeline | Optional | Optional | Required |
| Consent-first behavior | Optional | Required | Required |
| Source metadata | Optional | Optional | Required |
| customDimensions support | Optional | Optional | Required |

## 7. Declaring Conformance

### 7.1 Declaration Mechanism

Implementations SHOULD declare their conformance level in their documentation, configuration, and (optionally) in the event stream itself.

#### 7.1.1 Documentation Declaration

Implementation documentation SHOULD include a statement like:

> This implementation conforms to the OpenDataLayer Protocol Specification v1.0.0 at the **Standard** conformance level.

#### 7.1.2 Configuration Declaration

Implementations MAY include a conformance level in their configuration:

```javascript
const odl = new OpenDataLayer({
  conformanceLevel: "standard", // "minimal", "standard", or "full"
  specVersion: "1.0.0"
});
```

#### 7.1.3 Runtime Declaration

Implementations MAY expose their conformance level at runtime:

```javascript
odl.conformanceLevel; // "standard"
```

### 7.2 Conformance Testing

ODL provides a conformance test suite that verifies whether an implementation correctly meets the requirements of each level. The test suite checks:

- Event envelope structure and required fields.
- Context object presence and schema conformance.
- Event name compliance with the taxonomy.
- Data payload schema conformance.
- Consent-first behavior (Standard and Full).
- Middleware pipeline support (Full).

Implementations that pass the conformance test suite for a given level MAY declare conformance to that level.

## 8. Adapter Conformance

### 8.1 What is an Adapter?

An **adapter** is a consumer-specific translation layer that converts ODL events into vendor-specific API calls. For example, a Google Analytics adapter translates ODL `ecommerce.purchase` events into GA4 `purchase` events with the appropriate parameter mapping.

### 8.2 Adapter Conformance Requirements

Adapters have their own conformance requirements, separate from (but related to) the data layer conformance levels.

#### 8.2.1 Event Mapping

An adapter MUST document which ODL events it supports and how each event maps to the vendor's API.

**Example adapter mapping documentation:**

| ODL Event | Vendor Event | Mapping Notes |
|---|---|---|
| `page.view` | GA4 `page_view` | `data.title` maps to `page_title` |
| `ecommerce.purchase` | GA4 `purchase` | `data.orderId` maps to `transaction_id` |
| `ecommerce.product_viewed` | GA4 `view_item` | Product object maps to `items[]` |

#### 8.2.2 Context Mapping

An adapter MUST document which ODL context fields it uses and how they map to the vendor's context model.

#### 8.2.3 Consent Respect

An adapter MUST respect the consent state in the ODL event. If the adapter's vendor requires marketing consent and `consent.marketing` is `false`, the adapter MUST NOT send the event to the vendor.

#### 8.2.4 Data Fidelity

An adapter SHOULD preserve as much data as possible during translation. When the vendor's API does not support a field, the adapter SHOULD document the data loss.

#### 8.2.5 Adapter Conformance Levels

Adapters declare their own conformance level based on how many ODL events they support:

| Adapter Level | Requirement |
|---|---|
| **Basic** | Supports `page.view` and at least one other event category. |
| **Standard** | Supports all core events from the Standard conformance level. |
| **Complete** | Supports all events from the Full conformance level that are relevant to the vendor. |

### 8.3 Adapter Registry

ODL maintains a registry of known adapters, their conformance levels, and their supported events. The registry is a community resource that helps organizations choose adapters for their stack.

## 9. Progressive Adoption Path

ODL is designed for progressive adoption. Organizations do not need to implement Full conformance on day one. A typical adoption path:

### Phase 1: Minimal

1. Install the ODL library.
2. Emit `page.view` events with basic page context.
3. Verify events are flowing to a single consumer.

### Phase 2: Standard

4. Add `user`, `consent`, and `session` contexts.
5. Implement consent-first behavior.
6. Adopt the core event taxonomy for ecommerce (if applicable).
7. Add additional consumers with consent-aware routing.

### Phase 3: Full

8. Add all remaining contexts (`device`, `app`, `campaign`, `location`, `account`, `cart`, `experiment`, `loyalty`, `order`, `organization`, `subscription`).
9. Adopt the complete event taxonomy.
10. Enable schema validation.
11. Build out the middleware pipeline (enrichment, transformation, routing).
12. Add `source` metadata to all events.

Each phase can be deployed independently. There is no requirement to jump from Minimal to Full in a single release.
