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
// A trusted mouse click at the centre of the first visible element matching sel (and text). Radix
// Select opens on pointer events, which element.click() does not send.
async function tap(sel, text) {
  const find = text ? `__t.byText(${JSON.stringify(sel)}, ${JSON.stringify(text)})` : `document.querySelector(${JSON.stringify(sel)})`;
  const rect = await js(`(() => { const el = ${find}; if (!el) return null; el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!rect) throw new Error("not found: " + sel + " " + (text ?? ""));
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: rect.x, y: rect.y, button: "left", buttons: type === "mousePressed" ? 1 : 0, clickCount: 1, pointerType: "mouse" });
  await sleep(250);
}
/** Opens the dropdown labelled `label` and picks the option whose text includes `option`. */
async function choose(label, option) {
  await tap(`button[role=combobox][aria-label="${label}"]`);
  await waitFor("document.querySelector('[role=listbox]')");
  await tap("[role=option]", option);
  await waitFor("!document.querySelector('[role=listbox]')");
}
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
  await js(`[...document.querySelectorAll('[aria-label^="Quantity of Tomatoes"] button[aria-label="Increase quantity"]')].find(b=>b.offsetParent).click()`);
  await waitFor("__t.text().includes('Subtotal (5 items) ₹215') && __t.cartLabel() === 'Cart, 5 items'");
  await js(`[...document.querySelectorAll('button[aria-label^="Remove Papaya"]')].find(b=>b.offsetParent).click()`);
  await waitFor("__t.text().includes('Subtotal (4 items) ₹160') && __t.cartLabel() === 'Cart, 4 items'");
  await js(`[...document.querySelectorAll('[aria-label^="Quantity of Tomatoes"] button[aria-label="Decrease quantity"]')].find(b=>b.offsetParent).click()`);
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
  await js(`__t.click('header button[aria-label^=Account]')`); await waitFor(`__t.byText('[data-slot=popover-content] a', '${orderId}')`);
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
  await go("/products"); await choose("Sort products", "Price: Low to High"); await waitFor("location.search === '?sort=price-asc'");
  await sleep(400); let p = await js("__t.prices()"); expect(p.join() === [...p].sort((a, b) => a - b).join(), "asc " + p);
  await choose("Sort products", "Price: High to Low"); await waitFor("location.search === '?sort=price-desc'");
  await sleep(400); p = await js("__t.prices()"); expect(p.join() === [...p].sort((a, b) => b - a).join(), "desc " + p);
  await choose("Sort products", "Name: A to Z"); await waitFor("location.search === '?sort=name-asc'");
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
  await js("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true"); await waitFor("!document.querySelector('[role=dialog]')", 3000);
  return "heart → Wishlist, 1 saved; Add to cart → Cart, 1 item; /wishlist lists it; quick view opens";
});
await step(34, "Responsive layouts", async () => {
  const routes = ["/", "/about", "/agent-benefits", "/investors", "/privacy-policy", "/cancellation-refund-policy", "/return-policy", "/products", "/products/p-floral-kurta-set", `/products/p-tomatoes`, "/cart", "/checkout/address", "/wishlist", `/orders/${orderId}/tracking`, `/orders/${orderId}/confirmation`];
  const problems = [];
  for (const [w, h] of [[320, 568], [375, 812], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 720], [1440, 900]]) {
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
  expect(problems.length === 0, problems.join("; ")); return `${routes.length} routes × 8 widths, no horizontal overflow`;
});

// Product pages must open at the top after a client navigation (they used to land at the bottom at
// some viewport heights, e.g. 1024 × 768; see components/products/ProductDetailSkeleton.tsx).
const landing = "[location.pathname, Math.round(scrollY), Math.round(document.querySelector('main h1')?.getBoundingClientRect().top ?? -1), innerHeight]";
async function openFromDeep(selector, fromPath) {
  await js(`(() => { const ls = [...document.querySelectorAll(${JSON.stringify(selector)})]; const l = ls[ls.length - 1]; l.scrollIntoView({ block: "center" }); window.__l = l; return true; })()`);
  await sleep(400); const from = await js("Math.round(scrollY)"); const target = await js("window.__l.getAttribute('href')");
  await js("window.__l.click(); true");
  await waitFor(`location.pathname === ${JSON.stringify(target)} && document.querySelector('main h1')`); await sleep(1200);
  const [path, y, h1, vh] = await js(landing);
  expect(path !== fromPath && y === 0 && h1 > 0 && h1 < vh, `from scrollY ${from}: landed at ${y}, h1 at ${h1} of ${vh}`);
  return `${target} from scrollY ${from} → scrollY 0, h1 at ${h1}px`;
}
await step(35, "Homepage product opens at the top (1024×768 and 390×844)", async () => {
  const out = [];
  for (const [w, h] of [[1024, 768], [390, 844]]) { await viewport(w, h); await go("/"); out.push(`${w}: ` + await openFromDeep('main a[href^="/products/"]', "/")); }
  await viewport(1440, 900); return out.join("; ");
});
await step(36, "Product → related product, then back and forward", async () => {
  await viewport(1024, 768); await go("/products/p-tomatoes");
  const detail = await openFromDeep('#related-title ~ ul a[href^="/products/"]', "/products/p-tomatoes");
  const related = await js("location.pathname");
  await js("history.back(); true"); await waitFor("location.pathname === '/products/p-tomatoes'");
  await js("history.forward(); true"); await waitFor(`location.pathname === ${JSON.stringify(related)}`);
  await viewport(1440, 900); return detail + "; back → tomatoes, forward → " + related;
});
await step(37, "Quantity changes keep the scroll position", async () => {
  await viewport(390, 844); await go("/products/p-tomatoes"); await js("scrollTo(0, 250); true"); await sleep(300);
  const before = await js("Math.round(scrollY)");
  await js(`__t.click('button[aria-label="Increase quantity"]')`); await waitFor("document.querySelector('input[aria-label=Quantity]').value === '2'");
  await sleep(300); const after = await js("Math.round(scrollY)");
  await viewport(1440, 900); expect(before === after && before > 0, `${before} → ${after}`); return `scrollY ${before} → ${after}`;
});
await step(38, "Quick view closes when opening the full details", async () => {
  await go("/products"); await js(`__t.click('main button[aria-label="Quick view: Tomatoes"]')`);
  await waitFor("document.querySelector('[role=dialog]')");
  await js(`__t.click('[role=dialog] a', 'View full details')`); await waitFor("location.pathname === '/products/p-tomatoes'");
  // The dialog unmounts after its close animation (up to ~0.6 s on the dev server); it must never stay open.
  // Only the dialog opened here counts (hidden earlier pages kept alive by Next could hold their own).
  const tomatoesDialog = "[...document.querySelectorAll('[role=dialog]')].some(d => d.textContent.includes('Tomatoes'))";
  await waitFor(`!${tomatoesDialog}`, 3000).catch(async () => {
    const state = await js("[...document.querySelectorAll('[role=dialog]')].filter(d => d.textContent.includes('Tomatoes')).map(d => [d.getAttribute('data-state'), d.getBoundingClientRect().width > 0, getComputedStyle(d).display, !!d.closest('[hidden]'), document.activeElement === document.body].join(',')).join(' / ')");
    throw new Error("quick view still mounted 3 s after navigating: " + state);
  });
  await js("history.back(); true"); await waitFor("location.pathname === '/products'"); await sleep(600);
  expect(!(await js(tomatoesDialog)), "dialog reopened on back");
  return "dialog closed on navigation and stays closed after Back";
});
await step(39, "Buy now orders only that product and leaves the cart unchanged", async () => {
  const cartBefore = await js("localStorage.getItem('mithren.cart')");
  await go("/products/p-tomatoes"); await js(`__t.click('button[aria-label="Increase quantity"]')`);
  await waitFor("document.querySelector('input[aria-label=Quantity]').value === '2'");
  await js(`__t.click('main button', 'Buy now')`); await waitFor("location.pathname === '/checkout/address'");
  await waitFor("document.querySelector('input[name=delivery-address]')"); await js("document.querySelector('input[name=delivery-address]').click(); true");
  await js(`__t.click('main button', 'Continue to review')`); await waitFor("location.pathname === '/checkout/review' && __t.text().includes('Place order')");
  const t = await js("__t.text()");
  expect(t.includes("Buy now: only this item") && t.includes("Tomatoes") && t.includes("Qty 2") && !t.includes("Carrots") && t.includes("Total ₹80"), "review: " + t.slice(0, 300));
  await js(`__t.click('main button', 'Place order')`); await waitFor("/confirmation$/.test(location.pathname)");
  await waitFor("__t.text().includes('Order Placed Successfully')");
  const cartAfter = await js("localStorage.getItem('mithren.cart')");
  expect(cartAfter === cartBefore && (await js("__t.cartLabel()")) === "Cart, 1 item", `cart ${cartBefore} → ${cartAfter}`);
  return "review shows 2 × Tomatoes only (₹80); order placed; cart still holds Carrots (Cart, 1 item)";
});


// ---- Demo customer account (docs/DEMO_ACCOUNT.md) ----
await step(40, "Account pages are gated without a demo session", async () => {
  await viewport(1440, 900); await go("/account/orders");
  await waitFor("__t.text().includes('Sign in to see your account')");
  expect(!(await js("__t.text()")).includes("Sample order"), "account content leaked");
  const href = await js("[...document.querySelectorAll('main a')].find(a => a.textContent.includes('Go to sign in')).getAttribute('href')");
  expect(href === "/login?next=%2Faccount%2Forders", href); return "entry screen; sign-in link keeps the destination";
});
await step(41, "Sign in page: Explore Demo Account opens the intended page", async () => {
  await go("/login?next=%2Faccount%2Forders"); await waitFor("__t.text().includes('Welcome to Mithren Agro')");
  const t = await js("__t.text()");
  expect(t.includes("Demo mode") && t.includes("Continue as guest") && !(await js("!!document.querySelector('input[type=password]')")), "demo notice, guest link, no password field");
  await shot("41-login");
  await js("__t.click('main button', 'Explore Demo Account')"); await waitFor("location.pathname === '/account/orders' && __t.text().includes('My Orders')");
  await waitFor("__t.text().includes('Sample order')");
  const label = await js("document.querySelector('header button[aria-label^=Account]').getAttribute('aria-label')");
  expect(label === "Account: Demo Customer (demo)", label); return "→ /account/orders with sample orders; header shows the demo account";
});
await step(42, "Demo session survives a refresh; account navigation works", async () => {
  await go("/account"); await waitFor("__t.text().includes('Hello, Demo')");
  for (const [label, path, text] of [["My Profile", "/account/profile", "Demo Customer"], ["Track Orders", "/account/track", "On the way"], ["My Addresses", "/account/addresses", "Sample Street"], ["My Wishlist", "/account/wishlist", "Carrots"], ["Account Settings", "/account/settings", "Notification preferences"], ["Overview", "/account", "Recent orders"]]) {
    await js(`__t.click('nav[aria-label=Account] a', ${JSON.stringify(label)})`); await waitFor(`location.pathname === ${JSON.stringify(path)} && __t.text().includes(${JSON.stringify(text)})`);
  }
  await shot("42-account-overview"); return "reload keeps the session; 6 sections open with their content";
});
await step(43, "Edit the demo profile (invalid, then valid)", async () => {
  await go("/account/profile"); await js("__t.click('main button', 'Edit profile')"); await waitFor("document.querySelector('#field-email')");
  await js("__t.type('#field-email', 'not-an-email')"); await js("__t.click('main form button[type=submit]')");
  await waitFor("__t.text().includes('Enter an email address like')");
  await js("__t.type('#field-full_name', 'Meera Demo')"); await js("__t.type('#field-email', 'meera.demo@example.com')"); await js("__t.click('main form button[type=submit]')");
  await waitFor("__t.text().includes('Saved to the demo profile') && __t.text().includes('meera.demo@example.com')");
  await go("/account/profile"); await waitFor("__t.text().includes('Meera Demo')"); return "inline email error; saved; kept after reload";
});
await step(44, "Open a sample order and its simulated tracking", async () => {
  await go("/account/orders"); await waitFor("document.querySelectorAll('main article').length >= 3");
  await js("[...document.querySelectorAll('main article')].find(a => a.textContent.includes('Out for Delivery')).querySelector('a').click()");
  await waitFor("/^\\/account\\/orders\\/MA-/.test(location.pathname) && __t.text().includes('Simulated tracking')");
  const t = await js("__t.text()"); expect(t.includes("Sample order") && t.includes("never placed or paid for"), "sample labelling");
  const current = await js("document.querySelector('[aria-label=\"Order progress\"] [aria-current=step]')?.textContent");
  expect(current.includes("Out for Delivery"), current);
  await js("__t.click('main a', 'Open tracking page')"); await waitFor("/\\/tracking$/.test(location.pathname) && __t.text().includes('Simulated tracking')");
  await go("/account/orders/MA-00000000-NOPE"); await waitFor("__t.text().includes('couldn’t find that order')");
  await shot("44-account-order"); return "details + timeline at Out for Delivery; tracking page; unknown ID handled";
});
await step(45, "Add, edit, set default and delete an address (with confirmation)", async () => {
  await go("/account/addresses"); await js("__t.click('main button', 'Add address')"); await waitFor("document.querySelector('#address-full_name')");
  const v = { full_name: "Kiran Test", mobile: "9123456780", house: "Plot 9", street: "Park Road", city: "Mysuru", pincode: "570001" };
  for (const [k, val] of Object.entries(v)) await js(`__t.type('#address-${k}', ${JSON.stringify(val)})`);
  await js("__t.type('#address-state', 'Karnataka')"); await js("__t.click('main form button[type=submit]')");
  await waitFor("__t.text().includes('Kiran Test')");
  await js(`__t.click('main button[aria-label="Edit address for Kiran Test, Mysuru"]')`); await waitFor("document.querySelector('#address-landmark')");
  await js("__t.type('#address-landmark', 'Opposite the lake')"); await js("__t.click('main form button', 'Save changes')"); await waitFor("__t.text().includes('Opposite the lake')");
  await js("(() => { const li = [...document.querySelectorAll('main li')].find(l => l.textContent.includes('Kiran Test')); [...li.querySelectorAll('button')].find(b => b.textContent.includes('Set as default')).click(); return true; })()");
  await waitFor("[...document.querySelectorAll('main li')].find(l => l.textContent.includes('Kiran Test'))?.textContent.includes('Default')");
  await js(`__t.click('main button[aria-label="Delete address for Kiran Test, Mysuru"]')`); await waitFor("document.querySelector('[role=alertdialog]')");
  await js("__t.click('[role=alertdialog] button', 'Cancel')"); await sleep(400); expect((await js("__t.text()")).includes("Kiran Test"), "cancel kept it");
  await js(`__t.click('main button[aria-label="Delete address for Kiran Test, Mysuru"]')`); await waitFor("document.querySelector('[role=alertdialog]')");
  await js("__t.click('[role=alertdialog] button', 'Delete address')"); await waitFor("!__t.text().includes('Kiran Test')");
  return "added, edited (landmark), made default, cancel keeps, confirm deletes";
});
await step(46, "Checkout as the demo account uses the default address", async () => {
  await js("(() => { const li = [...document.querySelectorAll('main li')].find(l => l.textContent.includes('Sample Street')); const b = li && [...li.querySelectorAll('button')].find(b => b.textContent.includes('Set as default')); if (b) b.click(); return true; })()");
  await go("/products/p-papaya"); await js("__t.click('main button', 'Add to cart')"); await waitFor("__t.cartLabel() === 'Cart, 2 items'");
  await go("/cart"); await js("__t.click('main button', 'Proceed to checkout')"); await waitFor("location.pathname === '/checkout/address' && document.querySelector('input[name=delivery-address]')");
  const checked = await js("document.querySelector('input[name=delivery-address]:checked').closest('li').textContent");
  expect(checked.includes("Sample Street") && checked.includes("Default"), checked.slice(0, 120));
  await js("__t.click('main button', 'Continue to review')"); await waitFor("location.pathname === '/checkout/review' && __t.text().includes('Place order')");
  await js("__t.click('main button', 'Place order')"); await waitFor("/confirmation$/.test(location.pathname) && __t.text().includes('Order Placed Successfully')");
  const id = await js("location.pathname.split('/')[2]");
  await go("/account/orders"); await waitFor(`__t.text().includes(${JSON.stringify(id)})`);
  const card = await js(`[...document.querySelectorAll('main article')].find(a => a.textContent.includes(${JSON.stringify(id)})).textContent`);
  expect(!card.includes("Sample order"), "a real checkout order is not labelled sample"); return `${id} placed to the default sample address; listed in My Orders without the sample label`;
});
await step(47, "Settings: local preferences persist; reset asks first", async () => {
  await go("/account/settings"); await waitFor("document.querySelector('[role=switch]')");
  const before = await js("document.querySelectorAll('[role=switch]')[1].getAttribute('aria-checked')");
  await js("document.querySelectorAll('[role=switch]')[1].click(); true"); await sleep(300);
  await go("/account/settings"); await waitFor("document.querySelector('[role=switch]')");
  const after = await js("document.querySelectorAll('[role=switch]')[1].getAttribute('aria-checked')");
  expect(before !== after, before + " → " + after);
  expect((await js("__t.text()")).includes("no messages are sent"), "honest notice");
  await js("__t.click('main button', 'Reset demo data')"); await waitFor("document.querySelector('[role=alertdialog]')");
  await js("__t.click('[role=alertdialog] button', 'Cancel')"); return `offers ${before} → ${after} after reload; reset confirm opens and cancels`;
});
await step(48, "Mobile account navigation and header menu", async () => {
  await viewport(390, 844); await go("/account");
  await waitFor("document.querySelector('nav[aria-label=Account]')");
  const sw = await js("document.documentElement.scrollWidth"); expect(sw <= 390, "scrollWidth " + sw);
  await js("__t.click('header button[aria-label^=Account]')"); await waitFor("__t.byText('[data-slot=popover-content] a', 'My Orders')");
  await shot("48-account-menu-390");
  await js("__t.click('[data-slot=popover-content] a', 'My Orders')"); await waitFor("location.pathname === '/account/orders'");
  await sleep(400); expect(!(await js("!!document.querySelector('[data-slot=popover-content]')")), "menu closed after navigating");
  await shot("48-account-orders-390"); await viewport(1440, 900); return "no overflow at 390; header menu → My Orders and closes";
});
await step(49, "Logout ends the demo and keeps guest shopping working", async () => {
  await go("/account"); await js("__t.click('nav[aria-label=Account] button', 'Logout')");
  await waitFor("location.pathname === '/login' && __t.text().includes('You have left the demo account')");
  await go("/account"); await waitFor("__t.text().includes('Sign in to see your account')");
  const orders = await js("JSON.parse(localStorage.getItem('mithren.orders'))");
  expect(orders.every((o) => !o.is_sample) && orders.length >= 1, "samples removed, own orders kept: " + orders.length);
  expect((await js("JSON.parse(localStorage.getItem('mithren.addresses'))")).every((a) => !a.is_sample), "sample address removed");
  await js("__t.click('header button[aria-label^=Account]')"); await waitFor("__t.byText('[data-slot=popover-content] a', 'Sign in')");
  await go("/products"); await js("__t.click('main article button', 'Add to cart')"); await waitFor("__t.cartLabel() === 'Cart, 1 item'");
  return "signed-out notice; account gated again; samples gone; own orders kept; guest add-to-cart works";
});
await step(50, "Registration preview: validation, then no account created", async () => {
  await go("/register"); await js("__t.click('main form button[type=submit]')");
  await waitFor("__t.text().includes('Please fix the 3 highlighted fields')");
  await js("__t.type('#field-full_name', 'Asha Rao')"); await js("__t.type('#field-email', 'asha@example.com')");
  await js("document.querySelector('input[name=acknowledged]').click(); true"); await js("__t.click('main form button[type=submit]')");
  await waitFor("__t.text().includes('no account was created')");
  const stored = await js("JSON.stringify({ ...localStorage })"); expect(!stored.includes("asha@example.com"), "details stored");
  await shot("50-register-done"); return "3 errors; preview success says no account was created; nothing stored";
});
await step(51, "Help & support is honest and reachable", async () => {
  await go("/support"); await waitFor("__t.text().includes('Help & support')");
  const t = await js("__t.text()");
  expect(t.includes("will be added here before launch") && !/\+91|@mithren/i.test(t), "no invented contact details");
  return "FAQs; contact placeholder; no phone or email invented";
});

// ---- Homepage, opportunity pages, loading and feedback (phase 6) ----
await step(52, "Homepage order; static hero; no liquid glass on the hero strip", async () => {
  await viewport(1440, 900); await go("/");
  const order = await js("[...document.querySelectorAll('main > section')].map(s => s.getAttribute('aria-labelledby')).join()");
  expect(order === "hero-title,about-title,videos-title,categories-title,seasonal-title,bundles-title,banner-title", order);
  const t = await js("__t.text()");
  expect(!t.includes("Fresh picks") && !t.includes("Pantry staples, sold by the pack") && !t.includes("Meet Our Farmers"), "removed content still present");
  // Static hero (no slider) and no liquid glass on the benefits strip along its bottom.
  expect(!(await js("!!document.querySelector('[aria-roledescription=carousel], [aria-roledescription=slide]')")), "slider still present");
  const strip = await js("(() => { const ul = [...document.querySelectorAll('main section[aria-labelledby=hero-title] ul')].pop(); const outer = ul.parentElement; return [ul.className.includes('glass'), getComputedStyle(outer).backdropFilter, getComputedStyle(outer).backgroundColor].join('|'); })()");
  expect(strip === "false|none|rgba(0, 0, 0, 0)", strip);
  await shot("52-home-1440"); return `sections ${order}; strip: ${strip}`;
});
await step(53, "Agent Benefits: hero link, sections, direct open", async () => {
  await js("__t.click('main a', 'Agent Benefits')"); await waitFor("location.pathname === '/agent-benefits' && __t.text().includes('Grow local agriculture')");
  const t = await js("__t.text()");
  const missing = ["Seller Agent", "Delivery Agent", "Proposed benefits — subject to final company policy", "From interest to onboarding", "What onboarding is planned to cover", "Not yet published", "Become a Mithren Agent"].filter((x) => !t.includes(x));
  expect(missing.length === 0, "missing " + missing.join(", "));
  await js("__t.click('main a', 'Explore Delivery Opportunities')"); await waitFor("location.hash === '#delivery-agent'"); await sleep(600);
  const top = await js("Math.round(document.getElementById('delivery-agent').getBoundingClientRect().top)");
  expect(top >= 0 && top < 300, "anchor top " + top);
  expect(await js("[...document.querySelectorAll('main button')].filter(b => /applications: coming soon/.test(b.textContent)).length === 2 && [...document.querySelectorAll('main button')].filter(b => /applications: coming soon/.test(b.textContent)).every(b => b.disabled)"), "apply buttons must be disabled");
  await go("/agent-benefits"); await waitFor("__t.text().includes('Seller Agent')"); await shot("53-agents");
  return `hero → /agent-benefits; anchor scrolls to Delivery Agent (top ${top}px); applications disabled; direct load OK`;
});
await step(54, "Investor Opportunities: hero link, risk section, portal fallback, footer links", async () => {
  await go("/"); await js("__t.click('main a', 'Investor Opportunities')"); await waitFor("location.pathname === '/investors' && __t.text().includes('Investor Opportunities at Mithren Agro')");
  const t = await js("__t.text()");
  expect(t.includes("Risks and disclosures") && t.includes("no guarantee of returns") && !/guaranteed returns/i.test(t), "disclosure");
  const portal = await js("[...document.querySelectorAll('main button, main a')].filter(e => /Investor Portal/.test(e.textContent)).map(e => e.tagName + ':' + e.disabled).join()");
  expect(!portal.includes("A:") && portal.split(",").length === 2, "no link without a configured URL: " + portal);
  const footer = await js("[...document.querySelectorAll('footer a')].map(a => a.getAttribute('href')).join()");
  expect(footer.includes("/agent-benefits") && footer.includes("/investors"), footer);
  await shot("54-investors"); return `portal unconfigured → ${portal}; footer links to both pages`;
});
await step(55, "Video cards: two, after the hero, safe without a source", async () => {
  await go("/"); const info = await js("(() => { const s = document.querySelector('section[aria-labelledby=videos-title]'); return [s.querySelectorAll('article').length, s.querySelectorAll('video').length, s.textContent.includes('Video coming soon'), s.previousElementSibling.getAttribute('aria-labelledby')].join('|'); })()");
  expect(info === "2|0|true|about-title", info);
  await viewport(390, 844); await go("/"); await js("document.querySelector('section[aria-labelledby=videos-title]').scrollIntoView(); true"); await sleep(400); await shot("55-videos-390");
  await viewport(1440, 900); return "2 cards right after About, 'Video coming soon', no <video> element (nothing downloads) until a source is set";
});
await step(56, "Add to cart toast: success, auto-dismiss, error at the limit", async () => {
  await js("localStorage.removeItem('mithren.cart'); true");
  const addOkra = "(() => { const card = [...document.querySelectorAll('main article')].find(a => a.textContent.includes('Okra')); [...card.querySelectorAll('button')].find(b => b.textContent.includes('Add to cart')).click(); return true; })()";
  await go("/products"); await js(addOkra);
  await waitFor("__t.byText('[aria-label=Notifications] [role=status]', 'Added to cart successfully!')");
  expect((await js("__t.cartLabel()")) === "Cart, 1 item", "cart count");
  await shot("56-toast");
  await waitFor("!document.querySelector('[aria-label=Notifications] [role=status]')", 8000);
  const okra = await js("JSON.parse(localStorage.getItem('mithren.cart'))[0].product_id");
  await js(`localStorage.setItem('mithren.cart', JSON.stringify([{ product_id: ${JSON.stringify(okra)}, quantity: 20 }])); true`); await go("/products");
  await js(addOkra);
  await waitFor("__t.byText('[aria-label=Notifications] [role=alert]', 'Couldn’t add to cart')");
  expect(!(await js("!!__t.byText('[aria-label=Notifications] *', 'Added to cart successfully!')")), "no success toast on failure");
  await js("localStorage.removeItem('mithren.cart'); true");
  return "success toast, dismissed within 8 s; at the 20-item limit an error toast and no success toast";
});
await step(57, "Buy now is logo gold with dark text", async () => {
  await go("/products/p-tomatoes"); const c = await js("(() => { const b = __t.byText('main button', 'Buy now'); return getComputedStyle(b).backgroundColor + '|' + getComputedStyle(b).color; })()");
  expect(c === "rgb(245, 165, 28)|rgb(31, 45, 33)", c);
  const add = await js("getComputedStyle(__t.byText('main button', 'Add to cart')).backgroundColor");
  expect(add === "rgb(46, 125, 50)", "Add to cart stays green: " + add);
  await shot("57-buy-now"); return `Buy now ${c}; Add to cart ${add}`;
});
await step(58, "Category dropdown switches results; combines with sort", async () => {
  await go("/products"); await choose("Category", "Vegetables");
  await waitFor("location.search === '?category=vegetables' && /Showing \\d+ of 26/.test(__t.text())");
  const veg = await js("__t.text().match(/Showing (\\d+) of 26/)[1]");
  await choose("Sort products", "Price: Low to High"); await waitFor("location.search === '?category=vegetables&sort=price-asc'");
  await sleep(300); const p = await js("__t.prices()"); expect(p.length === Number(veg) && p.join() === [...p].sort((a, b) => a - b).join(), "sorted veg " + p);
  await choose("Category", "Fruits"); await waitFor("location.search === '?category=fruits&sort=price-asc'");
  await choose("Category", "All products"); await waitFor("location.search === '?sort=price-asc' && __t.text().includes('Showing 26 of 26')");
  await shot("58-category"); return `Vegetables ${veg} (sorted by price) → Fruits → All products 26`;
});
await step(59, "Account menu: My Orders opens the order history", async () => {
  await go("/"); await js("__t.click('header button[aria-label^=Account]')"); await waitFor("__t.byText('[data-slot=popover-content] a', 'My Orders')");
  expect(!(await js("document.querySelector('[data-slot=popover-content]').textContent.includes('Orders in this browser')")), "old label");
  await js("__t.click('[data-slot=popover-content] a', 'My Orders')"); await waitFor("location.pathname === '/account/orders'");
  return "signed out: My Orders → /account/orders (demo gate unchanged)";
});
await step(60, "Scrollbar hidden, scrolling still works", async () => {
  await go("/agent-benefits"); const st = await js("getComputedStyle(document.documentElement).scrollbarWidth + '|' + getComputedStyle(document.documentElement).overflowY + '|' + getComputedStyle(document.body).overflowY");
  expect(st === "none|visible|visible", st);
  await js("scrollTo(0, 900); true"); await sleep(300); const y = await js("Math.round(scrollY)");
  expect(y === 900, "scrollY " + y);
  await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 400, y: 400, deltaX: 0, deltaY: 400 }); await sleep(800);
  const y2 = await js("Math.round(scrollY)"); expect(y2 > y, `wheel ${y} → ${y2}`);
  return `scrollbar-width none; overflow visible; scrollTo → ${y}; wheel → ${y2}`;
});
await step(61, "Form placeholders with visible labels", async () => {
  await go("/register"); const ph = await js("[...document.querySelectorAll('main input[type=text], main input[type=email], main input[type=tel]')].map(i => (document.querySelector('label[for=\"' + i.id + '\"]')?.textContent ?? '?') + '=' + i.placeholder).join('; ')");
  expect(ph.split("; ").every((p) => !p.startsWith("?") && !p.endsWith("=")), ph);
  return ph;
});

// ---- Hero slider, About, policies and product options (phase 7) ----
await step(62, "Static hero buttons open the opportunity pages; About sits right below", async () => {
  await viewport(1440, 900); await go("/");
  const info = await js("(() => { const h = document.querySelector('section[aria-labelledby=hero-title]'); const a = document.querySelector('section[aria-labelledby=about-title]'); return [h.querySelectorAll('img').length, h.nextElementSibling === a, Math.round(a.getBoundingClientRect().height)].join('|'); })()");
  const [imgs, next, aboutHeight] = info.split("|");
  expect(imgs === "1" && next === "true" && Number(aboutHeight) < 300, info);
  await js("__t.click('section[aria-labelledby=hero-title] a', 'Investor Opportunities')"); await waitFor("location.pathname === '/investors'");
  await go("/"); await js("__t.click('section[aria-labelledby=hero-title] a', 'Agent Benefits')"); await waitFor("location.pathname === '/agent-benefits'");
  await go("/"); await js("document.querySelector('section[aria-labelledby=about-title]').scrollIntoView({ block: 'center' }); true"); await sleep(400); await shot("62-about-compact-1440");
  await viewport(390, 844); await go("/"); await shot("63-hero-390");
  const sw = await js("document.documentElement.scrollWidth"); expect(sw <= 390, "scrollWidth " + sw);
  await js("document.querySelector('section[aria-labelledby=about-title]').scrollIntoView(); true"); await sleep(400); await shot("63-about-390");
  await viewport(1440, 900); return `1 hero image; About right after it, ${aboutHeight}px tall at 1440; both hero buttons work; no overflow at 390`;
});
await step(64, "About section → About Us page", async () => {
  await go("/"); const t = await js("document.querySelector('section[aria-labelledby=about-title]').innerText");
  expect(t.includes("Farm Fresh") && t.includes("One Place") && t.includes("Grow Together") && !/[0-9]/.test(t), t.slice(0, 120));
  await js("__t.click('section[aria-labelledby=about-title] a', 'Learn More')"); await waitFor("location.pathname === '/about' && __t.text().includes('A marketplace built around farms')");
  await shot("64-about-page"); return "3 highlights, no numbers; Learn More → /about";
});
await step(65, "Footer: every policy link opens its page", async () => {
  const out = [];
  for (const label of ["Privacy Policy", "Terms and Conditions", "Cancellation and Refund Policy", "Shipping Policy", "Return Policy"]) {
    await go("/"); await js(`__t.click('footer a', ${JSON.stringify(label)})`);
    await waitFor(`document.querySelector('main h1')?.textContent === ${JSON.stringify(label)} && __t.text().includes('Draft for legal review')`);
    out.push(await js("location.pathname"));
  }
  const t = await js("__t.text()"); expect(t.includes("10-day return option applies only to eligible women’s apparel"), "return rule");
  await go("/cancellation-refund-policy"); const c = await js("__t.text()");
  expect(c.includes("Ready for Dispatch") && c.includes("customer-initiated cancellation is not permitted"), "packed rule"); await shot("65-cancellation-policy");
  return out.join(", ");
});
await step(66, "Product options: weight changes price; cart, checkout and order keep it", async () => {
  await js("localStorage.removeItem('mithren.cart'); true");
  await go("/products/p-red-onions"); await js("__t.click('main label', '500 g')"); await waitFor("__t.text().includes('per 500 g')");
  const t = await js("__t.text()"); expect(t.includes("₹20") && t.includes("Total ₹20"), "price for 500 g");
  const addHere = "document.querySelector('main [data-slot=button]:has(+ [data-variant=buy])').click(); true";
  await js(addHere); await waitFor("__t.byText('[aria-label=Notifications] [role=status]', 'Red Onions (500 g)')");
  await js("__t.click('main label', '2 kg')"); await waitFor("__t.text().includes('per 2 kg')"); await js(addHere);
  await waitFor("__t.cartLabel() === 'Cart, 2 items'"); await shot("66-onions-options");
  await go("/cart"); await waitFor("__t.text().includes('2 kg')");
  const lines = await js("[...document.querySelectorAll('main li')].filter(li => li.textContent.includes('Red Onions')).map(li => li.innerText.replace(/\\s+/g, ' ')).join(' | ')");
  expect(lines.includes("500 g") && lines.includes("2 kg") && lines.includes("₹20 each") && lines.includes("₹76 each"), lines);
  await js("__t.click('main button', 'Proceed to checkout')"); await waitFor("location.pathname === '/checkout/address'");
  await waitFor("document.querySelector('input[name=delivery-address]')"); await js("document.querySelector('input[name=delivery-address]').click(); true");
  await js("__t.click('main button', 'Continue to review')"); await waitFor("location.pathname === '/checkout/review' && __t.text().includes('Place order')");
  const review = await js("__t.text()"); expect(review.includes("500 g · Qty 1 × ₹20") && review.includes("2 kg · Qty 1 × ₹76") && review.includes("₹96"), review.slice(0, 300));
  await js("__t.click('main button', 'Place order')"); await waitFor("/confirmation$/.test(location.pathname) && __t.text().includes('Order Placed Successfully')");
  const conf = await js("__t.text()"); expect(conf.includes("500 g") && conf.includes("2 kg") && conf.includes("You can ask to cancel this order until it is packed"), "confirmation");
  return "500 g ₹20 and 2 kg ₹76 as two lines; review and confirmation keep both; total ₹96; cancellation note shown";
});
await step(67, "Apparel sizes: card asks for a size; out-of-stock size disabled; size kept to checkout", async () => {
  await go("/products?category=womens-apparel"); await waitFor("__t.text().includes('Floral Print Kurta Set')");
  await js("(() => { const card = [...document.querySelectorAll('main article')].find(a => a.textContent.includes('Floral Print Kurta Set')); [...card.querySelectorAll('a')].find(a => a.textContent.includes('Choose size')).click(); return true; })()");
  await waitFor("location.pathname === '/products/p-floral-kurta-set' && document.querySelector('input[type=radio][value=xxl]')");
  expect(await js("document.querySelector('input[type=radio][value=xxl]').disabled"), "XXL must be disabled");
  await js("__t.click('main label', 'L')"); await waitFor("__t.text().includes('2-piece set · Size L')");
  await js("__t.click('main button', 'Buy now')"); await waitFor("location.pathname === '/checkout/address'");
  await waitFor("document.querySelector('input[name=delivery-address]')"); await js("document.querySelector('input[name=delivery-address]').click(); true");
  await js("__t.click('main button', 'Continue to review')"); await waitFor("location.pathname === '/checkout/review'");
  expect((await js("__t.text()")).includes("2-piece set · Size L"), "size in review");
  return "Choose size → product page; XXL disabled; Size L carried into Buy now review";
});

writeFileSync(`${OUT}/results.json`, JSON.stringify({ results, consoleErrors: [...new Set(consoleErrors)], orderId }, null, 1));
for (const r of results) console.log(`${String(r.n).padEnd(3)} ${r.result.padEnd(4)} ${r.title} — ${r.detail}`);
console.log("console errors:", [...new Set(consoleErrors)]);
const failed = results.filter((r) => r.result !== "PASS").length;
console.log(failed ? `${failed} step(s) failed` : `All ${results.length} steps passed`);
ws.close(); chrome.kill(); process.exit(failed || consoleErrors.length ? 1 : 0);
