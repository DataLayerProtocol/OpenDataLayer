# React + OpenDataLayer

A complete React integration showing how to use OpenDataLayer for analytics tracking in a React SPA with TypeScript, including hooks, context providers, consent management, and e-commerce tracking.

## Quick Start

### 1. Install packages

```bash
npm install @opendatalayer/sdk @opendatalayer/adapter-gtm @opendatalayer/types
```

### 2. Create the ODL provider

Create `src/providers/ODLProvider.tsx`:

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { OpenDataLayer, debug } from "@opendatalayer/sdk";
import { gtmAdapter } from "@opendatalayer/adapter-gtm";
import type { ConsentContext } from "@opendatalayer/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ODLContextValue {
  odl: OpenDataLayer;
  updateConsent: (consent: ConsentContext) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ODLContext = createContext<ODLContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ODLProviderProps {
  children: ReactNode;
  /** GTM container ID -- only used for documentation; load the GTM snippet separately. */
  gtmId?: string;
  /** Enable console debug logging in development. */
  enableDebug?: boolean;
}

export function ODLProvider({
  children,
  enableDebug = process.env.NODE_ENV === "development",
}: ODLProviderProps) {
  // Use a ref so the instance survives re-renders without re-creation.
  const odlRef = useRef<OpenDataLayer | null>(null);

  if (odlRef.current === null) {
    odlRef.current = new OpenDataLayer({
      source: { name: "my-react-app", version: "1.0.0" },
      context: {
        app: {
          name: "My React App",
          version: "1.0.0",
          environment: process.env.NODE_ENV ?? "development",
          platform: "web",
        },
      },
      plugins: [
        gtmAdapter({
          includeContext: true,
          eventNameMap: {
            // Add any custom event name overrides here
          },
        }),
        ...(enableDebug ? [debug({ verbose: true })] : []),
      ],
    });
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      odlRef.current?.destroy();
    };
  }, []);

  const updateConsent = (consent: ConsentContext) => {
    odlRef.current?.setContext("consent", consent);
    odlRef.current?.track("consent.preferences_updated", {
      purposes: consent.purposes,
      method: consent.method,
    });
  };

  return (
    <ODLContext.Provider value={{ odl: odlRef.current, updateConsent }}>
      {children}
    </ODLContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Access the OpenDataLayer instance from any component.
 *
 * @example
 * ```tsx
 * const { track, setContext } = useODL();
 * track('interaction.element_clicked', { elementId: 'cta-hero' });
 * ```
 */
export function useODL() {
  const ctx = useContext(ODLContext);
  if (!ctx) {
    throw new Error("useODL must be used within an <ODLProvider>.");
  }

  const { odl, updateConsent } = ctx;

  return {
    /** Track any ODL event. */
    track: odl.track.bind(odl),
    /** Set a top-level context key. */
    setContext: odl.setContext.bind(odl),
    /** Deep-merge into an existing context key. */
    updateContext: odl.updateContext.bind(odl),
    /** Read the current context snapshot. */
    getContext: odl.getContext.bind(odl),
    /** Subscribe to events matching a pattern. Returns an unsubscribe fn. */
    on: odl.on.bind(odl),
    /** Update consent state and fire a consent.preferences_updated event. */
    updateConsent,
    /** The raw OpenDataLayer instance (advanced use). */
    odl,
  };
}
```

### 3. Create a page view hook

Create `src/hooks/usePageView.ts`:

```ts
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useODL } from "../providers/ODLProvider";

/**
 * Automatically tracks page views whenever the route changes.
 *
 * Attach this once in your root layout or App component.
 * It fires `page.view` on the initial load and `page.virtual_view`
 * on subsequent SPA navigations.
 */
export function usePageView() {
  const { track, setContext } = useODL();
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const pageContext = {
      url: window.location.href,
      path: location.pathname,
      title: document.title,
      referrer: document.referrer,
      search: location.search,
      hash: location.hash,
    };

    setContext("page", pageContext);

    if (isFirstRender.current) {
      track("page.view", pageContext);
      isFirstRender.current = false;
    } else {
      track("page.virtual_view", {
        ...pageContext,
        previousUrl: document.referrer,
        previousPath: sessionStorage.getItem("odl_prev_path") ?? "",
      });
    }

    sessionStorage.setItem("odl_prev_path", location.pathname);
  }, [location.pathname, location.search, location.hash, track, setContext]);
}
```

### 4. Wire it up in your App

Create `src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ODLProvider } from "./providers/ODLProvider";
import { usePageView } from "./hooks/usePageView";
import { HomePage } from "./pages/HomePage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";

