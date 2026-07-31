import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "positivo"
  | "neutro"
  | "negativo"
  | "alto"
  | "medio"
  | "bajo"
  | "dnl";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  positivo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  neutro: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  negativo: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  alto: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  medio: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  bajo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  dnl: "shine-sweep text-white [background-image:var(--gradient-accent)]",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize transition-transform duration-200",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
