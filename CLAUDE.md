@AGENTS.md

# Mithren Agro customer frontend

## Design system (required)

Always follow docs/DESIGN_SYSTEM.md when creating or modifying Mithren Agro frontend components. Use the official Modern Sage palette and shared design tokens. Primary buttons must use #2E7D32 by default and #1B5E20 on hover. Do not introduce alternative brand greens or unrelated color palettes without explicit approval.

- Colours come from `src/config/design-tokens.ts`, mirrored in `src/app/globals.css`; use semantic Tailwind classes (`bg-primary`, `text-muted-foreground`, `border-border`…), never raw hex or Tailwind palette colours.
- Use the shared `<Button>` variants for actions; primary actions use the `default` variant.
- `tests/design-tokens.test.ts` enforces this; keep it passing.
