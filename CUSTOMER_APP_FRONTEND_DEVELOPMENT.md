# Customer App — Frontend Development Guide

> **Project:** Organic Multi-Vendor Marketplace — Customer App
> **Document status:** Provisional v0.1
> **Audience:** The frontend developer building the Customer App independently.

---

## 0. READ THIS FIRST — Document Status and Handoff

This guide is written **without** two inputs. Both must be provided to the developer alongside this file.

| Missing input | Effect on this document | What the developer must do |
|---|---|---|
| **Customer scope document (.md)** | The only project hint available was the file name ("Organic MultiVendor Marketplace"). All business details (categories, product attributes, payments, vendor rules, tracking stages) are **assumptions** marked in the register (Section Q). | Compare this guide against the scope. If they conflict, **the scope wins**. Update the register and this file. |
| **Reference UI theme image** | The theme is **not yet confirmed**. All visual tokens (colors, fonts, radii, shadows) are **PENDING REFERENCE REVIEW**. No final design direction is invented here. | Follow Section G. Review the image first, fill in `config/design-tokens.ts`, then build components. |

**Handoff package for the developer:**
1. This file (`CUSTOMER_APP_FRONTEND_DEVELOPMENT.md`)
2. The customer scope `.md`
3. The reference UI theme image (suggested location in repo: `docs/reference/ui-theme.png`)

**Rules that apply throughout:**
- Backend does not exist. Everything runs on **mock data**.
- Orders, payments, authentication, and delivery tracking are **simulated**. The UI must never claim otherwise.
- Do not add business requirements that are not in the scope. Record uncertainties in Section Q.

---

## A. Project Overview

### Purpose
The Customer App lets shoppers discover organic products from multiple vendors, add them to a cart, place an order, and follow its status.

### Recommended stack
| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Local state | `useState` |
| Shared state | React Context (cart, mock session) only |

No Redux, Zustand, React Query, or form libraries unless a concrete need appears and is documented here.

### Frontend responsibilities and boundaries
- **Owns:** rendering, client-side search/filter/sort, cart, checkout form validation, simulated order creation, simulated tracking, mock sign-in.
- **Does not own:** real payments, real authentication, real inventory, real delivery data, vendor/admin tooling.

### Current phase vs. future backend work
| Current phase (mock) | Needs backend later |
|---|---|
| Product browsing, search, filters, sorting | Product/vendor/category APIs |
| Cart (in-memory, optional browser persistence) | Server-side cart (if required) |
| Checkout form and mock order creation | Order creation API, payment processing |
| Simulated order timeline | Real tracking/delivery status |
| Mock Google sign-in | Real auth provider and sessions |

---

## B. Pages and Navigation

Pages are labeled **Confirmed** (in scope), **Assumed**, or **Proposed**. Because the scope was not available, nothing below is marked Confirmed. Re-label each page once checked against the scope.

| # | Page | Route | Status |
|---|---|---|---|
| 1 | Home / Product Listing | `/` | Assumed (brief names it the main landing page) |
| 2 | Search and Filtering | (part of `/`) | Assumed |
| 3 | Product Details | `/products/[productId]` | Assumed |
| 4 | Cart | `/cart` | Assumed |
| 5 | Checkout | `/checkout` | Assumed |
| 6 | Order Confirmation | `/order-confirmation?orderId=...` | Assumed |
| 7 | Order History | `/orders` | Pending scope |
| 8 | Order Details + Tracking | `/orders/[orderId]` | Assumed |
| 9 | Login | `/login` | Proposed (mock Google Login) |
| 10 | Profile / Account | `/account` | Pending scope |
| 11 | Not Found | `app/not-found.tsx` | Recommended |

Header (global): logo, search shortcut, cart icon with count, account menu (or Sign in).

### 1. Home / Product Listing — `/`
- **Purpose:** Main landing page and product discovery.
- **Data:** products, categories, vendors (name shown on card), attribute filter options.
- **Components:** `SiteHeader`, `SearchInput`, `CategoryTabs`, `FilterPanel` (drawer on mobile), `SortSelect`, `ResultCount`, `ProductGrid`, `ProductCard`, `EmptyState`, `ResetFiltersButton`.
- **Actions:** type to search (instant), pick category, set filters, sort, clear all, open product, add to cart from card.
- **Navigation:** card → `/products/[id]`; header cart → `/cart`.
- **States:** loading skeleton (for future API), empty results ("No products match" + reset), error (generic retry).

