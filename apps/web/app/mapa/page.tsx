import { Header } from "@/components/layout/Header";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { MapaClient } from "@/components/mapa/MapaClient";
import { DepartmentGrid, type DepartmentEntry } from "@/components/mapa/DepartmentGrid";
import { getRealTerritorialPower } from "@/lib/data/territorial";
import { mockTerritorialPower, territorialSummaryByDepartment } from "@/lib/mock-data";
import { DEPARTMENT_COORDS } from "@/lib/department-coords";
import type { TerritorialPower, TerritorialOffice } from "@/lib/types";

const OFFICE_ORDER: TerritorialOffice[] = ["gobernacion", "alcaldia", "diputado", "concejal"];

function buildEntries(rows: TerritorialPower[]): DepartmentEntry[] {
  const byDept = new Map<string, TerritorialPower[]>();
  for (const row of rows) {
    if (!byDept.has(row.department)) byDept.set(row.department, []);
    byDept.get(row.department)!.push(row);
  }
  return Array.from(byDept.entries())
    .map(([department, officials]) => ({ department, officials }))
    .sort((a, b) => b.officials.length - a.officials.length || a.department.localeCompare(b.department));
}

function buildMapSummary(rows: TerritorialPower[]) {
  const byDept = new Map<string, Record<TerritorialOffice, number>>();
  for (const row of rows) {
    if (!byDept.has(row.department)) {
      byDept.set(row.department, { gobernacion: 0, alcaldia: 0, concejal: 0, diputado: 0 });
    }
    byDept.get(row.department)![row.office] += 1;
  }
  return Array.from(byDept.entries()).map(([department, counts]) => ({
    department,
    ...counts,
    total: OFFICE_ORDER.reduce((sum, o) => sum + counts[o], 0),
    coords: DEPARTMENT_COORDS[department],
  }));
}

export default async function MapaPage() {
  const real = await getRealTerritorialPower();
  const hasReal = real.length > 0;

  const rows = hasReal ? real : mockTerritorialPower;
  const entries = buildEntries(rows);
  const mapSummary = hasReal ? buildMapSummary(rows) : territorialSummaryByDepartment();
  const totalOfficials = rows.length;

  return (
    <div>
      <Header
        title="Mapa del Poder Territorial Liberal"
        subtitle="Gobernaciones · Alcaldías · Diputados · Concejales — por departamento"
      />
      <div className="p-4 md:p-6 space-y-4">
        {hasReal ? (
          <VerifiedDataBanner>
            {totalOfficials} cargos reales verificados en {entries.length} departamentos (gobernaciones, alcaldías y
            diputados). Concejales y consejos de juventud no tienen fuente pública consolidada a nivel nacional —
            solo se puede ampliar departamento por departamento vía prensa.
          </VerifiedDataBanner>
        ) : (
          <MockDataBanner />
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Departamentos con presencia — clic para desplegar
          </h2>
          <DepartmentGrid entries={entries} />
        </section>

        <section>
          <MapaClient summary={mapSummary} />
        </section>
      </div>
    </div>
  );
}
