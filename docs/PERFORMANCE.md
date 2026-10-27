# Scroll performance (27 Oct 2026)

Investigation of "the site feels slightly laggy while scrolling". Everything below was measured, not estimated, with the two scripts in `scripts/` (headless Chrome over the DevTools protocol, no extra dependencies).

## How it was measured

- `node scripts/perf-scroll.mjs <baseUrl> <label>`: real scroll gestures (`Input.synthesizeScrollGesture`, 1,500 px/s, down then up) at **4× CPU throttling**, at 1440×900 (mouse) and 390×844 @2x (touch), each case 3 times (median run reported). Records frame intervals (requestAnimationFrame) and a performance trace (main thread, raster, GPU). Options: `PERF_PAGES`, `PERF_REPEAT`, `PERF_CSS` (inject CSS for an A/B experiment), `PERF_DUMP=1` (save the raw trace), `PERF_BLOCK_PREFETCH=1`.
- `node scripts/perf-images.mjs <baseUrl>`: every image after a full scroll, with format, bytes, served width and displayed size.
- Measure a **production** build (`npm run build && npm start`); `next dev` is not representative.
- Headless Chrome renders frames at a fixed 60 or 30 fps cadence and composites on a software GPU, so the useful signals are frames longer than 50 ms, and the GPU work recorded in the trace (render passes and their draw time).

## Findings

| Suspect | Result | Evidence |
|---|---|---|
| **Backdrop-filter "glass" chips repeated on every product card** (wishlist heart, quick view: `glass-chip`, 12px blur + saturate) | **Confirmed: the largest GPU cost while scrolling.** Each blurred chip is its own render pass on every frame | `/products` (56 blurred elements): disabling all backdrop filters cut GPU render-pass draw time from 248 → 24 ms on desktop and 41 → 9 ms on mobile per scroll pass |
| **Live CSS `blur(10px)` + `mask-image` on the three page-height foliage accents** (`PageBackdrop`) | **Confirmed, smaller.** Long GPU render passes (up to 54 ms) appeared in the long frames on desktop | A/B with `filter: none`: desktop `/products` frames > 33 ms 10 → 3, p95 33 → 17 ms |
| Sticky glass header (backdrop blur over moving content, desktop only) | Costs one render pass per frame. **Kept**: removing it changes the design (the hero photograph runs under it), and the nested glass inside it showed no measurable cost | Disabling only the nested blurs: 450 vs 444 render passes |
| System memory pressure | **Confirmed as a large factor on this machine.** With two Next servers and Chrome running (~2 GB free), long frames tripled and Chrome stopped responding; with one server, scrolling was smooth | Same build: `/products` desktop long-frame runs 3/6/8 under pressure vs 2/3/4 without |
| Next.js link prefetching while links scroll into view | Small main-thread work (2–7 ms per call) seen in some long frames; blocking prefetches gave mixed results. **Kept** (it makes navigation instant) | `PERF_BLOCK_PREFETCH=1` A/B |
| Images | **Not a cause.** All images go through `next/image` (WebP, responsive widths), below-the-fold ones are lazy, the hero is eager with priority; ~650 KB for the desktop homepage | `perf-images.mjs` |
| JavaScript during scrolling | **Not a cause.** No scroll-linked app code; script time during scrolling is React's root event delegation (wheel/pointer events) and Next's prefetch | Trace: `EventDispatch wheel/pointermove` in `react-dom`; no app handlers |
| Framer Motion | **Not a cause.** Used only for the cart/wishlist count badge (animates on change) and `MotionConfig` | Code inspection |
| `next dev` vs production | Scrolling itself is similar (compositor-driven); dev mode decodes images more slowly and runs unminified code | `dev-mode` run |

## Changes

1. **`glass-chip-solid`** (same fill, highlight and rims, no backdrop blur) for the wishlist and quick-view chips repeated on every product card. No visible change: they sit on white studio photos. Backdrop-filtered elements on `/products`: 56 → 4.
2. **`PageBackdrop`** uses a pre-blurred, pre-faded image (`public/images/home/backdrop-foliage.webp`, 40 KB, made by `scripts/make-backdrop-image.mjs`) instead of live `filter: blur()` + `mask-image`. Same crop, blur and fade.

Tried and reverted (no measurable effect): removing the blur from the glass elements nested inside the header.

## Before and after (production build, same machine, dev server stopped, 4× CPU throttling, median of 3 runs)

| Viewport | Page | Frames > 50 ms per run, before → after | Main-thread compositing (ms), before → after |
|---|---|---|---|
| 1440×900 | `/` | 2 / 3 / 8 → 1 / 2 / 3 | 472 → 315 |
| 1440×900 | `/products` | 2 / 3 / 4 → 2 / 3 / 7 | 533 → 254 |
| 1440×900 | `/about` | 0 / 0 / 1 → 0 / 0 / 2 | 318 → 180 |
| 390×844 | `/`, `/products`, `/about` | 0 → 0 (all runs) | 141 / 213 / 205 → 136 / 328 / 132 |

GPU work while scrolling `/products` (one traced pass; before traced on the dev server, after on the production build; GPU work does not depend on the server mode):

| Viewport | Render passes | Render-pass draw time | Paint-pass time |
|---|---|---|---|
| 1440×900 | 444 → 446 | 248 → 139 ms | 445 → 263 ms |
| 390×844 | 90 → 12 | 41 → 4 ms | 96 → 13 ms |

Reading: rendering work during scrolling fell substantially (GPU draw time roughly halved on desktop and cut ~10× on mobile; compositing down 30–50% on desktop). Frame-drop counts in headless Chrome were already low and changed within run-to-run noise, because the headless GPU had headroom; the saved GPU work matters most on real devices with integrated GPUs and high-density screens, where blur cost grows with the number of pixels.

## Remaining

- The sticky glass header costs one GPU render pass per frame on desktop. Making it opaque would remove it, but changes the look over the hero; left as is.
- Low-memory machines: closing other heavy apps (or running only one Next server) has more effect than any code change.