function AppRoutes() {
  usePageView();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ODLProvider enableDebug={process.env.NODE_ENV === "development"}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ODLProvider>
  );
}
```

---

## E-Commerce Components

### ProductCard

`src/components/ProductCard.tsx`:

```tsx
import { useODL } from "../providers/ODLProvider";
import type { Product } from "@opendatalayer/types";

interface ProductCardProps {
  product: Product;
  listName?: string;
  position?: number;
}

export function ProductCard({ product, listName, position }: ProductCardProps) {
  const { track } = useODL();

  const handleClick = () => {
    track("ecommerce.product_clicked", {
      product: { ...product, position },
      listName,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    track("ecommerce.product_added", {
      product,
      cartId: "main-cart",
    });
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    track("ecommerce.wishlist_product_added", {
      product,
      wishlistName: "default",
    });
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <img src={product.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      <p className="brand">{product.brand}</p>
      <p className="price">
        {product.currency ?? "USD"} {product.price.toFixed(2)}
      </p>
      <div className="actions">
        <button onClick={handleAddToCart}>Add to Cart</button>
        <button onClick={handleAddToWishlist}>Wishlist</button>
      </div>
    </div>
  );
}
```

### ProductListView (with impression tracking)

`src/components/ProductListView.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { useODL } from "../providers/ODLProvider";
import { ProductCard } from "./ProductCard";
import type { Product } from "@opendatalayer/types";

interface ProductListViewProps {
  listId: string;
  listName: string;
  products: Product[];
}

export function ProductListView({
  listId,
  listName,
  products,
}: ProductListViewProps) {
  const { track } = useODL();
  const hasTrackedImpression = useRef(false);

  // Fire a list impression event once when the list is first rendered
  useEffect(() => {
    if (products.length > 0 && !hasTrackedImpression.current) {
      track("ecommerce.product_list_viewed", {
        listId,
        listName,
        products: products.map((p, i) => ({ ...p, position: i + 1 })),
      });
      hasTrackedImpression.current = true;
    }
  }, [products, listId, listName, track]);

  return (
    <div className="product-list">
      <h2>{listName}</h2>
      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            listName={listName}
            position={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
```

### Cart

`src/components/Cart.tsx`:

```tsx
import { useEffect } from "react";
import { useODL } from "../providers/ODLProvider";
import type { Product } from "@opendatalayer/types";

interface CartItem extends Product {
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export function Cart({ items, onRemove, onUpdateQuantity }: CartProps) {
  const { track } = useODL();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Track cart view on mount
  useEffect(() => {
    if (items.length > 0) {
      track("ecommerce.cart_viewed", {
        cartId: "main-cart",
        products: items,
        total,
        currency: "USD",
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemove = (item: CartItem) => {
    track("ecommerce.product_removed", {
      product: item,
      cartId: "main-cart",
    });
    onRemove(item.id);
  };

  const handleQuantityChange = (item: CartItem, newQty: number) => {
    if (newQty > item.quantity) {
      track("ecommerce.product_added", {
        product: { ...item, quantity: newQty - item.quantity },
        cartId: "main-cart",
      });
    } else if (newQty < item.quantity && newQty > 0) {
      track("ecommerce.product_removed", {
        product: { ...item, quantity: item.quantity - newQty },
        cartId: "main-cart",
      });
    }
    onUpdateQuantity(item.id, newQty);
  };

  return (
    <div className="cart">
      <h2>Shopping Cart ({items.length} items)</h2>

      {items.map((item) => (
        <div key={item.id} className="cart-item">
          <span>{item.name}</span>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) =>
              handleQuantityChange(item, parseInt(e.target.value, 10))
            }
          />
          <span>${(item.price * item.quantity).toFixed(2)}</span>
          <button onClick={() => handleRemove(item)}>Remove</button>
        </div>
      ))}

      <div className="cart-total">
        <strong>Total: ${total.toFixed(2)}</strong>
      </div>
    </div>
  );
}
```

### Checkout

`src/components/Checkout.tsx`:

```tsx
import { useState } from "react";
import { useODL } from "../providers/ODLProvider";
import type { Product } from "@opendatalayer/types";

interface CheckoutProps {
  items: Product[];
  total: number;
  currency: string;
}

export function Checkout({ items, total, currency }: CheckoutProps) {
  const { track } = useODL();
  const [step, setStep] = useState(1);
  const [coupon, setCoupon] = useState("");

  // Fire checkout started on mount
  useState(() => {
    track("ecommerce.checkout_started", {
      total,
      currency,
      products: items,
    });
  });

  const handleStepComplete = (
    stepNumber: number,
    stepName: string,
    extra?: Record<string, unknown>,
  ) => {
    track("ecommerce.checkout_step_completed", {
      step: stepNumber,
      stepName,
      ...extra,
    });
    setStep(stepNumber + 1);
  };

  const handleApplyCoupon = () => {
    if (coupon.trim()) {
      track("ecommerce.coupon_applied", {
        coupon,
        discount: 10.0,
      });
    }
  };

  const handlePaymentInfoEntered = (paymentMethod: string) => {
    track("ecommerce.payment_info_entered", {
      paymentMethod,
      total,
      currency,
    });
  };

  const handlePurchase = (orderId: string) => {
    track("ecommerce.purchase", {
      orderId,
      total,
      revenue: total * 0.9, // after discount
      tax: total * 0.08,
      shipping: 5.99,
      currency,
      coupon: coupon || undefined,
      paymentMethod: "credit_card",
      products: items,
    });
  };

  return (
    <div className="checkout">
      <h2>Checkout</h2>

      {step === 1 && (
        <section>
          <h3>Step 1: Shipping Address</h3>
          {/* Shipping form fields */}
          <div className="coupon-section">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Coupon code"
            />
            <button onClick={handleApplyCoupon}>Apply</button>
          </div>
          <button
            onClick={() =>
              handleStepComplete(1, "shipping", {
                shippingMethod: "standard",
              })
            }
          >
            Continue to Payment
          </button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h3>Step 2: Payment</h3>
          {/* Payment form fields */}
          <button
            onClick={() => {
              handlePaymentInfoEntered("credit_card");
              handleStepComplete(2, "payment", {
                paymentMethod: "credit_card",
              });
            }}
          >
            Continue to Review
          </button>
        </section>
      )}

      {step === 3 && (
        <section>
          <h3>Step 3: Review & Place Order</h3>
          <p>Total: {currency} {total.toFixed(2)}</p>
          <button
            onClick={() => {
              const orderId = `ORD-${Date.now()}`;
              handlePurchase(orderId);
            }}
          >
            Place Order
          </button>
        </section>
      )}
    </div>
  );
}
```

---

## Consent Management

### CookieConsent component

`src/components/CookieConsent.tsx`:

```tsx
import { useState, useEffect } from "react";
import { useODL } from "../providers/ODLProvider";

interface ConsentPurposes {
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  functional: boolean;
}

const DEFAULT_PURPOSES: ConsentPurposes = {
  analytics: false,
  marketing: false,
  personalization: false,
  functional: true, // functional is always on
};

export function CookieConsent() {
  const { track, updateConsent } = useODL();
  const [visible, setVisible] = useState(false);
  const [purposes, setPurposes] = useState<ConsentPurposes>(DEFAULT_PURPOSES);

  useEffect(() => {
    // Show the banner if the user hasn't consented yet
    const stored = localStorage.getItem("odl_consent");
    if (!stored) {
      setVisible(true);
    } else {
      // Restore saved consent and apply it immediately
      const savedPurposes = JSON.parse(stored) as ConsentPurposes;
      setPurposes(savedPurposes);
      updateConsent({
        status: "granted",
        purposes: savedPurposes,
        method: "banner",
      });
    }
  }, [updateConsent]);

  const handleAcceptAll = () => {
    const allGranted: ConsentPurposes = {
      analytics: true,
      marketing: true,
      personalization: true,
      functional: true,
    };

    setPurposes(allGranted);
    localStorage.setItem("odl_consent", JSON.stringify(allGranted));

    updateConsent({
      status: "granted",
      purposes: allGranted,
      method: "banner",
    });

    track("consent.given", {
      purposes: allGranted,
      method: "banner",
    });

    setVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("odl_consent", JSON.stringify(purposes));

    const hasAnyAnalyticsOrMarketing = purposes.analytics || purposes.marketing;

    updateConsent({
      status: hasAnyAnalyticsOrMarketing ? "granted" : "denied",
      purposes,
      method: "preference_center",
    });

    track("consent.preferences_updated", {
      purposes,
      method: "preference_center",
    });

    setVisible(false);
  };

  const handleRejectAll = () => {
    const allDenied: ConsentPurposes = {
      analytics: false,
      marketing: false,
      personalization: false,
      functional: true,
    };

    setPurposes(allDenied);
    localStorage.setItem("odl_consent", JSON.stringify(allDenied));

    updateConsent({
      status: "denied",
      purposes: allDenied,
      method: "banner",
    });

    track("consent.revoked", {
      purposes: allDenied,
      method: "banner",
    });

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-consent-banner" role="dialog" aria-label="Cookie consent">
      <h3>We value your privacy</h3>
      <p>
        We use cookies and similar technologies to provide you with the best
        experience. You can choose which categories to allow below.
      </p>

      <div className="consent-toggles">
        <label>
          <input type="checkbox" checked disabled />
          Functional (always on)
        </label>
        <label>
          <input
            type="checkbox"
            checked={purposes.analytics}
            onChange={(e) =>
              setPurposes((p) => ({ ...p, analytics: e.target.checked }))
            }
          />
          Analytics
        </label>
        <label>
          <input
            type="checkbox"
            checked={purposes.marketing}
            onChange={(e) =>
              setPurposes((p) => ({ ...p, marketing: e.target.checked }))
            }
          />
          Marketing
        </label>
        <label>
          <input
            type="checkbox"
            checked={purposes.personalization}
            onChange={(e) =>
              setPurposes((p) => ({ ...p, personalization: e.target.checked }))
            }
          />
          Personalization
        </label>
      </div>

      <div className="consent-actions">
        <button onClick={handleRejectAll}>Reject All</button>
        <button onClick={handleSavePreferences}>Save Preferences</button>
        <button onClick={handleAcceptAll}>Accept All</button>
      </div>
    </div>
  );
}
```

---

## Advanced Usage

### User identification

Track user sign-in and set persistent user context:

```tsx
// src/hooks/useAuth.ts
import { useCallback } from "react";
import { useODL } from "../providers/ODLProvider";

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
}

export function useAuth() {
  const { track, setContext } = useODL();

  const onSignIn = useCallback(
    (user: User) => {
      setContext("user", {
        id: user.id,
        email: user.email,
        isAuthenticated: true,
        traits: {
          name: user.name,
          plan: user.plan,
        },
      });

      track("user.signed_in", {
        method: "email",
      });
    },
    [track, setContext],
  );

  const onSignUp = useCallback(
    (user: User) => {
      setContext("user", {
        id: user.id,
        email: user.email,
        isAuthenticated: true,
        isNewUser: true,
        traits: {
          name: user.name,
          plan: user.plan,
        },
      });

      track("user.signed_up", {
        method: "email",
      });
    },
    [track, setContext],
  );

  const onSignOut = useCallback(() => {
    track("user.signed_out", {});
    setContext("user", { isAuthenticated: false });
  }, [track, setContext]);

  return { onSignIn, onSignUp, onSignOut };
}
```

### Consent-gated middleware

Block tracking events from reaching adapters until consent is granted:

```tsx
// src/middleware/consentGate.ts
import type { ODLPlugin } from "@opendatalayer/sdk";
import type { ODLEvent } from "@opendatalayer/sdk";

/**
 * Plugin that blocks non-essential events until consent is granted.
 *
 * Events in the `consent.*` and `page.*` categories are always allowed.
 * All other events are dropped if `context.consent.status` is not "granted".
 */
export function consentGate(): ODLPlugin {
  const ALWAYS_ALLOWED = ["consent.", "page."];

  return {
    name: "consent-gate",

    beforeEvent(event: ODLEvent): ODLEvent | null {
      // Always allow consent and page events
      if (ALWAYS_ALLOWED.some((prefix) => event.event.startsWith(prefix))) {
        return event;
      }

      // Check consent status from the event's context snapshot
      const consent = event.context?.consent as
        | { status?: string }
        | undefined;
      if (consent?.status === "granted") {
        return event;
      }

      // Block the event
      return null;
    },
  };
}
```

Register the plugin when creating the ODL instance:

```tsx
import { consentGate } from "./middleware/consentGate";

const odl = new OpenDataLayer({
  plugins: [
    consentGate(), // must be registered before adapters
    gtmAdapter(),
  ],
});
```

### Search tracking

```tsx
import { useODL } from "../providers/ODLProvider";

export function SearchBar() {
  const { track } = useODL();

  const handleSearch = (query: string, resultCount: number) => {
    track("search.performed", {
      query,
      resultCount,
    });
  };

  const handleResultClick = (query: string, resultUrl: string, position: number) => {
    track("search.result_clicked", {
      query,
      resultUrl,
      position,
    });
  };

  // ... render search UI
}
```

### Error boundary tracking

```tsx
import { Component, type ReactNode, type ErrorInfo } from "react";
import type { OpenDataLayer } from "@opendatalayer/sdk";

interface Props {
  children: ReactNode;
  odl: OpenDataLayer;
}

interface State {
  hasError: boolean;
}

export class TrackingErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.odl.track("error.boundary_triggered", {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### Custom event subscriptions

Listen for specific events to trigger side-effects (e.g., conversion pixels):

```tsx
import { useEffect } from "react";
import { useODL } from "../providers/ODLProvider";

export function ConversionPixelLoader() {
  const { on } = useODL();

  useEffect(() => {
    // Fire a conversion pixel whenever a purchase happens
    const unsubscribe = on("ecommerce.purchase", (event) => {
      const data = event.data as { orderId: string; total: number } | undefined;
      if (data) {
        // Example: fire a Meta/Facebook conversion pixel
        if (typeof window.fbq === "function") {
          window.fbq("track", "Purchase", {
            value: data.total,
            currency: "USD",
            content_ids: [data.orderId],
          });
        }
      }
    });

    return unsubscribe;
  }, [on]);

  return null;
}
```

---

## Project Structure

```
src/
  providers/
    ODLProvider.tsx        # Context provider + useODL hook
  hooks/
    usePageView.ts        # Automatic page view tracking
    useAuth.ts            # User identification helpers
  components/
    ProductCard.tsx        # Product click + add-to-cart tracking
    ProductListView.tsx    # Product list impression tracking
    Cart.tsx              # Cart view + item management tracking
    Checkout.tsx          # Full checkout funnel tracking
    CookieConsent.tsx     # Consent management UI
    SearchBar.tsx         # Search tracking
  middleware/
    consentGate.ts        # Consent-gated event filtering
  App.tsx                 # Router + provider wiring
```

## Events Reference

| User Action | ODL Event | GTM Event |
|---|---|---|
| Page loads | `page.view` | `page_view` |
| SPA navigation | `page.virtual_view` | `virtual_page_view` |
| View product list | `ecommerce.product_list_viewed` | `view_item_list` |
| Click product | `ecommerce.product_clicked` | `select_item` |
| Add to cart | `ecommerce.product_added` | `add_to_cart` |
| Remove from cart | `ecommerce.product_removed` | `remove_from_cart` |
| View cart | `ecommerce.cart_viewed` | `view_cart` |
| Begin checkout | `ecommerce.checkout_started` | `begin_checkout` |
| Checkout step complete | `ecommerce.checkout_step_completed` | `checkout_progress` |
| Enter payment info | `ecommerce.payment_info_entered` | `add_payment_info` |
| Purchase | `ecommerce.purchase` | `purchase` |
| Apply coupon | `ecommerce.coupon_applied` | `coupon_applied` |
| Accept consent | `consent.given` | `consent_given` |
| User sign in | `user.signed_in` | `login` |
| Search | `search.performed` | `search` |
