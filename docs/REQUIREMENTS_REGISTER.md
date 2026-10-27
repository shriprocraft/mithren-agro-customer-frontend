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
| Google Login | Open | Guide proposal; scope names no provider | Demo account only ("Explore Demo Account", no credentials; `docs/DEMO_ACCOUNT.md`); no auth library. Provider to be chosen after checking the seller/delivery portals' backend |
| Payment methods | Confirmed (display), Future backend (processing) | Scope §4.5; image footer | Razorpay / UPI / cards / net banking / COD shown as simulated; no payment is taken |
| Delivery charge / free-delivery rule | Open | Image shows "Free delivery above ₹599"; scope gives no rule | No charge is applied or invented: `CONFIGURED_CHARGES` is empty and pages say "Delivery: not calculated in this preview" |
| Per-vendor order splitting | Confirmed | Scope §4.5 | Cart grouped by seller; mock order creates vendor sub-orders |
| Delivery tracking stages | Confirmed (owner) | Phase 3 brief | Order Placed → Order Confirmed → Preparing Order → Ready for Dispatch → Out for Delivery → Delivered |
| Real delivery tracking | Future backend | — | Simulated timeline with visible notice |
| Order history | Confirmed (demo implemented, phase 5) · Future backend | Scope §4.6, §8 | `/account/orders` and `/account/orders/[orderId]`: orders saved in this browser plus labelled sample orders |
| Account / profile | Confirmed (demo implemented, phase 5) · Future backend | Scope §4.6 | `/account`, `/account/profile`, `/account/settings` with sample data in this browser; real accounts need authentication |
| Saved addresses | Confirmed (demo implemented, phase 5) | Scope §4.6 | `/account/addresses`: same address book as checkout, with a default that checkout preselects |
| Delivery area / postcode | Confirmed | Scope §2.2, §4.1 | Postcode selector in header; serviceability is mocked |
| Related products | Confirmed | Scope §4.4 | Included on product details (guide excluded it by default) |
| Recently viewed | Confirmed | Scope §4.1, §4.4 | Only "where data is available": local browsing history |
| Stock-based quantity limits | Open | Scope requires seller-specific stock; no limits given | Fixed max constant until confirmed |
| Routes | Decided (owner, phase 3) | Owner brief overrides scope §8 | `/products`, `/products/[productId]` (ids, not slugs), `/cart`, `/checkout/address`, `/checkout/review`, `/orders/[orderId]/confirmation`, `/orders/[orderId]/tracking`, `/wishlist` |
| Homepage vs listing on `/` | Decided | Scope §4.1 + image | `/` is a sectioned homepage; filtering/sorting live on `/products` and `/search` (guide put the listing on `/`) |
| Forms and validation library | Decided (phase 3) | No library added | Address validation is hand-written in `lib/address.ts` (Indian mobile and PIN rules), unit-tested |
| Unsupported claims in the image | Decided for the homepage | Scope §2.2, §4.1, §11 forbid them | Omitted: "Organic Certified", "100% honestly-labelled", "10,000+ happy families", "12-hour freshness guarantee", "Free delivery above ₹599", "Same-day", partner-farm profiles, testimonials, payment logos. The value strip states only how listings are presented |
| Ratings on product cards | Deferred | Scope §2.2 requires them; §4.4 and §11 forbid fabricating them | Not shown until real review data exists |
| Homepage sections | Implemented with mock data | Scope §2.2, §4.1; owner's homepage briefs | Hero (Investor Opportunities and Agent Benefits actions), two video cards (sources configurable, none supplied yet), category grid, seasonal, combo boxes, closing banner (27 Oct 2026 brief; the per-category rows were removed from the homepage). "Popular near you", recently viewed and recommendations need real data and are not shown |
| Agent Benefits page | Implemented, provisional content | Owner brief 27 Oct 2026 | `/agent-benefits`: Seller and Delivery Agent roles, proposed benefits and responsibilities, how it works, onboarding, FAQ. **Needs:** official agent terms, commission/payment terms, eligibility and verification rules, and application URLs (`NEXT_PUBLIC_*_AGENT_APPLY_URL`) |
| Investor Opportunities page | Implemented, provisional content | Owner brief 27 Oct 2026 | `/investors`: business overview, proposed benefits, process, eligibility, risks, FAQ, "Access Investor Portal". **Needs:** the Investor Portal URL (`NEXT_PUBLIC_INVESTOR_PORTAL_URL`), official investor documents, and legal/regulatory review of the wording |
| About Us | Implemented | Owner brief 27 Oct 2026 | Homepage About section and `/about`. **Needs:** company registration details, registered address and official contact channels (marked "to be added"); the About Us reference screenshot mentioned in the brief was not supplied in the repository |
| Product options (weights, packs, sizes) | Implemented with sample data | Owner brief 27 Oct 2026 | Cart, checkout and orders keep the chosen option and its price. **Needs:** the seller portal / catalogue API to supply `variants` per product with real prices and stock (none is backend-controlled yet) |
| Policy pages (privacy, terms, cancellation & refund, shipping, returns) | Drafts | Owner brief 27 Oct 2026; scope §8 | Five pages; rules in `config/policies.ts` (no cancellation once packed; 10-day returns for women's apparel only). **Needs:** review by a qualified Indian lawyer (incl. Consumer Protection (E-Commerce) Rules, 2020 and the DPDP Act, 2023), Grievance Officer and company details, delivery charges and areas, refund and return timelines, service-provider list |
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
