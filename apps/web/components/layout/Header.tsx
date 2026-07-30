import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { MobileMenuButton } from "@/components/layout/MobileMenuButton";
import { getCurrentProfile } from "@/lib/supabase/get-current-profile";
import { Circle } from "lucide-react";

export async function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const profile = await getCurrentProfile();

  return (
    <header
      className="flex items-center justify-between gap-2 border-b px-3 py-3 md:px-6"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <MobileMenuButton />
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="hidden text-xs text-slate-500 sm:block">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Circle size={8} className="fill-current" />
          Monitoreo activo
        </span>
        <ThemeToggle />
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
