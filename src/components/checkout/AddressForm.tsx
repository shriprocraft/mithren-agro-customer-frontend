"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { indianStates } from "@/data/indian-states";
import { addressTypeLabels, emptyAddress, validateAddress, type AddressErrors } from "@/lib/address";
import { cn } from "@/lib/utils";
import { addressTypes, type AddressInput } from "@/types/order";

interface AddressFormProps {
  initial?: AddressInput;
  submitLabel: string;
  onSubmit: (address: AddressInput) => void;
  onCancel?: () => void;
}

// Delivery address form. Errors appear after the first submit attempt (or once a field is left),
// are tied to their fields with aria-describedby, and focus moves to the first invalid field.
export function AddressForm({ initial = emptyAddress, submitLabel, onSubmit, onCancel }: AddressFormProps) {
  const [values, setValues] = useState<AddressInput>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof AddressInput, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const errors = validateAddress(values);
  const visible = (field: keyof AddressInput) => (submitted || touched[field] ? errors[field] : undefined);

  const set = (field: keyof AddressInput) => (value: string) => setValues((v) => ({ ...v, [field]: value }));
  const blur = (field: keyof AddressInput) => () => setTouched((t) => ({ ...t, [field]: true }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const first = Object.keys(errors)[0] as keyof AddressErrors | undefined;
    if (first) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    onSubmit(values);
  };

  const field = (name: keyof AddressInput, label: string, props: { optional?: boolean; placeholder?: string; autoComplete?: string; inputMode?: "numeric" | "tel" | "text"; maxLength?: number; hint?: string; className?: string } = {}) => (
    <Field name={name} label={label} optional={props.optional} error={visible(name)} hint={props.hint} className={props.className}>
      {(describedBy) => (
        <input
          id={`address-${name}`}
          name={name}
          value={(values[name] as string | undefined) ?? ""}
          onChange={(e) => set(name)(e.target.value)}
          onBlur={blur(name)}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          inputMode={props.inputMode}
          maxLength={props.maxLength}
          aria-invalid={visible(name) ? true : undefined}
          aria-describedby={describedBy}
          aria-required={!props.optional}
          className={inputClass}
        />
      )}
    </Field>
  );

  return (
    <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {submitted && Object.keys(errors).length > 0 && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          Please fix the {Object.keys(errors).length === 1 ? "highlighted field" : `${Object.keys(errors).length} highlighted fields`} below.
        </p>
      )}
      {field("full_name", "Full name", { autoComplete: "name", placeholder: "Enter the recipient’s full name" })}
      {field("mobile", "Mobile number", { placeholder: "Enter a 10-digit mobile number", autoComplete: "tel-national", inputMode: "tel", maxLength: 15, hint: "10 digits, e.g. 98765 43210" })}
      {field("house", "House / flat / building", { autoComplete: "address-line1", placeholder: "e.g. Flat 4B, Green Residency" })}
      {field("street", "Street and locality", { autoComplete: "address-line2", placeholder: "e.g. 12th Main Road, Indiranagar" })}
      {field("landmark", "Landmark", { optional: true, placeholder: "e.g. Near the bus stop", className: "sm:col-span-2" })}
      {field("city", "City", { autoComplete: "address-level2", placeholder: "Enter your city" })}
      <Field name="state" label="State" error={visible("state")}>
        {(describedBy) => (
          <select
            id="address-state"
            name="state"
            value={values.state}
            onChange={(e) => set("state")(e.target.value)}
            onBlur={blur("state")}
            autoComplete="address-level1"
            aria-invalid={visible("state") ? true : undefined}
            aria-describedby={describedBy}
            aria-required
            className={inputClass}
          >
            <option value="">Choose a state</option>
            {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </Field>
      {field("pincode", "PIN code", { placeholder: "6-digit PIN code", autoComplete: "postal-code", inputMode: "numeric", maxLength: 6 })}

      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium">Address type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {addressTypes.map((type) => (
            <label key={type} className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm has-focus-visible:ring-2 has-focus-visible:ring-ring", values.type === type ? "border-primary bg-secondary font-medium text-secondary-foreground" : "border-input hover:bg-soft")}>
              <input type="radio" name="type" value={type} checked={values.type === type} onChange={() => set("type")(type)} className="size-4 accent-primary outline-none" />
              {addressTypeLabels[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive";

function Field({ name, label, optional, error, hint, className, children }: { name: string; label: string; optional?: boolean; error?: string; hint?: string; className?: string; children: (describedBy: string | undefined) => ReactNode }) {
  const ids = [hint && !error && `address-${name}-hint`, error && `address-${name}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={`address-${name}`} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      {children(ids)}
      {hint && !error && <p id={`address-${name}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`address-${name}-error`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
