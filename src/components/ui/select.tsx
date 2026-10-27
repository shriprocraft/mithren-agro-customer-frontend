"use client"

import * as React from "react"
import { cn } from "cn"
import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

// Single-choice dropdown (Radix Select: full keyboard support, typeahead, screen-reader semantics).
// Trigger: white pill with a hairline input border, a leading icon slot, the value and a chevron;
// the menu is a white card above everything else (z-50, portalled) with a soft green selected row.

function Select(props: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectValue(props: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "group/select inline-flex h-11 w-full min-w-0 items-center gap-2 rounded-full border border-input/45 bg-card pr-3 pl-4 text-left text-sm text-foreground shadow-[0_1px_2px_rgb(var(--shadow-tint)/0.05)] transition-[border-color,box-shadow,background-color] outline-none select-none",
        "hover:border-primary/45 hover:bg-soft focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 data-[state=open]:border-primary/60 data-[state=open]:ring-2 data-[state=open]:ring-ring/20",
        "disabled:cursor-not-allowed disabled:opacity-55 data-[placeholder]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&>span]:min-w-0 [&>span]:truncate",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="ml-auto size-4 text-muted-foreground transition-transform group-data-[state=open]/select:rotate-180 motion-reduce:transition-none" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={6}
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-[max(var(--radix-select-trigger-width),12rem)] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[var(--elevation-overlay)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 motion-reduce:animate-none",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, hint, ...props }: React.ComponentProps<typeof SelectPrimitive.Item> & { hint?: React.ReactNode }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-xl py-2 pr-9 pl-3 text-sm outline-none select-none",
        "data-[highlighted]:bg-soft data-[highlighted]:text-foreground data-[state=checked]:bg-secondary data-[state=checked]:font-medium data-[state=checked]:text-secondary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {hint != null && <span className="ml-auto text-xs text-muted-foreground">{hint}</span>}
      <span className="absolute right-3 grid size-4 place-items-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-primary" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={cn("my-1 h-px bg-border", className)} {...props} />
}

export { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue }
