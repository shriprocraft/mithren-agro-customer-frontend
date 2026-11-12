# Backend contracts

What the customer frontend expects from the backend. Endpoint names live only in `src/config/api.ts`, and API calls only in `src/lib/api-client.ts` and `src/services/*`, so UI components don't change when these do.

**Status:** the backend (FastAPI, `mithren-agro-backend`) implements the session endpoints (`GET /auth/session`, `POST /auth/sign-out`), phone OTP sign-in, the customer profile, the address book and the public catalogue, as documented below. No SMS provider is connected yet: phone codes are delivered only by the backend's development fake sender. Cash on Delivery orders are implemented as documented below. Email OTP, Google sign-in and reverse geocoding are still proposals.

## Conventions

- **Base URL:** `NEXT_PUBLIC_API_BASE_URL`, which includes the API prefix, e.g. `http://localhost:8000/api/v1` locally. Paths below are relative to it.
- **Format:** JSON with `snake_case` fields. Money in paise, timestamps in ISO 8601, phone numbers in E.164.
- **Session:** an HTTP-only, `Secure`, `SameSite` cookie set by the backend. The frontend never sees a token. Every request uses `credentials: "include"`, so the backend needs a CORS allow-list with credentials enabled. `POST`, `PATCH` and `DELETE` must come from an allowed `Origin` (the interim CSRF protection; a session-tied CSRF token is planned).
- **Methods:** the API client sends `GET`, `POST`, `PATCH` and `DELETE`.
- **Errors:** any non-2xx status with:

```json
{ "error": { "code": "invalid_otp", "message": "Readable text", "retry_after_seconds": 30 } }
```

`retry_after_seconds` is optional. A `422 validation_error` also carries `fields`, one message per invalid field (`body` for the request as a whole); submitted values are never echoed:

```json
{ "error": { "code": "validation_error", "message": "Some details need correcting.", "fields": { "pincode": "Enter a valid 6-digit PIN code" } } }
```

