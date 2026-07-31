"use client";

import { Card } from "@/components/ui/Card";
import dynamic from "next/dynamic";
import { useState } from "react";
import { MapIcon } from "lucide-react";

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

/** Mapa visual — deliberadamente pequeño y secundario (pedido explícito de
 * la usuaria: "que tenga menos protagonismo"). La cuadrícula de
 * departamentos (DepartmentGrid) es ahora la vista principal de esta
 * página; este mapa es solo un vistazo geográfico rápido, no la fuente
 * primaria de navegación. */
export function MapaClient({ summary }: { summary: DeptSummary[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2 p-3 pb-2">
        <MapIcon size={14} />
        <p className="text-sm font-semibold tracking-tight">Vistazo geográfico</p>
      </div>
      <div className="h-[260px]">
        <ColombiaMap data={summary} selectedDepartment={selected} onSelectDepartment={setSelected} />
      </div>
    </Card>
  );
}
