# OpenDataLayer Protocol Specification v1 — Overview

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-02-23

---

## 1. What is OpenDataLayer?

OpenDataLayer (ODL) is a **universal, open-source data layer protocol** that defines a common schema and event model for collecting, structuring, and distributing behavioral and contextual data across digital properties. It provides a single, standardized interface between data producers (websites, applications, embedded systems) and data consumers (analytics platforms, marketing tools, data warehouses, personalization engines).

ODL is not a library, a tag manager, or an analytics product. It is a **protocol specification** — a contract that describes the shape of data, the taxonomy of events, and the mechanics of how producers and consumers interact through a shared data layer.

Any implementation that conforms to this specification can interoperate with any other conforming implementation, regardless of programming language, runtime environment, or vendor ecosystem.

## 2. Why ODL Exists

### 2.1 The Fragmentation Problem

The modern analytics ecosystem is deeply fragmented. Every vendor defines its own event names, its own data shapes, and its own integration patterns:

- **Google Analytics** expects events like `purchase` with a specific `ecommerce` object shape.
- **Segment** uses a `track` call with its own property conventions.
- **Adobe Analytics** relies on `s.products` strings and custom evars/props.
- **Amplitude**, **Mixpanel**, **Heap**, and dozens of others each define their own contracts.

This fragmentation creates several concrete problems:

1. **Vendor lock-in.** Switching analytics providers requires re-instrumenting every data collection point. A migration from Google Analytics to Amplitude is not a configuration change — it is a re-engineering effort.

2. **Duplicated instrumentation.** Organizations running multiple tools (analytics, A/B testing, personalization, marketing attribution) often instrument the same user actions multiple times, once per tool, leading to inconsistent data and bloated codebases.

3. **No shared vocabulary.** There is no industry-standard taxonomy for common events. What one vendor calls `product_viewed`, another calls `Product Viewed`, another calls `view_item`, and another calls `pdp_view`. This makes cross-platform analysis unreliable.

4. **Privacy as an afterthought.** Most data layer implementations bolt consent management on after the fact, rather than building it into the core event model.

5. **Schema drift.** Without a formal schema, data layers accumulate unvalidated, undocumented properties over time, making downstream data unreliable.

### 2.2 The Case for a Protocol

ODL addresses these problems by defining a **vendor-neutral protocol layer** that sits between instrumentation and consumption. The protocol provides:

- A **canonical event taxonomy** so that a "product added to cart" event means the same thing everywhere.
- A **formal schema** (JSON Schema) so that events can be validated at collection time.
- A **privacy-first context model** so that consent state is always available before any event is processed.
- A **middleware pipeline** so that events can be enriched, transformed, and routed without modifying instrumentation code.
- An **extension mechanism** so that organizations can add domain-specific events without breaking the core protocol.

## 3. Design Principles

ODL is built on six foundational principles. Every design decision in this specification traces back to one or more of these principles.

### 3.1 Schema-First

Every event, context object, and data payload in ODL has a corresponding JSON Schema definition. Schemas are not optional documentation — they are the protocol. Implementations MUST validate events against their schemas, and producers MUST NOT emit events that fail validation.

This principle ensures that data quality problems are caught at the point of collection, not weeks later when an analyst discovers broken data in a warehouse.

### 3.2 Privacy-by-Design

Consent is not a bolt-on feature. The ODL event model includes a first-class `consent` context object that is evaluated before any event is processed. The middleware pipeline supports consent-aware routing, so that events can be suppressed or redacted based on the user's consent state.

ODL follows the principle of **data minimization**: the protocol defines what data CAN be collected, not what data SHOULD be collected. Implementations are expected to collect only the data necessary for their stated purposes.

### 3.3 Vendor-Agnostic

ODL does not favor any analytics vendor, tag management system, or cloud provider. The protocol defines a neutral interchange format that any vendor can consume. Vendor-specific adapters translate between ODL events and vendor-specific APIs, but the core data layer remains vendor-free.

### 3.4 Extensible

