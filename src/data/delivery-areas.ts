import type { DeliveryArea } from "@/types/catalog";

// Sample areas for the location selector. Serviceability is not checked in this preview.
export const deliveryAreas: DeliveryArea[] = [
  { id: "area-blr", label: "Bengaluru", postal_code: "560001" },
  { id: "area-mys", label: "Mysuru", postal_code: "570001" },
  { id: "area-chn", label: "Chennai", postal_code: "600001" },
  { id: "area-hyd", label: "Hyderabad", postal_code: "500001" },
];
