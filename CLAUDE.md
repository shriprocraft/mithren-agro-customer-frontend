@AGENTS.md

# Mithren Agro customer frontend

## Design system (required)

Always follow docs/DESIGN_SYSTEM.md when creating or modifying Mithren Agro frontend components. Use the official Modern Sage palette and shared design tokens. Primary buttons must use #2E7D32 by default and #1B5E20 on hover. Do not introduce alternative brand greens or unrelated color palettes without explicit approval.

- Colours come from `src/config/design-tokens.ts`, mirrored in `src/app/globals.css`; use semantic Tailwind classes (`bg-primary`, `text-muted-foreground`, `border-border`…), never raw hex or Tailwind palette colours.
- Use the shared `<Button>` variants for actions; primary actions use the `default` variant.
- Approved exception (27 Oct 2026): **Buy now** uses the logo gold, `<Button variant="buy">` (`bg-gold`, dark text). Use it for Buy now only.
- `tests/design-tokens.test.ts` enforces this; keep it passing.

## Customer account (demo)

The account area is a demo with no authentication (docs/DEMO_ACCOUNT.md). Never add password fields, store credentials or describe the demo session as secure; real sign-in needs a server-verified session.
