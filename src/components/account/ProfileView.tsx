"use client";

import { useState, type FormEvent } from "react";
import { CircleCheck, Pencil } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { TextField } from "@/components/account/TextField";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useDemoAccount } from "@/context/DemoAccountContext";
import { demoProfile } from "@/data/demo-account";
import { validateProfile } from "@/lib/demo-account";
import type { CustomerProfile } from "@/types/account";

type Status = { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string };

// View and edit the demo profile. Changes stay in this browser and are reset when the demo ends;
// nothing is sent to an account service.
export function ProfileView() {
  const { profile, updateProfile } = useDemoAccount();
  const announce = useAnnounce();
  const [editing, setEditing] = useState<CustomerProfile | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const errors = editing ? validateProfile(editing) : {};

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setSubmitted(true);
    const first = Object.keys(errors)[0];
    if (first) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (updateProfile(editing)) {
      setEditing(null);
      setSubmitted(false);
      setStatus({ kind: "saved" });
      announce("Demo profile saved.");
    } else {
      setStatus({ kind: "error", message: "Your changes could not be saved in this browser. Check that site storage is enabled." });
    }
  };

  const restore = () => {
    if (!updateProfile(demoProfile)) {
      setStatus({ kind: "error", message: "The demo defaults could not be saved in this browser. Check that site storage is enabled." });
      return;
    }
    setEditing(null);
    setStatus({ kind: "saved" });
    announce("Demo profile restored.");
  };

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title="My Profile"
        description="The demo profile. Edits are kept in this browser only and reset when you leave the demo."
        action={!editing && <Button variant="outline" onClick={() => { setEditing(profile); setStatus({ kind: "idle" }); }}><Pencil aria-hidden="true" />Edit profile</Button>}
      />
      {status.kind === "saved" && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
          <CircleCheck className="size-4 shrink-0" aria-hidden="true" /> Saved to the demo profile in this browser.
        </p>
      )}
      {status.kind === "error" && <p role="alert" className="rounded-2xl border border-destructive/30 p-3 text-sm text-destructive">{status.message}</p>}

      {editing ? (
        <form noValidate onSubmit={save} className="surface-card grid gap-4 rounded-3xl p-5 sm:grid-cols-2 sm:p-6">
          <TextField name="full_name" label="Full name" autoComplete="name" placeholder="Enter your full name" value={editing.full_name} error={submitted ? errors.full_name : undefined}
            onChange={(v) => setEditing({ ...editing, full_name: v })} />
          <TextField name="email" label="Email address" type="email" placeholder="Enter your email address" autoComplete="email" value={editing.email} error={submitted ? errors.email : undefined}
            onChange={(v) => setEditing({ ...editing, email: v })} />
          <TextField name="mobile" label="Mobile number" optional type="tel" placeholder="Enter your 10-digit mobile number" inputMode="tel" autoComplete="tel-national" hint="10 digits, e.g. 98765 43210"
            value={editing.mobile} error={submitted ? errors.mobile : undefined} onChange={(v) => setEditing({ ...editing, mobile: v })} />
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button type="submit">Save changes</Button>
            <Button type="button" variant="outline" onClick={() => { setEditing(null); setSubmitted(false); }}>Cancel</Button>
          </div>
        </form>
      ) : (
        <section aria-label="Profile details" className="surface-card rounded-3xl p-5 sm:p-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Full name</dt><dd className="mt-0.5 font-medium">{profile.full_name}</dd></div>
            <div><dt className="text-muted-foreground">Email address</dt><dd className="mt-0.5 font-medium break-all">{profile.email}</dd></div>
            <div><dt className="text-muted-foreground">Mobile number</dt><dd className="mt-0.5 font-medium">{profile.mobile || "Not added"}</dd></div>
            <div><dt className="text-muted-foreground">Account type</dt><dd className="mt-0.5 font-medium">Demo account (sample data)</dd></div>
          </dl>
          <div className="mt-5 border-t border-border pt-4">
            <Button variant="ghost" onClick={restore}>Restore demo defaults</Button>
          </div>
        </section>
      )}
    </div>
  );
}
