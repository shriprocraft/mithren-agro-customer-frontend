"use client";

import { useId } from "react";
import { LogOut, RotateCcw } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ConfirmDialog } from "@/components/account/ConfirmDialog";
import { formatOrderTime } from "@/components/orders/OrderDetails";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { useEndDemoSession } from "@/hooks/useEndDemoSession";
import type { AccountPreferences } from "@/types/account";

const toggles: { key: keyof AccountPreferences; label: string; detail: string }[] = [
  { key: "order_updates", label: "Order updates", detail: "Status changes for your orders" },
  { key: "offers", label: "Offers and new arrivals", detail: "Occasional product news" },
];

// Demo settings. Preferences are remembered in this browser only: no email, SMS or push service is
// connected, and the page says so. Only actions that really work here are offered.
export function SettingsView() {
  const { session, preferences, updatePreferences, resetDemoData } = useDemoAccount();
  const announce = useAnnounce();
  const endSession = useEndDemoSession();

  return (
    <div className="space-y-6">
      <AccountPageHeader title="Account Settings" description="Settings for the demo account, kept in this browser." />

      <section aria-labelledby="prefs-title" className="surface-card rounded-3xl p-5 sm:p-6">
        <h2 id="prefs-title" className="font-heading text-lg font-semibold">Notification preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">Local demo settings: no messages are sent in this preview, whatever you choose.</p>
        <ul className="mt-4 divide-y divide-border">
          {toggles.map((toggle) => (
            <li key={toggle.key}>
              <Toggle
                label={toggle.label}
                detail={toggle.detail}
                checked={preferences[toggle.key]}
                onChange={(checked) => {
                  updatePreferences({ ...preferences, [toggle.key]: checked });
                  announce(`${toggle.label} ${checked ? "on" : "off"}.`);
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="session-title" className="surface-card rounded-3xl p-5 sm:p-6">
        <h2 id="session-title" className="font-heading text-lg font-semibold">Demo session</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Status</dt><dd className="mt-0.5 font-medium">Exploring the demo account</dd></div>
          <div><dt className="text-muted-foreground">Started</dt><dd className="mt-0.5 font-medium">{session ? formatOrderTime(session.started_at) : "—"}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">
          This is not a secure sign-in: there is no password, and the demo flag, profile, orders and addresses are stored in this browser.
          Leaving the demo removes the sample orders and address and resets the profile; your cart, wishlist and your own orders and addresses stay.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ConfirmDialog
            title="Reset the demo account?"
            description="The profile and preferences go back to their defaults and the sample orders and address are recreated. Orders and addresses you added yourself are kept."
            confirmLabel="Reset demo data"
            onConfirm={() => { resetDemoData(); announce("Demo data reset."); }}
            trigger={<Button variant="outline"><RotateCcw aria-hidden="true" />Reset demo data</Button>}
          />
          <Button variant="secondary" onClick={endSession}><LogOut aria-hidden="true" />Logout</Button>
        </div>
      </section>
    </div>
  );
}

function Toggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{detail}</span>
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="group grid h-11 w-14 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span aria-hidden="true" className={`relative h-7 w-12 rounded-full transition-colors motion-reduce:transition-none ${checked ? "bg-primary" : "bg-input"}`}>
          <span className={`absolute top-0.5 size-6 rounded-full bg-background shadow-card transition-transform motion-reduce:transition-none ${checked ? "translate-x-5.5" : "translate-x-0.5"}`} />
        </span>
      </button>
    </div>
  );
}
