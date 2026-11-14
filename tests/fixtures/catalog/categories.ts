import type { Category } from "@/types/catalog";

// Mock data. Real categories are configured by Admin (scope §4.2). The order here is the storefront
// order ("Shop by category", footer, marketplace category list).
// Oil, Cosmetics and Fancy Items use photographs from Unsplash (public/images/categories, credited in
// docs/IMAGE_CREDITS.md) until sellers supply their own.
export const categories: Category[] = [
  {
    id: "cat-spinach",
    slug: "spinach",
    name: "Spinach",
    short_description: "Fresh spinach and leafy greens.",
    image: {
      src: "/images/studio/products/spinach-studio.jpg",
      alt: "A tied bunch of fresh spinach leaves",
      studio: true,
    },
  },
  {
    id: "cat-vegetables",
    slug: "vegetables",
    name: "Vegetables",
    short_description: "Daily cooking vegetables.",
    image: {
      src: "/images/studio/categories/vegetables-studio.jpg",
      alt: "A row of tomatoes, spinach, carrots, okra, green chillies and red onions",
      studio: true,
    },
  },
  {
    id: "cat-fruits",
    slug: "fruits",
    name: "Fruits",
    short_description: "Everyday and seasonal fruit.",
    image: {
      src: "/images/studio/categories/fruits-studio.jpg",
      alt: "Mangoes, bananas, pomegranates and papaya grouped together",
      studio: true,
    },
  },
  {
    id: "cat-organic-groceries",
    slug: "organic-groceries",
    name: "Organic Groceries",
    short_description: "Rice, millets, pulses and flour.",
    image: {
      src: "/images/studio/categories/organic-groceries-studio.jpg",
      alt: "Bowls of rice, lentils, chana dal, sorghum and wheat flour with jaggery",
      studio: true,
    },
  },
  {
    id: "cat-oil",
    slug: "oil",
    name: "Oil",
    short_description: "Cold-pressed cooking oils.",
    image: { src: "/images/categories/oil.jpg", alt: "Glass bottles of golden cooking oil" },
  },
  {
    id: "cat-cosmetics",
    slug: "cosmetics",
    name: "Cosmetics",
    short_description: "Plant-based skin and lip care.",
    image: { src: "/images/categories/cosmetics.jpg", alt: "Natural skincare bottles and jars with stones and greenery" },
  },
  {
    id: "cat-fancy-items",
    slug: "fancy-items",
    name: "Fancy Items",
    short_description: "Handmade bangles and artisan crafts.",
    image: { src: "/images/categories/fancy-items.jpg", alt: "Stack of colourful bangles" },
  },
  {
    id: "cat-womens-apparel",
    slug: "womens-apparel",
    name: "Women Apparels",
    short_description: "Kurta sets, co-ords and dresses.",
    image: {
      src: "/images/studio/categories/womens-apparel-studio.jpg",
      alt: "A clothing rail with kurtas, a printed shirt and a tiered dress",
      studio: true,
    },
  },
  {
    id: "cat-fertilizers",
    slug: "fertilizers",
    name: "Fertilizers",
    short_description: "Compost, potting mix and soil inputs.",
    image: {
      src: "/images/studio/categories/fertilizers-studio.jpg",
      alt: "Open bags of compost and potting mix with a scoop and a seedling",
      studio: true,
    },
  },
];
