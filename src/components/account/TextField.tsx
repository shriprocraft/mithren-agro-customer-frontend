import type { HTMLInputTypeAttribute } from "react";
import { cn } from "@/lib/utils";

interface TextFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  type?: HTMLInputTypeAttribute;
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  className?: string;
}

/** Labelled input with hint and inline error tied by aria-describedby (same look as the address form). */
export function TextField({ name, label, value, onChange, error, hint, optional, type = "text", inputMode, autoComplete, className }: TextFieldProps) {
  const id = `field-${name}`;
  const describedBy = [hint && !error && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-required={!optional}
        aria-describedby={describedBy}
        className="h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive sm:text-sm"
      />
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
