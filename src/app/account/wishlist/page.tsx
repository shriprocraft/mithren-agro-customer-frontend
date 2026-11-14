import { Suspense } from "react";
import { LoadingState } from "@/components/checkout/PageState";
import type { Metadata } from "next";
import { RequireSignIn } from "@/components/account/RequireSignIn";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { WishlistView } from "@/components/checkout/WishlistView";
import { getCatalog, getVendors } from "@/services/catalog";

export const metadata: Metadata = { title: "My wishlist" };

// The same wishlist as /wishlist and the header (WishlistContext): one list, shown inside the account.
async function AccountWishlistPageContent() {
  const [catalog, vendors] = await Promise.all([getCatalog(), getVendors()]);
  const vendorNames = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  return (
    <RequireSignIn>
      <div className="space-y-5">
        <AccountPageHeader
          title="My Wishlist"
          description="Products you saved with the heart, kept in your account. The same list as the header wishlist."
        />
        <WishlistView catalog={catalog} vendorNames={vendorNames} />
      </div>
    </RequireSignIn>
  );
}

// The data comes live from the backend on every request, so it loads inside this boundary: the page
// streams with a loading state instead of blocking navigation.
export default function AccountWishlistPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading your wishlist…" fullHeight />}>
      <AccountWishlistPageContent />
    </Suspense>
  );
}
