import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  VERIFIED_LIBERAL_SENATORS_2026_2030,
  VERIFIED_SENATE_SOURCES,
  VERIFIED_SENATE_RETRIEVED_AT,
} from "@/lib/verified-data/senado-liberal-2026-2030";
import { BadgeCheck, ExternalLink } from "lucide-react";

export function VerifiedSenateRoster() {
  return (
    <Card className="border-emerald-300 dark:border-emerald-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <BadgeCheck size={15} />
          Registro Oficial Verificado — Senado ({VERIFIED_LIBERAL_SENATORS_2026_2030.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-500 mb-3">
          Nombres reales, verificados cruzando {VERIFIED_SENATE_SOURCES.length} fuentes de prensa
          independientes el {VERIFIED_SENATE_RETRIEVED_AT}. Sujeto a variación menor por cuota
          repartidora. A diferencia de las tarjetas de abajo, este registro no incluye comisión,
          bio, índice de alineación ni actividad — esos campos son datos de ejemplo y no deben
          atribuirse a personas reales hasta verificarse con el Congreso/DNL.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {VERIFIED_LIBERAL_SENATORS_2026_2030.map((s) => (
            <li key={s.fullName} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-dnl-red)] shrink-0" />
              {s.fullName}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-3 border-t pt-2 text-xs text-slate-500" style={{ borderColor: "var(--border)" }}>
          Fuentes:
          {VERIFIED_SENATE_SOURCES.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[var(--color-dnl-red)]"
            >
              {s.name} <ExternalLink size={11} />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
