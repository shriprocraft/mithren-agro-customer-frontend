// Scroll performance probe: drives real scroll gestures through headless Chrome (DevTools protocol, no
// extra dependencies) and reports frame timing plus where the main and raster threads spent their
// time. Run it against a production server (npm run build && npm start), not next dev:
//   node scripts/perf-scroll.mjs [baseUrl] [label]
// Each page is scrolled top → bottom → top with Input.synthesizeScrollGesture at 4× CPU throttling,
// at 1440×900 and 390×844. Results are printed and saved to perf-results/<label>.json.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const LABEL = process.argv[3] ?? "run";
const OUT = path.resolve("perf-results");
mkdirSync(OUT, { recursive: true });
const PAGES = (process.env.PERF_PAGES ?? "/,/products,/about,/products/p-red-onions").split(",");
const VIEWPORTS = [[1440, 900, false], [390, 844, true]];
const CPU_THROTTLE = 4;
const REPEAT = Number(process.env.PERF_REPEAT ?? 3);
// Optional A/B experiment: CSS injected after load (e.g. "*{backdrop-filter:none!important}").
const EXPERIMENT_CSS = process.env.PERF_CSS ?? "";

const port = 9361;
const chrome = spawn(process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ["--headless=new", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/profile-${LABEL}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets; for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map(); let traceEvents = []; let traceDone = null;
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Tracing.dataCollected") traceEvents.push(...m.params.value);
  if (m.method === "Tracing.tracingComplete") traceDone?.();
});
// Every command times out, so a stalled gesture or trace can never hang the run.
const send = (method, params = {}, ms = 120000) => new Promise((r, reject) => { const i = ++id; const t = setTimeout(() => { pending.delete(i); reject(new Error(`${method} timed out`)); }, ms); pending.set(i, (m) => { clearTimeout(t); r(m); }); ws.send(JSON.stringify({ id: i, method, params })); });
const js = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Page.enable"); await send("Runtime.enable");
// Optional experiment: block Next.js route prefetches (RSC requests) to see their cost while scrolling.
if (process.env.PERF_BLOCK_PREFETCH) { await send("Network.enable"); await send("Network.setBlockedURLs", { urls: ["*_rsc=*"] }); }

const categories = ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "cc", "viz", "benchmark"].join(",");
// Main-thread and raster work, summed from the trace (ms).
const BUCKETS = {
  script: ["FunctionCall", "EvaluateScript", "TimerFire", "FireAnimationFrame", "EventDispatch", "v8.callFunction"],
  style: ["UpdateLayoutTree", "RecalculateStyles"],
  layout: ["Layout"],
  paint: ["Paint", "PaintImage"],
  prepaintComposite: ["PrePaint", "Layerize", "UpdateLayer", "CompositeLayers", "Commit"],
  raster: ["RasterTask", "Rasterize"],
  imageDecode: ["ImageDecodeTask", "Decode Image", "Decode LazyPixelRef"],
};

