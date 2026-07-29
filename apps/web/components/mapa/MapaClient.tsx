"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockTerritorialPower } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Landmark, Building2, Users, MapPinned } from "lucide-react";

const ColombiaMap = dynamic(() => import("./ColombiaMap").then((m) => m.ColombiaMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">Cargando mapa…</div>
  ),
});

interface DeptSummary {
  department: string;
  gobernacion: number;
  alcaldia: number;
  concejal: number;
  diputado: number;
  total: number;
  coords?: { lat: number; lng: number };
}

const OFFICE_ICONS = { gobernacion: Landmark, alcaldia: Building2, concejal: Users, diputado: MapPinned };
const OFFICE_LABELS = { gobernacion: "Gobernación", alcaldia: "Alcaldía", concejal: "Concejal", diputado: "Diputado" };

export function MapaClient({ summary }: { summary: DeptSummary[] }) {
  const [selected, setSelected] = useState<string | null>(summary[0]?.department ?? null);

  const officials = useMemo(
    () => mockTerritorialPower.filter((o) => o.department === selected),
    [selected]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 h-[520px] rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
        <ColombiaMap data={summary} selectedDepartment={selected} onSelectDepartment={setSelected} />
      </div>

      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Departamentos</CardTitle>
          </CardHeader>
          <CardContent className="max-h-40 overflow-y-auto scrollbar-thin space-y-1">
            {summary.map((d) => (
              <button
                key={d.department}
                onClick={() => setSelected(d.department)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  selected === d.department
                    ? "bg-[var(--color-dnl-red)] text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <span>{d.department}</span>
                <span className="text-xs opacity-80">{d.total}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selected ?? "Selecciona un departamento"}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto scrollbar-thin space-y-2">
            {officials.map((o) => {
              const Icon = OFFICE_ICONS[o.office];
              return (
                <div key={o.id} className="flex items-start gap-2 rounded-lg border p-2" style={{ borderColor: "var(--border)" }}>
                  <Icon size={14} className="mt-0.5 text-slate-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">
                      {OFFICE_LABELS[o.office]}
                      {o.municipality ? ` · ${o.municipality}` : ""}
                    </p>
                    <p className="text-sm font-medium truncate">{o.official_name}</p>
                  </div>
                  {o.is_coalition && <Badge>coalición</Badge>}
                </div>
              );
            })}
            {officials.length === 0 && <p className="text-sm text-slate-500">Sin registros para este departamento.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
