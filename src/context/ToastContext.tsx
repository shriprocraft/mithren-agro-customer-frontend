"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Short confirmations and errors after an action (added to cart, address saved…). One provider, no
// toast library. Toasts sit at the bottom of the screen, clear of the header and the main controls,
// and dismiss themselves; errors stay longer. Success and info toasts are announced politely
// (role=status), errors assertively (role=alert). Passing the same `id` replaces a toast instead of
// stacking a duplicate, so repeated clicks on one button show one notification.

export type ToastTone = "success" | "error" | "info";

export interface ToastInput {
  /** Toasts with the same id replace each other. Defaults to the title. */
  id?: string;
  tone?: ToastTone;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}

interface ToastItem extends Required<Pick<ToastInput, "id" | "tone" | "title">> {
  description?: string;
  action?: ToastInput["action"];
  /** Changes on every show, so a replaced toast restarts its timer. */
  version: number;
}

const DURATION: Record<ToastTone, number> = { success: 3500, info: 4000, error: 6500 };
const MAX_VISIBLE = 3;

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const version = useRef(0);

  const show = useCallback((input: ToastInput) => {
    const item: ToastItem = {
      id: input.id ?? input.title,
      tone: input.tone ?? "success",
      title: input.title,
      description: input.description,
      action: input.action,
      version: ++version.current,
    };
    setToasts((current) => [...current.filter((t) => t.id !== item.id), item].slice(-MAX_VISIBLE));
  }, []);

  const dismiss = useCallback((id: string) => setToasts((current) => current.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <section
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:px-6 sm:pb-6"
      >
        {toasts.map((toast) => (
          <Toast key={`${toast.id}-${toast.version}`} toast={toast} onDismiss={dismiss} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}

const toneStyle: Record<ToastTone, { Icon: typeof CircleCheck; icon: string }> = {
  success: { Icon: CircleCheck, icon: "text-primary" },
  error: { Icon: CircleAlert, icon: "text-destructive" },
  info: { Icon: Info, icon: "text-info" },
};

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [paused, setPaused] = useState(false);
  const { Icon, icon } = toneStyle[toast.tone];

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), DURATION[toast.tone]);
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.tone, onDismiss]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      aria-live={toast.tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      data-tone={toast.tone}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-card p-3.5 pr-2 text-sm shadow-[var(--elevation-overlay)]",
        "animate-in duration-200 fade-in slide-in-from-bottom-2 motion-reduce:animate-none",
        toast.tone === "error" ? "border-destructive/30" : "border-border",
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-muted-foreground">{toast.description}</p>}
        {toast.action && (
          <Link
            href={toast.action.href}
            onClick={() => onDismiss(toast.id)}
            className="mt-1.5 inline-flex min-h-8 items-center font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            {toast.action.label}
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:bg-soft hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside ToastProvider");
  return useMemo(
    () => ({
      show,
      success: (title: string, rest?: Omit<ToastInput, "title" | "tone">) => show({ ...rest, title, tone: "success" }),
      error: (title: string, rest?: Omit<ToastInput, "title" | "tone">) => show({ ...rest, title, tone: "error" }),
      info: (title: string, rest?: Omit<ToastInput, "title" | "tone">) => show({ ...rest, title, tone: "info" }),
    }),
    [show],
  );
}
