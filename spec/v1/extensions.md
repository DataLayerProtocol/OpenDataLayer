# OpenDataLayer Protocol Specification v1 — Extensions

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-02-23

---

## 1. Introduction

The OpenDataLayer core specification covers the most common tracking scenarios across web analytics, ecommerce, media, forms, and more. However, every organization has domain-specific needs that the core taxonomy cannot anticipate. A healthcare company needs HIPAA-aware patient interaction events. A gaming company needs in-game economy events. A SaaS company needs feature adoption events.

Rather than trying to cover every possible domain in the core spec (which would make it bloated and unwieldy), ODL provides a formal **extension mechanism** that allows organizations to:

- Add custom events using the `custom.*` namespace.
- Attach custom properties to events via `customDimensions`.
- Define and register structured extension schemas.
- Share extensions with the community.

This document defines the rules and conventions for extending ODL.

## 2. Custom Events

### 2.1 The `custom.*` Namespace

The `custom` category is reserved for organization-specific events. Custom events follow the same `category.action` naming convention as core events, using `custom` as the category:

```
custom.action_name
```

**Valid examples:**
- `custom.quiz_completed`
- `custom.chatbot_opened`
- `custom.loyalty_points_redeemed`
- `custom.video_cta_clicked`
- `custom.onboarding_step_completed`
- `custom.subscription_upgraded`
- `custom.feature_flag_evaluated`

**Invalid examples:**
- `custom.` — Empty action name.
- `custom.quizCompleted` — Not snake_case.
- `custom.quiz.completed` — Too many dots (the action must be a single snake_case segment).
- `mycompany.quiz_completed` — Non-standard category (use `custom` as the category).

### 2.2 Custom Event Data Payloads

Custom events MAY include any data payload in the `data` field. The payload structure is defined by the organization that creates the custom event.

