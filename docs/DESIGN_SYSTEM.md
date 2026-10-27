# Mithren Agro Design System — Modern Sage

**Status: permanent standard for all Mithren Agro customer-frontend work.** Every new or changed page, component, dialog, form and interactive element follows this document. Do not introduce other brand greens or unrelated palettes without explicit approval from the project owner.

## Where the colours live

| Layer | File | Role |
|---|---|---|
| Source of truth | `src/config/design-tokens.ts` | Every hex value, with its contrast ratio |
| CSS variables | `src/app/globals.css` (`:root`) | Mirror of the tokens; shadcn/ui variable names where one exists |
| Tailwind theme | `src/app/globals.css` (`@theme inline`) | Exposes the variables as utilities: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-soft`… |
| Shared components | `src/components/ui/*` | Button, Input, Popover and Dialog consume the tokens; pages reuse these |
| Guard | `tests/design-tokens.test.ts` | Fails if CSS and tokens drift, if the primary colours change, or if a component hardcodes a hex value or a Tailwind palette colour such as `green-600` |

To change a colour, change it in **both** `design-tokens.ts` and `:root`, and keep the test passing. Components never use raw hex values.

## Official palette

### Core brand

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| Canvas / Main Background | `#FFFFFF` | `bg-background`, `bg-card` | Page, header, cards, popovers |
| Primary Brand Green | `#2E7D32` | `bg-primary`, `text-primary`, `text-brand` | Primary buttons, links, active states, key icons |
| Primary Hover Green | `#1B5E20` | `bg-primary-hover` | Primary hover; dark green text on tinted surfaces |
| Accent Green | `#A7D96C` | `bg-accent-green` | Decoration only (leaf marks, small fills). Never text |
| Soft Background Green | `#F5FDF7` | `bg-soft`, `bg-accent` | Selected section backgrounds, hover surfaces |
| Deep Heading Green | `#1F2D21` | `text-foreground` | Headings, product names, important text |

### Supporting

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| Body Text | `#667085` | `text-muted-foreground` | Descriptions, metadata, secondary text |
| Borders and Dividers | `#E8F1EA` | `border-border` | Card edges, dividers, outline buttons |
| Card Background | `#F0F9F4` | `bg-secondary`, `bg-muted`, `bg-band` | Tinted cards, chips, highlighted containers, announcement bar |
| Highlight / Warm Accent | `#FFD88A` | `bg-highlight` | Decorative fills and badges with dark text. **Never** a primary button |
| Logo Gold | `#F5A51C` (hover `#E8960C`, pressed `#D6870A`) | `bg-gold`, `bg-gold-hover`, `bg-gold-active` | **Buy now only** (`<Button variant="buy">`), always with Deep Heading Green text: 7.06:1, hover 6.05:1, pressed 5.04:1. Sampled from the warm band of `public/images/mithren-agro-logo.png` (#C07800–#F8A818); approved by the owner on 27 Oct 2026 |

### Derived (not in the reference, needed for states and accessibility)

| Token | Hex | Why |
|---|---|---|
| Primary pressed | `#154A19` (`bg-primary-active`) | Active/pressed state, a step darker than hover |
| Input border | `#7A8C7D` (`border-input`) | Form-control outlines need 3:1 (WCAG 1.4.11); `#E8F1EA` is only 1.15:1 |
| Shadow tint | `31 45 33` (`--shadow-tint`) | Deep Heading Green as RGB channels: `rgb(var(--shadow-tint) / 0.1)` |

### Semantic

| State | Hex | Tailwind | Notes |
|---|---|---|---|
| Success | `#2E7D32` | `text-success` | Brand green; always with an icon and text |
| Warning | `#B54708` | `text-warning` | Amber |
| Error / destructive | `#B42318` | `text-destructive`, `variant="destructive"` | Red; destructive buttons keep this meaning |
| Information | `#175CD3` | `text-info` | Blue |

Colour is never the only signal: stock status, errors and selection always pair colour with text or an icon.

## Buttons

Use `<Button>` from `src/components/ui/button.tsx`. Do not restyle buttons per page.

| Variant | Default | Hover | Pressed | Text |
|---|---|---|---|---|
| `default`: **every primary action** (Add to cart, Shop, Checkout, Apply, Save, Confirm…) | `#2E7D32` | `#1B5E20` | `#154A19` | `#FFFFFF` |
| `outline`: secondary actions | `#FFFFFF`, `#E8F1EA` border | `#F5FDF7`, green-tinted border | — | `#2E7D32` |
| `secondary`: tinted secondary | `#F0F9F4`, `#E8F1EA` border | slightly greener tint | — | `#1B5E20` |
| `ghost`: icon and low-emphasis actions | transparent | `#F5FDF7` | — | inherits; `#2E7D32` on hover |
| `destructive` | light red | darker light red | — | `#B42318` |
| `link` | — | underline, `#1B5E20` | — | `#2E7D32` |
| `buy`: **Buy now only** | `#F5A51C` | `#E8960C` | `#D6870A` | `#1F2D21`, semibold |

- **Primary buttons are always `#2E7D32` → `#1B5E20` on hover**, everywhere: one green, no gradients, no per-page variants. The single approved exception is **Buy now**, which uses the logo gold (`variant="buy"`) so it stands apart from Add to cart; do not use gold for any other action. A link styled as a primary CTA uses the `surface-primary` utility with `hover:bg-primary-hover` (see `PromoBanners`).
- **Focus:** every interactive element shows a solid 2px `#2E7D32` ring (`focus-visible:ring-2 focus-visible:ring-ring`); buttons add a 2px offset. 5.13:1 against white.
- **Disabled:** the primary becomes a flat `#E8F1EA` chip with `#667085` text and no shadow; other variants fade to 50%. Disabled controls are not focusable or clickable.
- **Size:** at least 44px tall (`h-11`); pill shaped.

## Backgrounds, cards and surfaces

- `#FFFFFF` is the dominant background. Keep the experience light: no large dark-green blocks.
- `#F5FDF7` for a selected or highlighted section band; `#F0F9F4` selectively for tinted cards and chips.
- Product and content cards: white (`surface-card`) with a `#E8F1EA` hairline and one soft green-tinted shadow. Product images sit on white; never put colour overlays on product photography.
- Glass (`glass-*` utilities) is reserved for floating surfaces over imagery: header (near-opaque white), search field, hero card, benefits strip, popovers and dialogs. Do not make ordinary cards translucent. Every backdrop blur is a GPU render pass on each scroll frame, so anything repeated per item (icon chips on product cards) uses `glass-chip-solid` (same look, no blur), and soft blurred decoration is baked into images rather than CSS `filter: blur()` (see docs/PERFORMANCE.md).
- Radii: cards `rounded-2xl`, large panels `rounded-3xl`, controls fully rounded.

## Typography and text colour

- Headings and product names: `text-foreground` (`#1F2D21`). One highlighted word may use `text-primary`.
- Descriptions, metadata and helper text: `text-muted-foreground` (`#667085`).
- Eyebrows, links and selected navigation: `text-primary` / `text-brand`.
- Fonts: Poppins for headings and body; Caveat only for the hero's handwritten note.

## States

| State | Treatment |
|---|---|
| Hover | Primary: `#1B5E20`. Neutral surfaces: `#F5FDF7`. Neutral icons/text turn `#2E7D32` |
| Focus | Solid 2px `#2E7D32` ring |
| Active / pressed | Primary `#154A19`, 1px press-down |
| Selected | Filter chips: primary fill with white text. Navigation: `#2E7D32` text with a 2px `#2E7D32` underline. Radio rows: `#F0F9F4` fill |
| Disabled | Primary: `#E8F1EA` with `#667085` text. Others: 50% opacity |
| Empty / loading | White card with `#E8F1EA` border, `#667085` text, an outline button to recover |
| Success / warning / error / info | Semantic tokens above, always with an icon and text |

## Layout, spacing and mobile conventions

Phones are designed first; the same components scale up. Reuse these values instead of inventing new ones.

| Use | Phones | From sm / md / lg |
|---|---|---|
| Page gutter | `Container`: 16px | 24px (sm), 32px (lg) |
| Space between homepage sections | `py-6` (24px) | `sm:py-8` |
| Grid gap between product cards | 10–12px (`gap-2.5`/`gap-3`) | `sm:gap-3`, 16px on product pages |
| Card padding | `p-1.5` product card, `p-3` list rows, `p-5` panels | `sm:p-2`, `sm:p-4`, `sm:p-6` |
| Page title (`h1`) | 26px (`text-[1.625rem]`) | `sm:text-3xl`/`text-4xl` |
| Product name on cards | 14px medium, clamped to 2 lines | same |
| Price on cards / product page | 15px semibold / 28px | same |
| Secondary text (pack size, seller) | 12px, `text-muted-foreground` | same; nothing smaller than 11px |

- **Touch targets:** buttons, steppers, filter rows and icon buttons are at least 44 × 44px (`Button` sizes already are). Text links in breadcrumbs and the footer are at least 36px tall.
- **Swipe rows** (category tiles, product rows, combo boxes on phones) scroll inside themselves with `snap-x` and `scroll-px-4`; their arrow buttons are shown from md only. Never hide page overflow to mask a wide element: find it and add `min-w-0` (grid and flex items default to their content width).
- **No hover-only behaviour:** quick view is a desktop extra (md+); on touch screens the card itself opens the product page.
- **Route loading states** (Suspense fallbacks for a whole page) must be at least one screen tall (`min-h-svh`, `LoadingState fullHeight`, `ProductDetailSkeleton`). A shorter placeholder lets Next.js keep the previous scroll position, so the new page opens at its bottom.

## Dropdowns, feedback and loading

- **Dropdowns:** single-choice menus use `Select` from `src/components/ui/select.tsx` (Radix: keyboard, typeahead, screen-reader roles). White pill trigger with a 45% input-colour border, optional leading icon, chevron that turns when open; the menu is a white card (`z-50`, portalled, so it is never behind cards) with a soft-green highlighted row, a `#F0F9F4` selected row and a check mark. Give every trigger an `aria-label` or a visible label.
- **Toasts:** `useToast()` (`src/context/ToastContext.tsx`): `success`, `error`, `info`, an optional description and one action link. Show a success toast only after the change has been accepted and saved (e.g. `addItem` returned "added"); pass an `id` so repeated clicks replace one toast. Success/info dismiss after 3.5–4 s, errors after 6.5 s; hovering or focusing pauses them. They are announced (status/alert), so don't also call `useAnnounce` for the same message.
- **Loading:** page-level fallbacks are at least one screen tall (see "Experience upgrade" in ARCHITECTURE). Product lists use `ProductGridSkeleton` (same grid and card outline as the real cards). In-place waits use `useDelayedFlag` so anything faster than 150 ms shows no skeleton. Buttons that start a navigation or async action use `<Button loading>` (spinner, disabled, `aria-busy`). Never add a delay to show an animation. All skeleton and spinner animations stop under `prefers-reduced-motion`.
- **Scrollbars:** the page scrollbar is hidden (`html { scrollbar-width: none }` plus the WebKit rule) and scrolling is unchanged; use the `scrollbar-none` utility for horizontal swipe rows. Never hide overflow to hide a scrollbar.

## About, options and policy pages

- **About panel**: one compact white `surface-card` panel (about 160–200px tall on desktop), copy and an outlined pill "Learn More" (2px brand-green border, fills green on hover) on the left; three small `bg-soft` highlight cards on the right, icon beside text from lg. Highlights are words, not numbers. It must stay visually lighter than the hero.
- **Option chips** (product page): native radios styled as rounded chips; selected = brand border on `bg-secondary`; unavailable = dashed border, struck-through label, disabled.
- **Policy pages** (`PolicyPage`): reading width (max-w-3xl), 1.7 line height, numbered sections, sticky contents list from lg, draft notice with a warning icon, missing details as highlighted `<Placeholder>`.

## Building new components and pages

1. Start from the shared primitives (`Button`, `Input`, `Popover`, `Dialog`, `Heading`, `Text`) and the existing cards.
2. Use only semantic Tailwind classes backed by tokens: `bg-primary`, `bg-soft`, `bg-secondary`, `border-border`, `text-foreground`, `text-muted-foreground`, `text-primary`, `text-success`, `text-warning`, `text-destructive`, `text-info`.
3. Need a colour that is not here? Ask first. If approved, add it to `design-tokens.ts`, `:root`, `@theme` and this document together.
4. Run `npm test`: the guard fails on hardcoded hex values and Tailwind palette colours in `src/components`.

## Accessibility and contrast (WCAG 2.2 AA)

| Pair | Ratio | Requirement |
|---|---|---|
| White on `#2E7D32` (primary button) | 5.13:1 | ≥ 4.5 |
| White on `#1B5E20` (hover) | 7.87:1 | ≥ 4.5 |
| `#1F2D21` on white (headings) | 14.43:1 | ≥ 4.5 |
| `#667085` on white (body) | 4.97:1 | ≥ 4.5 |
| `#667085` on `#F0F9F4` | 4.63:1 | ≥ 4.5 |
| `#2E7D32` on white (links, green text) | 5.13:1 | ≥ 4.5 |
| `#2E7D32` focus ring on white | 5.13:1 | ≥ 3 |
| `#7A8C7D` input border on white | 3.57:1 | ≥ 3 |

- `#A7D96C`, `#FFD88A` and `#E8F1EA` are below 3:1 on white: decoration, fills and dividers only, never text or the only boundary of a control.
- Keep visible focus, keyboard operation, 44px targets, text plus icon for status, and `prefers-reduced-motion` support.
