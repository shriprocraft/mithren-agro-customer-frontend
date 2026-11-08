"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CircleCheck, Pencil } from "lucide-react";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { TextField } from "@/components/account/TextField";
import { LoadingState } from "@/components/checkout/PageState";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { nameError } from "@/lib/customer-name";
import { accountProfileService, type AccountProfile, type ProfileService } from "@/services/profile";

type Load = { kind: "loading" } | { kind: "ready"; profile: AccountProfile } | { kind: "error" };
type Status = { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string };

// The signed-in customer's profile, from their account (GET/PATCH /customer/profile). Only the name can
// be changed here: email and phone are verified sign-in contacts and changing them needs verification.
export function AccountProfileView({ service = accountProfileService }: { service?: ProfileService | null }) {
  const announce = useAnnounce();
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [editing, setEditing] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    if (!service) return;
    let live = true;
    service.get().then(
      (profile) => live && setLoad({ kind: "ready", profile }),
      () => live && setLoad({ kind: "error" }),
    );
    return () => {
      live = false;
    };
  }, [service]);

  if (!service || load.kind === "error") {
    return (
      <div className="space-y-6">
        <AccountPageHeader title="My Profile" />
        <p role="alert" className="rounded-2xl border border-destructive/30 p-3 text-sm text-destructive">Your profile couldn’t be loaded. Check your connection and try again.</p>
      </div>
    );
  }
  if (load.kind === "loading") return <LoadingState label="Loading your profile…" />;

  const { profile } = load;
  const error = editing === null ? undefined : nameError(editing);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editing === null || saving) return;
    setSubmitted(true);
    if (error) {
      event.currentTarget.querySelector<HTMLElement>('[name="full_name"]')?.focus();
      return;
    }
    setSaving(true);
    try {
      const updated = await service.updateName(editing);
      setLoad({ kind: "ready", profile: updated });
      setEditing(null);
      setSubmitted(false);
      setStatus({ kind: "saved" });
      announce("Profile saved.");
    } catch {
      setStatus({ kind: "error", message: "Your name couldn’t be saved. Check your connection and try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AccountPageHeader
        title="My Profile"
        description="Your account details. Your mobile number is the verified contact you sign in with; email and mobile can’t be changed here."
        action={editing === null && <Button variant="outline" onClick={() => { setEditing(profile.full_name ?? ""); setStatus({ kind: "idle" }); }}><Pencil aria-hidden="true" />Edit name</Button>}
      />
      {status.kind === "saved" && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-sm text-secondary-foreground">
          <CircleCheck className="size-4 shrink-0" aria-hidden="true" /> Saved to your account.
        </p>
      )}
      {status.kind === "error" && <p role="alert" className="rounded-2xl border border-destructive/30 p-3 text-sm text-destructive">{status.message}</p>}

      {editing !== null ? (
        <form noValidate onSubmit={(event) => void save(event)} className="surface-card grid gap-4 rounded-3xl p-5 sm:grid-cols-2 sm:p-6">
          <TextField name="full_name" label="Full name" autoComplete="name" placeholder="Enter your full name" value={editing} error={submitted ? error : undefined}
            onChange={setEditing} />
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
            <Button type="button" variant="outline" onClick={() => { setEditing(null); setSubmitted(false); }}>Cancel</Button>
          </div>
        </form>
      ) : (
        <section aria-label="Profile details" className="surface-card rounded-3xl p-5 sm:p-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Full name</dt><dd className="mt-0.5 font-medium">{profile.full_name ?? "Not added"}</dd></div>
            <div><dt className="text-muted-foreground">Email address</dt><dd className="mt-0.5 font-medium break-all">{profile.email ?? "Not added"}</dd></div>
            <div><dt className="text-muted-foreground">Mobile number</dt><dd className="mt-0.5 font-medium">{profile.phone ?? "Not added"}</dd></div>
            <div><dt className="text-muted-foreground">Account type</dt><dd className="mt-0.5 font-medium">Customer account</dd></div>
          </dl>
        </section>
      )}
    </div>
  );
}
