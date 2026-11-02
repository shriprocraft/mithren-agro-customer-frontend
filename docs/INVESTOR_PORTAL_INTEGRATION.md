# Investor Portal integration

> **Status: NOT integrated (owner decision, 2 November 2026).** The customer app has no link, redirect, API call or configuration for the portal, and `/investors` is a Coming Soon page. This document is kept only as background for a future decision: its "journey" and "configuration" sections describe a removed design, and the portal findings may be out of date.

The customer storefront and the Investor Portal are separate applications. The storefront explains the opportunity and links out. It holds no investor account, takes no contribution and creates no investment.

Portal inspected on 2 November 2026: https://mithren-agro-investor-frontend.vercel.app/ (public pages, its client JavaScript, and rendered pages in headless Chrome). Re-check this document when the portal changes.

## The customer journey

| Step | Where | What happens |
|---|---|---|
| Entry | Homepage hero button and footer "Grow with us" link | Opens `/investors`. The homepage has no other investment content |
| Learn | `/investors` | Six domains, 12 projects, five amounts, process, risks, FAQ, what is unconfirmed |
| Browse | `/investors/projects`, `/investors/projects/[projectId]` | Project placeholders by domain |
| Choose | `/investors/plan` | Choose one of five amounts (required) and one project (optional). `?plan=` and `?project=` hold the choice |
| Review | `/investors/plan` summary | Shows the selection, what awaits confirmation, what happens next and the demo notice. It can be changed |
| Continue | "Explore Investment Opportunities" | A normal link to the portal's `/projects` catalogue, in the same tab |

Back from the portal returns to `/investors/plan` with the selection still in the URL.

## What the portal supports

| Mechanism | Supported? | Evidence |
|---|---|---|
| Contribution amount or plan parameter | **No** | The portal's code reads no such parameter |
| Category or domain parameter | **No** | Same; its category filter is internal state |
| `/projects?project=<portal id>` | Yes: shows that project | Read by its projects page and used by its own links. Rendered check: `?project=p-1` shows the project; an unknown id shows "Project not found"; extra `amount` and `category` parameters are ignored |
| `/login?next=<path>` | Yes: returns there after its demo login | Read by its login page, and used by its own links |

## What is passed today

**Nothing.** The destination comes from `investorPortalDestination` in `src/lib/investments.ts`:

- **Amount and plan:** can't be sent, because the portal has nowhere to receive them. The review screen tells the customer to note their choice.
- **Domain:** can't be sent, for the same reason.
- **Project:** can be sent, but isn't. This app's 12 projects are placeholders (`crop-production-1`), and the portal's are `p-1` to `p-12` with their own titles. No approved mapping exists, and guessing could send a customer to the wrong project. To turn it on, set `portal_project_id` on each project in `src/data/investments.ts`; no code change is needed.

The destination is the catalogue rather than a commitment screen, so a customer is not dropped into a simulated transaction.

## Portal limitations

- It describes itself as a frontend prototype: "Every project, amount, valuation and transaction is fictional sample data, and no real money, KYC, payment or payout is involved." The storefront shows a demo notice before customers leave.
- Its registration form has password fields, which it says are never stored or checked and shouldn't be real passwords. The storefront's notice repeats that warning.
- There is no shared sign-in. A customer signing in on the storefront is not signed in on the portal.
- **Content differs from the storefront, for the business to resolve:**
  - The portal shows plan names and durations (for example Starter Plan: 10, 12 or 24 weeks). The storefront shows durations as awaiting confirmation, because they have not been approved.
  - The portal calls the first domain "Crop Cultivation"; the storefront says "Crop Production".
  - The portal mentions a ₹100 simulated commitment that isn't one of the five amounts.

## Needed before production

**Portal**
1. Replace the simulated flows with a real backend, payments, KYC and payouts, subject to legal and regulatory review.
2. Accept a selection, for example `/projects?plan=<id>&domain=<slug>&project=<id>`, or a server-issued selection token. Agree the names first, then update `investorPortalDestination`.
3. Publish stable plan, domain and project ids, shared with the storefront.
4. Remove passwords stored or checked only in the browser.

**Storefront or shared backend**
1. Serve domains, projects, plans and rules from an API. `src/services/investments.ts` is the only file pages call, so only it changes. Contract: `docs/BACKEND_CONTRACTS.md`.
2. Decide whether customers and investors share an identity. If so, use a server-side handoff, never a token in a URL.
3. Have the wording on `/investors` reviewed by a qualified adviser.

## Configuration

`NEXT_PUBLIC_INVESTOR_PORTAL_URL` sets the portal's address. If it is unset, the owner-supplied demo portal is used. If it is empty or unsafe, the buttons become a disabled "Investor Portal: coming soon".
