# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-23

### Added

#### Protocol Specification v1.0.0 (Draft)
- 9 specification documents covering the complete protocol:
  overview, data model, events, context objects, transport, privacy, conformance, extensions, versioning
- 60+ events across 11 categories (page, ecommerce, media, consent, user, form, search, error, performance, interaction, custom)
- 8 context objects (page, user, consent, session, device, app, campaign, location)
- 3 conformance levels (Minimal, Standard, Full) with clear adoption path
- Privacy-by-design consent architecture with GDPR/CCPA alignment

#### Core Packages
- `@opendatalayer/sdk` -- reference implementation with event tracking, context management, middleware pipeline, and plugin system
- `@opendatalayer/types` -- TypeScript type definitions for the entire protocol
- `@opendatalayer/validator` -- AJV-based schema validation engine with semantic rules and CLI (`odl validate`)
- `@opendatalayer/testing` -- test helpers, Vitest/Jest custom matchers, event spy, and fixtures

#### Adapters
- `@opendatalayer/adapter-gtm` -- Google Tag Manager / GA4 adapter (stable)
- `@opendatalayer/adapter-segment` -- Segment analytics.js adapter (stable)
- `@opendatalayer/adapter-webhook` -- Generic webhook adapter with batch + real-time modes (stable)
- `@opendatalayer/adapter-adobe` -- Adobe Analytics (AppMeasurement) / AEP Web SDK adapter with product string building, eVar/prop mapping, and XDM commerce support
- `@opendatalayer/adapter-amplitude` -- Amplitude adapter with identify, revenue per product, group analytics, and auto user properties
- `@opendatalayer/adapter-piwik` -- Piwik PRO / Matomo adapter with ecommerce tracking, site search, custom dimensions, and userId management
- `@opendatalayer/adapter-tealium` -- Tealium iQ adapter with UDO auto-population, flat key-value conversion, and parallel product array convention

#### JSON Schemas
- 50+ JSON Schema (Draft 2020-12) definitions for event envelope, context objects, event-specific data payloads, and enums
- Validation scripts for schema integrity

#### SDK Built-in Plugins
- `autoPageView` -- automatic page.view / page.virtual_view tracking with SPA support
- `debug` -- console logging for development
- `persistence` -- localStorage event persistence with graceful degradation

#### Infrastructure
- Turborepo monorepo with npm workspaces
- Biome for linting and formatting
- GitHub Actions CI (schema validation, build, test, lint)
- VitePress documentation site scaffold
- Basic HTML example

[Unreleased]: https://github.com/DataLayerProtocol/OpenDataLayer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/DataLayerProtocol/OpenDataLayer/releases/tag/v0.1.0
