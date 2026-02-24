# OpenDataLayer (ODL)

**A universal, open-source data layer protocol for analytics and tracking.**

[![CI](https://github.com/DataLayerProtocol/OpenDataLayer/actions/workflows/ci.yml/badge.svg)](https://github.com/DataLayerProtocol/OpenDataLayer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@opendatalayer/sdk.svg)](https://www.npmjs.com/package/@opendatalayer/sdk)

---

OpenDataLayer is a **platform-agnostic specification** for how analytics events should be structured, validated, and consumed. Think OpenAPI, but for analytics and tracking.

**JSON Schemas are the single source of truth.** TypeScript types, documentation, validators, and test fixtures are all derived from the schemas -- eliminating drift between spec and implementation.

## Why?

The analytics ecosystem is fragmented. Every platform -- GA4, Segment, Adobe, Amplitude, Tealium -- has its own data layer format, naming conventions, and event taxonomy. This means:

- **Vendor lock-in**: Switching platforms requires rewriting your tracking
- **Inconsistency**: Different naming across platforms (e.g., `purchase` vs `order_completed` vs `transaction`)
- **No validation**: Events are typically fire-and-forget with no schema enforcement
- **Duplicated effort**: Every team builds their own data layer abstraction

OpenDataLayer solves this with a **single, standardized protocol** that any analytics tool can consume.

---

## The Protocol

The ODL protocol is the core standard -- the schemas, specification, and types that define how analytics events are structured. This is what organizations adopt.

### Event Model: `event + context + data`

```json
{
  "event": "ecommerce.purchase",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "specVersion": "1.0.0",
  "context": {
    "page": { "url": "https://example.com/checkout", "path": "/checkout" },
    "user": { "id": "user-123", "isAuthenticated": true },
    "consent": { "status": "granted", "purposes": { "analytics": true } }
  },
  "data": {
    "orderId": "ORD-789",
    "total": 142.49,
    "currency": "USD",
    "products": [{ "id": "SKU-456", "name": "Running Shoes", "price": 129.99 }]
  },
  "customDimensions": {
    "ab_test_variant": "checkout-v2"
  }
}
```

- **`event`** -- Dot-namespaced name (`category.action`). Enables wildcard subscriptions.
- **`context`** -- Ambient state that persists across events. 15 context domains: page, user, consent, session, device, app, campaign, location, account, cart, experiment, loyalty, order, organization, subscription.
- **`data`** -- Event-specific payload. Each event type has its own schema.
- **`customDimensions`** -- Escape hatch for implementation-specific key-value pairs.

### Event Taxonomy

354 JSON schemas across 46 event categories covering every major business interaction:

| Category | Events | | Category | Events |
|----------|--------|-|----------|--------|
| `ecommerce` | 21 | | `subscription` | 11 |
| `crm` | 12 | | `media` | 12 |
| `marketplace` | 10 | | `gaming` | 10 |
| `social` | 10 | | `content` | 10 |
| `support` | 10 | | `app` | 11 |
| `payment` | 9 | | `auth` | 9 |
| `collaboration` | 9 | | `communication` | 8 |
| `notification` | 8 | | `onboarding` | 8 |
| `education` | 8 | | `finance` | 8 |
| `account` | 8 | | `order` | 7 |
| `booking` | 7 | | `video_call` | 7 |
| `loyalty` | 7 | | `integration` | 7 |
| `form` | 6 | | `interaction` | 6 |
| `ai` | 6 | | `scheduling` | 6 |
| `ad` | 5 | | `automation` | 5 |
| `document` | 5 | | `feature` | 5 |
| `identity` | 5 | | `privacy` | 5 |
| `referral` | 5 | | `review` | 5 |
| `survey` | 5 | | `user` | 5 |
| `experiment` | 4 | | `search` | 4 |
| `page` | 3 | | `consent` | 3 |
| `performance` | 4 | | `file` | 6 |
| `error` | 2 | | `custom` | 1 |

### Schema-First Design

JSON Schemas (Draft 2020-12) are the **single source of truth**:

```
schemas/v1/
├── core/           # Event envelope, context wrapper, shared primitives
├── context/        # 15 context object schemas
├── events/         # 335+ event schemas across 46 categories
└── enums/          # Currency codes, consent purposes, device types, etc.
```

Everything derives from schemas:
- **TypeScript types**: `@opendatalayer/types`
- **Validation**: Runtime and build-time schema enforcement
- **Documentation**: Event/context reference generated from schemas
- **Test fixtures**: Validated against schemas

### Protocol Specification

The full formal specification is in [`spec/v1/`](./spec/v1/):

| Document | Description |
|----------|-------------|
| [Overview](./spec/v1/overview.md) | Protocol overview and design rationale |
| [Data Model](./spec/v1/data-model.md) | Core event+context model |
| [Events](./spec/v1/events.md) | Event naming and full taxonomy (46 categories) |
| [Context Objects](./spec/v1/context-objects.md) | All 15 context definitions |
| [Transport](./spec/v1/transport.md) | Push model, subscriptions, middleware pipeline |
| [Privacy](./spec/v1/privacy.md) | Privacy-by-design principles |
| [Conformance](./spec/v1/conformance.md) | Three conformance levels (Minimal, Standard, Full) |
| [Versioning](./spec/v1/versioning.md) | Versioning and backward compatibility |
| [Extensions](./spec/v1/extensions.md) | Custom events and contexts |

---

## The Toolkit

The ODL toolkit is a reference implementation that makes adoption effortless. You can adopt the protocol without the toolkit, or use the toolkit to get running in minutes.

### SDK

```bash
npm install @opendatalayer/sdk
```

```typescript
import { OpenDataLayer } from '@opendatalayer/sdk';

const odl = new OpenDataLayer({
  source: { name: 'my-app', version: '1.0.0' },
});

// Set context (persists across all events)
odl.setContext('page', {
  url: window.location.href,
  title: document.title,
});

// Track events
odl.track('page.view');

odl.track('ecommerce.purchase', {
  orderId: 'ORD-789',
  total: 142.49,
  currency: 'USD',
  products: [
    { id: 'SKU-456', name: 'Running Shoes', price: 129.99, currency: 'USD', quantity: 1 },
  ],
});

// Subscribe to events
odl.on('ecommerce.*', (event) => {
  console.log('Ecommerce event:', event);
});
```

### Adapters

Adapters translate ODL events to platform-specific formats. Each adapter is ~200-300 lines and handles the full mapping from ODL's universal schema to the vendor's expected format.

```typescript
import { gtmAdapter } from '@opendatalayer/adapter-gtm';
import { segmentAdapter } from '@opendatalayer/adapter-segment';

// Events automatically translated and pushed to both platforms
odl.use(gtmAdapter());
odl.use(segmentAdapter());

// ODL: ecommerce.purchase -> GTM: purchase (GA4 items format) + Segment: Order Completed
odl.track('ecommerce.purchase', { ... });
```

| Adapter | Translates to | Status |
|---------|---------------|--------|
| `@opendatalayer/adapter-gtm` | Google Tag Manager / GA4 | Stable |
| `@opendatalayer/adapter-segment` | Segment analytics.js | Stable |
| `@opendatalayer/adapter-webhook` | Generic HTTP webhook (batch + real-time) | Stable |
| `@opendatalayer/adapter-adobe` | Adobe Analytics (AppMeasurement + WebSDK) | Stable |
| `@opendatalayer/adapter-amplitude` | Amplitude Analytics | Stable |
| `@opendatalayer/adapter-piwik` | Piwik PRO / Matomo | Stable |
| `@opendatalayer/adapter-tealium` | Tealium iQ / EventStream | Stable |

### Validator

```bash
# CLI
npx @opendatalayer/validator validate events.json

# Programmatic
import { ODLValidator } from '@opendatalayer/validator';

const validator = new ODLValidator();
const result = validator.validate(myEvent);
```

Includes semantic rules beyond schema validation: consent-before-tracking, ecommerce currency consistency, required context presence.

### Testing

```typescript
import { ODLSpy, createPurchaseEvent, installMatchers } from '@opendatalayer/testing';

installMatchers();

const event = createPurchaseEvent();
expect(event).toBeValidODLEvent();
expect(event).toHaveEventName('ecommerce.purchase');
```

### All Packages

| Package | What it is |
|---------|-----------|
| **Protocol** | |
| `@opendatalayer/types` | TypeScript types for all events, contexts, and the event envelope |
| **Toolkit** | |
| `@opendatalayer/sdk` | Reference SDK -- event tracking, context management, plugin system |
| `@opendatalayer/validator` | JSON Schema validation engine + semantic rules + CLI |
| `@opendatalayer/testing` | Test helpers, fixtures, Vitest/Jest matchers, event spy |
| `@opendatalayer/adapter-*` | Platform adapters (GTM, Segment, Adobe, Amplitude, Piwik, Tealium, Webhook) |

---

## Project Structure

```
OpenDataLayer/
├── spec/v1/           # Formal protocol specification (9 documents)
├── schemas/v1/        # JSON Schemas — the source of truth (354 schemas)
│   ├── core/          #   Event envelope, context wrapper, shared primitives
│   ├── context/       #   15 context object schemas
│   ├── events/        #   335+ event schemas across 46 categories
│   └── enums/         #   Shared enum definitions
├── packages/
│   ├── types/         # TypeScript types (protocol)
│   ├── sdk/           # Reference SDK (toolkit)
│   ├── validator/     # Schema validator + CLI (toolkit)
│   └── testing/       # Test utilities (toolkit)
├── adapters/          # 7 platform adapters (toolkit)
├── scripts/           # Build tooling
├── examples/          # Working examples (HTML, Node, React, Next.js)
└── docs/              # VitePress documentation site
```

## Development

```bash
npm install                   # Install dependencies
npm run validate:schemas      # Validate all 354 JSON schemas
npm run build                 # Build all packages
npm test                      # Run all tests
npm run lint                  # Lint (Biome)
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines. The project welcomes contributions to schemas, adapters, SDK features, and documentation.

## License

[MIT](./LICENSE)