> **Note on validation:** Custom events without a registered extension schema are NOT subject to data payload validation, even at the Full conformance level. Full conformance requires validation of all *standard* events and any custom events that have registered schemas (see [conformance.md](conformance.md) and [Section 8](#8-extension-registration) below).

```json
{
  "event": "custom.quiz_completed",
  "id": "...",
  "timestamp": "...",
  "specVersion": "1.0.0",
  "context": { ... },
  "data": {
    "quizId": "quiz-onboarding-2026",
    "quizName": "Product Knowledge Quiz",
    "score": 85,
    "totalQuestions": 10,
    "correctAnswers": 8,
    "duration": 120000,
    "passed": true
  }
}
```

### 2.3 Custom Event Documentation

Organizations SHOULD document their custom events using the same format as the core taxonomy documentation in [events.md](events.md). At minimum, custom event documentation SHOULD include:

- **Event name**: The full `custom.action_name` string.
- **Description**: What the event represents and when to fire it.
- **Data payload schema**: A table or JSON Schema describing the `data` fields.
- **Example**: A complete JSON example.

### 2.4 Wildcard Subscriptions for Custom Events

Consumers can subscribe to all custom events using the `custom.*` wildcard:

```javascript
odl.subscribe("custom.*", (event) => {
  // Receives all custom events
});
```

## 3. customDimensions

### 3.1 Purpose

The `customDimensions` field on the event envelope (see [data-model.md](data-model.md)) provides a lightweight way to attach additional key-value pairs to any event without defining a full custom event or extension schema.

`customDimensions` is appropriate for:

- A/B test assignments.
- Feature flags.
- Internal campaign identifiers.
- Customer segments.
- Temporary instrumentation during experiments.
- Any key-value pair that does not warrant a schema change.

### 3.2 Structure

`customDimensions` is a flat key-value object:

- Keys MUST be strings in `camelCase`.
- Values MUST be primitives: `string`, `number`, or `boolean`.
- Nested objects and arrays are NOT permitted.
- `null` values are NOT permitted (omit the key instead).

```json
{
  "customDimensions": {
    "experimentId": "exp-checkout-v2",
    "experimentVariant": "streamlined",
    "customerSegment": "high-value",
    "featureFlags": "dark-mode,new-nav",
    "internalCampaign": "spring-sale-2026"
  }
}
```

### 3.3 Naming Conventions

To avoid collisions between different teams or systems, organizations SHOULD adopt a naming convention for `customDimensions` keys. Recommended approaches:

| Approach | Example | Use Case |
|---|---|---|
| Prefix by team | `marketing_campaignId`, `product_featureFlag` | Multi-team organizations |
| Prefix by system | `optimizely_experimentId`, `launchdarkly_flagKey` | Multi-tool environments |
| No prefix | `experimentId`, `customerSegment` | Small teams with simple needs |

### 3.4 When to Use customDimensions vs. Custom Events vs. Extensions

| Mechanism | Use When |
|---|---|
| `customDimensions` | You need to attach a few key-value pairs to existing events. No schema needed. Quick and lightweight. |
| Custom events (`custom.*`) | You need to track a new action that does not exist in the core taxonomy. The action has its own data payload. |
| Extensions (see [Section 5](#5-extension-schemas)) | You need to define a reusable, schema-validated set of custom events and/or context properties that could be shared across organizations or promoted into the core spec. |

## 4. Custom Context Properties

### 4.1 Extending Context Objects

The core context objects (page, user, consent, session, device, app, campaign, location) have defined schemas, but organizations MAY need to attach additional properties to these contexts.

There are two approaches:

#### 4.1.1 Via customDimensions (Recommended for Simple Cases)

Attach organization-specific values as `customDimensions` on individual events:

```json
{
  "event": "page.view",
  "customDimensions": {
    "contentGroup": "blog",
    "authorId": "author-42",
    "publishDate": "2026-02-15"
  },
  "context": { ... }
}
```

This approach keeps the context objects clean and uses the existing escape hatch.

#### 4.1.2 Via Extension Context (For Structured, Persistent Context)

For custom context that should persist across events (like core context objects), organizations MAY define **extension context objects** that are added to the `context` field alongside the core contexts:

```json
{
  "context": {
    "page": { ... },
    "user": { ... },
    "consent": { ... },
    "x_loyalty": {
      "tier": "gold",
      "points": 15000,
      "memberId": "LOY-789",
      "memberSince": "2024-01-15"
    }
  }
}
```

Extension context objects MUST be prefixed with `x_` to distinguish them from core context objects and avoid future naming conflicts.

### 4.2 Extension Context Rules

1. Extension context keys MUST start with `x_` (e.g., `x_loyalty`, `x_experiment`, `x_crm`).
2. Extension context objects follow the same persistence and merging rules as core context objects (see [context-objects.md](context-objects.md)).
3. Extension context objects SHOULD have a defined JSON Schema.
4. Core ODL middleware and consumers MUST ignore extension context objects they do not recognize (pass them through unmodified).

## 5. Extension Schemas

### 5.1 What is an Extension Schema?

An extension schema is a formal definition of a set of custom events, custom context objects, or both. Extension schemas use JSON Schema (the same schema language as the core protocol) and follow ODL's naming and structural conventions.

Extension schemas are useful when:

- Multiple teams or organizations want to track the same domain-specific events.
- Custom events need schema validation.
- An organization wants to contribute their events back to the community.

### 5.2 Extension Schema Structure

An extension schema is a JSON document with the following structure:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ODL Extension: Gaming",
  "description": "Extension events for in-game economy and player actions.",
  "version": "1.0.0",
  "odlSpecVersion": "1.0.0",
  "namespace": "x_gaming",
  "author": {
    "name": "Example Gaming Corp",
    "url": "https://github.com/example-gaming/odl-gaming-extension"
  },
  "events": {
    "custom.level_completed": {
      "description": "Fired when a player completes a game level.",
      "data": {
        "type": "object",
        "properties": {
          "levelId": { "type": "string", "description": "Unique level identifier." },
          "levelName": { "type": "string", "description": "Human-readable level name." },
          "levelNumber": { "type": "integer", "description": "Level number (1-indexed)." },
          "score": { "type": "number", "description": "Score achieved." },
          "stars": { "type": "integer", "minimum": 0, "maximum": 3, "description": "Star rating (0-3)." },
          "duration": { "type": "number", "description": "Time to complete in milliseconds." },
          "attempts": { "type": "integer", "description": "Number of attempts." }
        },
        "required": ["levelId"]
      }
    },
    "custom.virtual_currency_earned": {
      "description": "Fired when a player earns virtual currency.",
      "data": {
        "type": "object",
        "properties": {
          "currencyType": { "type": "string", "description": "Currency name (e.g., 'gold', 'gems')." },
          "amount": { "type": "number", "description": "Amount earned." },
          "source": { "type": "string", "description": "How the currency was earned." },
          "balance": { "type": "number", "description": "New balance after earning." }
        },
        "required": ["currencyType", "amount"]
      }
    }
  },
  "contexts": {
    "x_gaming": {
      "description": "Gaming-specific context for player state.",
      "type": "object",
      "properties": {
        "playerId": { "type": "string", "description": "Player identifier." },
        "playerLevel": { "type": "integer", "description": "Player's current level." },
        "playerClass": { "type": "string", "description": "Player's character class." },
        "sessionType": { "type": "string", "enum": ["casual", "ranked", "tournament"], "description": "Type of game session." }
      }
    }
  }
}
```

### 5.3 Extension Schema Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `$schema` | `string` | Yes | JSON Schema draft identifier. |
| `title` | `string` | Yes | Human-readable title of the extension. |
| `description` | `string` | Yes | Description of the extension's purpose. |
| `version` | `string` | Yes | Semantic version of the extension schema. |
| `odlSpecVersion` | `string` | Yes | The ODL spec version this extension is compatible with. |
| `namespace` | `string` | Yes | The `x_` prefixed namespace for this extension. |
| `author` | `object` | No | Author or organization information. |
| `events` | `object` | No | Map of event names to their data schemas. |
| `contexts` | `object` | No | Map of extension context names to their schemas. |

## 6. Naming Conventions for Extensions

### 6.1 Event Names

Custom events defined in extensions MUST use the `custom.*` namespace:

- `custom.level_completed` (not `gaming.level_completed`)
- `custom.virtual_currency_earned` (not `economy.currency_earned`)

This ensures that custom events are immediately identifiable as extensions and do not collide with current or future core taxonomy events.

### 6.2 Context Names

Extension context objects MUST use the `x_` prefix:

- `x_gaming` (not `gaming`)
- `x_loyalty` (not `loyalty`)
- `x_experiment` (not `experiment`)

### 6.3 Namespace Uniqueness

Extension namespaces SHOULD be unique across the community. The recommended format is:

```
x_{domain}
```

Where `{domain}` is a short, descriptive identifier for the extension's domain (e.g., `gaming`, `healthcare`, `fintech`, `saas`, `loyalty`).

If there is a risk of collision (e.g., multiple organizations creating gaming extensions), the namespace MAY include the organization name:

```
x_{org}_{domain}
```

For example: `x_acme_gaming`, `x_bigcorp_loyalty`.

### 6.4 Field Names

Fields within extension events and contexts MUST use `camelCase`, consistent with the core protocol.

## 7. Versioning Extensions

### 7.1 Semantic Versioning

Extension schemas follow the same semantic versioning rules as the core protocol (see [versioning.md](versioning.md)):

- **MAJOR**: Breaking changes (removing fields, changing types).
- **MINOR**: Additive changes (new optional fields, new events).
- **PATCH**: Documentation fixes, typo corrections.

### 7.2 ODL Spec Version Compatibility

Extension schemas declare which version of the ODL specification they are compatible with via the `odlSpecVersion` field. When the core ODL spec releases a new MAJOR version, extension authors SHOULD update their extensions to declare compatibility with the new version.

### 7.3 Extension Deprecation

Extension events and context fields can be deprecated following the same process as the core protocol:

1. Mark the field as deprecated in the extension schema.
2. Maintain the deprecated field for at least one MINOR version.
3. Remove the deprecated field in the next MAJOR version.

## 8. Extension Registration

### 8.1 Local Registration

Within an ODL implementation, extensions are registered by providing the extension schema to the data layer:

```javascript
import gamingExtension from './extensions/gaming.json';

const odl = new OpenDataLayer({
  extensions: [gamingExtension]
});
```

When an extension is registered:

1. Its event schemas are added to the validation registry.
2. Its context schemas are added to the context validation registry.
3. Custom events defined in the extension are recognized by the event name validator.

### 8.2 Validation with Extensions

When an extension is registered, the validation middleware includes the extension's schemas in its checks:

- `custom.level_completed` events are validated against the gaming extension's `level_completed` data schema.
- `x_gaming` context objects are validated against the gaming extension's context schema.

Without extension registration, custom events and extension contexts are not validated (they pass through the pipeline without schema checks).

## 9. Community Extension Registry

### 9.1 Concept

The ODL project maintains a **community extension registry** — a public catalog of extension schemas contributed by the community. The registry serves as:

- A **discovery mechanism** for finding existing extensions before building your own.
- A **standardization path** for promoting widely-used extensions into the core spec.
- A **quality baseline** through review and validation of registered extensions.

### 9.2 Registry Structure

The registry is organized by domain:

```
extensions/
  gaming/
    schema.json
    README.md
  healthcare/
    schema.json
    README.md
  saas/
    schema.json
    README.md
  loyalty/
    schema.json
    README.md
  ...
```

### 9.3 Submission Process

To submit an extension to the community registry:

1. **Create the extension schema** following the format in [Section 5.2](#52-extension-schema-structure).
2. **Document the extension** with a README that includes use cases, examples, and rationale.
3. **Submit a pull request** to the ODL extensions repository.
4. **Community review**: The extension is reviewed by the ODL maintainers and community for quality, naming conventions, and overlap with existing extensions.
5. **Acceptance**: Once approved, the extension is added to the registry.

### 9.4 Acceptance Criteria

Extensions submitted to the community registry MUST meet the following criteria:

| Criterion | Requirement |
|---|---|
| **Schema validity** | The extension schema MUST be valid JSON Schema. |
| **Naming conventions** | Events MUST use `custom.*`, contexts MUST use `x_*`, fields MUST use `camelCase`. |
| **Documentation** | The extension MUST include a README with description, use cases, and examples. |
| **No overlap** | The extension MUST NOT duplicate events or contexts already in the core spec or another registered extension. |
| **Versioned** | The extension MUST include a semantic version. |
| **ODL compatibility** | The extension MUST declare its ODL spec version compatibility. |
| **License** | The extension MUST be released under an open-source license compatible with the ODL project. |

### 9.5 Promotion to Core Specification

Extensions that gain widespread adoption across multiple organizations are candidates for promotion into the core ODL taxonomy. The promotion process:

1. **Observation**: An extension is widely used (tracked by registry download/reference counts).
2. **Proposal**: A proposal is submitted to promote the extension's events and/or contexts into the core spec.
3. **Community feedback**: The proposal is discussed publicly.
4. **Specification update**: If accepted, the extension's events are added to the core taxonomy in the next MINOR release. Event names change from `custom.*` to the appropriate core category (e.g., `custom.level_completed` becomes `gaming.level_completed` if a `gaming` category is added).
5. **Backward compatibility**: The `custom.*` names remain valid as aliases for at least one MAJOR version cycle.

## 10. Extension Examples

### 10.1 SaaS Product Analytics Extension

```json
{
  "title": "ODL Extension: SaaS Product Analytics",
  "version": "1.0.0",
  "odlSpecVersion": "1.0.0",
  "namespace": "x_saas",
  "events": {
    "custom.feature_activated": {
      "description": "User activates a product feature for the first time.",
      "data": {
        "type": "object",
        "properties": {
          "featureId": { "type": "string" },
          "featureName": { "type": "string" },
          "plan": { "type": "string" },
          "trialDay": { "type": "integer" }
        },
        "required": ["featureId"]
      }
    },
    "custom.subscription_changed": {
      "description": "User changes their subscription plan.",
      "data": {
        "type": "object",
        "properties": {
          "previousPlan": { "type": "string" },
          "newPlan": { "type": "string" },
          "changeType": { "type": "string", "enum": ["upgrade", "downgrade", "cancel", "reactivate"] },
          "mrr": { "type": "number" },
          "mrrChange": { "type": "number" }
        },
        "required": ["previousPlan", "newPlan", "changeType"]
      }
    }
  },
  "contexts": {
    "x_saas": {
      "type": "object",
      "properties": {
        "accountId": { "type": "string" },
        "plan": { "type": "string" },
        "mrr": { "type": "number" },
        "trialEndsAt": { "type": "string", "format": "date-time" },
        "isTrial": { "type": "boolean" },
        "seats": { "type": "integer" },
        "industry": { "type": "string" }
      }
    }
  }
}
```

### 10.2 Healthcare Interaction Extension

```json
{
  "title": "ODL Extension: Healthcare",
  "version": "1.0.0",
  "odlSpecVersion": "1.0.0",
  "namespace": "x_healthcare",
  "events": {
    "custom.appointment_booked": {
      "description": "Patient books a healthcare appointment.",
      "data": {
        "type": "object",
        "properties": {
          "appointmentType": { "type": "string" },
          "department": { "type": "string" },
          "provider": { "type": "string" },
          "isNewPatient": { "type": "boolean" },
          "scheduledDate": { "type": "string", "format": "date" },
          "bookingChannel": { "type": "string", "enum": ["web", "phone", "app", "in-person"] }
        },
        "required": ["appointmentType"]
      }
    },
    "custom.symptom_checker_completed": {
      "description": "User completes an online symptom checker tool.",
      "data": {
        "type": "object",
        "properties": {
          "checkerId": { "type": "string" },
          "symptomCount": { "type": "integer" },
          "recommendedAction": { "type": "string" },
          "duration": { "type": "number" }
        },
        "required": ["checkerId"]
      }
    }
  }
}
```

**Note:** Healthcare extensions MUST be particularly careful about PII and PHI (Protected Health Information). Patient identifiers, diagnosis codes, and treatment details MUST NOT be included in event data without appropriate consent and compliance measures. See [privacy.md](privacy.md) for PII handling guidance.

## 11. Extension Best Practices

1. **Search before creating.** Check the community registry for existing extensions in your domain before creating a new one.

2. **Start with customDimensions.** If you only need a few extra fields, use `customDimensions` before committing to a full extension.

3. **Document thoroughly.** Extensions are only useful if others can understand them. Include descriptions for every event and every field.

4. **Keep it focused.** An extension should cover one domain (e.g., "gaming" or "SaaS"), not everything.

5. **Use required fields sparingly.** Mark fields as required only when the event is meaningless without them.

6. **Version from the start.** Even if you do not plan to change the extension, start at version 1.0.0 so there is a clear baseline.

7. **Test your schemas.** Validate your extension schemas against actual event data before publishing them.

8. **Consider privacy.** If your extension involves sensitive domains (healthcare, finance, education), document the privacy implications and required consent levels.

9. **Contribute back.** If your extension is useful to others, submit it to the community registry.
