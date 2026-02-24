# OpenDataLayer Protocol Specification v1 — Privacy

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-02-23

---

## 1. Introduction

Privacy is not an add-on feature of the OpenDataLayer protocol — it is a **foundational design principle**. This document defines how ODL implements privacy-by-design, how consent is integrated into the event lifecycle, and how implementations should handle personal data to comply with global privacy regulations.

ODL's privacy architecture is built on a simple premise: **no data should flow without a reason, and no data about a person should flow without their consent.**

## 2. Consent-First Architecture

### 2.1 Principle

In the ODL model, consent is evaluated **before** any event is processed or delivered to a consumer. The consent context (see [context-objects.md](context-objects.md)) is a first-class component of every event envelope, and the middleware pipeline (see [transport.md](transport.md)) uses it to make routing and suppression decisions.

This is a fundamental departure from many existing implementations where tracking fires immediately on page load and consent is checked after the fact (or not at all).

### 2.2 Consent Before Tracking

Implementations MUST follow this order of operations:

1. **Initialize the data layer** with consent state set to the most restrictive defaults (all categories `false`).
2. **Restore prior consent** from persistent storage (cookie, local storage) if the user has previously made a consent choice.
3. **Evaluate consent** for any event before it passes through the middleware pipeline.
4. **Suppress or filter** events (or specific fields within events) that are not covered by the user's consent.