async function measure(pagePath, [w, h, mobile]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await send("Page.navigate", { url: BASE + pagePath });
  for (let i = 0; i < 100 && (await js("document.readyState")) !== "complete"; i++) await sleep(100);
  if (EXPERIMENT_CSS) await js(`(() => { const s = document.createElement("style"); s.textContent = ${JSON.stringify(EXPERIMENT_CSS)}; document.head.append(s); return true; })()`);
  await sleep(2500); // let images load and decode
  await send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
  const height = await js("document.documentElement.scrollHeight - innerHeight");
  traceEvents = [];
  await send("Tracing.start", { categories, transferMode: "ReportEvents" });
  // In-page frame recorder: rAF deltas while the gestures run.
  await js("window.__frames = []; window.__at = []; (() => { let last = performance.now(); const tick = (t) => { window.__frames.push(t - last); (window.__at ??= []).push(Math.round(scrollY)); last = t; if (!window.__stop) requestAnimationFrame(tick); }; window.__stop = false; requestAnimationFrame(tick); })(); true");
  const distance = Math.min(height, 6000);
  await send("Input.synthesizeScrollGesture", { x: Math.round(w / 2), y: Math.round(h / 2), yDistance: -distance, speed: 1500, gestureSourceType: mobile ? "touch" : "mouse", repeatCount: 0 });
  await send("Input.synthesizeScrollGesture", { x: Math.round(w / 2), y: Math.round(h / 2), yDistance: distance, speed: 1500, gestureSourceType: mobile ? "touch" : "mouse", repeatCount: 0 });
  const frames = await js("window.__stop = true; window.__frames.slice(1)");
  const at = await js("window.__at.slice(1)");
  const longAt = frames.map((d, i) => [Math.round(d), at[i]]).filter(([d]) => d > 50);
  await Promise.race([new Promise((r) => { traceDone = r; send("Tracing.end").catch(() => {}); }), sleep(60000)]);
  await send("Emulation.setCPUThrottlingRate", { rate: 1 });

  if (process.env.PERF_DUMP) writeFileSync(`${OUT}/trace-${LABEL}-${w}${pagePath.replace(/[^a-z0-9]+/gi, "_")}.json`, JSON.stringify(traceEvents));
  const sums = Object.fromEntries(Object.keys(BUCKETS).map((k) => [k, 0]));
  let backdropLayers = 0;
  for (const ev of traceEvents) {
    if (ev.ph !== "X" || typeof ev.dur !== "number") continue;
    for (const [bucket, names] of Object.entries(BUCKETS)) if (names.includes(ev.name)) sums[bucket] += ev.dur / 1000;
  }
  backdropLayers = await js("[...document.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return s.backdropFilter !== 'none' || s.webkitBackdropFilter && s.webkitBackdropFilter !== 'none'; }).length");
  const filtered = await js("[...document.querySelectorAll('*')].filter(e => getComputedStyle(e).filter !== 'none').length");
  // Top contributors (exclusive of nothing; top-level slices only), for diagnosis.
  const byName = {}; const byScript = {};
  for (const ev of traceEvents) {
    if (ev.ph !== "X" || typeof ev.dur !== "number") continue;
    byName[ev.name] = (byName[ev.name] ?? 0) + ev.dur / 1000;
    if (ev.name === "FunctionCall" || ev.name === "EventDispatch" || ev.name === "TimerFire" || ev.name === "v8.callFunction") {
      const d = ev.args?.data ?? {};
      const key = ev.name + " " + (d.type ?? "") + " " + (d.url ?? d.functionName ?? "").replace(BASE, "").slice(-60);
      byScript[key] = (byScript[key] ?? 0) + ev.dur / 1000;
    }
  }
  const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}: ${Math.round(v)}`);
  const sorted = [...frames].sort((a, b) => a - b);
  const pct = (p) => +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))].toFixed(1);
  const result = {
    page: pagePath, viewport: `${w}x${h}`, scrolled: distance * 2,
    frames: frames.length, avgFrameMs: +(frames.reduce((a, b) => a + b, 0) / frames.length).toFixed(1),
    p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), maxMs: +sorted.at(-1).toFixed(1),
    over33ms: frames.filter((f) => f > 33.4).length, over50ms: frames.filter((f) => f > 50).length,
    ...Object.fromEntries(Object.entries(sums).map(([k, v]) => [`${k}Ms`, Math.round(v)])),
    backdropFilterElements: backdropLayers, filterElements: filtered,
    domNodes: await js("document.getElementsByTagName('*').length"),
    topEvents: top(byName, 14), topScripts: top(byScript, 10), longFramesAt: longAt,
  };
  return result;
}

const results = [];
// Each case runs REPEAT times; the run with the median number of long frames (>50 ms) is reported.
for (const vp of VIEWPORTS) for (const p of PAGES) {
  const runs = [];
  for (let i = 0; i < REPEAT; i++) {
    try { runs.push(await measure(p, vp)); } catch (error) { console.log(`  ${p} @${vp[0]}: run skipped (${error.message})`); }
  }
  if (runs.length === 0) continue;
  runs.sort((a, b) => a.over50ms - b.over50ms || a.p95 - b.p95);
  const r = { ...runs[Math.floor(runs.length / 2)], over50msAllRuns: runs.map((x) => x.over50ms) };
  results.push(r);
  console.log(`${r.viewport.padEnd(9)} ${r.page.padEnd(24)} runs>50ms ${r.over50msAllRuns.join('/')} frames ${String(r.frames).padStart(4)}  avg ${r.avgFrameMs}ms  p95 ${r.p95}  p99 ${r.p99}  >33ms ${r.over33ms}  >50ms ${r.over50ms} | paint ${r.paintMs} raster ${r.rasterMs} composite ${r.prepaintCompositeMs} layout ${r.layoutMs} style ${r.styleMs} script ${r.scriptMs} decode ${r.imageDecodeMs} | backdrop ${r.backdropFilterElements} filter ${r.filterElements} nodes ${r.domNodes}`);
}
writeFileSync(`${OUT}/${LABEL}.json`, JSON.stringify(results, null, 1));
ws.close(); chrome.kill(); process.exit(0);
