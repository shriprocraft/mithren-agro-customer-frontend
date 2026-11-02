# Backend contracts

What the customer frontend expects from the backend. These are proposals for the backend team to confirm; no backend exists yet. Endpoint names live only in `src/config/api.ts`, and API calls only in `src/lib/api-client.ts` and `src/services/*`, so UI components don't change when these do.

## Conventions

- **Base URL:** `NEXT_PUBLIC_API_BASE_URL` (https).
- **Format:** JSON with `snake_case` fields. Money in paise, timestamps in ISO 8601, phone numbers in E.164.
- **Session:** an HTTP-only, `Secure`, `SameSite` cookie set by the backend. The frontend never sees a token. Every request uses `credentials: "include"`, so the backend needs a CORS allow-list with credentials enabled, plus CSRF protection on `POST`.
- **Errors:** any non-2xx status with:

```json
{ "error": { "code": "invalid_otp", "message": "Readable text", "retry_after_seconds": 30 } }
```

`retry_after_seconds` is optional.

| `code` | Typical status | Meaning |
|---|---|---|
| `invalid_otp` | 400 | Wrong code; it can be retried |
| `expired_otp` | 400 | Code expired or unknown; a new one is needed |
| `too_many_attempts` | 429 | Code locked; a new one is needed |
| `rate_limited` | 429 | Too many requests; send `retry_after_seconds` |
| `invalid_destination` | 400 | Phone or email can't be used |
| `session_expired` | 401 | The session ended |
| `provider_not_configured` | 503 | Provider isn't set up |
| `auth_unavailable` | 503 | Sign-in is down |

The frontend adds `network_error` and `timeout` itself. Any other code shows a generic message.

## Authentication (`src/services/auth`, `AuthService` in `src/types/auth.ts`)

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/auth/session` | none | `200 { "customer": Customer \| null }`, or `401` when signed out |
| POST | `/auth/otp/phone/request` | `{ "phone": "+919876543210" }` | `200 OtpChallenge` |
| POST | `/auth/otp/phone/verify` | `{ "challenge_id", "code" }` | `200 { "customer": Customer }` and sets the cookie |
| POST | `/auth/otp/email/request` | `{ "email": "name@example.com" }` | `200 OtpChallenge` |
| POST | `/auth/otp/email/verify` | `{ "challenge_id", "code" }` | `200 { "customer": Customer }` and sets the cookie |
| GET | `/auth/google/start?return_to=<same-site path>` | Browser navigation | Redirects to Google |
| POST | `/auth/sign-out` | none | `204` and clears the cookie |

```ts
Customer     { id: string; full_name: string | null; email: string | null; phone: string | null }
OtpChallenge { challenge_id: string; channel: "phone" | "email"; destination_hint: string; // masked
               expires_in_seconds: number; resend_after_seconds: number }
```

The session endpoint doubles as the customer profile. Sessions should refresh on the server, for example with a sliding cookie; the frontend doesn't call a refresh endpoint, and treats a `401` as signed out.

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

## Orders (no endpoint yet)

Orders are still saved in the browser (`OrdersContext`). `POST /orders` must:

- reject any request without a valid session (`401`), and never trust a client claim of being signed in;
- recalculate prices and stock on the server;
- be idempotent.

**The frontend's checkout gate and `placeOrder` check protect the customer journey only. Real enforcement must be on this endpoint.** Replace the body of `placeOrder` with the API call and keep the frontend check.

## Addresses (`Address` in `src/types/order.ts`; no endpoint yet)

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/customers/me/addresses` | none | `200 { "addresses": Address[], "default_address_id": string \| null }` |
| POST | `/customers/me/addresses` | `AddressInput` | `201 Address` |
| PUT | `/customers/me/addresses/:id` | `AddressInput` | `200 Address` |
| DELETE | `/customers/me/addresses/:id` | none | `204` |
| POST | `/customers/me/addresses/:id/default` | none | `204` |

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

Saved addresses, the default address and the active address are in browser storage until these endpoints exist. Replace the storage calls in `AddressBookContext` and `useDeliveryAddress`.

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
