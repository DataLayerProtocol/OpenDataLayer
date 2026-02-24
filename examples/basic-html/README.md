# Basic HTML Example

A standalone HTML page demonstrating the OpenDataLayer event tracking pattern without any build tools or dependencies.

## Running

Open `index.html` directly in your browser:

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

Or serve it with any static file server:

```bash
npx serve .
```

## What It Demonstrates

- **Event tracking** -- click the buttons to fire different event types (page views, ecommerce, search, custom events).
- **Context management** -- set user and consent context that gets attached to subsequent events.
- **Event log** -- all tracked events appear in the on-page log with their full data payload.
- **Console output** -- open DevTools to see debug-level `[ODL]` log entries for every event.

## How It Works

The page includes a minimal inline `SimpleODL` class that mirrors the core SDK API:

- `odl.track(eventName, data)` -- emit a structured event
- `odl.setContext(key, value)` -- attach persistent context (user, consent, page, app)
- `odl.on(pattern, handler)` -- subscribe to events by name or wildcard

In a real application you would import the full `@opendatalayer/sdk` package instead of the inline implementation.

## Events Fired

| Button | Event Name | Category |
|--------|-----------|----------|
| Page View | `page.view` | Navigation |
| View Product | `ecommerce.product_viewed` | Ecommerce |
| Add to Cart | `ecommerce.product_added` | Ecommerce |
| Purchase | `ecommerce.purchase` | Ecommerce |
| Search | `search.performed` | Search |
| Custom Event | `custom.button_click` | Custom |
| Set User Context | `user.identified` | User |
| Grant Consent | `consent.given` | Consent |