| `code` | Typical status | Meaning |
|---|---|---|
| `invalid_otp` | 400 | Wrong code; it can be retried |
| `expired_otp` | 400 | Code expired or unknown; a new one is needed |
| `too_many_attempts` | 429 | Code locked; a new one is needed |
| `rate_limited` | 429 | Too many requests; send `retry_after_seconds` |
| `invalid_destination` | 400 | Phone or email can't be used |
| `session_expired` | 401 | The session ended, or there is none |
| `origin_not_allowed` | 403 | A change was sent from an origin the backend doesn't allow |
| `address_not_found` | 404 | No such address for this customer (also for another customer's address) |
| `conflict` | 409 | A concurrent change prevented saving; trying again is safe |
| `validation_error` | 422 | Invalid fields, listed in `fields` |
| `provider_not_configured` | 503 | Provider isn't set up |
| `auth_unavailable` | 503 | Sign-in is down |
| `service_unavailable` | 503 | The account service is down |

The frontend adds `network_error` and `timeout` itself. Any other code shows a generic message.

## Authentication (`src/services/auth`, `AuthService` in `src/types/auth.ts`)

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/auth/session` | none | `200 { "customer": Customer }`; `200 { "customer": null }` with no cookie; `401 session_expired` (cookie cleared) when the cookie is no longer valid. **Implemented** |
| POST | `/auth/otp/phone/request` | `{ "phone": "+919876543210" }` | `200 OtpChallenge`, the same whether or not the number has an account. **Implemented** |
| POST | `/auth/otp/phone/verify` | `{ "challenge_id", "code" }` | `200 { "customer": Customer }` and sets the cookie; the first sign-in of a new number creates the account. **Implemented** |
| POST | `/auth/otp/email/request` | `{ "email": "name@example.com" }` | `200 OtpChallenge`. Not implemented; the Email tab is hidden (`src/config/auth.ts`) |
| POST | `/auth/otp/email/verify` | `{ "challenge_id", "code" }` | `200 { "customer": Customer }` and sets the cookie. Not implemented |
| GET | `/auth/google/start?return_to=<same-site path>` | Browser navigation | Redirects to Google. Not implemented; the button is disabled as "Coming soon" |
| POST | `/auth/sign-out` | none | `204` and clears the cookie. **Implemented** |

```ts
Customer     { id: string; full_name: string | null; email: string | null; phone: string | null }
OtpChallenge { challenge_id: string; channel: "phone" | "email"; destination_hint: string; // masked
               expires_in_seconds: number; resend_after_seconds: number }
```

After a successful verify the frontend calls `GET /auth/session` and treats the customer as signed in only if that returns them (so the browser really kept the cookie). A customer whose `full_name` is `null` is asked for a name right after signing in, saved with `PATCH /customer/profile`; they can skip it and are asked again at their next sign-in. The session is read again after saving or skipping.

Phone OTP limits (backend `OTP_*` settings, enforced on the server): 6-digit codes valid for 5 minutes, 5 attempts, 30-second resend cooldown, 5 requests per number and 20 per IP address per hour. Phone input is ASCII digits, spaces and hyphens, at most 20 characters; codes are exactly 6 ASCII digits.

The account profile has its own endpoints (see "Customer profile"). Sessions refresh on the server with a sliding idle expiry; the frontend doesn't call a refresh endpoint, and treats a `401` as signed out.

**Backend responsibilities:**
- Generate, hash, expire and rate-limit codes (per destination and per IP), with a limit on attempts.
- Never return a code. `development_code` exists only in the development mock.
- Avoid revealing whether an account exists.

### Google OAuth setup

The authorisation-code flow runs entirely on the backend. Google's client secret must never reach the frontend.

1. Create an OAuth client in Google Cloud Console and store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as **backend** environment variables.
2. Register the backend's callback, for example `https://<api-host>/auth/google/callback`, as an authorised redirect URI.
3. `/auth/google/start` validates `return_to` as a same-site path, stores it with `state` and PKCE, and redirects to Google.
4. The callback verifies `state` and the ID token, creates or finds the customer, sets the cookie and redirects to the storefront's `return_to`, which is `/login?next=<step>`.
5. On failure, redirect to `/login?auth_error=<code>&next=<step>`. Never send a token in the URL.

The storefront then calls `GET /auth/session`. Only that response marks the customer as signed in.

The "Continue with Google" button is text only for now. Add Google's official mark, following its branding guidelines, when the integration is approved.

### SMS and email providers

Sending codes is a backend job. No provider has been chosen or connected, and provider keys must stay on the backend.

## Catalogue (`src/services/catalog.ts`, `src/services/catalog-http.ts`; implemented)

Used when `NEXT_PUBLIC_CATALOG_SOURCE=backend`; otherwise the sample catalogue in `src/data` is used. Public: no cookie, no sign-in. Responses are `Cache-Control: public, max-age=60`, and the storefront caches them for a few minutes (`"use cache"`).

| Method | Path | Success |
|---|---|---|
| GET | `/catalog/categories` | `200 { "categories": Category[] }`, in display order |
| GET | `/catalog/vendors` | `200 { "vendors": Vendor[] }`: only vendors with something on sale |
| GET | `/catalog/products?category=<slug>&seasonal=true&limit=1..100&offset=0` | `200 { "products": Product[], "total", "limit", "offset" }`: single products, not combo boxes |
| GET | `/catalog/products/:id` | `200 Product` for a product or a combo box; `404 product_not_found` for anything else, including a sample id such as `p-tomatoes` |
| GET | `/catalog/products/:id/related?limit=1..8` | `200 { "products": Product[] }` from the same category (default 4) |
| GET | `/catalog/bundles?combo_box=true` | `200 { "products": Product[] }`: combo boxes with `bundle_items` and `bundle_contents`; `combo_box=true` gives the homepage boxes |

- Shapes are exactly `Category`, `Vendor` and `Product` in `src/types/catalog.ts`. Optional fields are left out, never `null`. Ids are UUIDs, so a cart or wishlist saved with sample ids simply drops those items.
- `stock_status` is worked out on the server (0 is `out_of_stock`, 1 to 5 `low_stock`); exact stock, seller ids and SKUs are never sent. `vendor_id` is a public vendor id, not the seller's.
- `price` is the list price and `discounted_price` the selling price, when lower. A product with options describes its default option; combo boxes are priced from their items, as in `lib/bundles.ts`.
- Only listed, active products of approved sellers appear; a combo box appears only if all its items do.
- Category rules (image shape, return eligibility) match on the category **slug**, never its id (`src/lib/catalog-display.ts`).

## Checkout quote (`src/services/checkout.ts`, `src/hooks/useCheckoutQuote.ts`; implemented)

Used with the backend catalogue only (sample product ids mean nothing to the API; sample mode keeps pricing in `lib/cart.ts`). The cart and address steps ask without an address; the review step asks with the chosen address when it is in the customer's account.

| Method | Path | Request | Success |
|---|---|---|---|
| POST | `/checkout/quote` | `{ "items": [{ "product_id", "variant_id"?, "quantity": 1..20 }], "address_id"? }` (1 to 50 items, each product and option once) | `200 Quote` (`src/types/checkout.ts`), `Cache-Control: no-store` |

- **Stateless:** nothing is reserved or saved. The server prices with the catalogue's own rules and checks stock across all lines, including what combo boxes contain.
- **Quantities are never lowered.** A line that can't be supplied gets `issue: "out_of_stock"` or `"insufficient_stock"`; items that can't be sold are listed in `unavailable`. Each adds a `blockers` entry with a message to show, and `can_checkout` is false. Stock is never a number.
- `charges` is `[]` (no delivery charge yet; prices include GST) and `serviceability` is `"not_checked"`.
- **Address:** optional. With one, a valid session is required (`401 session_expired`) and it must be the customer's own (`404 address_not_found`, also for an id that isn't a UUID). Without one, the cookie isn't read. `403 origin_not_allowed`, `422 validation_error` and `503` as elsewhere.
- **Before ordering**, the review step asks again. If anything differs from what is on screen (items, quantities, prices, issues or total, `lib/checkout-quote.ts quoteFingerprint`), it shows the new quote with a notice and places nothing: the order is placed only on a click made after the customer has seen the current prices. The order is then built with the server's prices.

