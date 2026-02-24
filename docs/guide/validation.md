# Validation

Bad data is expensive. A single missing `currency` field on a purchase event can silently break revenue dashboards for weeks before anyone notices. The `@opendatalayer/validator` package lets you catch these problems at development time, in CI, or at runtime -- before malformed events reach downstream systems.

## Why Validation Matters

- **Schema validation** ensures every event conforms to its JSON Schema (correct types, required fields, valid formats).
- **Semantic rules** catch higher-level problems that schemas alone cannot express -- like firing ecommerce events without consent, or tracking a purchase with no products.
- **Shift left** -- find instrumentation bugs during development instead of after a data outage.

## Installation

::: code-group

```bash [npm]
npm install @opendatalayer/validator
```

```bash [yarn]
yarn add @opendatalayer/validator
```

```bash [pnpm]
pnpm add @opendatalayer/validator
```

:::

## Basic Usage

Create an `ODLValidator` instance and pass events through its `validate` method:

```ts
import { ODLValidator } from '@opendatalayer/validator';

const validator = new ODLValidator();

const result = validator.validate({
  event: 'ecommerce.purchase',
  id: '550e8400-e29b-41d4-a716-446655440000',
  timestamp: '2026-02-23T10:30:00.000Z',
  specVersion: '1.0.0',
  data: {
    orderId: 'ORD-001',
    revenue: 259.98,
    currency: 'USD',
    products: [
      { id: 'SKU-123', name: 'Running Shoes', price: 129.99, quantity: 2 },
    ],
  },
});

if (result.valid) {
  console.log('Event is valid');
} else {
  console.error('Validation errors:', result.errors);
}
```

### ValidationResult

The `validate` method returns a `ValidationResult`:

```ts
interface ValidationResult {
  valid: boolean;            // true if no errors
  errors: ValidationError[]; // schema violations
  warnings: ValidationWarning[]; // semantic rule warnings
  event?: Record<string, unknown>; // the original event
}

interface ValidationError {
  path: string;    // JSON pointer to the failing field (e.g., "/data/currency")
  message: string; // human-readable error message
  keyword: string; // JSON Schema keyword that failed (e.g., "required", "type")
  params?: Record<string, unknown>;
}

interface ValidationWarning {
  rule: string;    // name of the semantic rule
  message: string; // human-readable warning message
}
```

### Batch validation

Validate an array of events at once:

```ts
const events = [
  { event: 'page.view', id: '...', timestamp: '...', specVersion: '1.0.0', data: {} },
  { event: 'ecommerce.purchase', id: '...', timestamp: '...', specVersion: '1.0.0', data: {} },
];

const results = validator.validateBatch(events);
results.forEach((result, i) => {
  if (!result.valid) {
    console.error(`Event ${i} failed:`, result.errors);
  }
});
```

## Validator Options

```ts
const validator = new ODLValidator({
  // Path to a directory containing .schema.json files
  schemaDir: './schemas/v1',

  // Strict mode: semantic warnings become errors
  strict: true,

  // Custom set of semantic rules (overrides defaults)
  rules: [consentBeforeTracking, ecommerceConsistency],
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `schemaDir` | `string` | Auto-detected | Directory containing `.schema.json` files. The validator walks it recursively. |
| `strict` | `boolean` | `false` | When true, semantic warnings are promoted to errors and cause `valid` to be `false`. |
| `rules` | `SemanticRule[]` | All built-in rules | Semantic rules to run after schema validation. |

## Semantic Rules

Semantic rules check for higher-level data quality issues that JSON Schema cannot express. They produce **warnings** by default, or **errors** in strict mode.

### Built-in rules

The validator ships with three built-in rules:

#### consent-before-tracking

Warns if a tracking event (ecommerce, user, interaction, media, search, performance, or form) is fired without consent context, or when consent has not been explicitly granted.

```ts
// This will produce a warning:
validator.validate({
  event: 'ecommerce.purchase',
  id: '...',
  timestamp: '...',
  specVersion: '1.0.0',
  data: { orderId: 'ORD-001', revenue: 99.99, currency: 'USD', products: [] },
  // no context.consent!
});
// Warning: Tracking event "ecommerce.purchase" fired without consent context.
```

::: tip
Consent events themselves (`consent.given`, `consent.revoked`, `consent.preferences_updated`) are exempt from this rule, since they legitimately fire before consent is granted.
:::

#### ecommerce-consistency

Checks ecommerce events for data integrity issues:

- Warns if monetary values (`revenue`, `tax`, `shipping`, `discount`, `price`) are present but no `currency` field is specified.
- Warns if `ecommerce.purchase` has an empty `products` array.
- Warns if products contain a `price` but no `currency` exists at the event level.

```ts
// This will produce a warning about missing currency:
validator.validate({
  event: 'ecommerce.product_viewed',
  id: '...',
  timestamp: '...',
  specVersion: '1.0.0',
  data: {
    product: { id: 'SKU-1', name: 'Shoes', price: 99.99 },
    // missing currency!
  },
});
```

#### required-context

Checks that events include the expected context for their category:

- `page.*` events should include `context.page`
- `user.*` events should include `context.user`

```ts
// This will produce a warning about missing page context:
validator.validate({
  event: 'page.view',
  id: '...',
  timestamp: '...',
  specVersion: '1.0.0',
  data: { title: 'Home', url: 'https://example.com/' },
  context: {}, // no page context!
});
```

### Writing custom rules

A semantic rule is any object that implements the `SemanticRule` interface:

```ts
import type { SemanticRule, ValidationWarning } from '@opendatalayer/validator';

