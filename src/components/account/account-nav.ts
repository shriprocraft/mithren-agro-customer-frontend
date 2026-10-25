import { CircleHelp, Heart, LayoutDashboard, MapPin, Package, Settings, Truck, UserRound, type LucideIcon } from "lucide-react";

export interface AccountNavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

/** Account sections, in the order of the brief. Help & Support is a public page (/support). */
export const accountNavItems: AccountNavItem[] = [
  { href: "/account", label: "Overview", Icon: LayoutDashboard },
  { href: "/account/profile", label: "My Profile", Icon: UserRound },
  { href: "/account/orders", label: "My Orders", Icon: Package },
  { href: "/account/track", label: "Track Orders", Icon: Truck },
  { href: "/account/addresses", label: "My Addresses", Icon: MapPin },
  { href: "/account/wishlist", label: "My Wishlist", Icon: Heart },
  { href: "/account/settings", label: "Account Settings", Icon: Settings },
  { href: "/support", label: "Help & Support", Icon: CircleHelp },
];

/** The section a path belongs to: "/account/orders/MA-…" highlights "My Orders". */
export function activeAccountHref(pathname: string): string | null {
  const matches = accountNavItems.filter((item) => pathname === item.href || (item.href !== "/account" && pathname.startsWith(`${item.href}/`)));
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}
