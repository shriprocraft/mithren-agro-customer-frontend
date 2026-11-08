"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleAlert } from "lucide-react";
import { TextField } from "@/components/account/TextField";
import { Button } from "@/components/ui/button";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api-client";
import { nameError } from "@/lib/customer-name";
import { accountProfileService, type ProfileService } from "@/services/profile";

function saveFailure(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "validation_error") return "That name can’t be used. Use 2 to 100 characters.";
    if (error.code === "session_expired" || error.status === 401) return "Your session has ended. Please sign in again.";
    if (error.code === "network_error" || error.code === "timeout") return "We couldn’t reach the server. Check your connection and try again.";
  }
  return "Your name couldn’t be saved. Please try again.";
}

// Asked once right after a first sign-in that has no name (decision A6). Saves through the existing
// PATCH /customer/profile, then reads the session again so the new name shows everywhere. "Skip for now"
// continues without a name; the customer is asked again at their next sign-in.
export function NameStep({ service = accountProfileService }: { service?: ProfileService | null }) {
  const auth = useAuth();
  const announce = useAnnounce();
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<"save" | "skip" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const error = nameError(name);

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[name="full_name"]')?.focus();
  }, []);

  const finish = async () => {
    await auth.refreshSession();
    auth.finishOnboarding();
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true);
    setFailure(null);
    if (error) {
      event.currentTarget.querySelector<HTMLElement>('[name="full_name"]')?.focus();
      return;
    }
    if (!service) return void skip();
    setBusy("save");
    try {
      await service.updateName(name);
      announce("Your name has been saved.");
      await finish();
    } catch (failed) {
      setFailure(saveFailure(failed));
      if (failed instanceof ApiError && failed.status === 401) await auth.refreshSession();
      setBusy(null);
    }
  };

  const skip = async () => {
    if (busy) return;
    setBusy("skip");
    await finish();
  };

  return (
    <form ref={formRef} noValidate onSubmit={save} aria-labelledby="name-step-title" className="grid gap-4">
      <div>
        <h2 id="name-step-title" className="font-heading text-lg font-semibold">What should we call you?</h2>
        <p className="mt-1 text-sm text-muted-foreground">You’re signed in. Add your name for your orders and deliveries. You can change it later in your profile.</p>
      </div>
      <TextField name="full_name" label="Full name" autoComplete="name" placeholder="Enter your full name" value={name} error={submitted ? error : undefined} onChange={setName} />
      {failure && (
        <p role="alert" className="flex gap-2 text-sm font-medium text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {failure}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" loading={busy === "save"} disabled={busy === "skip"}>
        {busy === "save" ? "Saving…" : "Save and continue"}
      </Button>
      <Button type="button" variant="ghost" className="w-full" loading={busy === "skip"} disabled={busy === "save"} onClick={() => void skip()}>
        Skip for now
      </Button>
    </form>
  );
}
