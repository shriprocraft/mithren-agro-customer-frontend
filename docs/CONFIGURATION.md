# Configuration

All configuration is through public environment variables (`NEXT_PUBLIC_*`), listed in `.env.example`. Copy it to `.env.local` (git-ignored) and fill in what you have. **These values are sent to every visitor's browser: never put a secret, API key or password in them.** They are read when the app is built, so rebuild (`npm run build`) or restart `npm run dev` after changing one.

Nothing here has a default production value: no URL was invented. When a value is missing or unsafe, the site shows a safe state instead of a broken link.

| Variable | Used by | When empty or invalid |
|---|---|---|
| `NEXT_PUBLIC_INVESTOR_PORTAL_URL` | "Access Investor Portal" on `/investors` (hero and closing panel). Opens the separate Investor Portal application in the same tab; this storefront does not handle investor sign-in | Disabled "Investor Portal: coming soon" button with a note |
| `NEXT_PUBLIC_SELLER_AGENT_APPLY_URL` | "Apply as a Seller Agent" on `/agent-benefits` | Disabled "Seller Agent applications: coming soon" |
| `NEXT_PUBLIC_DELIVERY_AGENT_APPLY_URL` | "Apply as a Delivery Agent" on `/agent-benefits` | Disabled "Delivery Agent applications: coming soon" |
| `NEXT_PUBLIC_VIDEO_FARM_TO_HOME_URL` | Homepage video card "From Farm to Your Home" | Poster image with "Video coming soon"; no play button, nothing downloaded |
| `NEXT_PUBLIC_VIDEO_GROW_WITH_US_URL` | Homepage video card "Grow With Mithren Agro" | Same |
| `NEXT_PUBLIC_DEMO_TOOLS` | `true` shows the demo tracking controls in a production build (development always shows them) | Hidden in production |

## Accepted values

- **Links** (`*_URL` for the portal and applications): absolute `https://` URLs. `http://` is accepted only for `localhost` / `127.0.0.1`, for local testing. Anything else (`javascript:`, `data:`, protocol-relative `//host`, plain `http://` to another host) is ignored. Validation: `safeExternalUrl` in `src/config/external-links.ts`.
- **Videos**: an `https://` URL or a path to a file under `public/` (for example put `farm-to-home.mp4` in `public/videos/` and set `/videos/farm-to-home.mp4`). MP4 (H.264/AAC) plays in every supported browser. Validation: `safeMediaUrl`.

## Policy rules

`src/config/policies.ts` holds the rules the policy pages state and the order screens apply:

| Setting | Current value | Used by |
|---|---|---|
| `cancellation.packedStatus` | `ready_for_dispatch` ("Ready for Dispatch", the packed state) | Cancellation and Refund Policy table, Terms, support FAQ, the note on each order |
| `returns.eligibleCategories` | `["womens-apparel"]` | Return Policy, Terms, support FAQ, the order note |
| `returns.windowDays` | `10` (from the delivery date) | Same |
| `lastUpdated` | `null` (shows "to be added") | Every policy page |

`policyPlaceholders` lists the business details still missing (registered address, CIN, support email and phone, Grievance Officer, jurisdiction). They appear highlighted on the pages until replaced. **All policy pages are drafts and must be reviewed by a qualified Indian lawyer before publication.**

## Product options

Options (weights, packs, sizes) are sample data in `src/data/products.ts` (`productOptions`). When the catalogue comes from the seller portal or an API, it must return `variants`, `variant_type` and `default_variant_id` per product, with each option's own price and stock (see `ProductVariant` in `src/types/catalog.ts`); the storefront needs no other change.

## Changing the copy

- Video titles, descriptions and poster images: `homeVideos` in `src/config/external-links.ts`.
- Agent Benefits content: `src/app/agent-benefits/page.tsx` (data arrays at the top). Investor content: `src/app/investors/page.tsx`.
- Both pages describe **proposed** terms. Replace the provisional notices and the "Not yet published" policy list once official documents exist, and have the investor wording reviewed by a qualified adviser before launch.
