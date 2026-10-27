// Bakes PageBackdrop's foliage accent into one image, so the browser no longer applies a live CSS
// blur(10px) and a radial mask-image to three large page-height elements on every frame (measured
// as long GPU render passes while scrolling; see docs/PERFORMANCE.md). Same source photo, crop,
// blur and fade as the CSS did: object-cover at 50% 35% into a 256 × 320 box, Gaussian blur with a
// 10px standard deviation, then radial-gradient(closest-side, opaque to 35%, transparent at 100%).
// Rendered at 2× (512 × 640) for sharp-enough edges on high-density screens.
//   node scripts/make-backdrop-image.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCALE = 2;
const W = 256 * SCALE;
const H = 320 * SCALE;
const SOURCE = path.join(__dirname, "../public/images/home/farm-essentials.jpg");
const OUT = path.join(__dirname, "../public/images/home/backdrop-foliage.webp");

const meta = await sharp(SOURCE).metadata();
// object-cover: scale to cover, then crop at 50% horizontally, 35% vertically.
const scale = Math.max(W / meta.width, H / meta.height);
const sw = Math.round(meta.width * scale);
const sh = Math.round(meta.height * scale);
const left = Math.round((sw - W) * 0.5);
const top = Math.round((sh - H) * 0.35);
const rgb = await sharp(SOURCE)
  .resize(sw, sh)
  .extract({ left, top, width: W, height: H })
  .blur(10 * SCALE)
  .removeAlpha()
  .raw()
  .toBuffer();

// closest-side ellipse: radii = half width, half height; alpha 1 up to 35%, linear to 0 at 100%.
const rgba = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - W / 2) / (W / 2);
    const dy = (y + 0.5 - H / 2) / (H / 2);
    const d = Math.sqrt(dx * dx + dy * dy);
    const alpha = d <= 0.35 ? 1 : d >= 1 ? 0 : 1 - (d - 0.35) / 0.65;
    const i = y * W + x;
    rgba[i * 4] = rgb[i * 3];
    rgba[i * 4 + 1] = rgb[i * 3 + 1];
    rgba[i * 4 + 2] = rgb[i * 3 + 2];
    rgba[i * 4 + 3] = Math.round(alpha * 255);
  }
}
const info = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 80, alphaQuality: 90 }).toFile(OUT);
console.log(`wrote ${path.relative(process.cwd(), OUT)} ${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB`);
