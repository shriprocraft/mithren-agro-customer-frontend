# Architecture and Decisions

## Folder structure

```text
src/
├── app/                  # Routes, layouts, route-level loading/error/not-found files. No business logic.
├── components/
│   ├── layout/           # Shell: AnnouncementBar, SiteHeader (+ search, location, cart/wishlist/account menus), CategoryNavigation, SiteFooter
│   ├── home/             # Homepage sections: hero, category grid, product sections, shop browser, feature panels, bundles, banner
│   ├── products/         # ProductCard, CompactProductCard, PriceDisplay, StockBadge, AddToCartButton, WishlistButton, ProductQuickView
│   └── ui/               # shadcn/ui primitives (button, input, label, popover, dialog) and typography
├── config/               # site.ts (brand), design-tokens.ts (theme), motion.ts (shared animation timing)
├── context/              # Client providers: cart, wishlist, browse (category + search), screen-reader announcer
├── data/                 # Mock datasets only: categories, vendors, products, bundles, delivery areas
├── services/             # catalog.ts — the only layer pages call for data. Async functions over mock data.
├── types/                # Shared TypeScript models (draft API contract, snake_case fields)
├── hooks/                # Reusable React hooks (none needed yet)
└── lib/                  # Pure helpers: browse anchors, cart rules, filters, formatters, collections, utils
public/images/            # Static images
tests/                    # Vitest setup and tests (co-located *.test.tsx files in src/ also run)
docs/                     # Architecture notes and design reference
```

Further feature folders from the development guide (`components/filters`, `cart`, `checkout`, `orders`, `feedback`, `context/`) are added when the first file for them is written. Empty folders hold a `.gitkeep` so they survive in Git.

## Data flow

`data/*` → `services/*` (typed, Promise-returning) → pages → presentational components via props. Components never import from `data/` directly. Swapping mock services for real APIs should not require component changes.

## Decisions

| Decision | Reason |
|---|---|
| Next.js 16 App Router, React 19, TypeScript `strict` + `noUncheckedIndexedAccess` | Required by both documents; `noUncheckedIndexedAccess` recommended by the guide |
| Tailwind CSS v4, CSS-variable theming in `src/app/globals.css` | shadcn/ui v4 convention; components use semantic classes, not raw hex. Tailwind v4 has no `tailwind.config`, so the guide's "theme extension" is the `@theme inline` block |
| `src/config/design-tokens.ts` mirrored by `globals.css` | Guide Section G structure; `tests/design-tokens.test.ts` fails on drift. The token `accent` (gold) maps to `--highlight` because shadcn reserves `--accent` for hover surfaces |
| shadcn Input + Label instead of a labelled `Input` | shadcn keeps the control and label separate; the guide's `FormField` (checkout phase) will combine label, control and error |
| Button: pill shape, sizes `default`/`lg`/`icon`/`icon-lg` only, `loading` prop | Reference image + guide Section N (44 px minimum); shadcn's `xs`/`sm` sizes were removed because they are under 44 px |
| shadcn/ui initialised (Radix base, Nova preset), no components added yet | Agreed with the project owner; components are added only when a page needs them |
| lucide-react as the single icon library | Scope requires a consistent icon library; installed by shadcn |
| Framer Motion | Required by the guide; used only for purposeful motion, with reduced-motion respected |
| Vitest + React Testing Library + jsdom | Agreed with the project owner; Playwright E2E to be added when real flows exist |
| `@types/node` ^24 | Matches the Node 24 runtime and satisfies Vitest's peer range |
| No `.env.example` | No environment variables are used yet |
| Brand name in `src/config/site.ts` | Scope requires a configurable storefront name |

## Homepage (phase 2)