The core taxonomy covers the most common tracking scenarios (page views, ecommerce, media, forms, consent), but every organization has domain-specific needs. ODL provides a `custom.*` event namespace, a `customDimensions` escape hatch on every event, and a formal extension registration mechanism so that the protocol can be extended without forking it.

### 3.5 Minimal Footprint

ODL is designed to add as little overhead as possible to the systems that implement it. The core data model is compact. The event taxonomy is flat (no deeply nested hierarchies). The middleware pipeline is optional. An implementation can start with a minimal conformance level and adopt more of the protocol over time.

### 3.6 Deterministic and Testable

Every aspect of the protocol is specified precisely enough to write automated tests against. Event names are enumerated. Field types are defined. Validation rules are explicit. This makes it possible to build conformance test suites that verify whether an implementation correctly follows the spec.

## 4. Core Architecture

ODL's architecture consists of three layers:

```
┌─────────────────────────────────────────────────────┐
│                    Producers                         │
│  (websites, apps, servers, IoT devices)             │
└──────────────────────┬──────────────────────────────┘
                       │  push events
                       ▼
┌─────────────────────────────────────────────────────┐
│              OpenDataLayer (the protocol)            │
│                                                     │
│  ┌─────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  Event   │  │  Context  │  │    Middleware     │  │
│  │ Envelope │  │  Objects  │  │    Pipeline       │  │
│  └─────────┘  └───────────┘  │                   │  │
│                               │ validate          │  │
│                               │ enrich            │  │
│                               │ transform         │  │
│                               │ route             │  │
│                               └──────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │  deliver events
                       ▼
┌─────────────────────────────────────────────────────┐
│                    Consumers                         │
│  (analytics, marketing, data warehouses, CRMs)      │
└─────────────────────────────────────────────────────┘
```

### 4.1 Event Envelope

Every trackable action is represented as an **event envelope** — a JSON object with a fixed structure containing the event name, a unique identifier, a timestamp, contextual data, and event-specific data. The envelope is the atomic unit of the protocol.

### 4.2 Context Objects

Context objects represent **ambient state** that persists across events. Rather than attaching page URL, user ID, and consent state to every individual event, ODL maintains context objects that are automatically merged into each event at emission time. Context objects include: `page`, `user`, `consent`, `session`, `device`, `app`, `campaign`, and `location`.

### 4.3 Data Payloads

Each event type defines its own data payload schema. A `page.view` event carries page-specific data (title, URL, referrer). An `ecommerce.purchase` event carries transaction-level data (order ID, revenue, products). Data payloads are the event-specific complement to the ambient context objects.

### 4.4 Middleware Pipeline

Between event emission and event delivery, ODL defines an optional **middleware pipeline** that can:

- **Validate** events against their JSON Schemas.
- **Enrich** events with additional data (e.g., looking up campaign parameters from the URL).
- **Transform** events (e.g., hashing PII fields before forwarding).
- **Route** events to different consumers based on event type or consent state.

Middleware functions are composable and ordered. They form a pipeline that each event passes through before reaching consumers.

## 5. Relationship to Existing Standards

ODL does not exist in a vacuum. Several prior efforts have addressed parts of this problem space.

### 5.1 W3C Customer Experience Digital Data Layer (CEDDL)

The W3C published the [Customer Experience Digital Data Layer](https://www.w3.org/2013/12/ceddl-201312.pdf) specification in 2013. CEDDL defined a `digitalData` object with nested structures for page, product, cart, transaction, event, component, and user data.

**What ODL takes from CEDDL:** The idea of a structured, standardized data object on the page. The concept of separating page-level context from event-level data.

**Where ODL diverges:** CEDDL is a static data object model, not an event-driven protocol. It describes the shape of data at a point in time, but does not define how events flow, how consumers subscribe, or how the data layer evolves over time. CEDDL also lacks a formal schema language, a consent model, and an extension mechanism. ODL is event-driven, schema-validated, and privacy-aware.

### 5.2 Google's dataLayer

Google Tag Manager popularized the `window.dataLayer` array pattern, where producers push objects onto an array and GTM reads them. This pattern is widely adopted but has significant limitations.

**What ODL takes from Google's dataLayer:** The push-based model where producers emit events by pushing objects onto a shared data structure. The idea that tag management and data collection can be decoupled.

**Where ODL diverges:** Google's dataLayer has no schema. Any object can be pushed onto the array, and there is no validation. Event names are not standardized (though Google's GA4 defines recommended events, they are not enforced). The dataLayer is tightly coupled to GTM's execution model. ODL provides formal schemas, a standardized event taxonomy, and a vendor-neutral consumption model.