const noEmptySearchQuery: SemanticRule = {
  name: 'no-empty-search-query',
  description: 'Warns if search.performed is fired with an empty query string.',

  validate(
    event: Record<string, unknown>,
    _context?: Record<string, unknown>,
  ): ValidationWarning[] {
    if (event.event !== 'search.performed') return [];

    const data = event.data as Record<string, unknown> | undefined;
    if (!data?.query || (data.query as string).trim() === '') {
      return [
        {
          rule: 'no-empty-search-query',
          message: 'search.performed fired with an empty query. This usually indicates an instrumentation bug.',
        },
      ];
    }

    return [];
  },
};
```

Register custom rules alongside or instead of the defaults:

```ts
import { ODLValidator, defaultRules } from '@opendatalayer/validator';

const validator = new ODLValidator({
  rules: [...defaultRules, noEmptySearchQuery],
});
```

## Custom Schemas

The validator loads JSON Schemas from a directory and matches them to events by naming convention. If you define custom events (e.g., `custom.quiz_completed`), you can validate them by placing a schema file in the right location.

### Schema directory structure

```
schemas/v1/
  core/
    event.schema.json         # base event envelope
  events/
    page/
      view.schema.json        # page.view data payload
    ecommerce/
      purchase.schema.json    # ecommerce.purchase data payload
    custom/
      quiz-completed.schema.json  # custom.quiz_completed data payload
  context/
    page.schema.json
    user.schema.json
```

### Naming convention

The validator maps `event.name` to a schema file path using this rule:

```
category.action_name  -->  events/category/action-name.schema.json
```

Underscores in the action segment are converted to hyphens. For example:

- `ecommerce.product_viewed` --> `events/ecommerce/product-viewed.schema.json`
- `custom.quiz_completed` --> `events/custom/quiz-completed.schema.json`

### Example custom schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://opendatalayer.org/schemas/v1/events/custom/quiz-completed.schema.json",
  "title": "custom.quiz_completed",
  "type": "object",
  "required": ["quizId", "score"],
  "properties": {
    "quizId": {
      "type": "string",
      "description": "Unique identifier for the quiz."
    },
    "score": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "Final score as a percentage."
    },
    "totalQuestions": {
      "type": "integer",
      "description": "Total number of questions in the quiz."
    },
    "correctAnswers": {
      "type": "integer",
      "description": "Number of correct answers."
    }
  },
  "additionalProperties": false
}
```

Point the validator at your schema directory:

```ts
const validator = new ODLValidator({
  schemaDir: './schemas/v1',
});
```

## CLI Usage

The validator ships with a CLI tool for validating event JSON files from the command line. This is especially useful in CI pipelines.

### Basic usage

```bash
npx odl validate events.json
```

### Validate a directory of files

```bash
npx odl validate test-events/
```

### Output formats

The CLI supports three output formats:

::: code-group

```bash [Console (default)]
npx odl validate events.json --format console
```

```bash [JSON]
npx odl validate events.json --format json
```

```bash [JUnit XML]
npx odl validate events.json --format junit
```

:::

### Strict mode

In strict mode, semantic warnings are promoted to errors and the CLI exits with a non-zero status code:

```bash
npx odl validate events.json --strict
```

### Custom schema directory

```bash
npx odl validate events.json --schema-dir ./my-schemas/v1
```

### CI integration

Add validation to your CI pipeline to catch instrumentation bugs before they merge:

```yaml
# .github/workflows/validate-events.yml
name: Validate Events
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx odl validate test-events/ --strict --format junit > results.xml
```

### Full CLI reference

```
Usage: odl <command> [options] [files...]

Commands:
  validate <file-or-glob...>   Validate event JSON files against ODL schemas

Options:
  --schema-dir <dir>           Custom schema directory (default: auto-detect)
  --format <format>            Output format: console, json, junit (default: console)
  --strict                     Strict mode: warnings become errors
  --help                       Show this help message
```

## Integration with the SDK

You can wire the validator into the SDK as middleware so events are validated at runtime. This is recommended for development and staging environments.

```ts
import { OpenDataLayer } from '@opendatalayer/sdk';
import { ODLValidator } from '@opendatalayer/validator';

const odl = new OpenDataLayer();
const validator = new ODLValidator({ strict: false });

// Add validation middleware (development only)
if (process.env.NODE_ENV === 'development') {
  odl.addMiddleware((event, next) => {
    const result = validator.validate(event);

    if (!result.valid) {
      console.error(`[ODL Validation] ${event.event} failed:`, result.errors);
    }

    if (result.warnings.length > 0) {
      console.warn(`[ODL Validation] ${event.event} warnings:`, result.warnings);
    }

    // Still allow the event through (log-only mode)
    next();
  });
}
```

::: warning
Do not use the validator as blocking middleware in production. Schema validation adds overhead and should be limited to development, staging, and CI environments.
:::

### Blocking mode

If you want to prevent invalid events from flowing through in staging:

```ts
if (process.env.NODE_ENV === 'staging') {
  odl.addMiddleware((event, next) => {
    const result = validator.validate(event);

    if (!result.valid) {
      console.error(`[ODL] Dropped invalid event "${event.event}":`, result.errors);
      return; // do not call next() -- event is cancelled
    }

    next();
  });
}
```

## Next Steps

- Browse the [Event Reference](/reference/events) to see all standard event schemas.
- Learn about [Adapters](/guide/adapters) to route validated events to analytics providers.
- Read the [Core Concepts](/guide/core-concepts) to understand the data model.