## Orders (`src/services/orders.ts`; implemented, Cash on Delivery)

Used when the backend catalogue is on (`NEXT_PUBLIC_CATALOG_SOURCE=backend`) and the customer is signed in through the backend. The sample catalogue and the demo account keep their orders in this browser (`OrdersContext`, mode `"browser"`), unchanged.

| Method | Path | Request | Success |
|---|---|---|---|
| POST | `/customer/orders` | header `Idempotency-Key: <uuid>`; `{ "items", "address_id", "payment_method": "cod", "pricing_version", "expected": { "total", "lines": [{ "item_index", "unit_price" }] } }` | `201` order (`200` with the same order when the key was already used for this request) |
| GET | `/customer/orders?limit=50` | none | `200 { "orders": [order], "next_cursor"? }`, newest first |
| GET | `/customer/orders/{order_number}` | none | `200` order |
| POST | `/customer/orders/{order_number}/cancel` | `{ "reason"? }` | `200` order (also when already cancelled) |

- The order matches `Order` (`types/order.ts`): `id` is the order number (`MA-YYYYMMDD-XXXXXX`), plus `payment_method`, `payment_status` (`pending` for COD, `void` once cancelled), `cancellable` and `cancel_reason`. The address is the order's own copy (`address.id` may be empty once the saved address is gone). Status `cancelled` ends an order before it is packed.
- **Placing** (review step): the final quote is taken again; the order is sent with that quote's `pricing_version`, total and unit prices. `409 quote_changed` (or `checkout_blocked`), both with `error.quote`, means nothing was placed: the page asks for a fresh quote, shows a notice and the customer clicks again. A lost response is retried with the same `Idempotency-Key`, so it can't place the order twice. Other errors: `401 session_expired`, `404 address_not_found`, `409 idempotency_key_reused`, `422 validation_error`.
- **Cancelling**: "Cancel order" (after a confirmation) on the order and tracking pages while `cancellable`; `409 cannot_cancel` once packed.
- **Server rules**: the session decides the customer; prices and stock are recalculated; ordering reserves stock (other customers see less available) without changing the seller's stock count; cancelling releases it.