Events that are strictly necessary for the website to function (e.g., consent management events themselves) MAY be exempt from consent checks. See [Section 2.4](#24-strictly-necessary-events).

### 2.3 Default Consent State

The default consent state for all categories MUST be `false` (not consented):

```json
{
  "consent": {
    "analytics": false,
    "marketing": false,
    "personalization": false,
    "functional": false
  }
}
```

This default aligns with the most restrictive interpretation of global privacy laws (opt-in required). Implementations MAY allow the default to be configured differently for jurisdictions where implied consent is legally sufficient, but the protocol's default is always opt-in.

### 2.4 Strictly Necessary Events

Some events are required for the basic functioning of the website or application and do not require consent. These include:

- `consent.given` — Recording that consent was granted.
- `consent.revoked` — Recording that consent was revoked.
- `consent.preferences_updated` — Recording consent preference changes.

Implementations MAY define additional strictly necessary events, but these MUST be limited to events that are genuinely required for the service to function and MUST NOT include analytics, marketing, or personalization events.

### 2.5 Consent-Aware Routing

The middleware pipeline's route stage (see [transport.md](transport.md)) MUST support consent-aware routing. This means:

- Events MAY be delivered to different consumers based on the consent state.
- Consumers that require marketing consent MUST NOT receive events when `consent.marketing` is `false`.
- Consumers that require analytics consent MUST NOT receive events when `consent.analytics` is `false`.
- Consumers that only require functional consent may receive events when `consent.functional` is `true`, regardless of other consent categories.

**Example consent-to-consumer mapping:**

| Consumer | Required Consent | Behavior When Not Consented |
|---|---|---|
| Web analytics (first-party) | `analytics` | Events suppressed |
| Advertising platform | `marketing` | Events suppressed |
| Personalization engine | `personalization` | Events suppressed |
| Error monitoring | None (strictly necessary) | Events always delivered |
| Data warehouse (aggregated) | `analytics` | Events suppressed or anonymized |
| A/B testing platform | `functional` | Events suppressed |

### 2.6 Consent Change Handling

When a user's consent state changes (e.g., they revoke marketing consent), the data layer MUST:

1. Update the consent context immediately.
2. Re-evaluate all active consumer subscriptions against the new consent state.
3. Stop delivering events to consumers whose required consent has been revoked.
4. Optionally notify consumers that their consent basis has changed, so they can stop any in-progress processing.

Consent changes SHOULD NOT be applied retroactively to events that have already been delivered.

## 3. Data Minimization

### 3.1 Principle

ODL follows the principle of **data minimization**: collect only the data that is necessary for the stated purpose. The protocol defines what data CAN be collected (the full schema), but implementations SHOULD collect only the subset they actually need.

### 3.2 Collection Guidance

| Data Type | Guidance |
|---|---|
| **Page URL and title** | Almost always necessary for basic analytics. Collect unless there is a specific reason not to. |
| **User ID** | Collect only when the user is authenticated and analytics consent is granted. |
| **Email, name, phone** | Collect only when necessary for a specific purpose (e.g., CRM sync) and with appropriate consent. Consider hashing. |
| **Device information** | Collect at the level of detail needed. Browser and OS are usually sufficient; full User-Agent is rarely needed. |
| **Location** | Country and region are usually sufficient. City-level and precise coordinates require additional justification and consent. |
| **IP address** | Avoid collecting raw IP addresses in event data. Use server-side geolocation and discard the IP. |

### 3.3 Context Object Scoping

Not all context objects need to be populated. Implementations SHOULD populate only the context objects required by their conformance level and their actual consumer needs:

- A privacy-focused implementation might populate only `page` and `consent` contexts.
- A full-featured ecommerce implementation might populate all 15 contexts.

The conformance levels (see [conformance.md](conformance.md)) provide a framework for choosing the appropriate scope.

## 4. PII Handling

### 4.1 Definition

For the purposes of this specification, **Personally Identifiable Information (PII)** includes any data that can directly or indirectly identify a specific individual. This includes but is not limited to:

- Email addresses
- Full names
- Phone numbers
- Physical addresses
- IP addresses
- Government identifiers (SSN, passport numbers)
- Financial identifiers (credit card numbers, bank account numbers)
- Biometric data
- Device identifiers that are tied to an individual

### 4.2 PII Fields in ODL

The following ODL fields commonly contain PII:

| Field | Location | PII Type |
|---|---|---|
| `user.id` | User context | Pseudonymous identifier |
| `user.anonymousId` | User context | Pseudonymous identifier |
| `user.traits.email` | User context | Direct identifier |
| `user.traits.firstName` | User context | Direct identifier |
| `user.traits.lastName` | User context | Direct identifier |
| `user.traits.phone` | User context | Direct identifier |
| `location.latitude` | Location context | Indirect identifier (precise) |
| `location.longitude` | Location context | Indirect identifier (precise) |
| `location.postalCode` | Location context | Indirect identifier (in sparse areas) |
| `device.userAgent` | Device context | Fingerprinting vector |

### 4.3 Hashing

PII fields MAY be hashed before being included in events. Hashing transforms the raw value into a fixed-length, irreversible string that can still be used for matching and deduplication but cannot be reversed to reveal the original value.

**Requirements for hashing:**

- Use SHA-256 as the hashing algorithm.
- Normalize values before hashing (lowercase, trim whitespace).
- When cross-system matching is required (e.g., email hashes sent to ad platforms for audience matching), do NOT use salting — all systems must produce the same hash for the same input.
- When cross-system matching is NOT needed (e.g., internal pseudonymization), SHOULD use salting to strengthen privacy protection and prevent rainbow table attacks.
- Mark hashed fields with a naming convention (e.g., `emailHash` instead of `email`) so consumers know the value is hashed.

**Example:**

```json
{
  "user": {
    "id": "user-789",
    "isAuthenticated": true,
    "traits": {
      "emailHash": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      "firstName": "Jane"
    }
  }
}
```

### 4.4 Redaction

PII fields MAY be redacted (removed entirely) from events before they are delivered to certain consumers. Redaction is typically done in the transform stage of the middleware pipeline.

**Example transform middleware:**

```javascript
function redactPiiMiddleware(event, next) {
  if (event.context.user?.traits) {
    delete event.context.user.traits.email;
    delete event.context.user.traits.phone;
    delete event.context.user.traits.firstName;
    delete event.context.user.traits.lastName;
  }
  next(event);
}
```

### 4.5 Encryption

For highly sensitive data that must be transmitted but should only be readable by specific consumers, implementations MAY encrypt PII fields using public-key encryption where only the intended consumer holds the private key. This approach is outside the scope of the core protocol but is a valid extension.

## 5. Consent Context Integration

### 5.1 Consent Categories

The ODL consent context defines four standard consent categories:

| Category | Purpose | Typical Consumers |
|---|---|---|
| `analytics` | Understanding user behavior and site performance | Web analytics, heatmaps, session replay |
| `marketing` | Advertising, retargeting, and attribution | Ad platforms, marketing automation, attribution tools |
| `personalization` | Tailoring content and experiences to the user | Recommendation engines, A/B testing, content personalization |
| `functional` | Enhanced functionality beyond strictly necessary | Chatbots, live chat, social widgets, embedded media |

### 5.2 Consent Granularity

ODL supports category-level consent, not field-level or event-level consent. This means consent is granted or denied for an entire category, not for individual events or data fields.

If finer-grained consent is needed, implementations CAN:

- Define additional consent categories using the extension mechanism (see [extensions.md](extensions.md)).
- Use the `customDimensions` field to add consent flags at the event level.
- Implement field-level suppression in the transform middleware.

### 5.3 Consent Signals

The consent context captures both the consent state and how it was obtained:

- **`method: "explicit"`** — The user actively opted in (clicked "Accept" on a consent banner).
- **`method: "implicit"`** — Consent was inferred from the user's behavior (e.g., continued browsing).
- **`method: "default"`** — The consent state reflects pre-set defaults before the user made a choice.

The `method` field is important for audit purposes. Some regulations (e.g., GDPR) require explicit consent for certain purposes.

### 5.4 Consent Persistence

The consent state MUST be persisted across page loads and sessions. Common persistence mechanisms:

- **First-party cookies.** The most common approach. Set a cookie with the consent state and restore it on each page load.
- **Local storage.** An alternative to cookies, though less widely supported for cross-subdomain scenarios.
- **Server-side storage.** For authenticated users, consent state can be stored in the user's profile on the server.

The persistence mechanism is implementation-defined, but implementations MUST document which mechanism they use.

## 6. Regulatory Considerations

ODL is designed to support compliance with global privacy regulations. This section provides guidance on how ODL's features map to specific regulatory requirements.

### 6.1 GDPR (General Data Protection Regulation)

The GDPR applies to organizations that process personal data of individuals in the European Union.

| GDPR Requirement | ODL Feature |
|---|---|
| Lawful basis for processing | Consent context tracks consent state and method. Consent-first architecture ensures no data flows without a basis. |
| Purpose limitation | Consent categories (analytics, marketing, personalization, functional) map to specific purposes. |
| Data minimization | ODL's design encourages collecting only necessary data. Context objects are optional. |
| Accuracy | Middleware pipeline allows data validation and correction. |
| Storage limitation | Events include timestamps for TTL enforcement. |
| Integrity and confidentiality | PII hashing and redaction in the middleware pipeline. |
| Rights of data subjects | See [Section 9](#9-right-to-erasure-support). |
| Consent withdrawal | Consent context supports revocation; consent-aware routing stops data flow immediately. |

### 6.2 CCPA / CPRA (California Consumer Privacy Act / California Privacy Rights Act)

| CCPA/CPRA Requirement | ODL Feature |
|---|---|
| Right to know | Event schemas document what data is collected. |
| Right to delete | See [Section 9](#9-right-to-erasure-support). |
| Right to opt out of sale/sharing | Consent context with `marketing: false` prevents data sharing with third parties. |
| Do Not Sell signal | GPC support (see [Section 7](#7-global-privacy-control-gpc-support)). |
| Data minimization | Same as GDPR above. |

### 6.3 ePrivacy Directive

The ePrivacy Directive (and the forthcoming ePrivacy Regulation) governs the use of cookies and similar technologies in the EU.

| ePrivacy Requirement | ODL Feature |
|---|---|
| Consent for non-essential cookies | Consent-first architecture; default consent is `false`. |
| Strictly necessary exemption | Consent events are exempt from consent checks. |
| Information requirement | Consent context records the `method` and `source` of consent. |

## 7. Global Privacy Control (GPC) Support

### 7.1 What is GPC?

Global Privacy Control (GPC) is a browser-level signal that communicates a user's privacy preferences to websites. When GPC is enabled, the browser sends a `Sec-GPC: 1` header with HTTP requests and sets `navigator.globalPrivacyControl` to `true`.

### 7.2 ODL GPC Integration

ODL integrates GPC through the consent context's `gpcEnabled` field:

```json
{
  "consent": {
    "gpcEnabled": true,
    "analytics": true,
    "marketing": false,
    "personalization": false,
    "functional": true
  }
}
```

### 7.3 GPC Behavior

When GPC is detected, implementations SHOULD:

1. Set `consent.gpcEnabled` to `true`.
2. Treat the GPC signal as an opt-out of sale/sharing (set `consent.marketing` to `false`).
3. Allow the user to override the GPC signal with explicit consent choices (the user's explicit choice takes precedence over GPC).
4. Log the GPC signal for compliance auditing purposes.

### 7.4 GPC and Consent Interactions

| Scenario | Behavior |
|---|---|
| GPC enabled, no explicit consent choice | `marketing: false`, `personalization: false` |
| GPC enabled, user explicitly grants marketing consent | `marketing: true` (explicit overrides GPC) |
| GPC disabled, no explicit consent choice | Default consent state applies |
| GPC enabled, user explicitly denies all consent | `marketing: false`, `analytics: false`, etc. |

## 8. Server-Side vs. Client-Side Privacy Implications

### 8.1 Client-Side Risks

When the ODL data layer runs entirely in the browser:

- **Exposure to ad blockers and privacy tools.** Client-side events may be blocked by browser extensions, ad blockers, or privacy-focused browsers.
- **JavaScript access to PII.** Any JavaScript on the page can potentially read the data layer, including PII in the user context.
- **Third-party script risks.** Third-party tags loaded on the page may access the data layer or intercept events.

### 8.2 Server-Side Benefits

Forwarding events through a server-side endpoint (see [transport.md](transport.md)) provides privacy advantages:

- **PII isolation.** PII can be processed server-side and stripped before forwarding to third parties.
- **No client-side exposure.** Third-party scripts never see raw PII.
- **IP address handling.** The server can perform geolocation and discard the raw IP address before forwarding events.
- **Reduced fingerprinting.** Device context fields that contribute to fingerprinting can be generalized server-side (e.g., truncating the User-Agent string).

### 8.3 Server-Side Risks

Server-side forwarding introduces its own risks:

- **Server-side access.** The server has access to all event data, including PII. Server security is critical.
- **Compliance responsibility.** The organization operating the server is a data processor (or controller) and is responsible for handling the data appropriately.
- **Logging.** Server logs may inadvertently capture PII from event payloads. Implementations MUST configure logging to exclude or redact PII.

### 8.4 Recommended Architecture

For the strongest privacy posture, ODL recommends a **server-side forwarding architecture** where:

1. The client-side data layer collects events with minimal PII.
2. Events are forwarded to a first-party server endpoint.
3. The server applies PII processing (hashing, redaction) in its middleware pipeline.
4. The server forwards processed events to third-party consumers.
5. Raw PII is never exposed to third-party JavaScript or APIs.

## 9. Right to Erasure Support

### 9.1 Overview

Privacy regulations (GDPR Article 17, CCPA/CPRA) grant individuals the right to request deletion of their personal data. While ODL itself is a data collection protocol (not a data storage system), the protocol supports erasure workflows.

### 9.2 Erasure Event

ODL does not define a dedicated erasure event in the core taxonomy. However, implementations that need to support erasure workflows SHOULD define a custom event:

```json
{
  "event": "custom.erasure_requested",
  "data": {
    "userId": "user-789",
    "requestId": "erasure-req-001",
    "requestedAt": "2026-02-23T10:00:00.000Z",
    "scope": "full"
  }
}
```

This event can trigger erasure workflows in downstream consumers (data warehouses, analytics platforms, CRMs).

### 9.3 Identity Resolution for Erasure

To fulfill an erasure request, the system needs to identify all data associated with the user. ODL supports this through:

- The `user.id` field, which links authenticated events to a user.
- The `user.anonymousId` field, which links anonymous events.
- The `user.identified` event, which bridges anonymous and authenticated states.

Implementations SHOULD maintain an identity graph that maps all known identifiers (user ID, anonymous ID, email hash) to a single individual, enabling comprehensive erasure.

### 9.4 Erasure in the Pipeline

When an erasure request is received:

1. Stop collecting data for the user (update consent to `false` for all categories).
2. Propagate the erasure request to all downstream consumers.
3. Delete or anonymize historical events associated with the user.
4. Confirm erasure completion to the requesting party.

The specific mechanics of erasure in downstream systems are outside the scope of this protocol, but ODL's architecture (with user identification and event routing) provides the foundation for building compliant erasure workflows.

## 10. Privacy Checklist

The following checklist summarizes the privacy requirements and recommendations for ODL implementations:

| # | Requirement | Level |
|---|---|---|
| 1 | Default consent state is `false` for all categories. | MUST |
| 2 | Consent is evaluated before events are delivered to consumers. | MUST |
| 3 | Strictly necessary events (consent events) bypass consent checks. | MUST |
| 4 | PII fields are documented and identifiable. | MUST |
| 5 | GPC signal is detected and reflected in consent context. | SHOULD |
| 6 | PII hashing uses SHA-256. | SHOULD |
| 7 | Server-side forwarding is used for PII-heavy workflows. | SHOULD |
| 8 | IP addresses are not stored in event data. | SHOULD |
| 9 | Consent state is persisted across sessions. | MUST |
| 10 | Consent revocation stops data flow immediately. | MUST |
| 11 | Erasure request workflow is documented. | SHOULD |
| 12 | Identity graph supports comprehensive erasure. | SHOULD |
| 13 | Data minimization is practiced (collect only what is needed). | SHOULD |
| 14 | Location precision is appropriate for the use case. | SHOULD |
| 15 | Device fingerprinting vectors are minimized. | SHOULD |
