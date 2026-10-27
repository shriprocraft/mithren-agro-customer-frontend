import type { ImageAsset, Product, ProductVariant, StockStatus, VariantType } from "@/types/catalog";

// Mock data for the preview storefront: names, prices (paise), stock and sellers are samples.
// Images illustrate the product type, not the actual listing (see docs/IMAGE_CREDITS.md): isolated
// studio shots on white, one per product, named after the product slug.
const studio = (slug: string, alt: string): ImageAsset[] => [
  { src: `/images/studio/products/${slug}-studio.jpg`, alt, studio: true },
];

const listings: Product[] = [
  // Fruits
  {
    id: "p-banganapalli-mangoes", slug: "banganapalli-mangoes", name: "Banganapalli Mangoes",
    description: "Large, golden-yellow mangoes with smooth, fibre-light flesh.",
    category_id: "cat-fruits", vendor_id: "v-sunrise", unit: "1 kg", price: 14000,
    stock_status: "in_stock", is_seasonal: true,
    images: studio("banganapalli-mangoes", "Three ripe golden-yellow mangoes"),
  },
  {
    id: "p-robusta-bananas", slug: "robusta-bananas", name: "Robusta Bananas",
    description: "Everyday bananas sold by the dozen.",
    category_id: "cat-fruits", vendor_id: "v-sunrise", unit: "1 dozen", price: 6000,
    stock_status: "in_stock",
    images: studio("robusta-bananas", "A bunch of ripe yellow bananas"),
  },
  {
    id: "p-papaya", slug: "papaya", name: "Papaya",
    description: "Whole papaya, roughly one kilogram per piece.",
    category_id: "cat-fruits", vendor_id: "v-green-acres", unit: "1 piece (approx. 1 kg)", price: 5500,
    stock_status: "in_stock",
    images: studio("papaya", "A whole papaya beside a halved papaya showing orange flesh and black seeds"),
  },
  {
    id: "p-pomegranates", slug: "pomegranates", name: "Pomegranates",
    description: "Deep red pomegranates with juicy arils.",
    category_id: "cat-fruits", vendor_id: "v-sunrise", unit: "500 g", price: 11000, discounted_price: 9500,
    stock_status: "in_stock", is_seasonal: true,
    images: studio("pomegranates", "Whole red pomegranates and one halved pomegranate"),
  },
  // Vegetables
  {
    id: "p-tomatoes", slug: "tomatoes", name: "Tomatoes",
    description: "Firm red tomatoes for cooking and salads.",
    category_id: "cat-vegetables", vendor_id: "v-green-acres", unit: "1 kg", price: 4000,
    stock_status: "in_stock",
    images: studio("tomatoes", "A cluster of ripe red tomatoes"),
  },
  {
    id: "p-spinach", slug: "spinach", name: "Spinach (Palak)",
    description: "A tied bunch of fresh spinach leaves.",
    category_id: "cat-vegetables", vendor_id: "v-green-acres", unit: "1 bunch", price: 3000,
    stock_status: "low_stock",
    images: studio("spinach", "A tied bunch of fresh spinach leaves"),
  },
  {
    id: "p-carrots", slug: "carrots", name: "Carrots",
    description: "Bright orange carrots with their leafy tops.",
    category_id: "cat-vegetables", vendor_id: "v-green-acres", unit: "500 g", price: 4500,
    stock_status: "in_stock", is_seasonal: true,
    images: studio("carrots", "A bunch of carrots with their green tops"),
  },
  {
    id: "p-okra", slug: "okra", name: "Okra (Bhindi)",
    description: "Tender green okra pods.",
    category_id: "cat-vegetables", vendor_id: "v-green-acres", unit: "500 g", price: 4000,
    stock_status: "in_stock",
    images: studio("okra", "A heap of fresh green okra pods"),
  },
  {
    id: "p-green-chillies", slug: "green-chillies", name: "Green Chillies",
    description: "Slender green chillies for everyday cooking.",
    category_id: "cat-vegetables", vendor_id: "v-green-acres", unit: "250 g", price: 2000,
    stock_status: "in_stock",
    images: studio("green-chillies", "A heap of long green chillies"),
  },
  {
    id: "p-red-onions", slug: "red-onions", name: "Red Onions",
    description: "Medium red onions, a kitchen staple.",
    category_id: "cat-vegetables", vendor_id: "v-green-acres", unit: "1 kg", price: 4500, discounted_price: 3900,
    stock_status: "in_stock",
    images: studio("red-onions", "Whole red onions and one halved red onion"),
  },
  // Organic Groceries (certification is not claimed for any sample item)
  {
    id: "p-sona-masoori-rice", slug: "sona-masoori-rice", name: "Sona Masoori Rice",
    description: "Medium-grain rice for everyday meals.",
    category_id: "cat-organic-groceries", vendor_id: "v-annapurna", unit: "5 kg", price: 42000,
    stock_status: "in_stock",
    images: studio("sona-masoori-rice", "A white bowl of polished white rice"),
  },
  {
    id: "p-jowar", slug: "jowar", name: "Jowar (Sorghum)",
    description: "Whole sorghum grain for rotis and porridge.",
    category_id: "cat-organic-groceries", vendor_id: "v-annapurna", unit: "1 kg", price: 9500,
    stock_status: "out_of_stock",
    images: studio("jowar", "A wooden bowl of creamy-white sorghum grains"),
  },
  {
    id: "p-masoor-dal", slug: "masoor-dal", name: "Masoor Dal",
    description: "Split red lentils that cook quickly.",
    category_id: "cat-organic-groceries", vendor_id: "v-annapurna", unit: "1 kg", price: 13000,
    stock_status: "in_stock",
    images: studio("masoor-dal", "A white bowl of split red lentils"),
  },
  {
    id: "p-chana-dal", slug: "chana-dal", name: "Chana Dal",
    description: "Split Bengal gram for dals and snacks.",
    category_id: "cat-organic-groceries", vendor_id: "v-annapurna", unit: "1 kg", price: 11000,
    stock_status: "in_stock",
    images: studio("chana-dal", "A white bowl of yellow split chickpeas"),
  },
  {
    id: "p-wheat-atta", slug: "whole-wheat-atta", name: "Whole Wheat Atta",
    description: "Whole wheat flour for chapatis and rotis.",
    category_id: "cat-organic-groceries", vendor_id: "v-annapurna", unit: "5 kg", price: 26000,
    stock_status: "in_stock",
    images: studio("whole-wheat-atta", "A white bowl of whole wheat flour beside wheat ears"),
  },
  {
    id: "p-jaggery", slug: "jaggery", name: "Jaggery",
    description: "Solid jaggery pieces for sweets and tea.",
    category_id: "cat-organic-groceries", vendor_id: "v-annapurna", unit: "1 kg", price: 9000,
    stock_status: "in_stock",
    images: studio("jaggery", "Blocks of golden-brown jaggery"),
  },
  // Fertilizers (no specifications, certifications or usage claims)
  {
    id: "p-vermicompost", slug: "vermicompost", name: "Vermicompost",
    description: "Bagged vermicompost for pots and garden beds.",
    category_id: "cat-fertilizers", vendor_id: "v-bhoomi", unit: "5 kg bag", price: 25000,
    stock_status: "in_stock",
    images: studio("vermicompost", "An open paper bag of dark vermicompost"),
  },
  {
    id: "p-potting-mix", slug: "potting-mix", name: "Potting Mix",
    description: "Ready-to-use mix for container plants.",
    category_id: "cat-fertilizers", vendor_id: "v-bhoomi", unit: "10 kg bag", price: 32000,
    stock_status: "in_stock",
    images: studio("potting-mix", "An open green pouch of potting mix"),
  },
  {
    id: "p-garden-compost", slug: "garden-compost", name: "Garden Compost",
    description: "Compost for preparing soil before planting.",
    category_id: "cat-fertilizers", vendor_id: "v-bhoomi", unit: "5 kg bag", price: 22000,
    stock_status: "low_stock",
    images: studio("garden-compost", "An open woven sack of garden compost with a scoop"),
  },
  // Women's apparel (no fabric or sourcing claims)
  {
    id: "p-floral-kurta-set", slug: "floral-kurta-set", name: "Floral Print Kurta Set",
    description: "White kurta with floral print and matching pants.",
    category_id: "cat-womens-apparel", vendor_id: "v-nila", unit: "2-piece set", price: 129900,
    stock_status: "in_stock",
    images: studio("floral-kurta-set", "White floral-print kurta with matching white pants"),
  },
  {
    id: "p-pink-kurta-set", slug: "pink-kurta-set", name: "Pink Printed Kurta Set",
    description: "Soft pink printed kurta with straight pants.",
    category_id: "cat-womens-apparel", vendor_id: "v-nila", unit: "2-piece set", price: 119900,
    stock_status: "low_stock",
    images: studio("pink-kurta-set", "Soft pink printed kurta with matching pants"),
  },
  {
    id: "p-printed-co-ord-set", slug: "printed-co-ord-set", name: "Printed Co-ord Set",
    description: "Relaxed shirt and pants in a bold print.",
    category_id: "cat-womens-apparel", vendor_id: "v-nila", unit: "2-piece set", price: 149900,
    stock_status: "in_stock",
    images: studio("printed-co-ord-set", "Teal and orange printed shirt with matching wide pants"),
  },
  {
    id: "p-tiered-midi-dress", slug: "tiered-midi-dress", name: "Yellow Tiered Dress",
    description: "Tiered dress with an embroidered neckline.",
    category_id: "cat-womens-apparel", vendor_id: "v-nila", unit: "1 piece", price: 99900,
    stock_status: "in_stock",
    images: studio("tiered-midi-dress", "Mustard-yellow tiered midi dress"),
  },
];

