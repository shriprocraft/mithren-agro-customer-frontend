// Mithren Agro "Modern Sage" palette: the single source of truth for colour (docs/DESIGN_SYSTEM.md).
// globals.css exposes these as CSS variables; components use semantic Tailwind classes, never raw hex.
// tests/design-tokens.test.ts fails if the two drift apart. Contrast ratios are against #FFFFFF.
export const designTokens = {
  colors: {
    // Brand
    primary: "#2E7D32", // Primary Brand Green: every primary button, links, active states (white text 5.13:1)
    primaryHover: "#1B5E20", // Primary Hover Green (white text 7.87:1)
    primaryActive: "#154A19", // pressed state, a step darker than hover (white text 10.37:1)
    primaryForeground: "#FFFFFF",
    brand: "#2E7D32", // green text accents (headline word, eyebrows, icons); same as primary by design
    accentGreen: "#A7D96C", // Accent Green: decorative only (leaf marks, small fills), 1.64:1, never text
    highlight: "#FFD88A", // Highlight / Warm Accent: decorative fills and badges with dark text; never primary buttons
    // Logo Gold: sampled from the warm band of public/images/mithren-agro-logo.png (#C07800–#F8A818).
    // Only for the Buy now action, always with Deep Heading Green text (7.06:1; hover 6.05:1; pressed 5.04:1).
    gold: "#F5A51C",
    goldHover: "#E8960C",
    goldActive: "#D6870A",
    // Surfaces
    background: "#FFFFFF", // Canvas / Main Background
    surface: "#FFFFFF", // product and content cards: clean white with a #E8F1EA border
    softBackground: "#F5FDF7", // Soft Background Green: selected section backgrounds, hover surfaces
    secondary: "#F0F9F4", // Card Background: tinted cards, chips, highlighted containers
    secondaryForeground: "#1B5E20", // text on #F0F9F4 (7.33:1)
    band: "#F0F9F4", // announcement bar and copyright bar
    border: "#E8F1EA", // Borders and Dividers (decorative, 1.15:1)
    inputBorder: "#7A8C7D", // form-control outlines need 3:1 (WCAG 1.4.11): 3.57:1
    // Text
    textPrimary: "#1F2D21", // Deep Heading Green: headings and important text (14.43:1)
    textMuted: "#667085", // Body Text: descriptions and secondary text (4.97:1; 4.63:1 on #F0F9F4)
    // Semantic
    success: "#2E7D32", // brand green doubles as success; always paired with an icon and text
    warning: "#B54708", // amber (5.43:1)
    error: "#B42318", // red (6.57:1)
    info: "#175CD3", // blue (5.99:1)
  },
  // The reference uses one geometric sans for headings and body, plus a handwritten accent.
  fonts: { heading: "Poppins", body: "Poppins", script: "Caveat" },
  radii: { sm: "0.5rem", md: "0.75rem", lg: "1rem", pill: "9999px" },
  // Shadows are tinted with Deep Heading Green (31 45 33) so they read as part of the palette.
  shadows: {
    card: "0 1px 2px rgb(31 45 33 / 0.04), 0 4px 16px rgb(31 45 33 / 0.06)",
    overlay: "0 12px 40px rgb(31 45 33 / 0.14)",
  },
  // Glass is reserved for floating surfaces over imagery (header, hero card, benefits strip, overlays).
  // The header is near-opaque so it reads as a clean white bar.
  glass: {
    header: { fill: "rgb(255 255 255 / 0.92)", blur: "18px" },
    panel: { fill: "rgb(255 255 255 / 0.62)", blur: "20px" },
    card: { fill: "rgb(255 255 255 / 0.7)", blur: "14px" },
    chip: { fill: "rgb(255 255 255 / 0.72)", blur: "12px" },
    field: { fill: "rgb(255 255 255 / 0.85)", blur: "12px" },
    overlay: { fill: "rgb(255 255 255 / 0.94)", blur: "24px" },
    edge: "rgb(255 255 255 / 0.78)",
  },
} as const;

export type DesignTokens = typeof designTokens;