| Decision | Reason |
|---|---|
| ~~Category links and search target an on-page browser via `#shop-<slug>` anchors~~ **Superseded in phase 3:** they open `/products` with URL filters | `BrowseContext` was removed; the homepage keeps a small category preview |
| ~~Product names open a quick-view dialog~~ **Superseded in phase 3:** product names link to `/products/[productId]`; quick view moved to an eye button on product cards | Product details pages now exist |
| ~~Cart, wishlist and location are in-memory React state~~ **Superseded in phase 3:** cart and wishlist persist in localStorage (location is still per page) | See "State and persistence" below |
| Account menu explains sign-in is coming, rather than linking to `/login` | Authentication is out of scope for this phase |
| Footer support/policy items are plain text marked "coming soon" | No destination pages exist; no contact details, social profiles or policies are invented |
| Server components by default; client components only for interactive pieces | `ProductCard` itself has no `"use client"`; only its cart, wishlist and quick-view controls do |
| Helpers shared by server and client code live in `lib/` and `components/products/category-icons.ts`, not in `"use client"` modules | Exports of a client module become client references and cannot be called during server rendering |
| Framer Motion only for the cart/wishlist badge pop (the homepage browser grid that also used it was removed in phase 4); hero entrance uses a CSS animation | Keeps JavaScript off the static hero; `MotionConfig reducedMotion="user"` and `motion-reduce:` variants honour reduced motion |
| Hero image uses `loading="eager"` + `fetchPriority="high"` instead of `preload` | Same priority without a separate preload hint |
| Liquid glass as Tailwind `@utility` classes in `globals.css` (`glass-header`, `glass-panel`, `glass-card`, `glass-chip`, `glass-field`, `glass-overlay`, `liquid-primary`); fills and blur radii are tokens in `design-tokens.ts` | Reproduces the reference's translucent surfaces with one consistent system; each surface has its own transparency, as in the image. Rims use inset shadows so `border` never shifts layout. An `@supports` fallback makes fills near-opaque where `backdrop-filter` is missing |
| Glass is used selectively: header, search field, wishlist/cart capsule, hero badge and floating chip, feature strip, carousel arrows, card wishlist hearts, popovers and dialogs. Content cards and section panels use the opaque `surface-card` utility (hairline edge, one soft shadow, no blur) | Glass on every card made the page look crowded and plastic; the reference keeps glass for floating and overlaid surfaces. Note: `backdrop-filter` makes an element the containing block for absolutely positioned children, so a card that loses glass must be `relative` to keep its `sr-only` text clipped (this caused horizontal overflow once) |
| Do not combine a `glass-*` or `surface-card` class with a `bg-*` class on the same element | Both set `background-color`, and `cn` cannot tell they conflict, so the winner depends on CSS order |
| `PageBackdrop` puts a few blurred foliage photographs along the page edges | The reference has out-of-focus leaves at the edges; the top pair also gives the header and hero glass real imagery to blur |
| From lg the header has a fixed height (`h-23`; `h-29` from xl, the proportions of `docs/reference/target-homepage.png`) and the hero pulls up under it (`-mt-23 pt-23`, `-mt-29 pt-29` from xl) | The target's hero photograph runs behind the glass header; the shorter 1024–1279 header keeps the first screen compact |
| Navigation and category tiles share one order (`src/lib/navigation.ts`): vegetables, fruits, organic groceries, seasonal produce, combo boxes, fertilizers, women's apparel | Matches the reference's row. The reference's leafy greens, herbs and exotic vegetables have no matching categories, so they are omitted rather than invented; categories added later are appended |
| Hero photo `public/images/mithren-hero-produce.png` (owner-supplied, 1536×1024); the hero fills the first screen and "Shop by category" is the next section | The image leaves open haze on the left for the copy. From lg it is anchored right at its own 3:2 ratio (88% of the hero height at 1024–1279px), so the crate stays clear of the copy and above the benefits strip; below lg it is a full-bleed band anchored right so the whole crate shows. Unlike the mockups' crate, this one carries no "MITHREN AGRO" branding |
| Logo: `public/images/mithren-agro-logo.png` used unmodified; `BrandMark` frames the measured artwork box and an SVG `feColorMatrix` filter makes the white background transparent at display time | The supplied PNG has no alpha channel and wide white margins. `mix-blend-mode: multiply` was tried and rejected: inside the translucent header/footer stacking contexts it leaves a visible white box |
| The reference is compared both at its literal 1024px width and at 1440px scaled down to 1024 | At 1024 its type would be 8–10px, so text keeps a legible minimum (11px) while the layout follows the reference's proportions; at 1440 the proportions match closely |
| Catalogue images carry an optional `studio` flag; `CatalogImage` shows studio cut-outs contained on white and other photos with a cover crop | Lets isolated product shots (`public/images/studio/`) be added one at a time without the remaining lifestyle photos looking worse. `tests/catalog-images.test.ts` fails if any product, combo box, category or tile image file is missing |
| Photography is licensed Unsplash stock stored in `public/images/` (see `docs/IMAGE_CREDITS.md`) | No real product photos supplied; local files avoid configuring an external image host |
| No ratings on product cards | The scope lists ratings on cards but forbids fabricating them; there is no review data |

