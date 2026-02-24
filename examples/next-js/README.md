# Next.js + OpenDataLayer

A Next.js App Router integration showing how to use OpenDataLayer for analytics with server components, client-side tracking, automatic page view detection, and e-commerce patterns.

## Quick Start

### 1. Install packages

```bash
npm install @opendatalayer/sdk @opendatalayer/adapter-gtm @opendatalayer/adapter-webhook
```

### 2. Create the ODL client provider

Since the SDK operates in the browser, wrap it in a client component. Create `src/providers/odl-provider.tsx`:

```tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { OpenDataLayer, debug } from "@opendatalayer/sdk";
import { gtmAdapter } from "@opendatalayer/adapter-gtm";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface ODLContextValue {
  track: (event: string, data?: Record<string, unknown>) => void;
  setContext: (key: string, value: Record<string, unknown>) => void;
  getContext: () => Record<string, unknown>;
}

const ODLContext = createContext<ODLContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ODLProvider({ children }: { children: ReactNode }) {
  const odlRef = useRef<OpenDataLayer | null>(null);
  const pathname = usePathname();

  // Initialize once
  if (!odlRef.current) {
    const odl = new OpenDataLayer();

    // Register adapters
    odl.use(gtmAdapter());

    // Debug plugin in development
    if (process.env.NODE_ENV === "development") {
      odl.use(debug());
    }

    odlRef.current = odl;
  }

  // Auto-track page views on route change
  useEffect(() => {
    odlRef.current?.track("page.view", {
      path: pathname,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
    });
  }, [pathname]);

  const value: ODLContextValue = {
    track: (event, data) => odlRef.current?.track(event, data),
    setContext: (key, val) => odlRef.current?.setContext(key, val),
    getContext: () => odlRef.current?.getContext() ?? {},
  };

  return <ODLContext.Provider value={value}>{children}</ODLContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useODL() {
  const ctx = useContext(ODLContext);
  if (!ctx) throw new Error("useODL must be used within <ODLProvider>");
  return ctx;
}
```

### 3. Add to your root layout

In `src/app/layout.tsx`:

```tsx
import { ODLProvider } from "@/providers/odl-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ODLProvider>{children}</ODLProvider>
      </body>
    </html>
  );
}
```

### 4. Track events from any component

```tsx
"use client";

import { useODL } from "@/providers/odl-provider";

export function AddToCartButton({ product }: { product: Product }) {
  const { track } = useODL();

  return (
    <button
      onClick={() =>
        track("ecommerce.product_added", {
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
          },
        })
      }
    >
      Add to Cart
    </button>
  );
}
```

## Advanced Usage

### Server-Side Event Tracking

For events that originate on the server (API routes, server actions), use the webhook adapter:

```ts
// src/lib/odl-server.ts
import { OpenDataLayer } from "@opendatalayer/sdk";
import { webhookAdapter } from "@opendatalayer/adapter-webhook";

// Server-side ODL instance (singleton)
let serverODL: OpenDataLayer | null = null;

export function getServerODL(): OpenDataLayer {
  if (!serverODL) {
    serverODL = new OpenDataLayer();
    serverODL.use(
      webhookAdapter({
        url: process.env.ANALYTICS_WEBHOOK_URL!,
        batch: true,
        batchSize: 20,
        batchInterval: 5000,
        headers: {
          Authorization: `Bearer ${process.env.ANALYTICS_API_KEY}`,
        },
      })
    );
  }
  return serverODL;
}
```

Use it in a Server Action:

```ts
// src/app/actions/purchase.ts
"use server";

import { getServerODL } from "@/lib/odl-server";

export async function completePurchase(orderId: string, items: CartItem[]) {
  // ... process payment ...

  const odl = getServerODL();
  odl.track("ecommerce.purchase", {
    orderId,
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    currency: "USD",
    products: items.map((item) => ({
      id: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });

  return { success: true };
}
```

### Middleware for Session Context

Enrich every server-side event with request metadata using Next.js middleware:

```ts
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Generate or reuse session ID
  let sessionId = request.cookies.get("odl_session")?.value;
  if (!sessionId) {
    sessionId = uuidv4();
    response.cookies.set("odl_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 60, // 30 minutes
    });
  }

  // Pass to server components via headers
  response.headers.set("x-odl-session", sessionId);
  response.headers.set("x-odl-ip", request.ip ?? "");
  response.headers.set("x-odl-ua", request.headers.get("user-agent") ?? "");

  return response;
}
```

### Consent Management with Server Components

```tsx
// src/components/consent-banner.tsx
"use client";

import { useState } from "react";
import { useODL } from "@/providers/odl-provider";

export function ConsentBanner() {
  const { track, setContext } = useODL();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleConsent = (purposes: Record<string, boolean>) => {
    setContext("consent", {
      status: "granted",
      purposes,
      method: "banner",
    });

    track("consent.given", { purposes, method: "banner" });
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t p-4">
      <p>We use cookies to improve your experience.</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={() =>
            handleConsent({ analytics: true, marketing: true })
          }
        >
          Accept All
        </button>
        <button
          onClick={() =>
            handleConsent({ analytics: true, marketing: false })
          }
        >
          Analytics Only
        </button>
      </div>
    </div>
  );
}
```

### E-commerce Product Page

```tsx
// src/app/products/[id]/page.tsx
import { getProduct } from "@/lib/products";
import { ProductTracker } from "./product-tracker";
import { AddToCartButton } from "@/components/add-to-cart";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  return (
    <div>
      <ProductTracker product={product} />
      <h1>{product.name}</h1>
      <p>${product.price}</p>
      <AddToCartButton product={product} />
    </div>
  );
}

// src/app/products/[id]/product-tracker.tsx
"use client";

import { useEffect } from "react";
import { useODL } from "@/providers/odl-provider";

export function ProductTracker({ product }: { product: Product }) {
  const { track } = useODL();

  useEffect(() => {
    track("ecommerce.product_viewed", {
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        brand: product.brand,
        category: product.category,
      },
    });
  }, [product.id]);

  return null;
}
```

### Multi-Adapter Setup

Send events to GTM on the client and a data warehouse webhook on the server:

```tsx
// src/providers/odl-provider.tsx (extended)
const odl = new OpenDataLayer();

// Client-side: GTM for tag management
odl.use(gtmAdapter({ includeContext: true }));

// Client-side: Segment for customer data platform
odl.use(segmentAdapter({ autoIdentify: true }));

// Client-side: Amplitude for product analytics
odl.use(amplitudeAdapter({ autoSetUserProperties: true }));
```