### 2. Product Details — `/products/[productId]`
- **Data:** gallery, name, vendor, price (+ discount), unit, description, stock status, attributes, rating (if in scope).
- **Components:** `ProductGallery`, `PriceDisplay`, `StockBadge`, `QuantitySelector`, `AddToCartButton`, `VendorTag`.
- **Actions:** choose quantity, add to cart (toast/mini-confirmation), go to cart.
- **States:** invalid ID → not-found view with link back to `/`; out of stock → disabled button with label.
- **Related products:** only add if the scope calls for it. Not included by default.

### 3. Cart — `/cart`
- **Data:** cart lines, subtotal, charges, total.
- **Components:** `CartItemRow`, `QuantitySelector`, `OrderSummary`, `EmptyState`.
- **Actions:** change quantity, remove, continue shopping, proceed to checkout.
- **States:** empty cart (CTA to `/`); item became unavailable (flag the row, block checkout until resolved).
- **Multi-vendor note:** group lines by vendor visually **only if** the scope requires per-vendor handling (see register).

### 4. Checkout — `/checkout`
- **Data:** contact details, delivery address, order summary.
- **Components:** `CheckoutForm`, `FormField`, `OrderSummary`, `PaymentMethodSelector` (only if scope lists payment methods), `SubmitOrderButton`.
- **Actions:** fill form, validate, place mock order.
- **Navigation:** success → `/order-confirmation?orderId=...`; empty cart → redirect to `/cart`.
- **States:** field errors inline, submitting state, mock failure banner with retry.
- **Payment:** UI only. Label as "Simulated — no payment is taken."

### 5. Order Confirmation — `/order-confirmation`
- **Data:** mock order ID, items, totals, delivery address, initial status.
- **Components:** `ConfirmationMessage`, `OrderSummary`, `OrderStatusBadge`.
- **Actions:** view order details, continue shopping.
- **States:** missing/invalid `orderId` → friendly message with link home.

### 6. Order History — `/orders` *(pending scope)*
- List of past (mock) orders: ID, date, total, status. Empty state for none. Requires signed-in mock customer **only if** the scope requires login.

### 7. Order Details and Tracking — `/orders/[orderId]`
- **Data:** full order, status, timeline steps with timestamps.
- **Components:** `OrderStatusTimeline`, `OrderSummary`, `OrderItemRow`.
- **States:** invalid order ID → not found. Show a visible note: "Tracking is simulated."

### 8. Login — `/login` *(proposed)*
- See Section D.

### 9. Account — `/account` *(pending scope)*
- Show mock profile (name, email, saved address). Sign-out button. Build only if the scope requires a profile.

---

## C. Data Display and Mock Data

### Rules
- Mock data lives in `src/data/`, never inside page or component files.
- IDs must be consistent across products, vendors, cart lines, and orders.
- Components receive typed data through props or service functions.
- Prices are stored as **integers in the smallest currency unit** (or a single documented convention) and formatted by `lib/formatters.ts`. **Currency is pending confirmation.** Keep it configurable.

### Type definitions (`src/types/`)

**Naming convention:** all interface fields use `snake_case` (e.g., `discounted_price`, `category_id`), so the types can map directly to a typical API response later. Type names stay `PascalCase`. React component props and variables stay `camelCase`.

```ts
// product.ts
export interface Vendor {
  id: string;
  name: string;
  location?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface Product {
  id: string;
  name: string;
  slug: string;
  images: { src: string; alt: string }[];
  price: number;
  discounted_price?: number;
  unit: string;               // e.g. "kg", "500 g", "dozen" (assumed)
  category_id: string;
  vendor_id: string;
  description: string;
  stock_status: StockStatus;
  rating?: number;            // only if scope includes reviews
  review_count?: number;
  attributes: Record<string, string | boolean>; // e.g. certified, origin (assumed)
}
```

```ts
// cart.ts
export interface CartItem {
  product_id: string;
  quantity: number;
}
// Price and name are looked up from products at render time.
// A snapshot of price is copied into the order at placement.
```

```ts
// customer.ts
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  saved_address?: Address;
}
```

