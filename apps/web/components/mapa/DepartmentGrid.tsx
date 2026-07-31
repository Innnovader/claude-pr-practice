"use client";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { TerritorialPower, TerritorialOffice } from "@/lib/types";
import { Landmark, Building2, Users, MapPinned, ChevronDown, MapPin } from "lucide-react";
import { useState } from "react";

const OFFICE_ICONS: Record<TerritorialOffice, typeof Landmark> = {
  gobernacion: Landmark,
  alcaldia: Building2,
  concejal: Users,
  diputado: MapPinned,
};
const OFFICE_LABELS: Record<TerritorialOffice, string> = {
  gobernacion: "Gobernación",
  alcaldia: "Alcaldía",
  concejal: "Concejal",
  diputado: "Diputado",
};
const OFFICE_ORDER: TerritorialOffice[] = ["gobernacion", "alcaldia", "diputado", "concejal"];

export interface DepartmentEntry {
  department: string;
  officials: TerritorialPower[];
}

function OfficialRow({ official }: { official: TerritorialPower }) {
  const Icon = OFFICE_ICONS[official.office];
  return (
    <div className="flex items-start gap-2 rounded-lg border p-2.5" style={{ borderColor: "var(--border)" }}>
      <Icon size={14} className="mt-0.5 text-slate-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">
          {OFFICE_LABELS[official.office]}
          {official.municipality ? ` · ${official.municipality}` : ""}
        </p>
        <p className="text-sm font-medium truncate">{official.official_name}</p>
        {official.is_coalition && official.coalition_partners && (
          <p className="mt-0.5 text-[11px] text-slate-400 truncate">
            Coalición: {official.coalition_partners.join(", ")}
          </p>
        )}
      </div>
      {official.is_coalition && <Badge>coalición</Badge>}
    </div>
  );
}

function DepartmentCard({ entry, delayMs }: { entry: DepartmentEntry; delayMs: number }) {
  const [expanded, setExpanded] = useState(false);
  const counts = OFFICE_ORDER.map((office) => ({
    office,
    count: entry.officials.filter((o) => o.office === office).length,
  })).filter((c) => c.count > 0);

  const sortedOfficials = [...entry.officials].sort(
    (a, b) => OFFICE_ORDER.indexOf(a.office) - OFFICE_ORDER.indexOf(b.office)
  );

  return (
    <div
      className="glass-card animate-fade-in-up overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)", animationDelay: `${delayMs}ms` }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="card-interactive flex w-full items-center justify-between gap-2 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-[var(--color-dnl-red)] shrink-0" />
            <p className="font-semibold truncate">{entry.department}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {counts.map(({ office, count }) => (
              <Badge key={office}>
                {count} {OFFICE_LABELS[office].toLowerCase()}
                {count > 1 ? "s" : ""}
              </Badge>
            ))}
          </div>
        </div>
        <ChevronDown size={16} className={cn("shrink-0 text-slate-400 transition-transform duration-300", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="space-y-2 border-t p-3" style={{ borderColor: "var(--border)" }}>
          {sortedOfficials.map((o) => (
            <OfficialRow key={o.id} official={o} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DepartmentGrid({ entries }: { entries: DepartmentEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500 py-8 text-center">Sin departamentos con presencia registrada todavía.</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {entries.map((entry, i) => (
        <DepartmentCard key={entry.department} entry={entry} delayMs={Math.min(i, 8) * 40} />
      ))}
    </div>
  );
}
