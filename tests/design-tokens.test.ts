// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
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
  primaryActive: "primary-active",
  primaryForeground: "primary-foreground",
  brand: "brand",
  accentGreen: "accent-green",
  highlight: "highlight",
  background: "background",
  surface: "card",
  softBackground: "soft",
  secondary: "secondary",
  secondaryForeground: "secondary-foreground",
  band: "band",
  border: "border",
  inputBorder: "input",
  textPrimary: "foreground",
  textMuted: "muted-foreground",
  success: "success",
  warning: "warning",
  error: "destructive",
  info: "info",
};

describe("design tokens", () => {
  it.each(Object.entries(colorVars))("colors.%s matches --%s in globals.css", (key, name) => {
    expect(cssVar(name)?.toLowerCase()).toBe(designTokens.colors[key as keyof typeof colorVars].toLowerCase());
  });

  // docs/DESIGN_SYSTEM.md: the permanent primary button colours.
  it("keeps the official primary button colours", () => {
    expect(designTokens.colors.primary).toBe("#2E7D32");
    expect(designTokens.colors.primaryHover).toBe("#1B5E20");
    expect(designTokens.colors.primaryForeground).toBe("#FFFFFF");
  });

  // New colours must go through tokens: no raw hex values or Tailwind palette colours in components.
  it("components use semantic tokens, not hardcoded colours", () => {
    const srcDir = fileURLToPath(new URL("../src/components", import.meta.url));
    const files = readdirSync(srcDir, { recursive: true, encoding: "utf8" }).filter((f) => /\.tsx?$/.test(f));
    const offenders = files.flatMap((f) => {
      // Comments may name the palette (e.g. "#2E7D32"); only code is checked.
      const text = readFileSync(`${srcDir}/${f}`, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      const hex = text.match(/(?<![\w-])#[0-9a-fA-F]{3,8}\b(?!["'`]?\s*[,)}\]]?\s*(?:href|id))/g) ?? [];
      const palette = text.match(/\b(?:bg|text|border|ring|from|via|to|fill|stroke)-(?:green|emerald|lime|yellow|amber|red|gray|zinc|slate|neutral|stone|olive)-\d{2,3}\b/g) ?? [];
      return [...hex.filter((h) => !["#fff", "#000"].includes(h.toLowerCase())), ...palette].map((m) => `${f}: ${m}`);
    });
    expect(offenders).toEqual([]);
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
