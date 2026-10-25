# Customer Frontend Implementation Checklist

Acceptance audit for the "complete customer frontend" brief (24 Oct 2026). Every row was verified by the method stated, not by the existence of a file.

**Verification methods**
- **E2E n**: step n of `npm run test:e2e` (`scripts/e2e-journey.mjs`), a real headless-Chrome run through the UI against `npm run dev`. Last run (25 Oct 2026): **54/54 steps passed, 0 console errors**.
- **Unit**: Vitest (`npm test`): **135 tests in 10 files passed**.
- **Prod check**: production build (`npm run build && npm run start`) inspected in Chrome.

**Status key:** PASS · FAIL · BLOCKED (needs something outside this repo)

## Roadmap

| # | Module | Status |
|---|---|---|
| 1 | Shared types, local persistence, cart quantities, catalogue lookup | Done |
| 2 | Routing foundation: links to `/products`, header search, active navigation | Done |
| 3 | Marketplace `/products` with filter drawer and sorting | Done |
| 4 | Product details `/products/[productId]` | Done |
| 5 | Cart `/cart` | Done |
| 6 | Addresses `/checkout/address` | Done |
| 7 | Review, order creation, confirmation | Done |
| 8 | Tracking `/orders/[orderId]/tracking` | Done |
| 9 | Wishlist page, not-found pages, header links | Done |
| 10 | Tests, end-to-end browser run, acceptance audit | Done |

## Acceptance audit

### Product details: `/products/[productId]`
| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Card opens its details page | `products/ProductLink.tsx` (stretched link in `ProductCard`, `CompactProductCard`, `BundleCard`) | E2E 3; unit `product-card.test.tsx` | PASS |
| Correct data from ID; image, name, description, category, price, pack size, availability | `app/products/[productId]/page.tsx`, `services/catalog.ts getProduct` | E2E 4 | PASS |
| Seller only when available | `vendorNames[product.vendor_id]` guarded | E2E 4 (shown); code path omits when missing | PASS |
| Variants only when supported | No variant field in the data, so none rendered | Code review: no variant UI | PASS |
| Quantity selection, limits | `QuantityStepper` (1–20, `lib/cart.ts clampQuantity`) | E2E 5; unit "cart quantities" | PASS |
| Out-of-stock cannot be bought | `PurchasePanel` disables Add/Buy now; `AddToCartButton` | Unit `product-card` (Jowar); E2E 25 guards | PASS |
| Add to Cart updates shared cart | `CartContext.addItem(id, qty)` | E2E 6 (header count) | PASS |
| Buy Now checks out that product | `CheckoutContext.start({kind:"buy_now"})` → `/checkout/address` | Code path; `useCheckoutLines` unit-covered via `resolveLines` | PASS (not in E2E run) |
| Wishlist uses shared state | `WishlistButton` (labelled) | E2E 33 | PASS |
| Related products link to their pages | `getRelatedProducts` + `ProductCard` | E2E 4 ("More from Vegetables") | PASS |
| Breadcrumbs | `layout/Breadcrumbs.tsx` | E2E 4 | PASS |
| Invalid ID → not-found | `notFound()` + `products/[productId]/not-found.tsx` | E2E 24; prod check (renders, `noindex`) | PASS |

### Cart: `/cart`
| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Thumbnail, name, pack size, unit price, quantity, line total, remove | `checkout/CartView.tsx` | E2E 8 | PASS |
| Increase/decrease; correct subtotal and total | `setQuantity`, `lib/cart.ts summarize` | E2E 8 (₹175 → ₹215 → ₹160 → ₹120) | PASS |
| Stock and quantity validation | `checkoutBlocker`, clamped stepper | Unit "blocks checkout" | PASS |
| Header count in sync | single `CartContext` | E2E 8, 16 | PASS |
| Empty state; Continue Shopping; Proceed to Checkout | `MessageState`, links | E2E 25, 9 | PASS |
| Survives refresh | `usePersistentState` (localStorage) | E2E 8b | PASS |
| No invented charges | `CONFIGURED_CHARGES = []`; "Delivery: not calculated in this preview" | E2E 8/13 screenshots | PASS |

