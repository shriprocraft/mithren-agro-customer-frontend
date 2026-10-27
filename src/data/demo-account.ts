import type { AccountPreferences, CustomerProfile } from "@/types/account";
import type { CartItem } from "@/types/cart";
import type { AddressInput, OrderStatus } from "@/types/order";

// Fictional data for the demo account. No real person: the name says "Demo", the email uses the
// reserved example.com domain and the street is "Sample Street".

export const demoProfile: CustomerProfile = {
  full_name: "Demo Customer",
  email: "demo.customer@example.com",
  mobile: "",
};

export const demoPreferences: AccountPreferences = { order_updates: true, offers: false };

export const demoAddress: AddressInput = {
  full_name: "Demo Customer",
  mobile: "9000000001",
  house: "Flat 4B, Sample Residency",
  street: "1 Sample Street, Indiranagar",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560038",
  type: "home",
};

/** Sample orders: what was bought, how long ago (days) and how far each has got. */
export const demoOrderTemplates: { items: CartItem[]; daysAgo: number; status: OrderStatus }[] = [
  { items: [{ product_id: "b-kitchen-vegetable-box", quantity: 1 }], daysAgo: 0.1, status: "order_confirmed" },
  { items: [{ product_id: "p-sona-masoori-rice", variant_id: "5kg", quantity: 1 }, { product_id: "p-masoor-dal", variant_id: "500g", quantity: 2 }], daysAgo: 1, status: "out_for_delivery" },
  { items: [{ product_id: "p-tomatoes", variant_id: "2kg", quantity: 1 }, { product_id: "p-robusta-bananas", variant_id: "1dozen", quantity: 1 }, { product_id: "p-jaggery", variant_id: "1kg", quantity: 1 }], daysAgo: 12, status: "delivered" },
];
