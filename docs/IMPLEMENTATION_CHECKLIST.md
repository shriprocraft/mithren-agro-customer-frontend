# Customer Frontend Implementation Checklist

Acceptance audit for the "complete customer frontend" brief (24 Oct 2026). Every row was verified by the method stated, not by the existence of a file.

**Verification methods**
- **E2E n**: step n of `npm run test:e2e` (`scripts/e2e-journey.mjs`), a real headless-Chrome run through the UI against `npm run dev`. Last run (27 Oct 2026): **70/70 steps passed, 0 console errors**.
- **Unit**: Vitest (`npm test`): **179 tests in 12 files passed**.
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

## Storefront update (27 Oct 2026)

Brief: "Master implementation prompt" (agent and investor pages, homepage restructure, videos, shop toolbar, loading, Buy now colour, toasts, placeholders, My Orders). Decisions: ARCHITECTURE "Storefront update (phase 6)"; configuration: `docs/CONFIGURATION.md`.

| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| "Meet Our Farmers" → **Agent Benefits** page (Seller and Delivery Agent, benefits, responsibilities, eligibility, how it works, onboarding, policy placeholders, FAQ, CTA) | `/agent-benefits`, `components/opportunities/*` | Unit; E2E 53 | PASS |
| Proposed benefits clearly marked; no guaranteed earnings, employment, insurance or eligibility | `ProvisionalNotice`, FAQ wording | Unit (no "guaranteed income/fixed salary"); review | PASS |
| Application buttons not falsely functional | `ExternalCta`: disabled "coming soon" until `NEXT_PUBLIC_*_AGENT_APPLY_URL` is set | Unit; E2E 53 | PASS |
| "Shop Fresh Produce" → **Investor Opportunities** page (business, opportunity, benefits, process, eligibility, risks, FAQ) | `/investors` | Unit; E2E 54 | PASS |
| **Access Investor Portal**: configured URL or safe fallback; no investor login rebuilt | `NEXT_PUBLIC_INVESTOR_PORTAL_URL` via `safeExternalUrl`; disabled + note when unset; "Opening…" feedback | Unit (both states, unsafe URLs rejected); E2E 54 | PASS (URL not configured yet) |
| Liquid-glass overlay removed from the hero's bottom strip, content kept | `ValueStrip` | E2E 52 (no backdrop filter or translucent plate); screenshots 390–1440 | PASS |
| Two real video cards right after the hero | `VideoSection`, `VideoCard`, `homeVideos` | Unit (no source, play, loading, error, no preload/autoplay); E2E 55 | PASS (no video files supplied yet) |
| Homepage order: hero, videos, Shop by category, Seasonal picks, Combo boxes, Browse banner, footer; Fresh picks and the in-between sections removed | `app/page.tsx` | Unit (order and absences); E2E 52 | PASS |
| Shop by category and Seasonal picks unchanged | Not modified (only the shared scrollbar utility class) | E2E 1–3, 35 | PASS |
| Hidden scrollbar, scrolling intact | `globals.css` (`html` rule, `scrollbar-none` utility) | Unit (CSS, no overflow hidden); E2E 60 (wheel and scrollTo) | PASS |
| Shop white space used meaningfully | Intro copy, real catalogue counts beside the heading, one toolbar, results summary | Screenshots; E2E 34 (no overflow) | PASS |
| Premium dropdowns; filter, sort, search and category combine | `ui/select.tsx` (Category, Sort), existing Filter drawer | E2E 26–32, 58; unit | PASS |
| Loading: navigation, product list updates, actions | `NavigationProgress`, `ProductGridSkeleton` + `useDelayedFlag`, full-height Suspense fallbacks, `<Button loading>` on Buy now / Explore Demo Account / portal | Unit; E2E 0 console errors; manual | PASS (see note) |
| Create/update/delete feedback, no success before saved | Cart, address book report `saved`; toasts on add/remove/default/delete; profile restore checks the save | Unit; E2E 45, 56 | PASS |
| Buy now in logo gold, dark text, other buttons unchanged | Tokens `gold*`, `Button variant="buy"` | Unit (contrast ≥ 5:1, variant); E2E 57 (computed colours) | PASS |
| "Added to cart successfully!" toast; error on failure; one per action | `ToastProvider`, `AddToCartButton` | Unit; E2E 56 | PASS |
| Login placeholders | The sign-in page has **no input fields** (demo, no password by design), so none were added; placeholders added to registration, profile, address and order-ID fields with labels kept | Unit; E2E 61 | PASS (as noted) |
| Account menu "Orders in this browser" → **My Orders** → order history | `AccountMenu` link to `/account/orders` | Unit; E2E 59 | PASS |
| Order history loading, empty and error states | `OrdersList` skeleton, empty state, blocked-storage warning | Unit (server render skeleton, empty) | PASS |
| Existing journeys (cart, checkout, Buy now, tracking, filters, account) | — | E2E 1–51 | PASS |