### Address management: `/checkout/address`
| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Select, add, edit, remove saved addresses | `AddressStep.tsx`, `AddressBookContext` | E2E 10, 10b | PASS |
| Home / Work / Other | `AddressForm` radio group | E2E 10b (Work) | PASS |
| Required fields, Indian mobile, PIN | `lib/address.ts validateAddress` | Unit "address validation"; E2E 11 | PASS |
| Inline errors, focus first invalid field | `AddressForm` (`aria-invalid`, `aria-describedby`) | E2E 11 | PASS |
| Invalid address cannot continue | `continueToReview` guard; review re-validates | E2E 11; unit `buildOrder` refusal | PASS |
| Selection kept during checkout; return and change | `CheckoutContext` (sessionStorage) | E2E 13 (edit round-trip) | PASS |
| Demo persistence | localStorage `mithren.addresses` | E2E 10b then 12 | PASS |

### Review: `/checkout/review`
| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Address, images, names, pack sizes, quantities, line totals, subtotal, charges, total | `ReviewStep.tsx`, `ItemList`, `OrderSummary` | E2E 13 | PASS |
| Edit Address, Return to Cart, Place Order | links/buttons | E2E 13, 14 | PASS |
| Validates cart, address, quantities, availability before ordering | `checkoutBlocker`, `isValidAddress`, `buildOrder` | Unit; E2E 25 | PASS |
| Totals match the cart | shared `summarize` | E2E 8 vs 13 (₹120) | PASS |

### Order creation and confirmation: `/orders/[orderId]/confirmation`
| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Duplicate submission prevented | ref guard + busy state in `ReviewStep` | E2E 14–15 (double click → exactly 1 order) | PASS |
| Unique ID; complete record; status Order Placed | `lib/orders.ts generateOrderId`, `buildOrder` | Unit "orders"; E2E 15 | PASS |
| Persisted; cart cleared only after success | `OrdersContext.placeOrder` checks the write; then `removeItems` | E2E 15–16 | PASS |
| No false success | `placeOrder` throws `OrderSaveError` if storage write fails; error shown | Code path (storage failure not simulated in E2E) | PASS (unit/code) |
| Confirmation content and actions | `orders/ConfirmationView.tsx` | E2E 17 | PASS |
| Track Order opens the same order | link to `/orders/{id}/tracking` | E2E 18 | PASS |
| Invalid ID handled | `orders/OrderLookup.tsx` | E2E 24 | PASS |

### Tracking: `/orders/[orderId]/tracking`
| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| ID, time, status, address, items, total | `TrackingView.tsx`, `OrderDetails` | E2E 18–23 | PASS |
| Estimated delivery only if valid | "not available" (no estimate exists) | E2E screenshots | PASS |
| Six stages; completed/current/pending distinct; connectors; icons; timestamps; responsive | `TrackingTimeline.tsx` | E2E 20–21, 34 (375px screenshot) | PASS |
| New order: only Order Placed reached | `buildOrder` | E2E 20; unit | PASS |
| Demo progression, persisted, hidden from customers | `advance`; `DEMO_TOOLS` flag | E2E 21–22; prod check (hidden in production, shown in development) | PASS |
| Consistent with confirmation; invalid IDs | single `OrdersContext` | E2E 23–24 | PASS |

### Filter and sort: `/products`
| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Dedicated Filter button with icon; drawer (right panel / bottom sheet) | `marketplace/FilterDrawer.tsx`, `ui/sheet.tsx` | E2E 26, 34 (375px) | PASS |
| Category, min/max price + sliders, availability, seller, pack size, seasonal, reduced price | `lib/marketplace.ts` | Unit `marketplace.test.ts`; E2E 27–28 | PASS |
| Organic attribute | Not in the data, so not offered | Code review | PASS (intentionally absent) |
| Sort: relevance, price ↑, price ↓, name A–Z | `sortOptions` | Unit; E2E 30 | PASS |
| Apply, Clear all, active count, chips | `FilterDrawer`, `ActiveChips` | E2E 27, 31 | PASS |
| Combines search + filters + sort; counts; empty state with Clear Filters | `applyCriteria`, `Marketplace.tsx` | E2E 29, 32 | PASS |
| Card cart and wishlist still work | `ProductCard` | E2E 33 | PASS |

### Shared state, navigation, quality
| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| One source of truth per state; validated stored data | Contexts + `usePersistentState`; `parse*` validators | Unit (malformed storage); E2E | PASS |
| Totals consistent across cart, review, confirmation, tracking | `summarize` + stored order totals | E2E 8, 13, 17, 23 | PASS |
| Refresh keeps cart, checkout, orders, tracking | localStorage / sessionStorage | E2E 8b, 22 | PASS |
| Every button has a destination; breadcrumbs; invalid routes | `app/not-found.tsx` etc. | E2E 2–24 | PASS |
| No horizontal overflow at 320/375/390/430/768/1024/1280/1440 | — | E2E 34 (8 routes × 8 widths); responsive audit (13 routes × 8 widths) | PASS |
| Modern Sage design system | tokens only; `tests/design-tokens.test.ts` colour guard | Unit | PASS |
| lint · typecheck · test · build | — | All pass | PASS |