### 5.3 Segment's Tracking Plan / Protocols

Segment's tracking API defines a set of standard calls (`identify`, `track`, `page`, `group`, `alias`) with a recommended event taxonomy for ecommerce. Segment Protocols adds schema validation on top.

**What ODL takes from Segment:** The ecommerce event taxonomy (Segment's spec is well-designed and widely adopted). The idea that events should have defined schemas.

**Where ODL diverges:** Segment's spec is a proprietary product feature, not an open protocol. It is tied to Segment's CDP platform. ODL is fully open, self-hostable, and vendor-neutral. ODL also provides richer context objects, a formal middleware pipeline, and a privacy-first consent model that Segment's spec does not include.

## 6. How ODL Differs

To summarize, ODL's key differentiators are:

| Feature | CEDDL | Google dataLayer | Segment | **ODL** |
|---|---|---|---|---|
| Open specification | Yes | No | No | **Yes** |
| JSON Schema validation | No | No | Partial | **Yes** |
| Dot-namespaced events | No | No | No | **Yes** |
| Privacy-first consent | No | No | No | **Yes** |
| Middleware pipeline | No | No | No | **Yes** |
| Vendor-agnostic | Yes | No | No | **Yes** |
| Extension mechanism | No | No | No | **Yes** |
| Conformance levels | No | No | No | **Yes** |

### 6.1 Dot-Namespaced Events

ODL uses a `category.action` naming convention for all events (e.g., `ecommerce.purchase`, `page.view`, `media.play`). This provides several benefits:

- **Readability.** Event names are self-documenting.
- **Wildcard subscriptions.** Consumers can subscribe to `ecommerce.*` to receive all ecommerce events.
- **Taxonomy enforcement.** The dot-namespace makes it clear which category an event belongs to, reducing naming collisions.

### 6.2 Fully Open

ODL's specification, schemas, reference implementations, and conformance tests are all open-source. There is no proprietary component, no vendor dependency, and no licensing restriction on use.

## 7. Specification Structure

This specification is organized into the following documents:

| Document | Description |
|---|---|
| [overview.md](overview.md) | This document. Protocol overview and design rationale. |
| [data-model.md](data-model.md) | Core event envelope and context model. |
| [events.md](events.md) | Event naming conventions and full taxonomy. |
| [context-objects.md](context-objects.md) | All context object definitions. |
| [versioning.md](versioning.md) | Versioning and backward compatibility. |
| [transport.md](transport.md) | Push model, subscriptions, and middleware pipeline. |
| [privacy.md](privacy.md) | Privacy-by-design and consent integration. |
| [conformance.md](conformance.md) | Conformance levels and requirements. |
| [extensions.md](extensions.md) | Custom events, contexts, and the extension registry. |

## 8. Terminology

The following terms are used throughout this specification:

- **Producer**: Any system that emits events to the data layer (e.g., a website, mobile app, or server).
- **Consumer**: Any system that receives events from the data layer (e.g., an analytics platform, a data warehouse, or a marketing tool).
- **Adapter**: A consumer-specific translation layer that converts ODL events into vendor-specific API calls.
- **Event envelope**: The standard JSON structure that wraps every event.
- **Context object**: An ambient state object that persists across events and is merged into each event at emission time.
- **Data payload**: The event-specific data attached to an event (distinct from context).
- **Middleware**: A function in the processing pipeline that can validate, enrich, transform, or route events.
- **Conformance level**: One of three levels (Minimal, Standard, Full) that describes how completely an implementation follows this specification.

## 9. Conformance Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this specification are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).
