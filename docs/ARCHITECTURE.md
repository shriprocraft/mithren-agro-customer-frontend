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
| Homepage order: hero, categories, fresh picks, seasonal, collection banners, groceries, farm essentials, apparel, combo boxes, closing banner. Each product appears once (`freshPicks` leaves out seasonal items; the 23-product "Shop the marketplace" grid was removed) | The grid repeated every other section and duplicated `/products`, which has the full search, filters and sorting. `tests/smoke.test.tsx` checks that no product link repeats |
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