## Customer journey (phase 3)

Checklist and acceptance audit: `docs/IMPLEMENTATION_CHECKLIST.md`. End-to-end run: `npm run test:e2e` (with `npm run dev` running).

### Routes

| Route | Rendering | Notes |
|---|---|---|
| `/products` | Static shell; results render on the client in `<Suspense>` (they read `useSearchParams`) | Search, filters and sort live in the URL (`lib/marketplace.ts`) |
| `/products/[productId]` | All catalogue items prerendered via `generateStaticParams`; params awaited inside `<Suspense>` | Cache Components has no `dynamicParams`; unknown ids call `notFound()` (soft 404 with `noindex`) |
| `/cart`, `/checkout/address`, `/checkout/review`, `/wishlist` | Static shell + client components | Show a loading state until browser storage has been read |
| `/orders/[orderId]/confirmation`, `/orders/[orderId]/tracking` | Static shell; the `params` promise is passed to a client component and read with `use()` in `<Suspense>` | Orders live in browser storage, so the server cannot know them |

URLs use product **ids** (owner instruction), not the slugs proposed in the scope.

### State and persistence

| State | Owner | Storage | Key |
|---|---|---|---|
| Cart lines | `CartContext` | localStorage | `mithren.cart` |
| Wishlist | `WishlistContext` | localStorage | `mithren.wishlist` |
| Saved addresses | `AddressBookContext` | localStorage | `mithren.addresses` |
| Checkout session (cart or "Buy now", chosen address) | `CheckoutContext` | sessionStorage | `mithren.checkout` |
| Orders and tracking history | `OrdersContext` | localStorage | `mithren.orders` |
| Marketplace search, filters, sort | URL query string | — | — |
| Default address | `AddressBookContext` | localStorage | `mithren.addresses.default` |
| Demo account marker, profile, preferences | `DemoAccountContext` | localStorage | `mithren.demo-session`, `mithren.demo-profile`, `mithren.demo-preferences` |

- `hooks/usePersistentState.ts` reads storage with `useSyncExternalStore`: server and hydration renders see the initial value (no mismatch), every reader of a key stays in sync (also across tabs), stored JSON is validated by a `parse*` function, and `set` reports whether the write was persisted. If storage is blocked, values live in memory for the session.
- Prices and names are always looked up from the catalogue (`lib/cart.ts resolveLines`); orders store a **snapshot** of each line so later catalogue changes do not alter past orders.
- `placeOrder` builds and validates the order (`lib/orders.ts buildOrder`), saves it, and throws if saving failed; purchased items leave the cart only after that.
- **This is demo persistence, not an order database.** Data is per browser, unauthenticated, editable by the user and lost when site data is cleared. There is no payment, seller notification or delivery partner.

### Demo tracking controls

There is no delivery backend, so the tracking page has a "Demo tools" panel that moves an order to its next stage (stages only move forward, one at a time, with a timestamp). It renders only when `NODE_ENV !== "production"` or `NEXT_PUBLIC_DEMO_TOOLS=true`, so production builds hide it from customers (verified).

