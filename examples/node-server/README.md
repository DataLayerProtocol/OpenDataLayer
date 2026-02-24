# Node.js Server + OpenDataLayer

Server-side event tracking with OpenDataLayer for Node.js backends. Covers API event tracking, event validation, Express middleware, and batch webhook delivery.

## Quick Start

### 1. Install packages

```bash
npm install @opendatalayer/sdk @opendatalayer/adapter-webhook @opendatalayer/validator
```

### 2. Initialize the server-side ODL instance

Create `src/analytics.ts`:

```ts
import { OpenDataLayer } from "@opendatalayer/sdk";
import { webhookAdapter } from "@opendatalayer/adapter-webhook";

const odl = new OpenDataLayer();

odl.use(
  webhookAdapter({
    url: process.env.ANALYTICS_ENDPOINT ?? "https://analytics.example.com/collect",
    batch: true,
    batchSize: 25,
    batchInterval: 5000,
    headers: {
      Authorization: `Bearer ${process.env.ANALYTICS_API_KEY}`,
      "Content-Type": "application/json",
    },
    onError: (error, events) => {
      console.error(
        `[analytics] Failed to send ${events.length} events:`,
        error
      );
    },
  })
);

export { odl };
```

### 3. Track events from your API

```ts
import { odl } from "./analytics.js";

// Track user sign-up
async function handleSignUp(userData: UserInput) {
  const user = await db.users.create(userData);

  odl.setContext("user", { id: user.id, email: user.email });

  odl.track("user.signed_up", {
    userId: user.id,
    method: userData.signUpMethod, // "email", "google", "github"
  });

  return user;
}

// Track purchase
async function handlePurchase(order: Order) {
  odl.track("ecommerce.purchase", {
    orderId: order.id,
    total: order.total,
    revenue: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    currency: order.currency,
    products: order.items.map((item) => ({
      id: item.productId,
      name: item.name,
      price: item.unitPrice,
      quantity: item.quantity,
      category: item.category,
    })),
  });
}
```

## Express Middleware

Automatically enrich events with request context:

```ts
// src/middleware/analytics.ts
import type { Request, Response, NextFunction } from "express";
import { odl } from "../analytics.js";

export function analyticsMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Set session context from request
  odl.setContext("session", {
    id: req.sessionID,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  // Set page context from request URL
  odl.setContext("page", {
    url: `${req.protocol}://${req.hostname}${req.originalUrl}`,
    path: req.path,
    referrer: req.headers.referer ?? req.headers.referrer,
  });

  // Set campaign context from UTM params
  if (req.query.utm_source) {
    odl.setContext("campaign", {
      source: req.query.utm_source as string,
      medium: req.query.utm_medium as string,
      name: req.query.utm_campaign as string,
      term: req.query.utm_term as string,
      content: req.query.utm_content as string,
    });
  }

  // Set user context if authenticated
  if (req.user) {
    odl.setContext("user", {
      id: req.user.id,
      isAuthenticated: true,
    });
  }

  next();
}

// Usage in app.ts:
// app.use(analyticsMiddleware);
```

### Track API endpoints automatically

```ts
// src/middleware/track-api.ts
import type { Request, Response, NextFunction } from "express";
import { odl } from "../analytics.js";

export function trackAPI(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Track all API calls as interaction events
    odl.track("interaction.api_call", {
      method: req.method,
      path: req.route?.path ?? req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers["user-agent"],
    });

    // Track errors specifically
    if (res.statusCode >= 400) {
      odl.track("error.api", {
        message: `${req.method} ${req.path} returned ${res.statusCode}`,
        statusCode: res.statusCode,
        method: req.method,
        path: req.path,
      });
    }
  });

  next();
}
```

## Event Validation

Validate events before sending them to ensure data quality:

```ts
// src/validate-events.ts
import { ODLValidator } from "@opendatalayer/validator";
import path from "node:path";

const validator = new ODLValidator();

// Load schemas from your project
validator.loadSchemas(path.resolve("./node_modules/@opendatalayer/sdk/schemas"));

export function validateAndTrack(
  odl: OpenDataLayer,
  event: string,
  data?: Record<string, unknown>
) {
  const envelope = {
    event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    specVersion: "1.0.0",
    data,
  };

  const result = validator.validate(envelope);

  if (!result.valid) {
    console.warn(
      `[analytics] Invalid event "${event}":`,
      result.errors.map((e) => e.message)
    );
    // Optionally still track in production, skip in development
    if (process.env.NODE_ENV === "development") {
      return;
    }
  }

  odl.track(event, data);
}
```

## Webhook Adapter Patterns

### Real-Time Mode (Low-Latency Events)

```ts
import { webhookAdapter } from "@opendatalayer/adapter-webhook";

// Real-time: send each event immediately
odl.use(
  webhookAdapter({
    url: "https://stream.example.com/events",
    batch: false,
    timeout: 3000,
  })
);
```

### Batch Mode (High-Volume Events)

```ts
// Batch: accumulate and flush periodically
odl.use(
  webhookAdapter({
    url: "https://warehouse.example.com/ingest",
    batch: true,
    batchSize: 50,
    batchInterval: 10000, // 10 seconds
    headers: { Authorization: "Bearer secret" },
    transformPayload: (event) => ({
      // Transform to your warehouse schema
      event_name: event.event,
      event_id: event.id,
      event_time: event.timestamp,
      properties: event.data,
      user_id: (event.context?.user as Record<string, unknown>)?.id,
    }),
  })
);
```

### Multi-Destination

```ts
// Send to multiple destinations
odl.use(
  webhookAdapter({
    url: "https://analytics.example.com/collect",
    batch: true,
    batchSize: 25,
  })
);

odl.use(
  webhookAdapter({
    url: "https://warehouse.example.com/events",
    batch: true,
    batchSize: 100,
    batchInterval: 30000,
  })
);
```

## Complete Express Example

```ts
// src/app.ts
import express from "express";
import { odl } from "./analytics.js";
import { analyticsMiddleware } from "./middleware/analytics.js";
import { trackAPI } from "./middleware/track-api.js";

const app = express();
app.use(express.json());
app.use(analyticsMiddleware);
app.use(trackAPI);

// User sign-up
app.post("/api/users", async (req, res) => {
  const user = await createUser(req.body);

  odl.setContext("user", { id: user.id });
  odl.track("user.signed_up", {
    userId: user.id,
    method: req.body.method,
  });

  res.json(user);
});

// Purchase
app.post("/api/orders", async (req, res) => {
  const order = await createOrder(req.body);

  odl.track("ecommerce.purchase", {
    orderId: order.id,
    total: order.total,
    currency: "USD",
    products: order.items.map((i) => ({
      id: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })),
  });

  res.json(order);
});

// Search
app.get("/api/search", async (req, res) => {
  const results = await search(req.query.q as string);

  odl.track("search.performed", {
    query: req.query.q,
    resultCount: results.length,
    filters: req.query.filters,
  });

  res.json(results);
});

// Graceful shutdown: flush remaining events
process.on("SIGTERM", () => {
  odl.destroy();
  process.exit(0);
});

app.listen(3000);
```
