import { siteConfig } from "@/config/site";

const wholeRupees = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 0,
});

const withPaise = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  minimumFractionDigits: 2,
});

/** Formats an integer amount in paise, e.g. 4000 → "₹40", 4050 → "₹40.50". */
export function formatPrice(paise: number): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? wholeRupees.format(rupees) : withPaise.format(rupees);
}

export function effectivePrice(product: { price: number; discounted_price?: number }): number {
  return product.discounted_price ?? product.price;
}