// Purchasable options per product (sample data, like everything in this file). Each option has its
// own price and availability; the option marked as default is the one each listing above describes
// (same unit, price and stock), so cards, sorting and filters are unchanged. Options suit the
// product: weights for loose produce and staples, packs for items sold by count, sizes for apparel.
// Single-form items (papaya, jowar, garden compost, combo boxes) have none.
type Option = [label: string, price: number, discounted?: number, stock?: StockStatus, unit?: string];
const optionId = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "");

function options(variant_type: VariantType, defaultLabel: string, list: Option[]): Pick<Product, "variants" | "variant_type" | "default_variant_id"> {
  const variants: ProductVariant[] = list.map(([label, price, discounted_price, stock_status = "in_stock", unit]) => ({
    id: optionId(label),
    label,
    ...(unit && { unit }),
    price,
    ...(discounted_price !== undefined && { discounted_price }),
    stock_status,
  }));
  return { variant_type, variants, default_variant_id: optionId(defaultLabel) };
}

const sizes = (labels: string[], price: number, stock: Partial<Record<string, StockStatus>> = {}): Option[] =>
  labels.map((label) => [label, price, undefined, stock[label] ?? "in_stock"]);

const productOptions: Record<string, Pick<Product, "variants" | "variant_type" | "default_variant_id">> = {
  "p-banganapalli-mangoes": options("weight", "1 kg", [["500 g", 7500], ["1 kg", 14000], ["2 kg", 27500]]),
  "p-robusta-bananas": options("pack", "1 dozen", [["Half dozen", 3200, undefined, "in_stock", "6 pieces"], ["1 dozen", 6000]]),
  "p-pomegranates": options("weight", "500 g", [["500 g", 11000, 9500], ["1 kg", 21000, 18500]]),
  "p-tomatoes": options("weight", "1 kg", [["500 g", 2200], ["1 kg", 4000], ["2 kg", 7800], ["5 kg", 18500, undefined, "low_stock"]]),
  "p-spinach": options("pack", "1 bunch", [["1 bunch", 3000, undefined, "low_stock"], ["2 bunches", 5800, undefined, "low_stock"]]),
  "p-carrots": options("weight", "500 g", [["250 g", 2500], ["500 g", 4500], ["1 kg", 8500]]),
  "p-okra": options("weight", "500 g", [["250 g", 2200], ["500 g", 4000], ["1 kg", 7600]]),
  "p-green-chillies": options("weight", "250 g", [["100 g", 1000], ["250 g", 2000], ["500 g", 3800]]),
  "p-red-onions": options("weight", "1 kg", [["500 g", 2300, 2000], ["1 kg", 4500, 3900], ["2 kg", 8800, 7600], ["5 kg", 21500, 18500]]),
  "p-sona-masoori-rice": options("weight", "5 kg", [["1 kg", 9000], ["5 kg", 42000], ["10 kg", 82000, undefined, "out_of_stock"]]),
  "p-masoor-dal": options("weight", "1 kg", [["500 g", 6800], ["1 kg", 13000], ["2 kg", 25500]]),
  "p-chana-dal": options("weight", "1 kg", [["500 g", 5800], ["1 kg", 11000]]),
  "p-wheat-atta": options("weight", "5 kg", [["1 kg", 5800], ["5 kg", 26000], ["10 kg", 50000]]),
  "p-jaggery": options("weight", "1 kg", [["500 g", 4800], ["1 kg", 9000]]),
  "p-vermicompost": options("weight", "5 kg bag", [["5 kg bag", 25000], ["10 kg bag", 48000], ["25 kg bag", 110000, undefined, "low_stock"]]),
  "p-potting-mix": options("weight", "10 kg bag", [["5 kg bag", 17000], ["10 kg bag", 32000]]),
  "p-floral-kurta-set": options("size", "M", sizes(["S", "M", "L", "XL", "XXL"], 129900, { XXL: "out_of_stock" })),
  "p-pink-kurta-set": options("size", "M", sizes(["S", "M", "L", "XL"], 119900, { M: "low_stock", XL: "out_of_stock" })),
  "p-printed-co-ord-set": options("size", "M", sizes(["XS", "S", "M", "L", "XL"], 149900)),
  "p-tiered-midi-dress": options("size", "M", sizes(["S", "M", "L"], 99900, { L: "low_stock" })),
};

export const products: Product[] = listings.map((product) => ({ ...product, ...productOptions[product.id] }));
