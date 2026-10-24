// Design tokens extracted from docs/reference/ui-theme.png (pixel-sampled, then adjusted for WCAG AA).
// globals.css exposes these as CSS variables; components use semantic Tailwind classes, never raw hex.
// tests/design-tokens.test.ts fails if the two drift apart.
export const designTokens = {
  colors: {
    primary: "#536643", // buttons and CTAs (sampled #516342–#536643)
    primaryHover: "#45563a",
    primaryForeground: "#ffffff",
    brand: "#3e5830", // deep green headline accent ("Tomorrow")
    secondary: "#eef1e9", // soft green tint: badges, newsletter strip
    secondaryForeground: "#2f3d27",
    band: "#dde5d6", // announcement bar and copyright bar
    accent: "#d9a21b", // logo gold and rating stars; decorative only (2.2:1), always pair with text
    background: "#f5f6f1", // page between the glass panels (sampled #f0f1eb–#f9f9f7)
    surface: "#fcfcfa", // opaque cards and fallbacks where glass is not supported
    border: "#e2e5dd",
    inputBorder: "#87907f", // 3:1 against surface and background
    textPrimary: "#1a1f1a",
    textMuted: "#5c615c",
    success: "#3f7d3a",
    warning: "#8a5a00",
    error: "#b42318",
  },
  // The reference uses one geometric sans for headings and body, plus a handwritten accent.
  fonts: { heading: "Poppins", body: "Poppins", script: "Caveat" },
  radii: { sm: "0.5rem", md: "0.75rem", lg: "1rem", pill: "9999px" },
  shadows: {
    card: "0 1px 2px rgb(26 31 26 / 0.04), 0 4px 16px rgb(26 31 26 / 0.06)",
    overlay: "0 12px 40px rgb(26 31 26 / 0.14)",
  },
  // Liquid glass surfaces, from the reference: the header and banners let the background show
  // through; cards and popovers are denser so text on them stays readable.
  glass: {
    header: { fill: "rgb(255 255 255 / 0.6)", blur: "18px" },
    panel: { fill: "rgb(255 255 255 / 0.52)", blur: "20px" },
    card: { fill: "rgb(255 255 255 / 0.64)", blur: "14px" },
    chip: { fill: "rgb(255 255 255 / 0.58)", blur: "12px" },
    field: { fill: "rgb(255 255 255 / 0.5)", blur: "12px" },
    overlay: { fill: "rgb(252 252 250 / 0.86)", blur: "24px" },
    edge: "rgb(255 255 255 / 0.78)", // the fine luminous rim on every glass surface
  },
} as const;

export type DesignTokens = typeof designTokens;