```ts
// order.ts
export type OrderStatus =
  | "placed" | "confirmed" | "packed" | "out_for_delivery" | "delivered" | "cancelled";
// Status list is ASSUMED. Replace with the scope's workflow.

export interface OrderLine {
  product_id: string;
  name: string;
  unit_price: number;
  quantity: number;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  at: string; // ISO date
}

export interface Order {
  id: string;                  // e.g. "ORD-10001"
  customer_id?: string;
  lines: OrderLine[];
  subtotal: number;
  delivery_charge: number;      // rule pending
  total: number;
  contact: { name: string; email: string; phone: string };
  address: Address;
  status: OrderStatus;
  timeline: OrderTimelineEntry[];
  placed_at: string;
}
```

### Datasets
| File | Contents | Notes |
|---|---|---|
| `data/categories.ts` | 6–8 categories | Assumed examples: fruits, vegetables, grains and pulses, dairy, spices, pantry. Replace per scope. |
| `data/vendors.ts` | 4–6 vendors | Needed for multi-vendor display |
| `data/products.ts` | 24–40 products | Mix of stock statuses, some discounted, several categories per vendor |
| `data/customer.ts` | 1 mock customer | Used by mock sign-in |
| `data/orders.ts` | 3–5 past orders | Each in a different status to exercise the timeline |

Product images: use local placeholder files under `public/images/products/` with descriptive filenames, or a single neutral placeholder. Every image needs real `alt` text.

---

## D. Authentication and Google Login

**Scope status:** login method **not confirmed**. Google Login is a **proposal**.

**Initial phase behavior:**
- Browsing, searching, cart, and checkout work **without** signing in (assumption; confirm with the customer).
- `/login` shows a "Continue with Google" button that is **mock only**. Clicking it signs in the mock customer from `data/customer.ts`.
- Show a small, visible "Demo sign-in" label so nobody mistakes it for real auth.
- Signed-in UI: header shows name/initial, access to `/orders` and `/account`, and a Sign out action.
- Actions that might require sign-in (pending scope): viewing order history, saving addresses.

**Structure for later replacement:**
- `lib/mock-auth.ts` exposes `signIn()`, `signOut()`, `getSession()`.
- `context/AuthContext.tsx` wraps those and exposes `{ customer, signIn, signOut }`.
- UI only talks to the context. Swapping in a real provider means replacing `mock-auth.ts` and the context internals.

**Do not:** add OAuth credentials, install an auth library, or write copy implying Google verified anyone.

---

## E. Product Listing UX — Highest Priority

### Layout
- Header, then a search bar, category tabs, a toolbar (result count, sort, filter button), then the product grid.
- Desktop: filter sidebar on the left (or a top bar) per the reference image. Mobile: filters open in a bottom sheet/drawer.

### Grid columns (Tailwind)
| Breakpoint | Columns |
|---|---|
| Mobile (default) | 2 |
| `sm` (≥640px) | 2–3 |
| `lg` (≥1024px) | 3–4 |
| `xl` (≥1280px) | 4 |

Adjust to the reference image.

### Product card contents
Image, name, vendor, price (with strikethrough original if discounted), unit, stock indicator, add-to-cart button. Entire card links to details. Keep it uncluttered.

### Filtering, search, sorting
All three combine and run on the client against `products`.

| Control | Behavior |
|---|---|
| Search | Case-insensitive match on name, vendor name, category name. Updates as the user types. |
| Category | Single-select, "All" default. |
| Attribute filters | Only filters built from fields present in the data (e.g. vendor, availability, certified). |
| Price range | Min/max inputs or slider, bounded by the dataset's actual min/max. |
| Sort | Relevance (default), price low→high, price high→low, name A–Z. Add "popularity" or "rating" only if the data supports it. |
| Reset | One button restores all defaults and clears search. |

**Implementation rule:** keep filter inputs in `useState`. Compute the visible list with one pure function during render:

```ts
const visible = applyProductFilters(products, { query, category_id, vendor_ids, price_range, in_stock_only, sort });
```

Do not store the filtered list in state. Do not use `useEffect` to sync it. Wrap in `useMemo` only if profiling shows a need.

### States
- Result count always visible ("12 products").
- Zero results: `EmptyState` with the active filters summarized and a "Clear filters" button.
- Loading skeleton component exists for the future API version (not shown with synchronous mock data unless simulating latency).

---

## F. Product Details, Cart, Checkout, and Tracking

