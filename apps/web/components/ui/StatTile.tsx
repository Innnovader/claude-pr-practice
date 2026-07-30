import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatTile({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "red" | "slate";
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex items-center gap-3.5"
      style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-card)" }}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl shrink-0 text-white",
            accent === "red" ? "shadow-[0_4px_12px_-2px_rgba(211,47,47,0.4)]" : "bg-slate-500/15 text-slate-500 shadow-none"
          )}
          style={accent === "red" ? { backgroundImage: "var(--gradient-accent)" } : undefined}
        >
          <Icon size={18} />
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}