## Experience upgrade (25 Oct 2026)

Brief: "Customer frontend experience upgrade" (scroll position, mobile, cards and product page, homepage, search/cart/checkout/trust). Extra verification:
- **Scroll matrix**: headless Chrome against the production build; 9 viewports (320×568 to 1440×900) × homepage cards (3 depths), related product and listing → product, with and without an 800 ms network delay: **90/90 landed at scrollY 0**.
- **Responsive audit**: 13 routes (incl. long search query, out-of-range product, cart, checkout, confirmation, tracking, wishlist) × 8 widths: horizontal overflow, elements outside the viewport, tap targets.

| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Product page opens at the top from homepage, listing, search and related products | Full-height Suspense fallbacks (`ProductDetailSkeleton`, `LoadingState fullHeight`); root cause in `docs/ARCHITECTURE.md` (phase 4) | E2E 35–36; scroll matrix 90/90 (before the fix: 1024×768 landed at scrollY 841 of 841) | PASS |
| Back / forward sensible; refresh keeps the browser's own position | Next.js and browser defaults, unchanged | E2E 36; probe (back restores the earlier offset) | PASS |
| Quantity and Add to cart don't reset scrolling | No scroll code on the page | E2E 37 | PASS |
| No duplicate scroll handlers | None added (`grep scrollTo`) | Code review | PASS |
| Quick view doesn't reappear after Back | `DialogClose` around "View full details" | E2E 38 | PASS |
| Compact mobile header; search and categories easy to reach | `SiteHeader`, `LocationSelector` | Screenshots 320/390; audit (no wrap, no overflow) | PASS |
| Consistent spacing and type scale | `docs/DESIGN_SYSTEM.md` "Layout, spacing and mobile conventions" | Screenshots | PASS |
| 44px targets for buttons, steppers, filters, icon buttons | `Button` sizes, `QuantityStepper`, `LocationSelector min-w-11` | Audit: remaining sub-44px items are 36px footer/breadcrumb text links and product names (whose card is the 44px+ target) | PASS (text links 36px by choice) |
| No hover-only behaviour | Quick view md+ only; the card opens the page | Code review | PASS |
| Product cards: one structure, 2-line names, aligned prices, no fake data | `ProductCard`, `CompactProductCard`, `BundleCard` | Unit `product-card`; screenshots | PASS |
| Product page in buying order; Add to cart + Buy now together; details below | `app/products/[productId]/page.tsx`, `PurchasePanel` | E2E 4–6, 39; screenshots 320–1440 | PASS |
| "You save" only from real sale prices | `price - discounted_price` | Code review | PASS |
| Buy now orders only that product; cart unchanged | `CheckoutContext` (unchanged); review notes it | **E2E 39** (was not covered before) | PASS |
| Homepage: no product shown twice; clear order | `app/page.tsx`, `lib/collections.ts freshPicks`; "Shop the marketplace" grid removed | Unit `smoke` (unique product links) | PASS |
| Client-side navigation for all internal links | `next/link` in tiles, banners, section links | Code review | PASS |
| Search: clear button, long queries wrap, empty state names the search | `Marketplace.tsx` | Audit (long query, 320px); E2E 29, 32 | PASS |
| Filter and Sort usable on phones | Equal-width row; sheet unchanged | E2E 26–31; screenshot 375 | PASS |
| Cart line items: image, name, pack, seller, unit price, stepper, line total, remove | `CartView.tsx` | E2E 8; audit at 320 (overflow found and fixed) | PASS |
| Mini cart "Checkout" really starts checkout | `CartMenu.tsx` | Code review; unit (renders) | PASS |
| No invented claims | "Farm Fresh" banner label removed; no ratings, counts or guarantees | `grep` review of UI copy | PASS |

### Launch requirements found (need real business content; not invented)
- Privacy policy, terms and conditions, shipping/delivery, cancellation, returns/refunds, FAQs, customer support channel: listed in the footer as "coming soon" (not links).
- Delivery areas, charges, taxes and estimates; payment; seller and delivery notifications; accounts.
- Real product data and photography; organic certification workflow before any "organic" label.

