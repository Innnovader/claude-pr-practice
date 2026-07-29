import { BadgeCheck } from "lucide-react";

export function VerifiedDataBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
      <BadgeCheck size={14} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
