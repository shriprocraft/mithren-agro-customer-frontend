import { products } from "@/data/products";
import { buildBundle, type BundleDefinition } from "@/lib/bundles";
import type { Product } from "@/types/catalog";

// Combo boxes are made only of catalogue products and priced from them (lib/bundles.ts): nothing here
// sets a price. Contents and prices are sample data, like the catalogue they come from.
// Photos show a typical box (docs/IMAGE_CREDITS.md); each card lists exactly what is included.

// Smaller everyday packs: in the catalogue (/products, their own pages) but not repeated on the homepage.
// They keep the ids of the earlier sample boxes, so carts and links saved before this change still resolve.
const offerDefinitions: BundleDefinition[] = [
  {
    id: "b-kitchen-vegetable-box", slug: "daily-vegetable-essentials", name: "Daily Vegetable Essentials",
    description: "The everyday cooking vegetables in one pack.",
    category_id: "cat-vegetables", vendor_id: "v-harvest-lane", badge: "Everyday",
    bundle_items: [
      { product_id: "p-tomatoes", variant_id: "1kg", quantity: 1 },
      { product_id: "p-red-onions", variant_id: "1kg", quantity: 1 },
      { product_id: "p-carrots", variant_id: "500g", quantity: 1 },
      { product_id: "p-okra", variant_id: "500g", quantity: 1 },
      { product_id: "p-green-chillies", variant_id: "250g", quantity: 1 },
      { product_id: "p-spinach", variant_id: "1bunch", quantity: 1 },
    ],
    images: [{
      src: "/images/studio/bundles/kitchen-vegetable-box-studio.jpg",
      alt: "Woven basket of tomatoes, carrots, cucumbers, sweet potatoes and spring onions",
      studio: true,
    }],
  },
  {
    id: "b-fruit-basket", slug: "fresh-fruit-family-pack", name: "Fresh Fruit Family Pack",
    description: "A week of everyday fruit for the family.",
    category_id: "cat-fruits", vendor_id: "v-harvest-lane", badge: "Family pick",
    bundle_items: [
      { product_id: "p-robusta-bananas", variant_id: "1dozen", quantity: 1 },
      { product_id: "p-papaya", quantity: 1 },
      { product_id: "p-pomegranates", variant_id: "500g", quantity: 1 },
      { product_id: "p-banganapalli-mangoes", variant_id: "1kg", quantity: 1 },
    ],
    images: [{
      src: "/images/studio/categories/fruits-studio.jpg",
      alt: "Mangoes, bananas, pomegranates and papaya grouped together",
      studio: true,
    }],
  },
  {
    id: "b-mixed-harvest-box", slug: "seasonal-harvest-selection", name: "Seasonal Harvest Selection",
    description: "The produce our sellers have marked seasonal, together.",
    category_id: "cat-fruits", vendor_id: "v-harvest-lane", badge: "Seasonal", is_seasonal: true,
    bundle_items: [
      { product_id: "p-banganapalli-mangoes", variant_id: "2kg", quantity: 1 },
      { product_id: "p-pomegranates", variant_id: "1kg", quantity: 1 },
      { product_id: "p-carrots", variant_id: "1kg", quantity: 1 },
    ],
    images: [{
      src: "/images/studio/sections/seasonal-studio.jpg",
      alt: "Mangoes, pomegranates and carrots grouped together",
      studio: true,
    }],
  },
];

