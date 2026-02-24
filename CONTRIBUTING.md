# Contributing to OpenDataLayer

Thank you for your interest in contributing to the OpenDataLayer protocol! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/OpenDataLayer.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Validate JSON schemas
npm run validate:schemas

# Generate TypeScript types from schemas
npm run generate:types

# Build all packages
npm run build

# Lint and format
npm run lint:fix
```

## Project Structure

- **`schemas/v1/`** -- JSON Schemas are the single source of truth. All types, docs, and validators derive from these.
- **`spec/v1/`** -- Human-readable protocol specification.
- **`packages/`** -- npm packages (sdk, types, validator, testing).
- **`adapters/`** -- Platform adapters (GTM, Segment, etc.).

## Making Changes

### Schema Changes

Schemas are the foundation. When modifying schemas:

1. Edit the schema in `schemas/v1/`
2. Run `npm run validate:schemas` to ensure schema validity
3. Run `npm run generate:types` to regenerate TypeScript types
4. Update tests and fixtures as needed
5. Run `npm test` to verify everything passes

### Adding a New Event

1. Create the event schema in `schemas/v1/events/<category>/<event-name>.schema.json`
2. Add the event to the taxonomy in `spec/v1/events.md`
3. Add test fixtures in `packages/testing/src/fixtures/`
4. Run the full test suite

### Adding a New Adapter

1. Create a new directory in `adapters/<platform>/`
2. Follow the adapter interface defined in `packages/sdk/src/plugins/`
3. Include mapping documentation
4. Add tests

## RFC Process

Significant changes to the protocol require an RFC (Request for Comments):

1. Copy `rfcs/000-template.md` to `rfcs/NNN-short-title.md`
2. Fill in the RFC template
3. Submit a PR with the RFC
4. Discussion happens in the PR
5. Once consensus is reached, the RFC is merged and implementation can begin

## Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting. Run `npm run lint:fix` before committing.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `schema:` schema changes
- `refactor:` code refactoring
- `test:` adding/updating tests
- `chore:` maintenance

## Pull Requests

- Fill out the PR template
- Ensure CI passes
- Request review from maintainers
- Keep PRs focused -- one feature/fix per PR

## Versioning

The protocol follows [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes to the event/context model
- **Minor**: New events, new optional context fields
- **Patch**: Bug fixes, documentation

## Code of Conduct

Be respectful, constructive, and collaborative. We're building an open standard for everyone.

## Questions?

Open an issue or start a discussion in the GitHub Discussions tab.
