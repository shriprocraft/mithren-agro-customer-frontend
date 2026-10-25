# Demo customer account

The customer account in this repository is a **demo**. It shows how sign-in, profile, orders, tracking, addresses, wishlist and settings will work, using sample data in the visitor's own browser. **It is not authentication and provides no security.** Nothing is sent to a server, because there is no account backend yet.

## What "demo authentication" means here

- There are **no credentials**: no password, PIN, one-time code or token is asked for, stored or checked anywhere (not in localStorage, sessionStorage, cookies or source code).
- "Signing in" means choosing **Explore Demo Account**. That writes a small marker to `localStorage` (`mithren.demo-session` = `{ "kind": "demo", "started_at": "<ISO time>" }`). The marker proves nothing about who the visitor is, and anyone can set or clear it.
- The `/account` pages check the marker only to decide what to *show* (account or an entry screen). That is a user-experience gate, **not access control**. Never rely on it to protect data.
- The registration page is a **preview**: it validates the form and then states that no account was created. What was typed is discarded; nothing is stored or sent.

## How to enter and leave demo mode

| Action | Where |
|---|---|
| Enter | **Explore Demo Account** on `/login`, on the entry screen of any `/account/*` page, on the registration success screen, or in the header account menu |
| Go straight to a section | `/login?next=/account/orders` (only same-site paths are accepted; `/login` and `/register` never loop) |
| Leave | **Logout** in the account sidebar, the header account menu, Account Settings or `/login` |
| Reset | Account Settings → **Reset demo data** (asks for confirmation) |

## What the demo account contains

| Feature | Route | Simulated? | Data |
|---|---|---|---|
| Overview | `/account` | Yes | Greeting, counts, latest orders |
| My Profile | `/account/profile` | Yes | Fictional profile (`Demo Customer`, `demo.customer@example.com`), editable and validated |
| My Orders | `/account/orders`, `/account/orders/[orderId]` | Yes | Three **sample orders** (labelled "Sample order") plus any order placed through checkout in this browser |
| Track Orders | `/account/track`; full page `/orders/[orderId]/tracking` | Yes: timeline is simulated, no delivery partner | Lookup by order ID among orders saved in this browser |
| My Addresses | `/account/addresses` | Yes | One fictional **sample address** (labelled "Sample") plus the visitor's own; add, edit, delete (confirmed), set default |
| My Wishlist | `/account/wishlist` (same list as `/wishlist` and the header) | Browser-only | Existing `WishlistContext` |
| Account Settings | `/account/settings` | Yes: no messages are sent | Two local notification toggles, session details, reset, logout |
| Help & Support | `/support` (public) | — | FAQs about what the preview does; no contact details exist yet, so none are shown |
| Sign in | `/login` | Yes | No password form (see "Decisions") |
| Register | `/register` | Preview only | Name, email, optional mobile, preview acknowledgement |

Sample data is fictional: the names say "Demo", the email uses the reserved `example.com` domain, and the street is "Sample Street". The sample address needs a mobile number to pass the checkout validation, so it uses `9000000001`; it is not anyone's known number, but it is a valid-looking Indian number, so replace it if the owner prefers another value.

## Where demo data is stored

All in this browser's `localStorage` (checkout uses `sessionStorage`), through `hooks/usePersistentState.ts`. Every stored value is validated when read.

| Key | Owner | Contents | On Logout |
|---|---|---|---|
| `mithren.demo-session` | `DemoAccountContext` | Demo marker (no identity) | Set to `null` |
| `mithren.demo-profile` | `DemoAccountContext` | Demo profile edits | Reset to the defaults |
| `mithren.demo-preferences` | `DemoAccountContext` | Two booleans | Reset to the defaults |
| `mithren.orders` | `OrdersContext` | Orders; demo samples have `is_sample: true` | Sample orders removed; checkout orders kept |
| `mithren.addresses`, `mithren.addresses.default` | `AddressBookContext` | Addresses (samples have `is_sample: true`) and the default address id | Sample address removed; own addresses kept |
| `mithren.wishlist`, `mithren.cart` | existing contexts | Unchanged by the demo | Kept |
| `mithren.checkout` (session) | `CheckoutContext` | Current checkout | Kept |

Cart, wishlist, the visitor's own orders and addresses belong to **this browser**, not to the demo account (guest checkout uses them too), so leaving the demo keeps them. To remove everything, clear this site's data in the browser.

## Integration with shopping and checkout

- Guest browsing, cart, wishlist, Buy now and guest checkout work exactly as before; no step requires the demo account.
- There is **one** address book: checkout and My Addresses edit the same `AddressBookContext` with the same form and validation. A new checkout preselects the **default** address (or the first saved one); a choice made during that checkout is kept until the order is placed.
- Orders placed while in the demo account are ordinary checkout orders (not labelled as samples). They stay after Logout, like any order placed in this browser.
- No price, charge, tax or payment rule changed.

## Decisions

| Decision | Reason |
|---|---|
| No email/password form on `/login` | Without an account service a form could only pretend to check credentials, and it would invite visitors to type real passwords |
| Gate inside each page (`RequireDemoSession`), not a redirect | No redirect loops; the address bar keeps the destination; the layout always renders its page (Next.js instant-navigation validation flags layouts that drop their page) |
| Samples are added to the existing order and address stores, flagged `is_sample` | One source of truth for checkout, tracking and the account; samples can be removed precisely |
| Help & Support is a public page | Guests need it too; the account navigation links to it |
| Registration acknowledgement instead of "I accept the terms" | No terms or privacy policy exist yet; the checkbox says so |

## Before production: what must replace the demo

1. Choose a real authentication provider or a verified backend. Check what the seller and delivery portals use first: shared-backend compatibility has not been investigated, and no provider is assumed.
2. Replace `DemoAccountContext` with a provider backed by a **server-verified session** (HTTP-only secure cookies or the provider's SDK). Never trust a client-side flag as proof of sign-in.
3. Implement `CustomerAccountService` (`src/types/account.ts`): sign in, register, sign out, get and update the profile, get orders, get and save addresses, with **server-side authorisation** on every call so customers only see their own data.
4. Move orders, addresses and profiles from browser storage to the backend; replace the `services/` and context storage calls with API calls. Remove the sample-data seeding (`data/demo-account.ts`, `buildSampleOrders`).
5. Gate account routes on the server (for example in a layout that reads the verified session) and keep the client gate only for loading states.
6. Add password reset and account recovery, email/mobile verification, rate limiting and audit logging through the chosen provider.
7. Keep secrets in server-side environment variables only.
8. Publish terms, privacy, shipping, cancellation and returns policies, and real support contact details, before collecting any personal data.
9. Real notification preferences need a messaging service; real tracking needs seller and delivery integrations.

## Tests

- Unit (`tests/demo-account.test.tsx`): profile/registration validation, same-site `next` handling, untrusted storage parsing, sample orders valid and consistent, starting and ending the demo (samples added and removed, own addresses kept), no password/token in storage, the gate, the header menu in both states, registration preview storing nothing.
- End to end (`npm run test:e2e`, steps 40–51): gating, sign-in with `next`, refresh, navigation, profile edit, sample order and tracking, address add/edit/default/delete with confirmation, checkout with the default address, settings persistence, mobile menu, logout, registration preview, support page.