### Customer journey
1. Land on `/`, search or filter.
2. Open a product, choose quantity, add to cart (confirmation feedback).
3. Open `/cart`, adjust quantities, remove items.
4. Proceed to `/checkout`, complete details, place the mock order.
5. Land on `/order-confirmation` with a mock order ID.
6. Follow progress on `/orders/[orderId]`.

### Cart rules
- Adding an existing product increases its quantity (no duplicate lines).
- Quantity minimum 1. Reducing below 1 asks to remove or removes explicitly via a Remove button.
- Quantity maximum: a documented constant (e.g., 20) until stock rules are known.
- Out-of-stock products cannot be added.
- Totals: `subtotal = sum(effective_price × quantity)`, `total = subtotal + delivery_charge`. Delivery charge rule is **pending**; implement it in one function in `lib/pricing.ts` (e.g., flat fee or free over a threshold, marked as placeholder).

### Checkout fields (assumed)
Full name, phone, email, address line 1, address line 2 (optional), city, state, postal code. Payment method selector appears only if the scope lists methods.

Validation: required fields, email format, phone format (pattern confirmed with scope/region), postal code format. Show errors on blur and on submit. Move focus to the first invalid field on failed submit.

### Mock order placement
- `createMockOrder(input)` builds an `Order` with ID `ORD-` + incrementing number, snapshots line prices, sets status `placed`, adds the first timeline entry, and stores the order in an in-memory/session store.
- Simulate a short delay (~800 ms) and an optional forced-failure switch (dev flag) to exercise the error UI.
- On success: clear the cart, navigate to confirmation.

### Simulated tracking
- Orders in `data/orders.ts` have fixed statuses for demo.
- A newly placed order can advance through statuses via a helper that derives status from elapsed time since `placed_at` (derived at render time, no timers required), or manually via a clearly labeled dev control.
- The tracking page shows "Tracking is simulated."

---

## G. UI Reference Image and Design System

### Status: PENDING REFERENCE REVIEW
The reference UI theme image has **not been reviewed** for this document. The theme is not confirmed and may be delayed. **Do not start styling components until the image has been reviewed and the token file is filled in.** Layout and functionality can proceed with neutral, unstyled primitives in the meantime.

### Handoff
The image will be shared with the developer together with this file. Store it at `docs/reference/ui-theme.png`.

### Extraction checklist (complete before styling)
| Item to extract | Where it goes |
|---|---|
| Primary, secondary, accent colors | `design-tokens.ts` → `colors` |
| Background and surface colors | `colors.background`, `colors.surface` |
| Text colors (primary, muted, inverse) | `colors.text*` |
| Success / warning / error colors | `colors.state*` |
| Font family and fallbacks | `fonts` + `app/layout.tsx` |
| Heading/body sizes, weights, line heights | `typography` scale |
| Button styles (primary, secondary, ghost) and states | `components/ui/button` |
| Input and search bar style | `components/ui/input` |
| Card border, radius, shadow | `components/ui/card`, `ProductCard` |
| Border radii scale | `radii` |
| Shadow scale | `shadows` |
| Spacing rhythm and max content width | `spacing`, layout container |
| Header and navigation design | `components/layout` |
| Product card composition | `components/products/ProductCard` |
| Modal/dialog/drawer appearance | `components/ui/modal` |
| Responsive behavior shown | Section N |

### Design token structure (values pending)

```ts
// src/config/design-tokens.ts
export const designTokens = {
  colors: {
    primary: "TBD",
    primaryHover: "TBD",
    secondary: "TBD",
    accent: "TBD",
    background: "TBD",
    surface: "TBD",
    border: "TBD",
    textPrimary: "TBD",
    textMuted: "TBD",
    success: "TBD",
    warning: "TBD",
    error: "TBD",
  },
  fonts: { body: "TBD", heading: "TBD" },
  radii: { sm: "TBD", md: "TBD", lg: "TBD" },
  shadows: { card: "TBD", overlay: "TBD" },
} as const;
```

Wire tokens into Tailwind through `tailwind.config` (theme extension) or CSS variables in `globals.css`, so components use semantic classes (`bg-primary`, `text-muted`) and never raw hex values.

### Design rules
- Small, consistent palette derived from the image.
- Clean, readable fonts. No decorative or trendy display fonts.
- Reusable text styles through a `Text`/`Heading` component or shared classes.
- Visible keyboard focus ring on all interactive elements.
- Contrast: at least WCAG AA (4.5:1 body text, 3:1 large text/UI).
- If an element in the image hurts usability (low contrast, tiny tap targets), keep the visual language but fix the usability issue and note the deviation in Section Q.

