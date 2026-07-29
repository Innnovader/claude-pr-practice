import { Card } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-dnl-red)] text-white font-bold text-sm">
            DNL
          </div>
          <div>
            <p className="text-sm font-semibold">Radar Liberal</p>
            <p className="text-[11px] text-slate-500">Dirección Nacional Liberal</p>
          </div>
        </div>

        {configured ? (
          <>
            <div className="mb-4 flex items-center gap-2 text-sm font-medium">
              <ShieldCheck size={15} className="text-emerald-600" />
              Acceso restringido — super_admin / analyst / reader
            </div>
            <LoginForm />
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            Supabase no está configurado todavía (faltan
            NEXT_PUBLIC_SUPABASE_URL / ANON_KEY en apps/web/.env.local), así
            que el inicio de sesión no puede activarse. Mientras tanto, todo
            el dashboard es de lectura libre con datos de ejemplo.
          </div>
        )}
      </Card>
    </div>
  );
}
