# Core Concepts

OpenDataLayer is built on a small set of foundational ideas. Understanding these concepts makes it straightforward to instrument any application.

## Events

An **event** is a discrete thing that happened: a page was viewed, a product was added to a cart, a user signed up. Every event follows the same envelope structure:

```json
{
  "event": "ecommerce.product_added",
  "id": "unique-uuid-v4",
  "timestamp": "2025-06-15T10:30:00.000Z",
  "specVersion": "1.0.0",
  "context": { },
  "data": { },
  "customDimensions": { }
}
```

### Event Naming

Events use a **dot-separated namespace** pattern:

```
category.action
```

The first segment is the category (e.g., `page`, `ecommerce`, `user`, `consent`, `search`, `media`, `form`). The second segment is the specific action. This convention enables wildcard subscriptions like `ecommerce.*`.

### Standard Events

OpenDataLayer ships with schemas for common event categories:

| Category | Examples |
|----------|----------|
| `page` | `page.view` |
| `ecommerce` | `product_viewed`, `product_added`, `purchase`, `checkout_started` |
| `user` | `user.identified`, `user.signed_up`, `user.signed_out` |
| `consent` | `consent.given`, `consent.revoked` |
| `search` | `search.performed` |
| `media` | `media.play_started`, `media.completed` |
| `form` | `form.submitted`, `form.started` |

You can define your own events in the `custom` namespace (e.g., `custom.feature_flag_evaluated`) with arbitrary data payloads.

## Context

**Context** is persistent metadata that gets attached to every event automatically. Instead of passing the same values on every `track` call, you set context once and it flows through.

```ts
odl.setContext('user', { id: 'u-123', isAuthenticated: true });
odl.setContext('page', { url: '...', title: '...' });
```

Standard context types include:

| Context | Purpose |
|---------|---------|
| `page` | Current page URL, path, title, referrer |
| `app` | Application name, version, environment, platform |
| `user` | User ID, authentication state, traits |
| `consent` | Consent status, purposes granted/denied |
| `session` | Session ID, visit count |
| `device` | Device type, screen resolution, viewport |
| `campaign` | UTM parameters, traffic source |

Context is mutable. When a user logs in, update the `user` context; subsequent events will include the new identity.

## Data Model

Every event has three data areas:

1. **Envelope** -- the top-level fields (`event`, `id`, `timestamp`, `specVersion`). These are the same for every event and are managed by the SDK.
2. **Data** -- the event-specific payload. For `ecommerce.purchase`, this includes order ID, total, products, etc. Each event type has its own JSON Schema defining the allowed shape.
3. **Context** -- the ambient state described above. Context is a snapshot taken at the moment the event is tracked.

An optional fourth area, **customDimensions**, provides an escape hatch for organization-specific properties that do not fit the standard schema.

## Schemas

Every event and context type is defined by a [JSON Schema (Draft 2020-12)](https://json-schema.org/draft/2020-12/json-schema-core.html). Schemas serve multiple purposes:

- **Validation** -- reject malformed events before they pollute downstream systems.
- **Documentation** -- schemas are the single source of truth for what each event contains.
- **Code generation** -- TypeScript types are auto-generated from schemas, giving compile-time safety.
- **Contracts** -- schemas act as a versioned contract between instrumentation code and data consumers.

All schemas live in the `schemas/v1/` directory. See the [Event Reference](/reference/events) and [Context Reference](/reference/contexts) for the generated documentation.

## Adapters

An **adapter** is a lightweight plugin that receives events and forwards them to a third-party destination (Google Analytics, Segment, Amplitude, etc.). Adapters can:

- Filter which events they handle
- Transform the ODL event shape into the destination's expected format
- Respect consent context to suppress events when the user has not granted permission

See the [Adapters](/guide/adapters) guide for details.

## Validation

The SDK can optionally validate event payloads against their JSON Schemas at runtime. This is especially useful during development and QA to catch instrumentation mistakes early. See the [Validation](/guide/validation) guide for configuration options.

## Further Reading

- [OpenDataLayer Specification](https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/SPEC.md) -- the full protocol specification.
- [Event Reference](/reference/events) -- auto-generated docs for all standard events.
- [Context Reference](/reference/contexts) -- auto-generated docs for all context types.
