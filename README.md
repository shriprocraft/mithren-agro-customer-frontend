# Mithren Agro — Customer Storefront

Customer-facing frontend for Mithren Agro, a farm-to-home marketplace for fresh produce, organic staples, combo boxes, fertilizers and women's apparel.

This repository contains the **customer app only**. Seller, admin, delivery and investor apps are out of scope.

> **Current phase: foundation.** There is no backend. Products, orders, sign-in and tracking will run on clearly labelled mock data. Nothing in this app takes real payments or authenticates real users.

## Requirements

- Node.js 24 (tested with v24.19.0)
- npm 11

## Setup

```bash
npm install
```

No environment variables are needed at this stage, so there is no `.env.example`. Add one, with placeholder values only, when the first variable is introduced.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | TypeScript in strict mode, no emit |
| `npm test` | Run unit/component tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run check` | Lint, typecheck, test and build in sequence |

## Stack

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (Radix) · lucide-react icons · Framer Motion · ESLint · Vitest + Testing Library.

Adding shadcn components: `npx shadcn@latest add <component>`. Components land in `src/components/ui/`.

## Project documents

| File | Purpose |
|---|---|
| `ORGANIC_MARKETPLACE_CUSTOMER_APP_SCOPE.md` | Customer app scope (source of business requirements) |
| `CUSTOMER_APP_FRONTEND_DEVELOPMENT.md` | Frontend development guide |
| `docs/reference/ui-theme.png` | Homepage visual reference |
| `docs/ARCHITECTURE.md` | Folder structure, technical decisions and open questions |
