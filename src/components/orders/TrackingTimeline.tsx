import { BadgeCheck, Check, ClipboardCheck, House, Package, PackageOpen, Truck, type LucideIcon } from "lucide-react";
import { formatOrderTime } from "@/components/orders/OrderDetails";
import { orderStatusDescriptions, orderStatusLabels } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { orderStatuses, type Order, type OrderStatus } from "@/types/order";

const icons: Record<OrderStatus, LucideIcon> = {
  order_placed: ClipboardCheck,
  order_confirmed: BadgeCheck,
  preparing: PackageOpen,
  ready_for_dispatch: Package,
  out_for_delivery: Truck,
  delivered: House,
};

/**
 * Six-stage order timeline. Completed stages are filled green with a tick, the current stage is
 * ringed and labelled "Current", pending stages are outlined and muted. The connecting line is green
 * up to the current stage. Vertical on phones, horizontal from md up. State is also given as text.
 */
export function TrackingTimeline({ order }: { order: Order }) {
  const currentIndex = orderStatuses.indexOf(order.status);
  const reachedAt = Object.fromEntries(order.history.map((event) => [event.status, event.at]));

  return (
    <ol aria-label="Order progress" className="grid gap-0 md:grid-cols-6">
      {orderStatuses.map((status, index) => {
        const state = index < currentIndex ? "completed" : index === currentIndex ? "current" : "pending";
        const Icon = state === "completed" ? Check : icons[status];
        const isLast = index === orderStatuses.length - 1;
        return (
          <li key={status} aria-current={state === "current" ? "step" : undefined} className="relative flex gap-4 pb-8 md:flex-col md:items-center md:gap-3 md:pb-0 md:text-center">
            {/* Connector to the next stage: vertical on phones, horizontal from md. */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-12 bottom-0 left-[1.375rem] w-0.5 md:top-[1.375rem] md:right-[-50%] md:bottom-auto md:left-1/2 md:h-0.5 md:w-auto",
                  index < currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-11 shrink-0 place-items-center rounded-full",
                state === "completed" && "bg-primary text-primary-foreground",
                state === "current" && "bg-primary text-primary-foreground ring-4 ring-secondary",
                state === "pending" && "border-2 border-border bg-background text-muted-foreground",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-1 md:px-1 md:pt-0">
              <p className={cn("font-medium", state === "pending" && "text-muted-foreground")}>
                {orderStatusLabels[status]}
                {state === "current" && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground md:mt-1 md:ml-0 md:block md:w-fit md:mx-auto">Current</span>}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {state === "pending" ? "Pending" : orderStatusDescriptions[status]}
                <span className="sr-only">{state === "completed" ? " (completed)" : state === "current" ? " (current stage)" : ""}</span>
              </p>
              {reachedAt[status] && <p className="mt-0.5 text-xs text-muted-foreground"><time dateTime={reachedAt[status]}>{formatOrderTime(reachedAt[status])}</time></p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
