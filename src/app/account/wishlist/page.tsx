import type { Metadata } from "next";
import { RequireDemoSession } from "@/components/account/RequireDemoSession";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { WishlistView } from "@/components/checkout/WishlistView";
import { getCatalog, getVendors } from "@/services/catalog";

export const metadata: Metadata = { title: "My wishlist (demo)" };

// The same wishlist as /wishlist and the header (WishlistContext): one list, shown inside the account.
export default async function AccountWishlistPage() {
  const [catalog, vendors] = await Promise.all([getCatalog(), getVendors()]);
  const vendorNames = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  return (
    <RequireDemoSession>
      <div className="space-y-5">
        <AccountPageHeader title="My Wishlist" description="Products you saved with the heart. Kept in this browser, shared with the header wishlist." />
        <WishlistView catalog={catalog} vendorNames={vendorNames} />
      </div>
    </RequireDemoSession>
  );
}
