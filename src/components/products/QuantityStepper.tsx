"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clampQuantity, MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Names the product for screen readers, e.g. "Quantity of Tomatoes". */
  label: string;
  disabled?: boolean;
  className?: string;
}

// − value + control. Typed values are clamped to 1…MAX_QUANTITY_PER_ITEM; the buttons disable at the limits.
export function QuantityStepper({ value, onChange, label, disabled, className }: QuantityStepperProps) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center rounded-full border border-input bg-background", className)}>
      <Button variant="ghost" size="icon" type="button" aria-label="Decrease quantity" disabled={disabled || value <= 1} onClick={() => onChange(clampQuantity(value - 1))}>
        <Minus aria-hidden="true" />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        aria-label="Quantity"
        min={1}
        max={MAX_QUANTITY_PER_ITEM}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(clampQuantity(Number(e.target.value)))}
        className="h-11 w-12 bg-transparent text-center text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button variant="ghost" size="icon" type="button" aria-label="Increase quantity" disabled={disabled || value >= MAX_QUANTITY_PER_ITEM} onClick={() => onChange(clampQuantity(value + 1))}>
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
