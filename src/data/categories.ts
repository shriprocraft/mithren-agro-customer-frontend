import type { Category } from "@/types/catalog";

// Mock data. Real categories are configured by Admin (scope §4.2).
export const categories: Category[] = [
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
    id: "cat-vegetables",
    slug: "vegetables",
    name: "Vegetables",
    short_description: "Daily vegetables and leafy greens.",
    image: {
      src: "/images/studio/categories/vegetables-studio.jpg",
      alt: "A row of tomatoes, spinach, carrots, okra, green chillies and red onions",
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
  {
    id: "cat-womens-apparel",
    slug: "womens-apparel",
    name: "Women's Apparel",
    short_description: "Kurta sets, co-ords and dresses.",
    image: {
      src: "/images/studio/categories/womens-apparel-studio.jpg",
      alt: "A clothing rail with kurtas, a printed shirt and a tiered dress",
      studio: true,
    },
  },
];
