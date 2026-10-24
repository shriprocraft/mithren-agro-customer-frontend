import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Shared text styles (guide, Section K). The visual variant is independent of the semantic tag,
// so a page keeps one h1 while sections can still use large headings.
const headingVariants = cva("font-heading text-foreground text-balance", {
  variants: {
    variant: {
      // Hero 44px at 1024px and 56px from 1280px, sized for the spacious landing hero; 22px section titles.
      display: "text-[2.5rem] leading-[1.04] font-medium tracking-tight sm:text-5xl lg:text-[2.75rem] lg:leading-[1.04] xl:text-[3.5rem] xl:leading-[1.02]",
      h1: "text-3xl leading-tight font-medium tracking-tight sm:text-4xl",
      h2: "text-xl leading-tight font-semibold tracking-tight sm:text-[1.375rem]",
      h3: "text-xl leading-snug font-medium",
      h4: "text-base leading-snug font-semibold",
    },
  },
  defaultVariants: { variant: "h2" },
})

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

function Heading({
  as: Tag = "h2",
  variant,
  className,
  ...props
}: React.ComponentProps<"h2"> &
  VariantProps<typeof headingVariants> & { as?: HeadingTag }) {
  return (
    <Tag
      data-slot="heading"
      className={cn(headingVariants({ variant, className }))}
      {...props}
    />
  )
}

const textVariants = cva("text-pretty", {
  variants: {
    variant: {
      body: "text-base leading-relaxed text-foreground",
      lead: "text-lg leading-relaxed text-muted-foreground",
      muted: "text-sm leading-normal text-muted-foreground",
      small: "text-xs leading-normal text-muted-foreground",
    },
  },
  defaultVariants: { variant: "body" },
})

type TextTag = "p" | "span" | "div"

function Text({
  as: Tag = "p",
  variant,
  className,
  ...props
}: React.ComponentProps<"p"> &
  VariantProps<typeof textVariants> & { as?: TextTag }) {
  return (
    <Tag
      data-slot="text"
      className={cn(textVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Heading, headingVariants, Text, textVariants }
