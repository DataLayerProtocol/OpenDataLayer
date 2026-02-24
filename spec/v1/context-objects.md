# OpenDataLayer Protocol Specification v1 — Context Objects

**Status:** Draft
**Version:** 1.0.0
**Last Updated:** 2026-02-23

---

## 1. Introduction

Context objects represent **ambient state** in the OpenDataLayer protocol. Unlike event data payloads (which are specific to a single event), context objects persist across events and are automatically merged into every event emitted during the relevant state.

Context objects answer the question: "What was true about the world when this event happened?" They describe the page, the user, the device, the session, the consent state, the application, the campaign, and the location at the time of the event.

## 2. Context Object Principles

### 2.1 Persistence

Context objects are **set once and persist** until explicitly updated or the session ends. Setting the `user` context after login means every subsequent event includes that user context automatically. Producers do not need to re-attach user data to every event.

### 2.2 Automatic Inclusion

The data layer implementation is responsible for merging the current context objects into every event at emission time. Producers push events with event-specific data; the data layer attaches the ambient context.

### 2.3 Selective Inclusion

Not all context objects are required on every event. The required set depends on the conformance level (see [conformance.md](conformance.md)):

- **Minimal**: `page` context only.
- **Standard**: `page`, `user`, `consent`, `session` contexts.
- **Full**: All 10 context objects.

### 2.4 Context Merging Strategy

When a context object is updated, the new values are **deep merged** with the existing values. The merge follows these rules:

1. **Scalar values**: The new value replaces the old value (latest wins).
2. **Objects**: Recursively merged (new keys are added, existing keys are updated).
3. **Arrays**: The new array replaces the old array entirely (arrays are not merged element-by-element).
4. **Null values**: Setting a field to `null` explicitly removes it from the context.
5. **Omitted fields**: Fields not present in the update are left unchanged.

**Example:**

Existing `user` context:
```json
{
  "id": "user-123",
  "isAuthenticated": true,
  "traits": {
    "email": "jane@example.com",
    "firstName": "Jane"
  }
}
```

Update:
```json
{
  "traits": {
    "lastName": "Doe",
    "loyaltyTier": "gold"
  }
}
```

Resulting `user` context after merge:
```json
{
  "id": "user-123",
  "isAuthenticated": true,
  "traits": {
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "loyaltyTier": "gold"
  }
}
```

### 2.5 Context Reset

Some context objects SHOULD be reset under specific conditions:

- **`page` context**: Reset on every page navigation (including SPA route changes).
- **`user` context**: Reset on sign-out.
- **`session` context**: Reset when a new session begins.
- **`campaign` context**: Reset on each new page view if new UTM parameters are present; otherwise, persist for the session.

Implementations SHOULD document their context reset behavior.

---

## 3. Page Context

The `page` context describes the current page or screen the user is viewing. It is the most fundamental context object and is REQUIRED at all conformance levels.

### 3.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | `string` | Yes | The full URL of the current page (including protocol, host, path, and query string). |
| `title` | `string` | Yes | The page title (typically the `<title>` element content or screen name). |
| `path` | `string` | No | The URL path component (e.g., `/products/shoes`). |
| `hash` | `string` | No | The URL hash fragment (e.g., `#section-2`). |
| `search` | `string` | No | The URL query string (e.g., `?category=running&sort=price`). |
| `referrer` | `string` | No | The referring URL. |
| `type` | `string` | No | A classification of the page type. Common values: `"homepage"`, `"product"`, `"category"`, `"article"`, `"landing"`, `"checkout"`, `"account"`, `"search"`, `"error"`. |
| `name` | `string` | No | A human-readable, stable identifier for the page (useful when URLs are dynamic). Example: `"product-detail"`, `"homepage"`. |
| `language` | `string` | No | The language of the page content as an IETF BCP 47 language tag (e.g., `"en-US"`, `"fr-FR"`). |

### 3.2 When Populated

The `page` context MUST be set or updated on every page navigation, including:

- Full page loads.
- Client-side route changes in single-page applications.
- Screen transitions in mobile applications.

### 3.3 Example

