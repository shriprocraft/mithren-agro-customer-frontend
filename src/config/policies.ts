import { orderStatuses, type OrderStatus } from "@/types/order";
import type { CategorySlug } from "@/types/catalog";

// The business rules the policy pages state and the order screens apply, in one place so they can't
// drift apart. Values marked "to confirm" are the owner's intended rules, not yet final operations.
// Every policy page is a DRAFT for review by a qualified Indian lawyer before publication.

export const policyConfig = {
  /** Shown as "Last updated" on every policy page; null until the reviewed versions are published. */
  lastUpdated: null as string | null,
  cancellation: {
    /**
     * Customers can't cancel once an order reaches this status. "Ready for Dispatch" is the
     * application's packed state ("Your order is packed and waiting for pickup").
     */
    packedStatus: "ready_for_dispatch" as OrderStatus,
  },
  returns: {
    /** Routine returns apply only to these categories (to confirm: final eligible items). */
    eligibleCategories: ["womens-apparel"] as CategorySlug[],
    eligibleCategoryLabel: "women’s apparel",
    /** Days from the delivery date (to confirm). */
    windowDays: 10,
  },
} as const;

/** True while a customer may still ask to cancel: before the order is packed. */
export function canRequestCancellation(status: OrderStatus): boolean {
  return orderStatuses.indexOf(status) < orderStatuses.indexOf(policyConfig.cancellation.packedStatus);
}

/** Whether items in this category have the routine return option. */
export function isReturnEligibleCategory(slug: string | undefined): boolean {
  return slug !== undefined && (policyConfig.returns.eligibleCategories as string[]).includes(slug);
}

/** Last day a return request can be made, counted from the delivery time. */
export function returnWindowEnd(deliveredAt: string): Date {
  const end = new Date(deliveredAt);
  end.setDate(end.getDate() + policyConfig.returns.windowDays);
  return end;
}

/** Placeholders for details the business has not supplied yet; shown highlighted on the pages. */
export const policyPlaceholders = {
  registeredAddress: "[Registered office address — to be added]",
  supportEmail: "[Customer support email — to be added]",
  supportPhone: "[Customer support phone number and hours — to be added]",
  grievanceOfficer: "[Grievance Officer name, designation and contact details — to be added]",
  jurisdiction: "[City for courts’ jurisdiction — to be confirmed]",
  cin: "[Corporate Identification Number (CIN) — to be added]",
} as const;
