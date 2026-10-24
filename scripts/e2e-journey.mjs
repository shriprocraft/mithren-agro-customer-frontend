// End-to-end customer journey through the real UI in headless Chrome, driven over the DevTools
// protocol (no extra dependencies). Start the app first (npm run dev, so the demo tracking tools are
// available), then: npm run test:e2e [-- <baseUrl> <outDir>]. Writes screenshots and results.json to
// <outDir> (default e2e-results/). Set CHROME_PATH if Chrome is not at the Windows default location.
// It clears this site's localStorage/sessionStorage in its own temporary browser profile only.
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = path.resolve(process.argv[3] ?? "e2e-results");
mkdirSync(OUT, { recursive: true });
const port = 9341;
const chrome = spawn(process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=${OUT}/profile`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets; for (let i = 0; i < 60; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(200); }
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map(); const consoleErrors = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") consoleErrors.push(m.params.exceptionDetails.exception?.description?.slice(0, 200) ?? m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 200));
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const js = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "eval failed"); return r.result?.result?.value; };
await send("Runtime.enable"); await send("Page.enable");
const viewport = (w, h) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
await viewport(1440, 900);

// Helpers that run in the page.
await send("Page.addScriptToEvaluateOnNewDocument", { source: `
  window.__t = {
    byText(sel, text) { return [...document.querySelectorAll(sel)].find((el) => el.textContent.replace(/\\s+/g, " ").trim().includes(text) && el.offsetParent !== null); },
    click(sel, text) { const el = text ? this.byText(sel, text) : document.querySelector(sel); if (!el) throw new Error("not found: " + sel + " " + (text ?? "")); el.click(); return true; },
    type(sel, value) { const el = document.querySelector(sel); if (!el) throw new Error("no input " + sel); const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value); if (el.tagName === "SELECT") el.dispatchEvent(new Event("change", { bubbles: true })); else el.dispatchEvent(new Event("input", { bubbles: true })); return true; },
    text() { return document.querySelector("main")?.innerText.replace(/\\s+/g, " ") ?? ""; },
    cartLabel() { return document.querySelector('header button[aria-label^="Cart"]')?.getAttribute("aria-label"); },
    prices() { return [...document.querySelectorAll("main ul li article p span.font-heading")].map((s) => Number(s.textContent.replace(/[^0-9.]/g, ""))); },
  };` });

async function go(path) { await send("Page.navigate", { url: BASE + path }); await waitFor("document.readyState === 'complete'"); await sleep(900); }
async function waitFor(expr, ms = 15000) { const end = Date.now() + ms; while (Date.now() < end) { try { if (await js(`!!(${expr})`)) return true; } catch {} await sleep(150); } throw new Error("timeout waiting for: " + expr); }
async function shot(name) { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, "base64")); }

const results = [];
async function step(n, title, fn) {
  try { const detail = await fn(); results.push({ n, title, result: "PASS", detail: detail ?? "" }); }
  catch (e) { results.push({ n, title, result: "FAIL", detail: String(e.message ?? e).slice(0, 300) }); await shot(`fail-${n}`); }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

let orderId = null;

await go("/"); await js("localStorage.clear(); sessionStorage.clear(); true"); await go("/");

await step(1, "Open the homepage", async () => { expect((await js("__t.text()")).includes("Good Food"), "hero missing"); return "hero headline present"; });
await step(2, "Navigate to the marketplace", async () => {
  await js(`__t.click('header nav a', 'All products')`); await waitFor("location.pathname === '/products'");
  await waitFor("__t.text().includes('Showing 26 of 26 products')"); return "header nav → /products, 26 of 26";
});
await step(3, "Open a product", async () => {
  await js(`__t.click('main a[href="/products/p-tomatoes"]')`); await waitFor("location.pathname === '/products/p-tomatoes'");
  await waitFor("document.querySelector('h1')?.textContent === 'Tomatoes'"); return "card link → /products/p-tomatoes";
});
await step(4, "Verify product details", async () => {
  const t = await js("__t.text()");
  for (const s of ["Tomatoes", "₹40", "1 kg", "In stock", "Sold by Green Acres Growers", "Vegetables", "More from Vegetables"]) expect(t.includes(s), "missing " + s);
  expect(await js("!!document.querySelector('nav[aria-label=Breadcrumb] a[href=\"/products?category=vegetables\"]')"), "breadcrumb");
  await shot("04-product"); return "name, price, unit, stock, seller, category, breadcrumbs, related";
});
await step(5, "Change quantity", async () => {
  await js(`__t.click('button[aria-label="Increase quantity"]')`); await js(`__t.click('button[aria-label="Increase quantity"]')`);
  await waitFor("document.querySelector('input[aria-label=Quantity]').value === '3'");
  expect((await js("__t.text()")).includes("Total ₹120"), "line total ₹120"); return "qty 3, total ₹120";
});
await step(6, "Add it to the cart", async () => {
  await js(`__t.click('main button', 'Add to cart')`); await waitFor("__t.cartLabel() === 'Cart, 3 items'"); return "header: Cart, 3 items";
});
await step("6b", "Add a second product from the marketplace", async () => {
  await go("/products?q=papaya"); await waitFor("__t.text().includes('Showing 1 of 26')");
  await js(`__t.click('main article button', 'Add to cart')`); await waitFor("__t.cartLabel() === 'Cart, 4 items'"); return "papaya added; Cart, 4 items";
});
await step(7, "Open the cart", async () => {
  await js(`__t.click('header button[aria-label^="Cart"]')`); await waitFor("__t.byText('[data-slot=popover-content] a', 'View cart')");
  await js(`__t.click('[data-slot=popover-content] a', 'View cart')`); await waitFor("location.pathname === '/cart'");
  await waitFor("__t.text().includes('Order summary')"); return "header popover → /cart";
});
await step(8, "Verify quantity and totals; edit and remove", async () => {
  let t = await js("__t.text()");
  expect(t.includes("Subtotal (4 items) ₹175"), "subtotal 4 items ₹175 (3×40 + 55): " + t.slice(t.indexOf("Subtotal"), t.indexOf("Subtotal") + 40));
  await js(`[...document.querySelectorAll('[aria-label="Quantity of Tomatoes"] button[aria-label="Increase quantity"]')].find(b=>b.offsetParent).click()`);
  await waitFor("__t.text().includes('Subtotal (5 items) ₹215') && __t.cartLabel() === 'Cart, 5 items'");
  await js(`[...document.querySelectorAll('button[aria-label="Remove Papaya from cart"]')].find(b=>b.offsetParent).click()`);
  await waitFor("__t.text().includes('Subtotal (4 items) ₹160') && __t.cartLabel() === 'Cart, 4 items'");
  await js(`[...document.querySelectorAll('[aria-label="Quantity of Tomatoes"] button[aria-label="Decrease quantity"]')].find(b=>b.offsetParent).click()`);
  await waitFor("__t.text().includes('Subtotal (3 items) ₹120') && __t.text().includes('Total ₹120')");
  await shot("08-cart"); return "+1 → ₹215, remove papaya → ₹160, −1 → ₹120; header count follows";
});
await step("8b", "Cart survives a refresh", async () => {
  await go("/cart"); await waitFor("__t.text().includes('Subtotal (3 items) ₹120')"); return "still 3 × Tomatoes after reload";
});
await step(9, "Proceed to checkout", async () => {
  await js(`__t.click('main button', 'Proceed to checkout')`); await waitFor("location.pathname === '/checkout/address'");
  await waitFor("document.querySelector('#address-full_name')"); return "→ /checkout/address, add-address form shown (no saved addresses)";
});
await step(11, "Invalid address data is rejected", async () => {
  await js(`__t.click('main form button[type=submit]')`);
  await waitFor("document.querySelectorAll('[aria-invalid=true]').length === 7");
  await js(`__t.type('#address-mobile', '12345')`); await js(`__t.type('#address-pincode', '0123')`);
  await waitFor("__t.text().includes('valid 10-digit Indian mobile') && __t.text().includes('valid 6-digit PIN')");
  expect(await js("location.pathname") === "/checkout/address", "stayed on the page");
  await shot("11-address-errors"); return "7 required-field errors; mobile and PIN messages; stays on page";
});
await step(10, "Enter a valid address", async () => {
  const values = { full_name: "Asha Rao", mobile: "98765 43210", house: "12B Lake View Apts", street: "MG Road, Indiranagar", city: "Bengaluru", pincode: "560038" };
  for (const [k, v] of Object.entries(values)) await js(`__t.type('#address-${k}', ${JSON.stringify(v)})`);
  await js(`__t.type('#address-state', 'Karnataka')`);
  await js(`__t.click('main form button[type=submit]')`);
  await waitFor("__t.text().includes('Deliver to') && __t.text().includes('Asha Rao')"); return "saved and selected";
});
await step("10b", "Edit, add and remove addresses; type Work", async () => {
  await js(`__t.click('button[aria-label="Edit address for Asha Rao"]')`); await waitFor("document.querySelector('#address-landmark')");
  await js(`__t.type('#address-landmark', 'Near the lake')`); await js(`__t.click('main form button', 'Save changes')`);
  await waitFor("__t.text().includes('Near the lake')");
  await js(`__t.click('main button', 'Add a new address')`); await waitFor("document.querySelector('#address-full_name')");
  const v = { full_name: "Ravi Kumar", mobile: "9123456780", house: "Plot 4", street: "HITEC City", city: "Hyderabad", pincode: "500081" };
  for (const [k, val] of Object.entries(v)) await js(`__t.type('#address-${k}', ${JSON.stringify(val)})`);
  await js(`__t.type('#address-state', 'Telangana')`); await js(`__t.click('main form label', 'Work')`);
  await js(`__t.click('main form button[type=submit]')`); await waitFor("__t.text().includes('Ravi Kumar') && __t.text().includes('Work')");
  await js(`__t.click('button[aria-label="Remove address for Ravi Kumar"]')`); await waitFor("!__t.text().includes('Ravi Kumar')");
  await js(`[...document.querySelectorAll('input[name=delivery-address]')][0].click()`);
  return "edit (landmark), add Work address, remove it";
});
await step(12, "Continue to order review", async () => {
  await js(`__t.click('main button', 'Continue to review')`); await waitFor("location.pathname === '/checkout/review'");
  await waitFor("__t.text().includes('Place order')"); return "→ /checkout/review";
});
await step(13, "Verify address, products and total", async () => {
  const t = await js("__t.text()");
  for (const s of ["Asha Rao", "Near the lake", "560038", "Tomatoes", "Qty 3", "Total ₹120"]) expect(t.includes(s), "missing " + s);
  await js(`__t.click('main a', 'Edit address')`); await waitFor("location.pathname === '/checkout/address'");
  await waitFor("document.querySelector('input[name=delivery-address]:checked')");
  await js(`__t.click('main button', 'Continue to review')`); await waitFor("location.pathname === '/checkout/review' && __t.text().includes('Place order')");
  await shot("13-review"); return "all present; Edit address round-trip keeps selection";
});
await step(14, "Place the order (double-click guarded)", async () => {
  await js(`(() => { const b = __t.byText('main button', 'Place order'); b.click(); b.click(); return true; })()`);
  await waitFor("/^\\/orders\\/[^/]+\\/confirmation$/.test(location.pathname)");
  orderId = await js("location.pathname.split('/')[2]");
  return "→ " + (await js("location.pathname"));
});
await step(15, "Order created once with a unique ID", async () => {
  const orders = await js("JSON.parse(localStorage.getItem('mithren.orders'))");
  expect(orders.length === 1, "orders saved: " + orders.length);
  expect(/^MA-\d{8}-[A-Z2-9]{6}$/.test(orderId), "id format " + orderId);
  expect(orders[0].total === 12000 && orders[0].status === "order_placed", "stored total/status");
  return `${orderId}; exactly 1 order stored; total 12000 paise; status order_placed`;
});
await step(16, "Cart cleared after success", async () => { await waitFor("__t.cartLabel() === 'Cart, 0 items'"); return "header: Cart, 0 items"; });
await step(17, "Confirmation page", async () => {
  await waitFor("__t.text().includes('Order Placed Successfully')");
  const t = await js("__t.text()");
  for (const s of [orderId, "Placed on", "Order Placed", "Asha Rao", "Tomatoes", "Qty 3", "Total ₹120", "Track order", "Continue shopping"]) expect(t.includes(s), "missing " + s);
  await shot("17-confirmation"); return "heading, ID, time, status, address, items, total, actions";
});
await step(18, "Open tracking", async () => {
  await js(`__t.click('main a', 'Track order')`); await waitFor(`location.pathname === '/orders/${orderId}/tracking'`);
  await waitFor("__t.text().includes('Track your order')"); return "Track order → same order's tracking";
});
await step(19, "Initial status", async () => {
  expect(await js("document.querySelector('[aria-label=\"Order progress\"] [aria-current=step]')?.textContent.includes('Order Placed')"), "current = Order Placed");
  return "current stage: Order Placed";
});
await step(20, "Completed, current and pending stages", async () => {
  const states = await js(`[...document.querySelectorAll('[aria-label="Order progress"] li')].map(li => li.textContent.includes('(current stage)') ? 'current' : li.textContent.includes('(completed)') ? 'completed' : 'pending')`);
  expect(JSON.stringify(states) === JSON.stringify(["current", "pending", "pending", "pending", "pending", "pending"]), JSON.stringify(states));
  await shot("20-tracking-new"); return states.join(", ");
});
await step(21, "Demo status progression", async () => {
  await js(`__t.click('main button', 'Move to')`); await waitFor("__t.text().includes('Current status Order Confirmed')");
  await js(`__t.click('main button', 'Move to')`); await waitFor("__t.text().includes('Current status Preparing Order')");
  const states = await js(`[...document.querySelectorAll('[aria-label="Order progress"] li')].map(li => li.textContent.includes('(current stage)') ? 'current' : li.textContent.includes('(completed)') ? 'completed' : 'pending')`);
  expect(states.join() === "completed,completed,current,pending,pending,pending", states.join());
  await shot("21-tracking-advanced"); return states.join(", ");
});
await step(22, "Refresh keeps tracking state", async () => {
  await go(`/orders/${orderId}/tracking`); await waitFor("__t.text().includes('Current status Preparing Order')"); return "Preparing Order after reload";
});
await step(23, "Same order, consistent elsewhere", async () => {
  await go(`/orders/${orderId}/confirmation`); await waitFor("__t.text().includes('Order Placed Successfully')");
  const t = await js("__t.text()"); expect(t.includes("Preparing Order") && t.includes("Total ₹120"), "status/total on confirmation");
  await js(`__t.click('header button[aria-label=Account]')`); await waitFor(`__t.byText('[data-slot=popover-content] a', '${orderId}')`);
  return "confirmation shows Preparing Order and ₹120; order listed in account menu";
});
await step(24, "Invalid product and order IDs", async () => {
  await go("/products/not-a-product"); await waitFor("document.body.innerText.includes('couldn’t find that product')");
  await go("/orders/MA-00000000-NOPE/tracking"); await waitFor("__t.text().includes('couldn’t find that order')");
  await go("/orders/MA-00000000-NOPE/confirmation"); await waitFor("__t.text().includes('couldn’t find that order')");
  await go("/no-such-page"); await waitFor("document.body.innerText.includes('Page not found')");
  return "product, order (both pages) and unknown route show recovery states";
});
await step(25, "Empty-cart behaviour", async () => {
  await go("/cart"); await waitFor("__t.text().includes('Your cart is empty')");
  await go("/checkout/review"); await waitFor("__t.text().includes('nothing to review')");
  await go("/checkout/address"); await waitFor("__t.text().includes('nothing to check out')");
  return "cart, address and review all guard an empty cart";
});
await step(26, "Open the Filter button", async () => {
  await go("/products"); await js(`__t.click('main button', 'Filter')`);
  await waitFor("document.querySelector('[role=dialog]')?.textContent.includes('Filter products')"); await shot("26-filter-drawer"); return "drawer opens";
});
await step(27, "Filter by category", async () => {
  await js(`__t.click('[role=dialog] label', 'Fruits')`); await js(`__t.click('[role=dialog] button', 'Apply filters')`);
  await waitFor("location.search === '?category=fruits'");
  await waitFor("__t.text().includes('Showing 5 of 26 products')");
  const badge = await js(`__t.byText('main button', 'Filter').textContent`);
  expect(badge.includes("1"), "active count badge"); return "5 fruit items (4 products + Fruit Basket); badge 1; chip shown";
});
await step(28, "Filter by minimum and maximum price", async () => {
  await js(`__t.click('main button', 'Filter')`); await waitFor("document.querySelector('[role=dialog]')");
  await js(`__t.type('[role=dialog] input[type=number]', '50')`);
  await js(`(() => { const el = document.querySelectorAll('[role=dialog] input[type=number]')[1]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'150'); el.dispatchEvent(new Event('input',{bubbles:true})); return true; })()`);
  await js(`__t.click('[role=dialog] button', 'Apply filters')`); await waitFor("location.search.includes('min=50') && location.search.includes('max=150')");
  await sleep(500); const prices = await js("__t.prices()");
  expect(prices.length > 0 && prices.every((p) => p >= 50 && p <= 150), "prices " + prices);
  return `fruits ₹50–₹150: ${prices.join(", ")}`;
});
await step(29, "Combine search and filters", async () => {
  await js(`__t.type('#marketplace-search', 'mango')`); await js(`__t.click('main form button[type=submit]')`);
  await waitFor("location.search.includes('q=mango') && location.search.includes('category=fruits')");
  await sleep(400); const t = await js("__t.text()");
  expect(t.includes("Showing 1 of 26") && t.includes("Banganapalli Mangoes"), t.slice(0, 200)); return "q=mango + fruits + price → 1 result";
});
await step(30, "Sorting", async () => {
  await go("/products"); await js(`__t.type('main select', 'price-asc')`); await waitFor("location.search === '?sort=price-asc'");
  await sleep(400); let p = await js("__t.prices()"); expect(p.join() === [...p].sort((a, b) => a - b).join(), "asc " + p);
  await js(`__t.type('main select', 'price-desc')`); await waitFor("location.search === '?sort=price-desc'");
  await sleep(400); p = await js("__t.prices()"); expect(p.join() === [...p].sort((a, b) => b - a).join(), "desc " + p);
  await js(`__t.type('main select', 'name-asc')`); await waitFor("location.search === '?sort=name-asc'");
  await sleep(400); const names = await js("[...document.querySelectorAll('main article h3')].map(h=>h.textContent)");
  expect(names.join() === [...names].sort((a, b) => a.localeCompare(b)).join(), "names"); return "price ↑, price ↓, name A–Z verified";
});
await step(31, "Clear all filters", async () => {
  await go("/products?category=fruits,vegetables&stock=in_stock&seasonal=1");
  await waitFor("document.querySelector('[aria-label=\"Active filters\"]')");
  const before = await js("__t.text().match(/Showing (\\d+) of 26/)[1]");
  await js(`__t.click('[aria-label="Active filters"] button', 'Clear all')`); await waitFor("location.search === ''");
  await waitFor("__t.text().includes('Showing 26 of 26')"); return `${before} → 26 after Clear all`;
});
await step(32, "Counts and empty results", async () => {
  await go("/products?q=zzzz&category=fruits"); await waitFor("__t.text().includes('No products match')");
  expect((await js("__t.text()")).includes("Showing 0 of 26"), "count 0");
  await js(`__t.click('main button', 'Clear filters')`); await waitFor("location.search === '?q=zzzz'");
  await js(`__t.click('main button', 'Clear search')`); await waitFor("location.search === '' && __t.text().includes('Showing 26 of 26')");
  return "0 results state → Clear filters → Clear search → 26";
});
await step(33, "Wishlist and cart still work from the marketplace", async () => {
  await js(`__t.click('main button[aria-label="Save Carrots to wishlist"]')`);
  await waitFor(`document.querySelector('header button[aria-label^="Wishlist"]').getAttribute('aria-label') === 'Wishlist, 1 saved'`);
  await js(`(() => { const card = [...document.querySelectorAll('main article')].find(a => a.textContent.includes('Carrots')); [...card.querySelectorAll('button')].find(b => b.textContent.includes('Add to cart')).click(); return true; })()`);
  await waitFor("__t.cartLabel() === 'Cart, 1 item'");
  await go("/wishlist"); await waitFor("__t.text().includes('Carrots')");
  await js(`__t.click('main button[aria-label="Quick view: Carrots"]')`); await waitFor("document.querySelector('[role=dialog]')?.textContent.includes('View full details')");
  return "heart → Wishlist, 1 saved; Add to cart → Cart, 1 item; /wishlist lists it; quick view opens";
});
await step(34, "Responsive layouts", async () => {
  const routes = ["/", "/products", `/products/p-tomatoes`, "/cart", "/checkout/address", "/wishlist", `/orders/${orderId}/tracking`, `/orders/${orderId}/confirmation`];
  const problems = [];
  for (const [w, h] of [[375, 812], [768, 1024], [1024, 768], [1440, 900]]) {
    await viewport(w, h);
    for (const r of routes) {
      await go(r);
      const sw = await js("document.documentElement.scrollWidth");
      if (sw > w) problems.push(`${r}@${w}: scrollWidth ${sw}`);
    }
  }
  await viewport(375, 812); await go(`/orders/${orderId}/tracking`); await shot("34-tracking-375");
  await go("/products"); await js(`__t.click('main button', 'Filter')`); await sleep(700); await shot("34-filter-375");
  await go("/products/p-tomatoes"); await shot("34-product-375");
  await viewport(1440, 900);
  expect(problems.length === 0, problems.join("; ")); return `${routes.length} routes × 4 widths, no horizontal overflow`;
});

writeFileSync(`${OUT}/results.json`, JSON.stringify({ results, consoleErrors: [...new Set(consoleErrors)], orderId }, null, 1));
for (const r of results) console.log(`${String(r.n).padEnd(3)} ${r.result.padEnd(4)} ${r.title} — ${r.detail}`);
console.log("console errors:", [...new Set(consoleErrors)]);
const failed = results.filter((r) => r.result !== "PASS").length;
console.log(failed ? `${failed} step(s) failed` : `All ${results.length} steps passed`);
ws.close(); chrome.kill(); process.exit(failed || consoleErrors.length ? 1 : 0);