// The ₹1,000, ₹5,000 and ₹10,000 budget boxes that lead "Combo offers": fresh produce only (vegetables,
// leafy greens and fruit). Quantities were chosen so that the items' current prices add up to exactly
// these amounts; tests/bundles.test.ts fails if a catalogue price change breaks that. The quantities
// are sample compositions for Mithren Agro to confirm or replace.
const boxDefinitions: BundleDefinition[] = [
  {
    id: "b-essential-fresh-box", slug: "essential-fresh-box", name: "Essential Fresh Box",
    description: "Vegetables, leafy greens and fruit for a small household's week.",
    category_id: "cat-vegetables", vendor_id: "v-harvest-lane", badge: "Starter",
    bundle_items: [
      { product_id: "p-tomatoes", variant_id: "1kg", quantity: 2 },
      { product_id: "p-red-onions", variant_id: "500g", quantity: 2 },
      { product_id: "p-carrots", variant_id: "500g", quantity: 2 },
      { product_id: "p-okra", variant_id: "500g", quantity: 1 },
      { product_id: "p-green-chillies", variant_id: "250g", quantity: 1 },
      { product_id: "p-spinach", variant_id: "1bunch", quantity: 3 },
      { product_id: "p-robusta-bananas", variant_id: "1dozen", quantity: 1 },
      { product_id: "p-papaya", quantity: 3 },
      { product_id: "p-pomegranates", variant_id: "500g", quantity: 2 },
      { product_id: "p-banganapalli-mangoes", variant_id: "500g", quantity: 3 },
    ],
    images: [{
      src: "/images/studio/bundles/mixed-harvest-box-studio.jpg",
      alt: "Wooden crate of pumpkin, brinjals, capsicums, cucumbers, grapes and oranges",
      studio: true,
    }],
  },
  {
    id: "b-family-harvest-box", slug: "family-harvest-box", name: "Family Harvest Box",
    description: "A larger family's week of vegetables, leafy greens and fruit.",
    category_id: "cat-vegetables", vendor_id: "v-harvest-lane", badge: "Family size",
    bundle_items: [
      { product_id: "p-tomatoes", variant_id: "2kg", quantity: 4 },
      { product_id: "p-red-onions", variant_id: "2kg", quantity: 4 },
      { product_id: "p-carrots", variant_id: "1kg", quantity: 4 },
      { product_id: "p-okra", variant_id: "1kg", quantity: 3 },
      { product_id: "p-green-chillies", variant_id: "500g", quantity: 2 },
      { product_id: "p-spinach", variant_id: "2bunches", quantity: 5 },
      { product_id: "p-robusta-bananas", variant_id: "1dozen", quantity: 6 },
      { product_id: "p-papaya", quantity: 6 },
      { product_id: "p-pomegranates", variant_id: "1kg", quantity: 6 },
      { product_id: "p-banganapalli-mangoes", variant_id: "2kg", quantity: 6 },
    ],
    images: [{
      src: "/images/studio/sections/combo-boxes-studio.jpg",
      alt: "Two wooden crates, one of vegetables and one of fruit",
      studio: true,
    }],
  },
  {
    id: "b-premium-harvest-box", slug: "premium-harvest-box", name: "Premium Harvest Box",
    description: "Bulk vegetables, leafy greens and fruit for large households and bigger orders.",
    category_id: "cat-vegetables", vendor_id: "v-harvest-lane", badge: "Bulk",
    bundle_items: [
      { product_id: "p-tomatoes", variant_id: "5kg", quantity: 3 },
      { product_id: "p-red-onions", variant_id: "5kg", quantity: 4 },
      { product_id: "p-carrots", variant_id: "1kg", quantity: 8 },
      { product_id: "p-okra", variant_id: "1kg", quantity: 9 },
      { product_id: "p-green-chillies", variant_id: "500g", quantity: 4 },
      { product_id: "p-spinach", variant_id: "2bunches", quantity: 8 },
      { product_id: "p-robusta-bananas", variant_id: "1dozen", quantity: 10 },
      { product_id: "p-papaya", quantity: 11 },
      { product_id: "p-pomegranates", variant_id: "1kg", quantity: 12 },
      { product_id: "p-banganapalli-mangoes", variant_id: "2kg", quantity: 12 },
    ],
    images: [{
      src: "/images/products/vegetable-fruit-box.jpg",
      alt: "A crate of grapes, brinjals, capsicums, oranges and zucchini",
    }],
  },
];

export const comboOffers: Product[] = offerDefinitions.map((d) => buildBundle(d, products));
export const comboBoxes: Product[] = boxDefinitions.map((d) => buildBundle(d, products));

/** Every combo, for the catalogue, cart and product pages. */
export const bundles: Product[] = [...comboOffers, ...comboBoxes];