---

## H. Motion and Interaction Design

Add motion **after** layouts and functionality work.

| Where | Animation | Purpose |
|---|---|---|
| Landing content | Short fade + small upward slide on first load | Gentle entrance |
| `ProductCard` | Slight lift/shadow on hover (desktop only) | Hover feedback |
| `ProductGrid` | `AnimatePresence` + `layout` fade for items entering/leaving | Show filter results changing without jumps |
| `Button` | Subtle scale on press (`whileTap`) | Tactile feedback |
| `FilterDrawer` / `CartDrawer` / `Modal` | Slide/fade in and out | Context transitions |
| `OrderStatusTimeline` | Steps reveal in sequence, current step highlighted | Clarify progress |
| Toast / add-to-cart confirmation | Fade + slide | Confirm action |

**Rules:**
- One shared duration/easing set in `config/motion.ts` (e.g., 0.2–0.35 s, one ease curve).
- Respect reduced motion: use `useReducedMotion()` or `MotionConfig reducedMotion="user"` at the layout level.
- Animate `opacity` and `transform` only. Avoid animating layout properties that cause shift.
- Do not animate every element. If it has no purpose, skip it.

---

## I. Technology Stack Details

- `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `framer-motion`. Nothing else is required to start.
- Optional only if justified: an accessible headless dialog primitive (e.g., Radix Dialog) if building a focus-trapped modal by hand proves too costly. Document the decision here if added.
- ESLint (Next default) and Prettier are fine. Enable `strict`, `noUncheckedIndexedAccess` is recommended.

---

## J. State Management Rules

| State | Where | Why |
|---|---|---|
| Search text, filters, sort | `useState` in the listing page's client component | Local to one page |
| Filtered products | Derived during render | No duplicate state |
| Selected quantity (product page) | `useState` | Local |
| Drawer/modal open flags | `useState` | Local |
| Cart items | `CartContext` | Needed by header, product, cart, checkout |
| Mock session (customer) | `AuthContext` | Needed by header and protected views |
| Placed orders (this session) | Module-level store inside `services/orders` | Keeps order logic out of components |

**Information flow:**
`data/*` → `services/*` (typed accessors) → page (server or client component) → presentational components via props. Cart and auth flow through context providers mounted once in `app/layout.tsx`.

**Persistence:** persist cart and created orders in `localStorage` (wrapped in try/catch, hydrated safely to avoid SSR mismatch) so refresh doesn't lose the demo flow. Mark as temporary.

**Avoid:** `useEffect` for derivable values, custom hooks created "just in case", global stores.

Because the cart and auth use Context, providers and any component using them must be client components (`"use client"`). Keep server components for static page shells where practical.

---

## K. Component Architecture and Code Quality

- **Guideline:** each component file under ~100 lines. Extract meaningful sections, not trivial fragments.
- One responsibility per component. Props typed with interfaces.
- Presentation components do not import from `data/` directly.
- Business logic (pricing, filtering, order creation) lives in `lib/` or `services/`, not in JSX.
- Avoid nested ternaries in JSX. Use early returns or small subcomponents.

### Component inventory

| Component | Location | Responsibility | Key props |
|---|---|---|---|
| `Button` | `ui/button` | All buttons, variants | `variant`, `size`, `loading`, `disabled` |
| `Text` / `Heading` | `ui/typography` | Shared type styles | `as`, `variant` |
| `Input` | `ui/input` | Labeled text input | `label`, `error`, `id` |
| `SearchInput` | `filters` | Search field with clear | `value`, `onChange` |
| `Select` | `ui/select` | Native-styled select | `label`, `options`, `value`, `onChange` |
| `Modal` | `ui/modal` | Accessible dialog/drawer shell | `open`, `onClose`, `title` |
| `SiteHeader` | `layout` | Logo, search link, cart, account | none |
| `Footer` | `layout` | Basic footer links | none |
| `ProductCard` | `products` | Summary card | `product`, `vendorName`, `onAdd` |
| `ProductGrid` | `products` | Responsive grid + animation | `products` |
| `ProductGallery` | `products` | Image viewer | `images` |
| `PriceDisplay` | `products` | Price + discount | `price`, `discounted_price` |
| `StockBadge` | `products` | Availability label | `status` |
| `QuantitySelector` | `cart` | +/− control | `value`, `min`, `max`, `onChange` |
| `CategoryTabs` | `filters` | Category selector | `categories`, `activeId`, `onSelect` |
| `FilterPanel` | `filters` | Attribute/price filters | `filters`, `onChange`, `onReset` |
| `SortSelect` | `filters` | Sort control | `value`, `onChange` |
| `ResultCount` | `filters` | "N products" | `count` |
| `CartItemRow` | `cart` | One cart line | `item`, `product`, `onQuantity`, `onRemove` |
| `OrderSummary` | `cart` (shared w/ checkout, orders) | Subtotal, charges, total | `lines`, `subtotal`, `charges`, `total` |
| `CheckoutForm` | `checkout` | Fields + validation | `onSubmit`, `defaults` |
| `FormField` | `checkout` | Label + control + error | `label`, `error`, `children` |
| `OrderStatusBadge` | `orders` | Status chip | `status` |
| `OrderStatusTimeline` | `orders` | Progress steps | `timeline`, `currentStatus` |
| `OrderListItem` | `orders` | History row | `order` |
| `EmptyState` | `feedback` | Icon, message, action | `title`, `message`, `action` |
| `LoadingSkeleton` | `feedback` | Placeholder blocks | `variant` |
| `ErrorMessage` | `feedback` | Friendly error + retry | `message`, `onRetry` |
| `ConfirmationMessage` | `feedback` | Success block | `title`, `orderId` |
| `Toast` | `feedback` | Add-to-cart confirmation | `message` |
| `SimulationNotice` | `feedback` | "Simulated" label | `children` |

---

## L. Folder and File Structure

```text
src/
├── app/
│   ├── layout.tsx                 # Providers, header, footer, fonts, MotionConfig
│   ├── page.tsx                   # Product listing (home)
│   ├── globals.css                # Tailwind layers, CSS variables from tokens
│   ├── not-found.tsx              # Unknown routes
│   ├── products/[productId]/page.tsx
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   ├── order-confirmation/page.tsx
│   ├── orders/page.tsx            # Only if history is in scope
│   ├── orders/[orderId]/page.tsx
│   ├── account/page.tsx           # Only if profile is in scope
│   └── login/page.tsx             # Mock login (proposed)
├── components/
│   ├── ui/        (button, input, select, modal, typography)
│   ├── layout/    (SiteHeader, Footer)
│   ├── products/  (ProductCard, ProductGrid, ProductGallery, PriceDisplay, StockBadge)
│   ├── filters/   (SearchInput, CategoryTabs, FilterPanel, SortSelect, ResultCount)
│   ├── cart/      (CartItemRow, QuantitySelector, OrderSummary)
│   ├── checkout/  (CheckoutForm, FormField)
│   ├── orders/    (OrderStatusBadge, OrderStatusTimeline, OrderListItem)
│   └── feedback/  (EmptyState, LoadingSkeleton, ErrorMessage, ConfirmationMessage, Toast, SimulationNotice)
├── data/          # categories, vendors, products, customer, orders (mock only)
├── types/         # product, cart, customer, order
├── services/      # products, orders, auth boundary over mock data
├── context/       # CartContext, AuthContext
├── lib/           # filters.ts, pricing.ts, validation.ts, formatters.ts, mock-auth.ts, utils.ts
└── config/        # design-tokens.ts, motion.ts
```

| Folder | Purpose |
|---|---|
| `app/` | Routes only. Pages compose components; no business logic. |
| `components/` | Reusable UI grouped by feature. |
| `data/` | Static mock datasets. Deleted/replaced when APIs exist. |
| `types/` | Shared TypeScript models. These become the API contract draft. |
| `services/` | The only layer pages call for data. See Section M. |
| `context/` | Cart and mock session providers. |
| `lib/` | Pure helpers (filtering, pricing, validation, formatting). |
| `config/` | Design tokens and motion constants. |

Remove any listed folder or route that the scope does not require. No empty placeholder files.

---

## M. Mock Services and Future Backend Integration

Pages call `services/*`. Services read `data/*`. Functions return Promises so call sites don't change when real APIs arrive.

| Function | Returns | Later replaced by |
|---|---|---|
| `getProducts()` | `Promise<Product[]>` | Product list API |
| `getProductById(id)` | `Promise<Product \| null>` | Product detail API |
| `getCategories()` | `Promise<Category[]>` | Category API |
| `getVendors()` | `Promise<Vendor[]>` | Vendor API |
| `createMockOrder(input)` | `Promise<Order>` | Order creation API |
| `getOrderById(id)` | `Promise<Order \| null>` | Order detail API |
| `getOrders()` | `Promise<Order[]>` | Order history API |

**Notes:**
- Search/filter/sort stay in `lib/filters.ts` for now. If the future API filters server-side, this moves behind the service.
- The cart remains client-side (`CartContext`). Add `getCartItems` only if a server cart is confirmed.
- Do not invent endpoint URLs or request shapes. Backend contracts are to be agreed with the backend team.
- Business rules (pricing, validation, status derivation) stay in `lib/`, not in components.

---

## N. Responsive Design and Accessibility

**Responsive**
- Mobile-first. Header collapses to logo, search icon, cart, menu.
- Filters in a drawer on mobile/tablet, sidebar on desktop.
- Cart/checkout: single column on mobile, summary beside form on `lg`.
- Tap targets at least 44×44 px.

**Accessibility**
- Semantic landmarks: `header`, `nav`, `main`, `footer`; one `h1` per page.
- Every input has a visible `<label>`; errors linked via `aria-describedby`.
- Modals/drawers: focus trap, Escape to close, return focus to trigger, `aria-modal`.
- Visible focus ring on every interactive element.
- Meaningful `alt` text on product images.
- Announce cart updates and result count changes via `aria-live="polite"`.
- Color is never the only status indicator (pair with text/icon).
- Reduced motion supported (Section H).

---

## O. Error Handling and Edge Cases

| Case | Behavior |
|---|---|
| No search/filter results | `EmptyState` + clear filters button |
| Invalid product ID | Not-found view with link to `/` (`notFound()`) |
| Empty cart | Empty state with "Browse products" on `/cart`; `/checkout` redirects to `/cart` |
| Invalid checkout fields | Inline errors, focus first invalid field, no submit |
| Missing/invalid order ID | Friendly "order not found" with links to `/` and `/orders` |
| Missing customer info | Checkout allows guest entry (assumption); orders list prompts sign-in if login is required |
| Duplicate cart addition | Increase quantity on existing line |
| Out-of-stock product | Disabled add button + "Out of stock" badge; cart flags unavailable lines |
| Conflicting filters (e.g., price range excludes everything) | Zero-result empty state describing active filters |
| Price min > max | Validate input, swap or show message |
| Mock order failure | Error message, cart preserved, retry button |
| Unknown routes | `not-found.tsx` with link home |

---

## P. Development Phases and Acceptance Criteria

### Phase 1 — Scope and Setup
- **Deliverables:** reviewed scope and reference image; updated register; initialized Next.js project; token file filled from image; base `ui/` components.
- **Files:** `config/design-tokens.ts`, `tailwind.config`, `globals.css`, `components/ui/*`, `app/layout.tsx`.
- **Depends on:** scope doc, reference image.
- **Acceptance:** project runs; strict TS passes; tokens contain no "TBD"; Section Q updated against the scope.
- **Done when:** base Button, Input, Typography render correctly in the chosen theme.

### Phase 2 — Product Listing
- **Deliverables:** mock datasets, services, listing page with search, category, attribute and price filters, sorting, reset, empty state.
- **Files:** `data/*`, `types/*`, `services/products.ts`, `lib/filters.ts`, `components/products/*`, `components/filters/*`, `app/page.tsx`.
- **Depends on:** Phase 1.
- **Acceptance:** search, filters, and sort work together; result count correct; empty state and reset work; grid correct at mobile/tablet/desktop.
- **Done when:** a user can find any product in the dataset using any combination of controls.

### Phase 3 — Shopping Flow
- **Deliverables:** product details, `CartContext`, cart page, checkout form with validation, `createMockOrder`.
- **Files:** `app/products/[productId]`, `app/cart`, `app/checkout`, `context/CartContext.tsx`, `lib/pricing.ts`, `lib/validation.ts`, `services/orders.ts`, `components/cart/*`, `components/checkout/*`.
- **Depends on:** Phase 2.
- **Acceptance:** add/update/remove works from any page; totals correct; duplicate adds merge; invalid forms blocked; out-of-stock cannot be added.
- **Done when:** a mock order can be created from a populated cart.

### Phase 4 — Customer Orders
- **Deliverables:** confirmation page, history (if in scope), details + timeline.
- **Files:** `app/order-confirmation`, `app/orders/*`, `components/orders/*`, `data/orders.ts`.
- **Depends on:** Phase 3.
- **Acceptance:** confirmation shows consistent order data; invalid IDs handled; timeline reflects status; "simulated" notice visible.
- **Done when:** the journey discovery → order tracking works end to end without a backend.

### Phase 5 — Authentication and Integration Readiness
- **Deliverables:** mock Google sign-in, `AuthContext`, account page (if in scope), final service boundaries, integration notes.
- **Files:** `lib/mock-auth.ts`, `context/AuthContext.tsx`, `app/login`, `app/account`.
- **Depends on:** Phase 4; scope answer on login.
- **Acceptance:** sign-in/out works; signed-in UI differs correctly; all data access goes through `services/`; "demo sign-in" label shown.
- **Done when:** replacing mock auth/services requires no UI component changes.

### Phase 6 — UI Polish and Quality
- **Deliverables:** Framer Motion per Section H, theme consistency review, accessibility and responsive pass, edge-case pass.
- **Files:** `config/motion.ts`, affected components.
- **Depends on:** Phases 1–5.
- **Acceptance:** reduced motion honored; keyboard-only run through full journey; AA contrast; zero TypeScript and ESLint errors; each edge case in Section O verified; component files near the 100-line guideline.
- **Done when:** the UI matches the reference image's visual language and the register has no unresolved "pending" items that block release.

---

## Q. Requirements and Assumptions Register

| Requirement / decision | Status | Source / rationale | Implementation impact | Follow-up |
|---|---|---|---|---|
| Customer scope document | **Pending** | Not available when this guide was written | All items below may change | Developer reviews scope, updates this table |
| Multi-vendor marketplace | Assumed | File name only | Vendor shown on cards/details; vendor data model | Confirm vendor display rules |
| Product categories | Assumed | "Organic" implies food categories | Placeholder categories in `data/categories.ts` | Get real category list |
| Product attributes (unit, certification, origin) | Assumed | Typical for organic goods | `attributes` field, attribute filters | Confirm required attributes |
| Ratings and reviews | Pending | Not known | `rating` optional; no review UI by default | Confirm if in scope |
| Currency and number format | Pending | Not known | Configurable formatter | Confirm currency |
| Authentication required to browse/buy | Assumed: not required | Brief default | Guest checkout allowed | **Confirm login requirements** |
| Google Login | **Proposed** | Brief proposal | Mock only; adapter structure | Confirm with customer before real integration |
| Payment methods | **Pending** | Not known | Payment UI omitted until listed; always simulated | **Confirm payment methods** |
| Real payment processing | Future backend | No backend | Not implemented | Define with backend team |
| Delivery charge / free-delivery rule | Pending | Not known | Single placeholder in `lib/pricing.ts` | Confirm pricing rules |
| Per-vendor order splitting / charges | Pending | Multi-vendor assumption | Cart grouped by vendor only if required | Confirm |
| Delivery tracking stages | **Pending** | Not known | Assumed statuses in `types/order.ts` | **Confirm order workflow** |
| Real delivery tracking | Future backend | No backend | Simulated timeline with visible notice | Define with backend team |
| Order history page | Pending | Brief says "if required" | Route built only if confirmed | Confirm |
| Customer profile / account page | **Pending** | Brief says "if applicable" | Route built only if confirmed | **Confirm profile requirements** |
| Saved addresses | Pending | Not known | Only in mock customer | Confirm |
| Delivery area / postcode restrictions | Pending | Not known | None implemented | Confirm |
| Related products on details page | Not included | Needs scope justification | None | Confirm |
| Stock-based quantity limits | Pending | Not known | Fixed max constant | Confirm stock rules |
| Reference UI image | **Pending** | Theme not confirmed, may be delayed | Tokens set to TBD; styling blocked until reviewed | Review image, fill tokens, log deviations here |
| Cart persistence via localStorage | Proposed | Keeps demo flow after refresh | Hydration-safe storage | Remove or replace when server cart exists |
| Next.js + Tailwind + Framer Motion stack | Confirmed (by brief) | Project instructions | As documented | Justify any deviation here |
| Component files under ~100 lines | Confirmed (guideline) | Project instructions | Split meaningfully | Review during Phase 6 |
| Deviations from scope or reference image | — | — | — | Record each one here with reason |
