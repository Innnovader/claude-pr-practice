import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

export function StatTile({
  label,
  value,
  icon: Icon,
  accent,
  delayMs = 0,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accent?: "red" | "slate";
  delayMs?: number;
}) {
  return (
    <div
      className="glass-card animate-fade-in-up rounded-2xl border p-4 flex items-center gap-3.5"
      style={{
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-card)",
        animationDelay: `${delayMs}ms`,
      }}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl shrink-0 text-white transition-transform duration-300",
            accent === "red" ? "shadow-[0_4px_16px_-2px_rgba(211,47,47,0.5)]" : "bg-slate-500/15 text-slate-500 shadow-none"
          )}
          style={accent === "red" ? { backgroundImage: "var(--gradient-accent)" } : undefined}
        >
          <Icon size={18} />
        </div>
      )}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-bold tracking-tight tabular-nums">
          <AnimatedNumber value={value} />
        </p>
      </div>
    </div>
  );
}
