import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Shared page gutter and max content width (1308px of content, the panel width in the target). */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[85.75rem] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
