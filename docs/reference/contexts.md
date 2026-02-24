# Context Reference

Context objects represent **ambient state** that the SDK automatically attaches to every event. Instead of passing the same values on every `track()` call, you set context once and it flows through until you change it.

This page documents all 8 standard context objects, their fields, and examples. For the full specification, see the [Context Objects Specification](https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/spec/v1/context-objects.md).

## Overview

| Context | Purpose | Required at | Reset trigger |
|---------|---------|-------------|---------------|
| [`page`](#page) | Current page URL, title, referrer | All levels | Page navigation |
| [`user`](#user) | User identity, auth state, traits | Standard | Sign-out |
| [`consent`](#consent) | Privacy consent categories | Standard | Consent change |
| [`session`](#session) | Session ID, visit count, duration | Standard | Session start |
| [`device`](#device) | Browser, OS, viewport, screen | Full | Page load |
| [`app`](#app) | Application name, version, environment | Full | Initialization |
| [`campaign`](#campaign) | UTM parameters, traffic source | Full | Session start / UTM change |
| [`location`](#location) | Geographic location, timezone | Full | Page load |

### Conformance levels

- **Minimal**: Only `page` context is required.
- **Standard**: `page`, `user`, `consent`, and `session` are required.
- **Full**: All 15 context objects are required.

### Setting context

```ts
// Replace an entire context domain
odl.setContext('page', { url: '...', title: '...' });

// Deep-merge into an existing context domain
odl.updateContext('user', { traits: { loyaltyTier: 'platinum' } });
```

---

## page

The `page` context describes the current page or screen the user is viewing. It is the most fundamental context object and is required at all conformance levels.

**When to set:** On every page navigation, including full page loads, SPA route changes, and mobile screen transitions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | **Yes** | Full URL including protocol, host, path, and query string |
| `title` | `string` | **Yes** | Page title (`<title>` element or screen name) |
| `path` | `string` | No | URL path component (e.g., `/products/shoes`) |
| `hash` | `string` | No | URL hash fragment (e.g., `#section-2`) |
| `search` | `string` | No | URL query string (e.g., `?category=running&sort=price`) |
| `referrer` | `string` | No | Referring URL |
| `type` | `string` | No | Page type: `"homepage"`, `"product"`, `"category"`, `"article"`, `"landing"`, `"checkout"`, `"account"`, `"search"`, `"error"` |
| `name` | `string` | No | Stable human-readable page identifier (e.g., `"product-detail"`) |
| `language` | `string` | No | Page language as IETF BCP 47 tag (e.g., `"en-US"`) |

```json
{
  "page": {
    "url": "https://www.example.com/products/running-shoes?sort=price",
    "title": "Running Shoes -- Example Store",
    "path": "/products/running-shoes",
    "search": "?sort=price",
    "referrer": "https://www.google.com/",
    "type": "category",
    "name": "product-listing",
    "language": "en-US"
  }
}
```

```ts
odl.setContext('page', {
  url: window.location.href,
  title: document.title,
  path: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
  referrer: document.referrer,
  type: 'product',
});
```

---

## user

The `user` context describes the current user, whether authenticated or anonymous.

**When to set:** On authentication (login), sign-out, profile updates, and on initial page load for anonymous users.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | No | Stable unique user identifier (backend user ID for authenticated users) |
| `anonymousId` | `string` | No | Anonymous identifier (first-party cookie or device ID) for identity stitching |
| `isAuthenticated` | `boolean` | No | Whether the user is authenticated (defaults to `false`) |
| `traits` | `object` | No | Flexible user attributes (see traits table below) |

### Common user traits

| Trait | Type | Description |
|-------|------|-------------|
| `email` | `string` | Email address (subject to PII handling rules) |
| `firstName` | `string` | First name |
| `lastName` | `string` | Last name |
| `phone` | `string` | Phone number |
| `company` | `string` | Company or organization |
| `role` | `string` | User role: `"admin"`, `"customer"`, `"free_user"`, `"premium"` |
| `createdAt` | `string` | ISO 8601 timestamp of account creation |
| `loyaltyTier` | `string` | Loyalty program tier |
| `totalOrders` | `number` | Lifetime order count |
| `totalRevenue` | `number` | Lifetime revenue |

::: warning
Never include passwords, payment details, or government IDs in user traits. Check consent state before populating PII fields.
:::

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

```ts
// After login
odl.setContext('user', {
  id: 'user-789',
  isAuthenticated: true,
  traits: {
    email: 'jane.doe@example.com',
    firstName: 'Jane',
    role: 'premium',
  },
});

// After sign-out: reset to anonymous
odl.setContext('user', {
  anonymousId: 'anon-abc-123-def-456',
  isAuthenticated: false,
});
```

---

## consent

The `consent` context describes the user's current privacy consent state. It drives consent-aware behavior across adapters and the validation pipeline.

**When to set:** On page load (restore from storage), after consent banner interaction, and when GPC is detected.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `analytics` | `boolean` | No | Consent for analytics tracking |
| `marketing` | `boolean` | No | Consent for marketing/advertising tracking |
| `personalization` | `boolean` | No | Consent for personalization |
| `functional` | `boolean` | No | Consent for functional cookies beyond strictly necessary |
| `method` | `string` | No | How consent was obtained: `"explicit"`, `"implicit"`, `"default"` |
| `updatedAt` | `string` | No | ISO 8601 timestamp of last consent update |
| `gpcEnabled` | `boolean` | No | Whether the browser has Global Privacy Control enabled |

::: tip
The default state for all consent categories is `false` (opt-in by default). Categories must be explicitly set to `true` after user action.
:::

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

```ts
// After user accepts analytics + functional, denies marketing
odl.setContext('consent', {
  analytics: true,
  marketing: false,
  personalization: true,
  functional: true,
  method: 'explicit',
  updatedAt: new Date().toISOString(),
  gpcEnabled: navigator.globalPrivacyControl ?? false,
});
```

---

## session

The `session` context describes the current user session.

**When to set:** On session start, and update periodically during the session.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | **Yes** | Unique session identifier |
| `isNew` | `boolean` | No | Whether this is a new session (first page view) |
| `count` | `number` | No | Session number for this user (1 = first visit) |
| `startedAt` | `string` | No | ISO 8601 timestamp of session start |
| `referrer` | `string` | No | External referrer that initiated the session |
| `landingPage` | `string` | No | URL of the first page viewed in this session |
| `duration` | `number` | No | Current session duration in milliseconds |
| `pageViews` | `number` | No | Number of page views in this session |
| `engaged` | `boolean` | No | Whether the session qualifies as "engaged" |

::: info
ODL does not prescribe a specific session definition. Common approaches include 30-minute inactivity timeout, calendar-day boundaries, or campaign-based resets. Document your session definition for data consumers.
:::

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

```ts
odl.setContext('session', {
  id: crypto.randomUUID(),
  isNew: true,
  count: 1,
  startedAt: new Date().toISOString(),
  referrer: document.referrer,
  landingPage: window.location.href,
  pageViews: 1,
  duration: 0,
});
```

---

## device

The `device` context describes the user's device, browser, and viewport.

**When to set:** On page load. Update `viewport` on resize or orientation change.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `string` | No | `"desktop"`, `"mobile"`, `"tablet"`, `"smart_tv"`, `"wearable"`, `"other"` |
| `browser` | `string` | No | Browser name (e.g., `"Chrome"`, `"Firefox"`, `"Safari"`) |
| `browserVersion` | `string` | No | Browser version string |
| `os` | `string` | No | Operating system (e.g., `"macOS"`, `"Windows"`, `"iOS"`, `"Android"`) |
| `osVersion` | `string` | No | OS version |
| `screenResolution` | `string` | No | Screen resolution as `"widthxheight"` in physical pixels |
| `viewport` | `string` | No | Viewport size as `"widthxheight"` in CSS pixels |
| `language` | `string` | No | Browser language as IETF BCP 47 tag |
| `userAgent` | `string` | No | Full User-Agent string (increasingly unreliable due to UA reduction) |
| `touchEnabled` | `boolean` | No | Whether touch input is supported |
| `cookiesEnabled` | `boolean` | No | Whether cookies are enabled |
| `doNotTrack` | `boolean` | No | Whether DNT header is set (deprecated but still present) |
| `connectionType` | `string` | No | Network type: `"4g"`, `"3g"`, `"wifi"`, `"ethernet"` |

::: warning
Some device fields (`userAgent`, `screenResolution`) can contribute to fingerprinting. Only populate device context when the user has granted analytics consent. Prefer User-Agent Client Hints over the full UA string.
:::

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

```ts
odl.setContext('device', {
  type: 'desktop',
  browser: 'Chrome',
  browserVersion: '122.0.6261.94',
  os: 'macOS',
  screenResolution: `${screen.width}x${screen.height}`,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  language: navigator.language,
  touchEnabled: 'ontouchstart' in window,
  cookiesEnabled: navigator.cookieEnabled,
});
```

---

## app

The `app` context describes the application or website producing events. Typically set once at initialization.

**When to set:** On initialization. These values are usually static for the lifetime of the page.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | **Yes** | Application or website name |
| `version` | `string` | No | Current application version |
| `build` | `string` | No | Build number or identifier |
| `environment` | `string` | No | `"production"`, `"staging"`, `"development"`, `"testing"` |
| `platform` | `string` | No | `"web"`, `"ios"`, `"android"`, `"react_native"`, `"electron"`, `"server"` |
| `namespace` | `string` | No | Reverse-domain namespace (e.g., `"com.example.store"`) |

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

```ts
odl.setContext('app', {
  name: 'Example Store',
  version: '3.2.0',
  build: '20260223.1',
  environment: process.env.NODE_ENV,
  platform: 'web',
  namespace: 'com.example.store',
});
```

---

## campaign

The `campaign` context describes the marketing campaign or traffic source that brought the user to the current session. Fields map directly to standard UTM parameters.

**When to set:** On session start by parsing UTM parameters and click IDs from the landing page URL. Update when new UTM parameters appear.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | `string` | No | Traffic source (maps to `utm_source`) |
| `medium` | `string` | No | Marketing medium (maps to `utm_medium`) |
| `name` | `string` | No | Campaign name (maps to `utm_campaign`) |
| `term` | `string` | No | Paid search keyword (maps to `utm_term`) |
| `content` | `string` | No | Ad content variant (maps to `utm_content`) |
| `id` | `string` | No | Unique campaign identifier |
| `clickId` | `string` | No | Ad platform click ID (`gclid`, `fbclid`, `msclkid`) |
| `clickIdSource` | `string` | No | Click ID source: `"google"`, `"facebook"`, `"microsoft"`, `"other"` |

### UTM parameter mapping

| UTM Parameter | Campaign Field |
|---------------|----------------|
| `utm_source` | `source` |
| `utm_medium` | `medium` |
| `utm_campaign` | `name` |
| `utm_term` | `term` |
| `utm_content` | `content` |

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

```ts
// Parse UTM params from the URL
const params = new URLSearchParams(window.location.search);
const campaign: Record<string, string> = {};

if (params.get('utm_source')) campaign.source = params.get('utm_source')!;
if (params.get('utm_medium')) campaign.medium = params.get('utm_medium')!;
if (params.get('utm_campaign')) campaign.name = params.get('utm_campaign')!;
if (params.get('utm_term')) campaign.term = params.get('utm_term')!;
if (params.get('utm_content')) campaign.content = params.get('utm_content')!;
if (params.get('gclid')) {
  campaign.clickId = params.get('gclid')!;
  campaign.clickIdSource = 'google';
}

if (Object.keys(campaign).length > 0) {
  odl.setContext('campaign', campaign);
}
```

---

## location

The `location` context describes the user's geographic location, typically derived from IP geolocation or the device's geolocation API.

**When to set:** On page load from IP geolocation. Update with precise coordinates if the user grants browser geolocation permission.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `country` | `string` | No | ISO 3166-1 alpha-2 country code (e.g., `"US"`, `"GB"`) |
| `region` | `string` | No | Region, state, or province code (e.g., `"CA"` for California) |
| `city` | `string` | No | City name |
| `postalCode` | `string` | No | Postal or ZIP code (consider truncating for privacy) |
| `timezone` | `string` | No | IANA timezone (e.g., `"America/Los_Angeles"`) |
| `latitude` | `number` | No | Latitude (only with explicit geolocation consent) |
| `longitude` | `number` | No | Longitude (only with explicit geolocation consent) |

::: warning
Precise coordinates (`latitude`, `longitude`) MUST only be populated with explicit geolocation consent. IP-based geolocation (country, region, city) should still respect the user's analytics consent state.
:::

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

```ts
// Timezone can be derived client-side without geolocation consent
odl.setContext('location', {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});

// If you have server-side IP geolocation data
odl.updateContext('location', {
  country: 'US',
  region: 'CA',
  city: 'San Francisco',
});
```

---

## Context Merging

When context is updated via `updateContext`, new values are **deep merged** with existing values:

- **Scalar values**: New value replaces old value.
- **Objects**: Recursively merged (new keys added, existing keys updated).
- **Arrays**: New array replaces old array entirely.
- **`null`**: Explicitly removes the field.
- **Omitted fields**: Left unchanged.

```ts
// Initial context
odl.setContext('user', {
  id: 'user-123',
  isAuthenticated: true,
  traits: { email: 'jane@example.com', firstName: 'Jane' },
});

// Partial update: only traits.loyaltyTier is added
odl.updateContext('user', {
  traits: { loyaltyTier: 'gold' },
});

// Result: { id: 'user-123', isAuthenticated: true,
//   traits: { email: 'jane@example.com', firstName: 'Jane', loyaltyTier: 'gold' } }
```

For the full context specification including merging rules, reset conditions, and conformance levels, see the [Context Objects Specification](https://github.com/DataLayerProtocol/OpenDataLayer/blob/main/spec/v1/context-objects.md).