## Experience upgrade (phase 4)

| Decision | Reason |
|---|---|
| Page-level Suspense fallbacks are at least one screen tall (`ProductDetailSkeleton`, `LoadingState fullHeight`, the marketplace fallback) | **Root cause of "product page opens at the bottom".** With Partial Prefetching a product page first renders its short loading shell. The browser clamped the old scroll position to that short page, Next.js saw the new page's top edge on screen and (by design) kept the position, and Chrome's scroll anchoring then held the footer in place while the product streamed in. It depended on viewport height (reproduced at 1024×768 and 1366×657, not at 1440×900). A full-height placeholder puts the page top off screen, so Next.js scrolls to the top. No custom scroll code was added |
| "View full details" in the quick view closes the dialog | Next.js keeps up to three previous pages alive (hidden); a dialog left open reappeared, still open, after Back |
| Internal links use `next/link` everywhere (category tiles, banners, section "view all" links) | Plain `<a>` caused full page reloads into the marketplace |
| *(Superseded by phase 6.)* Homepage order: hero, categories, fresh picks, seasonal, collection banners, groceries, farm essentials, apparel, combo boxes, closing banner. Each product appears once (`freshPicks` leaves out seasonal items; the 23-product "Shop the marketplace" grid was removed) | The grid repeated every other section and duplicated `/products`, which has the full search, filters and sorting. `tests/smoke.test.tsx` checks that no product link repeats |
| Mobile header: logo, location (pin only under 430px), wishlist/cart, account in one row; search below; category row last | Shopping content starts higher on the first screen; no action was removed |
| Product page: image, name, price per pack, availability, seller, quantity, Add to cart + Buy now in one row, then "Product details". Image 4:3 on phones; two columns from md (768px) | Purchase controls start on the first screen on common phones; the wishlist heart moved onto the image |
| Mini cart "Checkout" starts the cart checkout (or opens the cart when something blocks it) | It used to link to `/cart` under a Checkout label |

## Demo customer account (phase 5)

Full description, storage keys and the production checklist: `docs/DEMO_ACCOUNT.md`. **Demo only: no authentication, no security.**

| Decision | Reason |
|---|---|
| Routes: `/login`, `/register`, `/account` (+ `profile`, `orders`, `orders/[orderId]`, `track`, `addresses`, `wishlist`, `settings`), public `/support` | Scope §8 names `/account` and `/account/orders`; order tracking stays at `/orders/[orderId]/tracking` and is linked, not duplicated |
| `DemoAccountContext` (inside the order and address providers) owns only the demo marker, profile and preferences; samples go into the existing stores flagged `is_sample` | No second address book or order model; logout removes exactly the samples |
| `app/account/layout.tsx` renders `AccountShell` (sidebar from lg, swipeable section pills below) and always renders its page; each page wraps its content in `RequireDemoSession` | A layout that withholds its page makes Next.js report "Could not validate … instant navigation" (dropped segment); a per-page gate also avoids redirect loops |
| `CheckoutContext.start` clears the previous checkout's address choice | So the default address (My Addresses) is preselected in each new checkout |
| `CustomerAccountService` is a type only | Documents the future backend contract without fake calls |

## Storefront update (phase 6)

Configuration for the new external links and videos: `docs/CONFIGURATION.md`.

