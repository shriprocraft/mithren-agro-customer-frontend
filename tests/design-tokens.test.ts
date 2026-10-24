// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { designTokens } from "@/config/design-tokens";

const css = readFileSync(
  fileURLToPath(new URL("../src/app/globals.css", import.meta.url)),
  "utf8",
);
const rootBlock = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";

function cssVar(name: string): string | undefined {
  return rootBlock.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();
}

// Token key → CSS variable that carries it (shadcn naming where one exists).
const colorVars: Record<keyof typeof designTokens.colors, string> = {
  primary: "primary",
  primaryHover: "primary-hover",
  primaryForeground: "primary-foreground",
  brand: "brand",
  secondary: "secondary",
  secondaryForeground: "secondary-foreground",
  band: "band",
  accent: "highlight",
  background: "background",
  surface: "card",
  border: "border",
  inputBorder: "input",
  textPrimary: "foreground",
  textMuted: "muted-foreground",
  success: "success",
  warning: "warning",
  error: "destructive",
};

describe("design tokens", () => {
  it.each(Object.entries(colorVars))("colors.%s matches --%s in globals.css", (key, name) => {
    expect(cssVar(name)).toBe(designTokens.colors[key as keyof typeof colorVars]);
  });

  it("shadow tokens match the elevation variables", () => {
    expect(cssVar("elevation-card")).toBe(designTokens.shadows.card);
    expect(cssVar("elevation-overlay")).toBe(designTokens.shadows.overlay);
  });

  it.each(["header", "panel", "card", "chip", "field", "overlay"] as const)("glass.%s matches its CSS variables", (surface) => {
    expect(cssVar(`glass-${surface}`)).toBe(designTokens.glass[surface].fill);
    expect(cssVar(`glass-${surface}-blur`)).toBe(designTokens.glass[surface].blur);
  });

  it("glass edge matches --glass-edge", () => {
    expect(cssVar("glass-edge")).toBe(designTokens.glass.edge);
  });

  it("radius tokens match the Tailwind radius scale", () => {
    expect(css).toContain(`--radius-sm: ${designTokens.radii.sm};`);
    expect(css).toContain(`--radius-md: ${designTokens.radii.md};`);
    expect(cssVar("radius")).toBe(designTokens.radii.lg);
  });

  it("contains no unresolved placeholder values", () => {
    expect(JSON.stringify(designTokens)).not.toMatch(/TBD/);
  });
});
