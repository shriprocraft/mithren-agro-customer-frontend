# Requirements and Assumptions Register

Updated version of Section Q of `CUSTOMER_APP_FRONTEND_DEVELOPMENT.md`, checked against `ORGANIC_MARKETPLACE_CUSTOMER_APP_SCOPE.md` and the reference image. The guide itself is left unchanged as a supplied reference.

Precedence: project owner's instructions → scope → development guide (the guide states "the scope wins").

**Status key:** Confirmed (stated in the scope or by the owner) · Decided (resolved by precedence) · Open (needs an owner answer) · Future backend (not possible without a backend).

| Requirement / decision | Status | Source | Implementation impact |
|---|---|---|---|
| Customer scope document | Confirmed | Scope supplied and reviewed | This register replaces the guide's assumptions |
| Reference UI image | Confirmed | `docs/reference/ui-theme.png` reviewed | Tokens in `src/config/design-tokens.ts`; no "TBD" values remain |
| Mock data only, no backend in this repo | Confirmed | Owner; guide Section 0 | Scope's real full-stack requirement deferred; `services/` kept swappable |
| Multi-vendor marketplace | Confirmed | Scope §1, §4.5 | Seller/store on cards and details; parent order + per-seller sub-orders (simulated) |
| Brand name | Confirmed | Owner (scope placeholder was "GreenBasket") | "Mithren Agro" in `src/config/site.ts` |
| Product categories | Confirmed, partly Open | Scope §4.2 + owner/image | Scope list plus Fertilizer and Ladies Dresses from the image; **apparel attributes (size, colour) open** |
| Product attributes | Confirmed | Scope §4.4, §5 | Variants (250 g / 500 g / 1 kg / bunch / box / piece), seller, stock, harvest/packed/best-before, storage, origin, verified-organic flag |
| Ratings and reviews | Confirmed | Scope §2.2, §4.4, §4.6 | Ratings on cards; reviews on details; never fabricated |
| Currency and number format | Confirmed | Scope §4.5 (Razorpay, India), §9.2 (paise), image (₹) | INR, integer paise, `en-IN` locale |
| Login required to browse | Confirmed: not required | Scope §3.1 | Guests browse, search, view and add to cart |
| Login required for checkout | Owner decision (phase 3): not required in this demo | Scope §3.1 vs owner brief | Checkout runs without sign-in; revisit when authentication is built |
| Google Login | Open | Guide proposal; scope names no provider | Mock "demo sign-in" only; no auth library |
| Payment methods | Confirmed (display), Future backend (processing) | Scope §4.5; image footer | Razorpay / UPI / cards / net banking / COD shown as simulated; no payment is taken |
| Delivery charge / free-delivery rule | Open | Image shows "Free delivery above ₹599"; scope gives no rule | No charge is applied or invented: `CONFIGURED_CHARGES` is empty and pages say "Delivery: not calculated in this preview" |
| Per-vendor order splitting | Confirmed | Scope §4.5 | Cart grouped by seller; mock order creates vendor sub-orders |
| Delivery tracking stages | Confirmed (owner) | Phase 3 brief | Order Placed → Order Confirmed → Preparing Order → Ready for Dispatch → Out for Delivery → Delivered |
| Real delivery tracking | Future backend | — | Simulated timeline with visible notice |
| Order history | Confirmed | Scope §4.6, §8 | `/account/orders` (scope route, not the guide's `/orders`) |
| Account / profile | Confirmed | Scope §4.6 | `/account` with profile and preferences (mock) |
| Saved addresses | Confirmed | Scope §4.6 | Multiple addresses with a default (mock) |
| Delivery area / postcode | Confirmed | Scope §2.2, §4.1 | Postcode selector in header; serviceability is mocked |
| Related products | Confirmed | Scope §4.4 | Included on product details (guide excluded it by default) |
| Recently viewed | Confirmed | Scope §4.1, §4.4 | Only "where data is available": local browsing history |
| Stock-based quantity limits | Open | Scope requires seller-specific stock; no limits given | Fixed max constant until confirmed |
| Routes | Decided (owner, phase 3) | Owner brief overrides scope §8 | `/products`, `/products/[productId]` (ids, not slugs), `/cart`, `/checkout/address`, `/checkout/review`, `/orders/[orderId]/confirmation`, `/orders/[orderId]/tracking`, `/wishlist` |
| Homepage vs listing on `/` | Decided | Scope §4.1 + image | `/` is a sectioned homepage; filtering/sorting live on `/products` and `/search` (guide put the listing on `/`) |
| Forms and validation library | Decided (phase 3) | No library added | Address validation is hand-written in `lib/address.ts` (Indian mobile and PIN rules), unit-tested |
| Unsupported claims in the image | Decided for the homepage | Scope §2.2, §4.1, §11 forbid them | Omitted: "Organic Certified", "100% honestly-labelled", "10,000+ happy families", "12-hour freshness guarantee", "Free delivery above ₹599", "Same-day", partner-farm profiles, testimonials, payment logos. The value strip states only how listings are presented |
| Ratings on product cards | Deferred | Scope §2.2 requires them; §4.4 and §11 forbid fabricating them | Not shown until real review data exists |
| Homepage sections | Implemented with mock data | Scope §2.2, §4.1; owner's homepage brief | Hero, category grid, fresh picks, seasonal, shop browser, groceries, farm essentials, apparel, combo boxes, banner. "Popular near you", recently viewed and recommendations need real data and are not shown |
| Cart persistence via localStorage | Decided | Guide §J | Hydration-safe; temporary until a server cart exists |
| Stack | Confirmed | Owner + both documents | Next.js 16, React 19, TypeScript strict, Tailwind v4, shadcn/ui, Framer Motion, Vitest |
| Component files under ~100 lines | Confirmed (guideline) | Guide §K | Checked in Phase 6 |

## Deviations from the reference image

| Element | Image | Implemented | Reason |
|---|---|---|---|
| Small "Add to cart" and pill buttons | About 26–30 px tall at reference scale | Minimum 44 px (`h-11`) | Guide Section N tap-target rule |
| Input borders | Very light | `#87907f` | WCAG 1.4.11 needs 3:1 for input boundaries |
| Gold accent | Bright logo/star gold | `#d9a21b`, decorative only | Below 3:1; never used as the only carrier of meaning |
| Typefaces | Unidentified geometric sans | Outfit (headings), Inter (body) | Closest readable matches; replace if brand fonts are supplied |