## Demo customer account (25 Oct 2026)

Brief: "Demo authentication & customer account system". Details and production checklist: `docs/DEMO_ACCOUNT.md`. Extra verification: responsive audit of 12 account/auth routes × 8 widths (320, 360, 390, 430, 768, 1024, 1280, 1440), signed out and in a demo session: **192 checks, no horizontal overflow, no console errors** (one 3px overflow on /register at 320 was found and fixed). Production build: account flow, hidden demo tools and product scroll re-checked.

| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Enter the demo ("Explore Demo Account"), destination kept | `ExploreDemoButton`, `safeNextPath` | E2E 41; unit (next paths) | PASS |
| Demo mode indicator on auth and account pages | `DemoBadge` | E2E 41; screenshots | PASS |
| No passwords collected, stored or hard-coded | No password fields; storage holds a marker only | Unit ("stores no password or token"); E2E 41 (no password input) | PASS |
| Session survives refresh; no hydration errors | `usePersistentState` (useSyncExternalStore) | E2E 42; 0 console errors | PASS |
| Signed-out visitors don't see account screens; no redirect loops | `RequireDemoSession` entry screen | Unit (gate); E2E 40, 49 | PASS |
| Login page: branding, guest option, registration link, honest notice | `LoginView`, `AuthLayout` | E2E 41; screenshots 320–1440 | PASS |
| Registration preview: validation, success says no account created, nothing stored | `RegisterView`, `validateRegistration` | Unit; E2E 50 | PASS |
| Dashboard: greeting, demo status, navigation, recent orders, quick links, empty states | `AccountOverview`, `AccountShell`, `AccountNav` | E2E 42; screenshots | PASS |
| Profile: view, edit, validate, Save/Cancel, feedback, restore defaults | `ProfileView` | E2E 43; unit (validation) | PASS |
| Orders: labelled sample orders, details, tracking, not-found | `OrdersList`, `AccountOrderView`, existing `TrackingTimeline` | E2E 44; unit (sample orders valid) | PASS |
| Simulated tracking, clearly labelled; invalid IDs | Timeline reused; "Simulated tracking" labels | E2E 44 | PASS |
| Addresses: list, add, edit, delete (confirmed), default, empty state; one address model | `AddressManager` on `AddressBookContext` | E2E 45 | PASS |
| Checkout uses the default address; guest checkout unchanged | `CheckoutContext.start`, `AddressStep` | E2E 46 (demo), 9–17 and 39 (guest, Buy now) | PASS |
| Wishlist reused (one state) | `WishlistView` in `/account/wishlist` | E2E 42 | PASS |
| Settings: local toggles labelled as local, session info, reset (confirmed), logout | `SettingsView` | E2E 47 | PASS |
| Help & support without invented contacts or policies | `/support` | E2E 51 | PASS |
| Header: signed-out sign-in options; demo account links + Logout; closes after navigating; mobile | `AccountMenu` | Unit; E2E 41, 48, 49 | PASS |
| Logout ends the demo, removes samples, keeps own data and guest shopping | `endDemoSession` | Unit; E2E 49 | PASS |
| Existing behaviour (homepage, product scroll, cart, checkout, filters) | — | E2E 1–39; production scroll matrix 90/90 | PASS |
| **Real authentication, secure sessions, server-side customer data, live tracking** | Not built (no backend) | — | **NOT DONE (by design)** |

## Known limitations (not failures)

| Item | Status | Next step |
|---|---|---|
| Real backend, payments, seller notifications, delivery partner | BLOCKED | Needs APIs; replace `services/` and the contexts' storage with API calls |
| Customer authentication and accounts | BLOCKED (demo only) | See "Before production" in `docs/DEMO_ACCOUNT.md` |
| Orders/addresses only in this browser | By design (demo) | Server persistence with authenticated accounts |
| Unknown product IDs return HTTP 200 with the not-found page (`noindex`) in production | Framework trade-off | Cache Components streams the shell before `notFound()`; acceptable for a soft 404 |
| Delivery charges, taxes, estimates | Not configured | Add rules to `CONFIGURED_CHARGES` once confirmed |
| Stock is a status, not a count; 20-per-item cap is a placeholder | Open (register) | Confirm per-seller stock rules |
| On a 320 × 568 phone the product price and buttons start just below the first screen (name visible) | Accepted | Revisit if analytics show many very small screens |
| The hero's desktop "Delivery by area" chip points to the location selector, which is not checked against real areas | Preview copy | Replace once delivery areas exist |