```json
{
  "page": {
    "url": "https://www.example.com/products/running-shoes?sort=price",
    "title": "Running Shoes — Example Store",
    "path": "/products/running-shoes",
    "search": "?sort=price",
    "referrer": "https://www.google.com/",
    "type": "category",
    "name": "product-listing",
    "language": "en-US"
  }
}
```

---

## 4. User Context

The `user` context describes the current user, whether authenticated or anonymous.

### 4.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | No | A stable, unique identifier for the user. For authenticated users, this is typically the user ID from the backend system. For anonymous users, this MAY be omitted or set to an anonymous identifier. |
| `anonymousId` | `string` | No | An anonymous identifier for the user, typically a first-party cookie or device ID. Used for identity stitching before authentication. |
| `isAuthenticated` | `boolean` | No | Whether the user is currently authenticated. Defaults to `false` if omitted. |
| `traits` | `object` | No | A flexible object containing user attributes. See [Section 4.2](#42-user-traits). |
| `email` | `string` | No | The user's email address (plain text). Subject to PII handling rules (see [privacy.md](privacy.md)). |
| `hashedEmail` | `string` | No | A SHA-256 hex-encoded hash of the user's lowercase, trimmed email address. Useful for identity resolution without exposing PII. |
| `isNewUser` | `boolean` | No | Whether the user is new (e.g., first visit or recently registered). |
| `segments` | `string[]` | No | Audience segments the user belongs to. |
| `role` | `string` | No | User's role within the product (e.g., `"admin"`, `"member"`, `"viewer"`). |
| `locale` | `string` | No | User's preferred locale in BCP 47 format (e.g., `"en-US"`). |

### 4.2 User Traits

The `traits` object within the user context contains user attributes. Common traits include:

| Trait | Type | Description |
|---|---|---|
| `email` | `string` | User's email address. Subject to PII handling rules (see [privacy.md](privacy.md)). |
| `firstName` | `string` | User's first name. |
| `lastName` | `string` | User's last name. |
| `phone` | `string` | User's phone number. |
| `company` | `string` | User's company or organization. |
| `role` | `string` | User's role or type (e.g., `"admin"`, `"customer"`, `"free_user"`, `"premium"`). |
| `createdAt` | `string` | ISO 8601 timestamp of account creation. |
| `loyaltyTier` | `string` | Loyalty program tier. |
| `totalOrders` | `number` | Lifetime order count. |
| `totalRevenue` | `number` | Lifetime revenue. |

The `traits` object is extensible. Implementations MAY add additional traits as needed, but SHOULD prefer `customDimensions` on the event envelope for truly ad-hoc values.

### 4.3 PII Considerations

The `user` context is the most likely place for personally identifiable information (PII) to appear. Implementations MUST:

- Check consent state before populating PII fields (see [privacy.md](privacy.md)).
- Support hashing or redacting PII fields in the middleware pipeline.
- Never include highly sensitive data (passwords, payment details, government IDs) in user traits.

### 4.4 When Populated

- **On authentication**: Set `id`, `isAuthenticated: true`, and known `traits`.
- **On sign-out**: Reset to anonymous state (`isAuthenticated: false`, remove `id` and PII traits).
- **On profile update**: Merge updated traits.
- **On initial page load**: Set `anonymousId` if the user is not yet authenticated.

### 4.5 Example

```json
{
  "user": {
    "id": "user-789",
    "anonymousId": "anon-abc-123-def-456",
    "isAuthenticated": true,
    "traits": {
      "email": "jane.doe@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "premium",
      "loyaltyTier": "gold",
      "createdAt": "2024-06-15T10:00:00.000Z",
      "totalOrders": 12
    }
  }
}
```

---

## 5. Consent Context

The `consent` context describes the user's current privacy consent state. It is a critical component of ODL's privacy-by-design architecture and is evaluated before events are processed.

### 5.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `analytics` | `boolean` | No | Whether the user has consented to analytics tracking. |
| `marketing` | `boolean` | No | Whether the user has consented to marketing/advertising tracking. |
| `personalization` | `boolean` | No | Whether the user has consented to personalization. |
| `functional` | `boolean` | No | Whether the user has consented to functional cookies/tracking beyond strictly necessary. |
| `method` | `string` | No | How consent was obtained: `"explicit"` (active opt-in), `"implicit"` (continued use), `"default"` (pre-set values before user action). |
| `updatedAt` | `string` | No | ISO 8601 timestamp of the last consent update. |
| `gpcEnabled` | `boolean` | No | Whether the user's browser has Global Privacy Control (GPC) enabled. |
| `doNotTrack` | `boolean` | No | Whether the Do Not Track (DNT) header is set in the browser. (Note: DNT is deprecated but still present in some browsers.) |
| `version` | `string` | No | The version of the consent policy the user agreed to. |
| `region` | `string` | No | Applicable regulatory jurisdiction (e.g., `"GDPR"`, `"CCPA"`, `"LGPD"`, `"PIPL"`). |
| `status` | `string` | No | The overall consent status: `"granted"`, `"denied"`, `"pending"`. |
| `purposes` | `object` | No | A map of consent purpose names to their granted/denied state (e.g., `{ "analytics": true, "marketing": false }`). |

### 5.2 Consent Categories

The four consent categories (`analytics`, `marketing`, `personalization`, `functional`) cover the most common consent management scenarios. Organizations MAY add additional categories using the `customDimensions` field on individual events or through the extension mechanism.

The default state for all consent categories is `false` (not consented) until explicitly set. This follows the principle of **opt-in by default**.

### 5.3 When Populated

- **On page load**: Restore consent state from persistent storage (cookie, local storage) if previously set.
- **On consent interaction**: Update when the user interacts with a consent banner or preference center.
- **On GPC detection**: Set `gpcEnabled` based on the `navigator.globalPrivacyControl` signal.

### 5.4 Example

```json
{
  "consent": {
    "analytics": true,
    "marketing": false,
    "personalization": true,
    "functional": true,
    "method": "explicit",
    "updatedAt": "2026-02-20T09:15:00.000Z",
    "gpcEnabled": false
  }
}
```

---

## 6. Session Context

The `session` context describes the current user session.

### 6.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | A unique identifier for the current session. |
| `isNew` | `boolean` | No | Whether this is a new session (first page view). |
| `count` | `number` | No | The session number for this user (e.g., 1 for first visit, 5 for fifth visit). |
| `startedAt` | `string` | No | ISO 8601 timestamp of when the session started. |
| `referrer` | `string` | No | The external referrer that initiated this session (distinct from page referrer, which can be internal). |
| `landingPage` | `string` | No | The URL of the first page viewed in this session. |
| `duration` | `number` | No | Current session duration in milliseconds (updated periodically). |
| `pageViews` | `number` | No | Number of page views in this session so far. |
| `engaged` | `boolean` | No | Whether the session qualifies as "engaged" (based on implementation-defined criteria such as duration, page views, or conversions). |

### 6.2 Session Definition

ODL does not prescribe a specific session definition. Common approaches include:

- **Timeout-based**: A session ends after 30 minutes of inactivity (Google Analytics default).
- **Calendar-based**: A session ends at midnight.
- **Campaign-based**: A new session begins when the marketing campaign source changes.
- **Custom**: Any combination of the above.

Implementations MUST document their session definition.

### 6.3 When Populated

- **On session start**: Set `id`, `isNew: true`, `startedAt`, `referrer`, and `landingPage`.
- **On subsequent page views**: Update `isNew: false`, increment `pageViews`.
- **Periodically**: Update `duration`.

### 6.4 Example

```json
{
  "session": {
    "id": "sess-abc123-def456",
    "isNew": false,
    "count": 5,
    "startedAt": "2026-02-23T14:10:00.000Z",
    "referrer": "https://www.google.com/",
    "landingPage": "https://www.example.com/",
    "pageViews": 3,
    "duration": 245000,
    "engaged": true
  }
}
```

---

## 7. Device Context

The `device` context describes the user's device, browser, and viewport.

### 7.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | No | Device type: `"desktop"`, `"mobile"`, `"tablet"`, `"smart_tv"`, `"wearable"`, `"other"`. |
| `browser` | `string` | No | Browser name (e.g., `"Chrome"`, `"Firefox"`, `"Safari"`, `"Edge"`). |
| `browserVersion` | `string` | No | Browser version string. |
| `os` | `string` | No | Operating system name (e.g., `"macOS"`, `"Windows"`, `"iOS"`, `"Android"`, `"Linux"`). |
| `osVersion` | `string` | No | Operating system version. |
| `screenResolution` | `string` | No | Screen resolution as `"widthxheight"` in physical pixels (e.g., `"2560x1440"`). |
| `viewport` | `string` | No | Browser viewport size as `"widthxheight"` in CSS pixels (e.g., `"1440x900"`). |
| `language` | `string` | No | The browser or device language as an IETF BCP 47 tag (e.g., `"en-US"`). |
| `userAgent` | `string` | No | The full User-Agent string. Note: increasingly unreliable due to UA reduction. Consider using Client Hints instead. |
| `touchEnabled` | `boolean` | No | Whether the device supports touch input. |
| `cookiesEnabled` | `boolean` | No | Whether cookies are enabled. |
| `doNotTrack` | `boolean` | No | Whether the DNT header is set. (Note: DNT is deprecated but still present in some browsers.) |
| `connectionType` | `string` | No | Network connection type if available via Network Information API: `"4g"`, `"3g"`, `"2g"`, `"slow-2g"`, `"wifi"`, `"ethernet"`. |

### 7.2 Privacy Considerations

Some device fields (particularly `userAgent` and `screenResolution`) can contribute to device fingerprinting. Implementations SHOULD:

- Only populate device context fields when the user has consented to analytics tracking.
- Consider using the User-Agent Client Hints API instead of the full User-Agent string.
- Avoid collecting high-entropy fields that are not needed.

### 7.3 When Populated

- **On page load**: Detect and set all available device properties.
- **On viewport change**: Update `viewport` if the window is resized.
- **On orientation change**: Update `viewport` for mobile devices.

### 7.4 Example

```json
{
  "device": {
    "type": "desktop",
    "browser": "Chrome",
    "browserVersion": "122.0.6261.94",
    "os": "macOS",
    "osVersion": "15.3",
    "screenResolution": "2560x1440",
    "viewport": "1440x900",
    "language": "en-US",
    "touchEnabled": false,
    "cookiesEnabled": true,
    "connectionType": "wifi"
  }
}
```

---

## 8. App Context

The `app` context describes the application or website that is producing events.

### 8.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | Yes | The name of the application or website. |
| `version` | `string` | No | The current version of the application. |
| `build` | `string` | No | The build number or identifier. |
| `environment` | `string` | No | The runtime environment: `"production"`, `"staging"`, `"development"`, `"testing"`. |
| `platform` | `string` | No | The platform: `"web"`, `"ios"`, `"android"`, `"react_native"`, `"electron"`, `"server"`. |
| `namespace` | `string` | No | A reverse-domain namespace for the app (e.g., `"com.example.store"`). |
| `sdkName` | `string` | No | Name of the analytics SDK used (e.g., `"@opendatalayer/sdk"`). |
| `sdkVersion` | `string` | No | Version of the analytics SDK. |
| `deployId` | `string` | No | Identifier for the current deployment or release. |

### 8.2 When Populated

- **On initialization**: Set all app context fields when the data layer is initialized. These values are typically static for the lifetime of the page or app session.
- **On version change**: Update `version` if a hot-reload or dynamic update changes the app version.

### 8.3 Example

```json
{
  "app": {
    "name": "Example Store",
    "version": "3.2.0",
    "build": "20260223.1",
    "environment": "production",
    "platform": "web",
    "namespace": "com.example.store"
  }
}
```

---

## 9. Campaign Context

The `campaign` context describes the marketing campaign or traffic source that brought the user to the current session.

### 9.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `source` | `string` | No | The traffic source (e.g., `"google"`, `"facebook"`, `"newsletter"`). Corresponds to `utm_source`. |
| `medium` | `string` | No | The marketing medium (e.g., `"cpc"`, `"organic"`, `"email"`, `"social"`, `"referral"`). Corresponds to `utm_medium`. |
| `name` | `string` | No | The campaign name (e.g., `"spring-sale-2026"`). Corresponds to `utm_campaign`. |
| `term` | `string` | No | The paid search keyword. Corresponds to `utm_term`. |
| `content` | `string` | No | The ad content variant. Corresponds to `utm_content`. |
| `id` | `string` | No | A unique campaign identifier. |
| `clickId` | `string` | No | Click identifier from an ad platform (e.g., `gclid`, `fbclid`, `msclkid`). |
| `clickIdSource` | `string` | No | The source of the click ID: `"google"`, `"facebook"`, `"microsoft"`, `"other"`. |

### 9.2 UTM Parameter Mapping

The campaign context fields map directly to standard UTM parameters:

| UTM Parameter | Campaign Field |
|---|---|
| `utm_source` | `source` |
| `utm_medium` | `medium` |
| `utm_campaign` | `name` |
| `utm_term` | `term` |
| `utm_content` | `content` |

### 9.3 When Populated

- **On session start**: Parse UTM parameters and click IDs from the landing page URL.
- **On new UTM parameters**: If a user navigates to a URL with new UTM parameters during a session, the campaign context SHOULD be updated. Implementations MAY choose to start a new session in this case.
- **From referrer**: If no UTM parameters are present, the campaign context MAY be partially populated from the referrer URL (e.g., setting `source` to `"google"` and `medium` to `"organic"` for a Google organic search referral).

### 9.4 Example

```json
{
  "campaign": {
    "source": "google",
    "medium": "cpc",
    "name": "spring-sale-2026",
    "term": "running shoes",
    "content": "ad-variant-b",
    "clickId": "CjwKCAiA0...",
    "clickIdSource": "google"
  }
}
```

---

## 10. Location Context

The `location` context describes the user's geographic location. This context is typically derived from IP geolocation or, with consent, from the device's geolocation API.

### 10.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `country` | `string` | No | ISO 3166-1 alpha-2 country code (e.g., `"US"`, `"GB"`, `"DE"`). |
| `region` | `string` | No | Region, state, or province code (e.g., `"CA"` for California, `"ON"` for Ontario). |
| `city` | `string` | No | City name. |
| `postalCode` | `string` | No | Postal or ZIP code. |
| `timezone` | `string` | No | IANA timezone string (e.g., `"America/Los_Angeles"`, `"Europe/London"`). |
| `latitude` | `number` | No | Latitude coordinate. Only with explicit geolocation consent. |
| `longitude` | `number` | No | Longitude coordinate. Only with explicit geolocation consent. |

### 10.2 Privacy Considerations

Location data is sensitive and subject to privacy regulations:

- **IP-based geolocation** (country, region, city): MAY be populated without explicit geolocation consent, but SHOULD respect the user's analytics consent state.
- **Precise coordinates** (`latitude`, `longitude`): MUST only be populated with explicit geolocation consent from the user.
- **Postal codes**: Can be identifying in sparsely populated areas. Implementations SHOULD consider truncating postal codes (e.g., using only the first 3 digits of a US ZIP code).

### 10.3 When Populated

- **On page load**: Derive location from IP geolocation or server-side lookup.
- **On geolocation consent**: Populate precise coordinates if the user grants browser geolocation permission and analytics consent.
- **From timezone**: The `timezone` field can often be derived client-side from `Intl.DateTimeFormat().resolvedOptions().timeZone`.

### 10.4 Example

```json
{
  "location": {
    "country": "US",
    "region": "CA",
    "city": "San Francisco",
    "postalCode": "941",
    "timezone": "America/Los_Angeles"
  }
}
```

---

## 11. Organization Context

The `organization` context describes the organization, company, or tenant associated with the current user or session. This is particularly useful for B2B SaaS products where users belong to organizations and analytics need to be segmented by account.

### 11.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | A unique identifier for the organization. |
| `name` | `string` | No | The display name of the organization. |
| `plan` | `string` | No | The current subscription plan: `"free"`, `"starter"`, `"professional"`, `"enterprise"`, `"custom"`. |
| `industry` | `string` | No | The industry classification of the organization. |
| `size` | `string` | No | The organization size range: `"1-10"`, `"11-50"`, `"51-200"`, `"201-1000"`, `"1001-5000"`, `"5000+"`. |
| `domain` | `string` | No | The primary domain of the organization (e.g., `"example.com"`). |
| `country` | `string` | No | ISO 3166-1 alpha-2 country code of the organization's headquarters. |
| `region` | `string` | No | Region or state of the organization's headquarters. |
| `createdAt` | `string` | No | ISO 8601 timestamp of when the organization account was created. |
| `mrr` | `number` | No | Monthly recurring revenue for this organization. |
| `employeeCount` | `integer` | No | Number of employees in the organization. |
| `isTrialing` | `boolean` | No | Whether the organization is currently on a trial. |
| `traits` | `object` | No | A flexible object containing additional organization attributes. |
| `parentId` | `string` | No | Identifier of the parent organization, if part of a hierarchy. |

### 11.2 When Populated

- **On authentication**: Set organization context when a user authenticates and their organization is known.
- **On organization switch**: Update when the user switches between organizations in multi-tenant applications.
- **On plan change**: Update `plan`, `mrr`, and `isTrialing` when the organization's subscription changes.

### 11.3 Example

```json
{
  "organization": {
    "id": "org-456",
    "name": "Acme Corp",
    "plan": "enterprise",
    "industry": "Technology",
    "size": "201-1000",
    "domain": "acme.com",
    "country": "US",
    "region": "CA",
    "createdAt": "2024-03-10T00:00:00.000Z",
    "mrr": 4999.00,
    "employeeCount": 350,
    "isTrialing": false
  }
}
```

---

## 12. Account Context

The `account` context represents the account or subscription context for B2B scenarios. While similar to the organization context, the account context focuses on the commercial relationship (subscription, billing, and lifecycle) rather than the organizational identity.

### 12.1 Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | The account identifier. |
| `name` | `string` | No | The account or organization name. |
| `plan` | `string` | No | The account's subscription plan or tier. |
| `industry` | `string` | No | The account's industry vertical. |
| `employeeCount` | `string` | No | Company size range: `"1-10"`, `"11-50"`, `"51-200"`, `"201-1000"`, `"1001-5000"`, `"5000+"`. |
| `createdAt` | `string` | No | ISO 8601 timestamp of when the account was created. |
| `mrr` | `number` | No | Monthly recurring revenue for this account. |
| `domain` | `string` | No | The account's primary domain. |
| `country` | `string` | No | ISO 3166-1 alpha-2 country code of the account. |
| `status` | `string` | No | Current account lifecycle status: `"active"`, `"trialing"`, `"suspended"`, `"churned"`, `"cancelled"`. |
| `seats` | `integer` | No | Number of licensed seats on the account. |

### 12.2 When Populated

- **On authentication**: Set account context when a user authenticates and their account is known.
- **On account switch**: Update when the user switches between accounts.
- **On subscription change**: Update `plan`, `mrr`, `status`, and `seats` when the account's subscription changes.

### 12.3 Example

```json
{
  "account": {
    "id": "acct-789",
    "name": "Acme Corp",
    "plan": "enterprise",
    "industry": "Technology",
    "employeeCount": "201-1000",
    "createdAt": "2024-03-10T00:00:00.000Z",
    "mrr": 4999.00,
    "domain": "acme.com",
    "country": "US",
    "status": "active",
    "seats": 50
  }
}
```

---

## 13. Context Object Summary

| Context | Required (Minimal) | Required (Standard) | Required (Full) | Reset Trigger |
|---|---|---|---|---|
| `page` | Yes | Yes | Yes | Page navigation |
| `user` | No | Yes | Yes | Sign-out |
| `consent` | No | Yes | Yes | Consent change |
| `session` | No | Yes | Yes | Session start |
| `device` | No | No | Yes | Page load |
| `app` | No | No | Yes | Initialization |
| `campaign` | No | No | Yes | Session start / UTM change |
| `location` | No | No | Yes | Page load / geolocation change |
| `organization` | No | No | Yes | Authentication / organization switch |
| `account` | No | No | Yes | Authentication / account switch |

See [conformance.md](conformance.md) for the complete conformance level definitions.
