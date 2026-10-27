export interface CartItem {
  product_id: string;
  /** The chosen option (ProductVariant.id) for products that have options. */
  variant_id?: string;
  quantity: number;
}
// Price and name are looked up from the catalogue at render time (guide, Section C).
