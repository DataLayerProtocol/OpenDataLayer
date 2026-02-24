---
layout: home

hero:
  name: OpenDataLayer
  text: Universal Data Layer Protocol
  tagline: An open-source, vendor-neutral standard for collecting, structuring, and routing analytics and marketing data across platforms.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/DataLayerProtocol/OpenDataLayer

features:
  - title: Vendor Neutral
    details: No lock-in. OpenDataLayer defines a universal event model that works with any analytics provider, CDP, or marketing tool.
  - title: Schema-First
    details: Every event and context is backed by a JSON Schema. Validate data at the edge before it reaches downstream systems.
  - title: TypeScript Native
    details: Full type safety out of the box. Auto-generated types from schemas mean your tracking code catches errors at compile time.
  - title: Adapter Architecture
    details: Ship data to Google Analytics, Segment, Amplitude, or any destination through lightweight, pluggable adapters.
  - title: Privacy by Design
    details: First-class consent context and purpose-based filtering let you respect user choices without bolting compliance on after the fact.
  - title: Open Standard
    details: Community-driven specification released under MIT. Extend it, fork it, contribute back -- the protocol belongs to everyone.
---

## Quick Start

```bash
npm install @opendatalayer/sdk
```

```ts
import { createODL } from '@opendatalayer/sdk';

const odl = createODL();

// Track a page view
odl.track('page.view');

// Track an ecommerce event
odl.track('ecommerce.product_viewed', {
  product: {
    id: 'SKU-123',
    name: 'Running Shoes',
    price: 129.99,
    currency: 'USD',
  },
});
```

Read the full [Getting Started](/guide/getting-started) guide to learn more.