| Decision | Reason |
|---|---|
| *(Superseded by phase 7.)* Homepage: hero → two video cards → Shop by category → Seasonal picks → Combo boxes → closing "browse the marketplace" banner → footer. Fresh picks, the twin promo banners, Organic groceries, Farm essentials and Women's apparel rows were taken off the homepage only | Requested focus. The section components (`ProductSection`, `PromoBanners`, `OrganicGroceriesSection`, `FarmEssentialsSection`, `WomensApparelSection`) and `freshPicks` stay in the codebase; every product is still reached from the category tiles, header navigation and `/products`. "Browse Fresh Produce" was read as the closing `MarketplaceBanner` that follows Combo boxes |
| *(Superseded by phase 7: now in the hero's "Grow with Mithren Agro" bar.)* Hero actions: **Investor Opportunities** (`/investors`) and **Agent Benefits** (`/agent-benefits`) replace "Shop Fresh Produce" and "Meet Our Farmers" | Requested. `MeetFarmersButton` (a popover only the hero used) was removed. Both pages are also linked from the footer ("Grow with us") |
| *(Superseded by phase 7: the strip is no longer shown.)* The hero's benefits strip lost its liquid-glass layers (translucent outer plate, reflection gradient, inset rims, glass icon chips); it is one near-opaque white panel with a light blur and a hairline border | Requested; the strip's content and layout are unchanged. Other glass surfaces (header, floating hero card, overlays) were not changed |
| `/investors` and `/agent-benefits` are static pages; all benefits are labelled as proposals, and no earnings, returns or eligibility are promised | No official policy exists. `ProvisionalNotice` marks proposed content; "Not yet published" placeholders hold the future policy documents |
| External destinations come only from `NEXT_PUBLIC_*` variables, validated by `safeExternalUrl` (https; http only for localhost). Missing → disabled "coming soon" button plus a note (`ExternalCta`) | Never invent URLs; never show a button that looks like a working application form; a bad value can't become a `javascript:` link |
| Video cards (`VideoCard`): `preload="none"`, poster through `next/image`, play only on request, the browser's own controls after starting, loading and error states, "coming soon" without a source | No video files exist in the repository; no autoplay with sound; nothing large is downloaded until asked |
| Toasts: one `ToastProvider` (no library), bottom of the screen, de-duplicated by id. Add to cart shows "Added to cart successfully!" only when `addItem` returns "added"; at the 20-item limit an error toast; if the browser won't store the cart, an info toast says it lasts for this visit | Requested feedback without a second toast library; success is never reported before the cart accepted the item |
| Browser-storage writes report whether they were saved (`usePersistentState.set` already returned it; the cart and address book now pass it on). Address add/edit/delete/default and cart removal toast success only when saved, otherwise an error | All "create/update/delete" operations in this frontend are synchronous localStorage writes: there is nothing to wait for, so no spinners or fake delays were added; the real failure (blocked storage) is reported |
| Shop toolbar: search, **Category** and **Sort** dropdowns (`ui/select.tsx`, Radix), Filter drawer. Controls update at once (`useOptimistic`); the results follow the committed URL, and if the navigation takes over 150 ms the grid shows `ProductGridSkeleton` and the count says "Updating results…" | Results come from the URL (back/forward and sharing keep working). The skeleton reflects the real router wait, never an artificial delay |
| `NavigationProgress`: a 2px bar at the top while a same-site link navigation is pending, shown only after 150 ms, cleared when the URL changes (10 s safety stop) | Immediate feedback for slow navigations without flashing on prefetched (instant) ones. Route-level loading UI was already in place: every dynamic route's static shell has a full-height Suspense fallback, which is what a `loading.tsx` would add |
| Buy now, Explore Demo Account and external CTAs show a spinner/"Opening…" while navigating (`useTransition`, `<Button loading>`) | Feedback on actions that leave the page |
| Page scrollbar hidden (`html { scrollbar-width: none }` + WebKit rule); swipe rows use the `scrollbar-none` utility | Requested clean look; overflow is never set to hidden, so wheel, touch, trackpad and keyboard scrolling are unchanged |
| Signed-out account menu: "Orders in this browser" became a **My Orders** link to `/account/orders` (the existing order history, still behind the demo gate); the latest orders stay listed beneath it | Requested label; access rules unchanged, and guests can still open their tracking pages from the list |
| Order history shows a skeleton until saved orders are read, an empty state, and a warning when site storage is blocked | Requested loading, empty and error states, based on what can actually fail here |

## Website upgrade (phase 7)

| Decision | Reason |
|---|---|
| Homepage: two-slide hero → About Mithren Agro → two video cards → Shop by category → Seasonal picks → Combo boxes → browse banner → footer | Requested order. Fresh picks and the in-between sections stay off the homepage |
| *(Reverted: see "Hero restored".)* `HeroSection` was a full-width slider of the two owner-supplied photos (`public/images/home/hero-slide-*.jpg`, 1600×900, real logo on the crate and bag). Copy sits on each photo's calm side (right on the crate, left on the bag; top on phones) over a plain dark gradient. No glass utilities or backdrop blur anywhere in the hero | Replaces the old static hero instead of adding a second one; the liquid-glass overlay is not reintroduced. The previous hero image (`mithren-hero-produce.png`) and `ValueStrip` are no longer used |
| *(Reverted with the slider.)* Slider behaviour: one `setTimeout` per slide keyed to `[running, index]` (manual moves restart it; nothing accumulates; cleared on unmount); pauses on hover, focus inside, hidden tab and the Pause button; no autoplay and no slide/zoom animation with reduced motion; inactive slide is `inert` and `aria-hidden`; arrows, dots, swipe and arrow keys; both images loaded once (first with `priority`) | WCAG 2.2.2 (pause control for moving content), no hidden focusable buttons, no layout shift (fixed heights) |
| *(Reverted with the slider.)* A "Grow with Mithren Agro" bar along the bottom of the hero held Agent Benefits and Investor Opportunities | The brief keeps these homepage entries, but slide 2's button is now "Shop Fresh Produce" (shopping); a bar shown on every slide keeps both entries visible |
| `AboutSection` (three descriptive highlights, no numbers) and a new `/about` page. The supplied About Us reference screenshot was not in the repository, so the layout follows the written description; the page uses the owner's branded crate photo unedited | No invented statistics, credentials or history; company details are marked "to be added" |
| **Product options (variants).** `Product.variants` (`ProductVariant`: id, label, optional unit, price, discounted price, stock) with `variant_type` (`weight`, `pack`, `volume`, `size`) and `default_variant_id`. The product's own unit/price/stock describe the default option, so listings, sorting, filters and facets are unchanged. `lib/variants.ts` resolves a product + option id into a `Selection`; unknown ids resolve to null, never to another option | Each option is priced and stocked on its own; nothing on the backend is implied. In production the seller portal / catalogue API must supply these fields |
| Cart items carry `variant_id`; lines are keyed by `lineKey(product, option)`, so two weights of one product are two lines. `resolveLines` takes price and stock from the option; `CartLine` has `key` and `selection`. Buy now sends `variant_id`; orders snapshot `variant_id`, `variant_label` ("Size M"), the option's unit, price and `category_id` | Every selected option affects the purchase: price, totals, stock blocking, cart, checkout, confirmation, tracking and history |
| Product page: option chips (native radios: arrow keys, screen-reader state), price, pack, stock, total, Add to cart and Buy now all follow the chosen option; out-of-stock options are shown but disabled. Cards: weight/pack products add the listed option (named in the toast); **apparel cards show "Choose size"** and link to the product page | Never add an apparel size the shopper didn't pick. Option changes are local and instant, so they show no loading state |
| Sample options: weights for loose produce, staples and soil bags; packs for bananas and spinach; sizes for apparel (ranges differ per item, some sizes out of stock); single-form items (papaya, jowar, garden compost, combo boxes) have none. No product is sold by volume yet | "Do not assign the same variants to every product" |
| Policies: `/privacy-policy`, `/terms-and-conditions`, `/cancellation-refund-policy`, `/shipping-policy`, `/return-policy` on a shared `PolicyPage` (contents list, draft notice, highlighted placeholders, links to the others). Rules come from `config/policies.ts`: cancellation can be requested until `ready_for_dispatch` (the app's packed status); routine returns only for women's apparel, 10 days from delivery | One source for the pages, the support FAQs and the per-order note, so they cannot disagree. Every page is a draft for review by a qualified Indian lawyer; no clause removes statutory rights |
| `OrderPolicyNote` on confirmation, tracking and account order pages: whether the order can still be cancelled and, once delivered, the return deadline for eligible apparel | Applies the stated rules to real order data. There is no self-service cancellation or return yet, so it points to support |
| Footer: About (with link), Shop, Customer support (Contact Us and FAQs are sections of `/support`, plus My Orders and Order Tracking), Policies, Grow with us | No dead links: every entry opens an existing page or section |

## Hero restored (27 Oct 2026)

| Decision | Reason |
|---|---|
| The two-slide hero was removed and the static hero that preceded it was restored: the committed `HeroSection` from Git (`0c33170`) with the phase-6 changes re-applied by the same edit as before (Investor Opportunities and Agent Benefits buttons, benefits strip without liquid glass). Same image (`mithren-hero-produce.png`), headline, copy, layout and breakpoints as before the slider | Owner request. The pre-slider version was never committed, so Git alone holds the older "Shop Fresh Produce / Meet Our Farmers" hero; re-applying the recorded phase-6 edit reproduces the version that was live before the slider exactly. The "Grow with Mithren Agro" bar went with the slider: the hero buttons are those entries again |
| Slider-only code removed (component logic, progress keyframes). No dependency was added for it, so none was removed. `hero-slide-farm-crate.jpg` stays (About page); `hero-slide-kitchen-bag.jpg` is kept, unused, for later | "Remove slider code; keep the two images" |
| About Mithren Agro made compact: smaller padding and gaps, h2 at text-xl/2xl, 14px description, smaller Learn More, cards with 36–40px icons, icon beside text from lg | Owner request: it must not overpower the hero |

## Conflicts between the references (open)

The development guide states that **the scope wins** where the two disagree. The project owner's instructions take precedence over both.

| # | Topic | Scope says | Dev guide says | Owner / image says | Working resolution |
|---|---|---|---|---|---|
| 1 | Backend | Real full-stack app with persistent data | No backend; everything mock | Frontend only, mock services, no DB/auth/payments now | Mock-only for this repository and phase; service layer kept swappable |
| 2 | Brand | Temporary name "GreenBasket" | — | Mithren Agro | Mithren Agro, configurable |
| 3 | Catalogue | Fruits, vegetables, organic grocery | Placeholder grocery categories | Adds fertilizers and women's apparel | Follow owner; apparel needs size/colour variants rather than weight units — **to confirm before data modelling** |
| 4 | Palette | Bright white/light background, forest green, emerald, sparing lime | Pending image | Modern Sage palette (owner decision) | **Resolved:** Modern Sage, primary `#2E7D32` / hover `#1B5E20`; see `docs/DESIGN_SYSTEM.md` |
| 5 | Routes | `/products/[slug]`, `/account/orders`, `/checkout/success` | `/products/[productId]`, `/orders`, `/order-confirmation` | — | Scope routes (guide defers to scope) |
| 6 | Forms/validation | Zod + React Hook Form recommended | No form libraries | — | **To decide** before checkout work |
| 7 | Login | Required for checkout | Guest checkout assumed; mock Google sign-in proposed | — | Scope wins: login required for checkout (mocked) |
| 8 | Reference image content | No unsupported claims; never fabricate ratings/reviews/certification | Same | Image shows "100% honestly-labelled", "Organic Certified", "10,000+ happy families", "12-hour freshness guarantee", star ratings and named testimonials | Reproduce the layout, but treat these as content slots that need verified data or clear demo labelling — **to confirm** |
| 9 | Payment logos | Razorpay when configured | Payment UI simulated | Image footer shows Razorpay, UPI, Visa, Mastercard, RuPay | Show only as "accepted methods" once confirmed; no real payment |

## Pending before UI work

- Resolve conflicts 3, 6 and 8 above. The full, updated register is in `docs/REQUIREMENTS_REGISTER.md`.
- The shadcn `.dark` palette in `globals.css` is still neutral grey. Dark mode is not in either document, so it is unused and untouched.