Note on loading: every cart, wishlist, address and profile change is a synchronous write to this browser's storage, so there is no wait to show and no spinner was added (adding a delay would be fake). The skeleton and progress bar appear only when a navigation actually takes longer than 150 ms; on the dev server that is common, on the production build (prefetched static pages) it is rare.

## Website upgrade (27 Oct 2026, second brief)

Brief: "Complete customer website upgrade". Decisions: ARCHITECTURE "Website upgrade (phase 7)".

| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Two-image cinematic hero with the supplied photos, 6 s autoplay, arrows, dots, progress, pause, swipe, reduced motion, no glass | `HeroSection`, `public/images/home/hero-slide-*.jpg` | Unit (timer restart, pause, inert slide, no glass); E2E 52, 62, 63 | PASS |
| Both hero buttons reach the shop | "Explore Marketplace" → `/products`; "Shop Fresh Produce" → `/products?category=fruits,vegetables` | Unit; E2E 62 | PASS |
| About Mithren Agro right after the hero; Learn More → About page | `AboutSection`, new `/about` | Unit; E2E 64 | PASS (reference screenshot not supplied; built from the description) |
| Homepage order hero → About → videos → categories → seasonal → combo boxes → browse banner → footer; Fresh picks absent | `app/page.tsx` | Unit; E2E 52, 55 | PASS |
| Agent Benefits and Investor Opportunities entries on the homepage | "Grow with Mithren Agro" bar in the hero; footer | Unit; E2E 53, 54 | PASS |
| Seller and Delivery Agent topics (catalogue, pricing, orders, customer service, earnings subject to the model) | `/agent-benefits` | Unit; E2E 53 | PASS |
| Investor page: business model, technology, growth, contact; portal button configurable, no fake login | `/investors`, `NEXT_PUBLIC_INVESTOR_PORTAL_URL` | Unit; E2E 54 | PASS (URL not configured) |
| Footer: About, customer support, five policies, shopping, opportunities, no dead links | `SiteFooter` | Unit (every link exists); E2E 65 | PASS |
| Five policy pages, consistent rules, legal-review notice | `app/*-policy`, `terms-and-conditions`, `config/policies.ts` | Unit (each page, rules); E2E 65 | PASS (drafts) |
| No cancellation after Packed; per-order note | `canRequestCancellation` (`ready_for_dispatch`), `OrderPolicyNote` | Unit; E2E 65, 66 | PASS |
| 10-day returns for women's apparel only, from delivery | `policyConfig.returns`, Return Policy, order note | Unit; E2E 65 | PASS |
| Weight/pack/size options with their own price and stock; cart, checkout and orders keep them | `ProductVariant`, `lib/variants.ts`, cart/order changes | Unit (data, cart lines, legacy lines, order snapshot, panel, Buy now); E2E 66, 67 | PASS (sample data; backend must supply real options) |
| Add to cart toast names the option, only after success | `AddToCartButton` | Unit; E2E 56, 66 | PASS |
| Shop layout, premium dropdowns, hidden scrollbar, loading states, gold Buy now, My Orders | Phase 6, unchanged | E2E 26–34, 56–61 | PASS |
| Login placeholders | The sign-in page still has no input fields (demo, no passwords by design); registration, profile, address and order-ID fields have placeholders | E2E 61 | PASS (as noted) |
| Existing cart, checkout, account, tracking | — | E2E 1–51 | PASS |

Run on 27 Oct 2026: lint clean, typecheck clean, **179 unit tests in 12 files**, production build (57 pages), **E2E 70/70, 0 console errors** (10 routes × 8 widths without horizontal overflow included).

## Hero restored and About compacted (27 Oct 2026)

| Requirement | Implementation | Verification | Result |
|---|---|---|---|
| Static hero restored exactly as before the slider (image, headline, copy, buttons, layout) | Git `0c33170` + the recorded phase-6 edit | Unit (one image, buttons, no slider, no glass on the strip); E2E 1, 52–54, 62 | PASS |
| Slider code and timers removed | `HeroSection`, `globals.css` | Unit; E2E 52 | PASS |
| The two supplied images kept | `public/images/home/hero-slide-*.jpg` | — | Kept (one used on /about) |
| About section smaller and balanced | `AboutSection` | E2E 62 (height measured), screenshots 1440 and 390 | PASS |

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
| Agent and investor terms, the Investor Portal URL, application URLs and video files | Not supplied | Provide them (docs/CONFIGURATION.md); replace the provisional notices once official documents exist |
| The hero's desktop "Delivery by area" chip points to the location selector, which is not checked against real areas | Preview copy | Replace once delivery areas exist |
