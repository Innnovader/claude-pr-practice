import type { CurrentProfile } from "@/lib/supabase/get-current-profile";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

const ROLE_LABEL: Record<CurrentProfile["role"], string> = {
  super_admin: "Super Admin",
  analyst: "Analista",
  reader: "Lector",
};

export function UserMenu({ profile }: { profile: CurrentProfile | null }) {
  if (!isSupabaseConfigured()) return null;

  if (!profile) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-[var(--color-dnl-red)] hover:text-[var(--color-dnl-red)] dark:text-slate-300"
        style={{ borderColor: "var(--border)" }}
      >
        <UserRound size={13} />
        Iniciar sesión
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-xs font-medium">{profile.email}</span>
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <ShieldCheck size={11} />
          {ROLE_LABEL[profile.role]}
        </span>
      </div>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          aria-label="Cerrar sesión"
          className="flex h-8 w-8 items-center justify-center rounded-lg border text-slate-500 hover:border-[var(--color-dnl-red)] hover:text-[var(--color-dnl-red)]"
          style={{ borderColor: "var(--border)" }}
        >
          <LogOut size={14} />
        </button>
      </form>
    </div>
  );
}
