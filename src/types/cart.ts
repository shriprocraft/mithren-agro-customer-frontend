export interface CartItem {
  product_id: string;
  /** The chosen option (ProductVariant.id) for products that have options. */
  variant_id?: string;
  quantity: number;
}
// Price and name are looked up from the catalogue at render time (guide, Section C).

/**
 * A line the store took out of the cart (or, merging a browser cart at sign-in, couldn't add), so the
 * customer can be told. `not_sold`: the seller no longer sells it (or that option); `cart_full`: no room.
 */
export interface CartRemoval {
  product_id: string;
  variant_id?: string;
  reason: "not_sold" | "cart_full";
}