## Customer profile (`src/services/profile.ts`; implemented)

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/customer/profile` | none | `200 { "id", "full_name", "email", "phone" }` |
| PATCH | `/customer/profile` | `{ "full_name": "Asha R" }` | `200`, the profile |

Only the name can change (2 to 100 characters after trimming); any other field is a `422`. Email and phone are the verified sign-in contacts and are read-only. Used by Account → Profile for a customer signed in through the backend; the demo profile stays in browser storage.

## Addresses (`Address` in `src/types/order.ts`, `src/services/addresses.ts`; implemented)

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/customer/addresses` | none | `200 { "addresses": Address[], "default_address_id": string \| null }`, newest first |
| POST | `/customer/addresses` | `AddressInput` | `201 Address`; the customer's first address becomes the default |
| PATCH | `/customer/addresses/:id` | any subset of `AddressInput` (the frontend sends the whole form) | `200 Address` |
| DELETE | `/customer/addresses/:id` | none | `204`; deleting the default leaves no default |
| PATCH | `/customer/addresses/:id/default` | none | `200 { "default_address_id": string }` |

- The customer comes from the session cookie; no customer id is ever sent. Another customer's address, or an id that isn't a UUID, is a `404 address_not_found`.
- Optional fields (`landmark`, `latitude`, `longitude`) are `null` in responses. The frontend sends them as `null` when empty, so an edit can clear them.
- Validation matches `src/lib/address.ts`: the mobile number may be typed with `+91`, `91`, a leading 0, spaces or dashes and is stored as 10 digits; the state must be in `src/data/indian-states.ts`; text fields are at most 200 characters (name 100).

How the fields map to the model proposed in the brief:

| Proposed | In `Address` |
|---|---|
| `id`, `latitude`, `longitude` | Same names; coordinates are optional |
| `label` | `type` (`home`, `work`, `other`) |
| `recipientName`, `phoneNumber` | `full_name`, `mobile` |
| `addressLine1`, `addressLine2` | `house`, `landmark` |
| `locality` | `street` ("Street and locality") |
| `city`, `state`, `postalCode` | `city`, `state`, `pincode` |
| `isDefault` | `default_address_id` on the list |
| `createdAt`, `updatedAt` | Added by the server |

`AddressBookContext` uses these endpoints when a customer is signed in through the backend. Guests and the demo account keep addresses in browser storage; those are never uploaded or deleted when someone signs in. The address chosen in the header (`useDeliveryAddress`) is still a per-browser preference.

## Reverse geocoding (`src/services/geocoding.ts`)

`GET /geocoding/reverse?lat=13.06&lng=80.25`

```json
{ "address": { "formatted": "12 Anna Salai, Chennai", "street": "12 Anna Salai", "city": "Chennai", "state": "Tamil Nadu", "postal_code": "600002" } }
```

- Return `{ "address": null }` when nothing is found.
- Require the provider's key on the backend, and rate-limit the endpoint.
- Treat coordinates as personal data: don't log them.
- `state` must be a full state name to prefill the form.

The customer always reviews and saves the result. A result doesn't mean delivery is available: serviceability needs its own rule and endpoint, which don't exist yet.

## Investor data (`src/services/investments.ts`)

Investing isn't available, so none of this is needed yet. The Coming Soon page reads only the domains. If investing opens, `GET /investments/domains`, `/investments/projects`, `/investments/plans` and `/investments/allocation-rules` would return the models in `src/types/investment.ts`, with unconfirmed values left `null`.
