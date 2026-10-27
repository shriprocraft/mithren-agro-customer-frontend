// Image audit: for each page, every <img> after a full scroll (so lazy images load), with the file
// served (format, bytes), its natural size and the size it is displayed at. Flags images more than
// 2× larger than needed (after device pixel ratio) and eager images below the first screen.
//   node scripts/perf-images.mjs [baseUrl]
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = path.resolve("perf-results");
mkdirSync(OUT, { recursive: true });
const port = 9362;
const chrome = spawn(process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/profile-images`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets; for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const js = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable"); await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });

for (const [w, h, dpr, mobile] of [[1440, 900, 1, false], [390, 844, 2, true]]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile });
  for (const page of (process.env.PERF_PAGES ?? "/,/products,/about").split(",")) {
    await send("Page.navigate", { url: BASE + page });
    for (let i = 0; i < 100 && (await js("document.readyState")) !== "complete"; i++) await sleep(100);
    const firstScreen = await js(`[...document.images].filter(i => i.getBoundingClientRect().top < innerHeight && i.getBoundingClientRect().bottom > 0).map(i => i.currentSrc)`);
    await js("(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 1500)); return true; })()");
    const rows = await js(`(() => {
      const res = Object.fromEntries(performance.getEntriesByType("resource").map(e => [e.name, e]));
      return [...document.images].filter(i => i.currentSrc && i.complete).map(i => {
        const r = i.getBoundingClientRect(); const e = res[i.currentSrc] ?? {};
        const u = new URL(i.currentSrc); const src = u.searchParams.get("url") ?? u.pathname;
        return { src, w: u.searchParams.get("w"), natural: i.naturalWidth + "x" + i.naturalHeight, shown: Math.round(r.width) + "x" + Math.round(r.height),
          kb: Math.round((e.encodedBodySize ?? 0) / 1024), type: (e.name ?? "").includes("_next/image") ? "next" : "raw", loading: i.loading,
          over: r.width ? +(i.naturalWidth / (r.width * devicePixelRatio)).toFixed(1) : null, visibleNow: false };
      });
    })()`);
    const total = rows.reduce((s, r) => s + r.kb, 0);
    console.log(`\n${w}x${h}@${dpr} ${page}: ${rows.length} images, ${total} KB`);
    for (const r of rows.sort((a, b) => b.kb - a.kb).slice(0, 8)) {
      const flags = [r.over > 2 ? `OVERSIZED ${r.over}x` : "", r.type === "raw" ? "NOT OPTIMISED" : "", firstScreen.some((s) => s.includes(encodeURIComponent(r.src)) || s.endsWith(r.src)) ? "first screen" : ""].filter(Boolean).join(", ");
      console.log(`  ${String(r.kb).padStart(5)} KB  ${r.src.padEnd(52)} w=${String(r.w).padEnd(5)} natural ${r.natural.padEnd(10)} shown ${r.shown.padEnd(9)} ${r.loading} ${flags}`);
    }
  }
}
ws.close(); chrome.kill(); process.exit(0);
