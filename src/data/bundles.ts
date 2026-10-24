import type { Product } from "@/types/catalog";

// Illustrative combo boxes. Contents and prices are sample data; no discounts are implied.
export const bundles: Product[] = [
  {
    id: "b-mixed-harvest-box", slug: "mixed-harvest-box", name: "Mixed Harvest Box",
    description: "A mix of vegetables and fruit for the week.",
    category_id: "cat-vegetables", vendor_id: "v-harvest-lane", unit: "Approx. 5 kg", price: 54900,
    stock_status: "in_stock",
    bundle_contents: ["Pumpkin", "Brinjal", "Capsicum", "Cucumber", "Grapes", "Oranges"],
    images: [{
      src: "/images/studio/bundles/mixed-harvest-box-studio.jpg",
      alt: "Wooden crate of pumpkin, brinjals, capsicums, cucumbers, grapes and oranges",
      studio: true,
    }],
  },
  {
    id: "b-fruit-basket", slug: "fruit-basket", name: "Fruit Basket",
    description: "An assortment of whole fruit in a woven basket.",
    category_id: "cat-fruits", vendor_id: "v-harvest-lane", unit: "Approx. 4 kg", price: 69900,
    stock_status: "in_stock",
    bundle_contents: ["Pineapple", "Mangoes", "Grapes", "Kiwi", "Plums"],
    images: [{
      src: "/images/studio/bundles/fruit-basket-studio.jpg",
      alt: "Wicker basket of pineapple, mangoes, grapes, kiwis and plums",
      studio: true,
    }],
  },
  {
    id: "b-kitchen-vegetable-box", slug: "kitchen-vegetable-box", name: "Kitchen Vegetable Basket",
    description: "Everyday cooking vegetables in one basket.",
    category_id: "cat-vegetables", vendor_id: "v-harvest-lane", unit: "Approx. 3 kg", price: 34900,
    stock_status: "low_stock",
    bundle_contents: ["Tomatoes", "Carrots", "Cucumber", "Sweet potato", "Spring onions"],
    images: [{
      src: "/images/studio/bundles/kitchen-vegetable-box-studio.jpg",
      alt: "Woven basket of tomatoes, carrots, cucumbers, sweet potatoes and spring onions",
      studio: true,
    }],
  },
];
