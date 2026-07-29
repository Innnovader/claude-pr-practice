import { Header } from "@/components/layout/Header";
import { ParliamentarianCard } from "@/components/parlamentarios/ParliamentarianCard";
import { VerifiedSenateRoster } from "@/components/parlamentarios/VerifiedSenateRoster";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { StatTile } from "@/components/ui/StatTile";
import { mockSenators, mockRepresentatives, mockStatements } from "@/lib/mock-data";
import { getRealParliamentarians } from "@/lib/data/parliamentarians";
import { Users, Landmark, AlertOctagon } from "lucide-react";

// Departamentos con representante liberal en Cámara que no logramos
// verificar cruzando 2 fuentes independientes (nombre reportado por una
// sola fuente, o directamente no localizado) — pendientes de cargar por la
// DNL desde sus registros internos.
const PENDING_CAMARA_DEPARTMENTS = [
  "Arauca (segunda curul)",
  "Chocó",
  "Córdoba",
  "Nariño",
  "Valle del Cauca",
  "Guaviare",
  "San Andrés y Providencia",
];

export default async function ParlamentariosPage() {
  const realParliamentarians = await getRealParliamentarians();
  const hasRealData = realParliamentarians.length > 0;

  const realSenators = realParliamentarians.filter((p) => p.chamber === "senado");
  const realReps = realParliamentarians.filter((p) => p.chamber === "camara");

  const senators = hasRealData ? realSenators : mockSenators;
  const representatives = hasRealData ? realReps : mockRepresentatives;
  const criticalAlerts = mockStatements.filter((s) => s.is_critical);

  return (
    <div>
      <Header
        title="Seguimiento a la Bancada Liberal — Congreso 2026–2030"
        subtitle="13 Senadores + Representantes a la Cámara"
      />
      <div className="p-4 md:p-6 space-y-6">
        {hasRealData ? (
          <VerifiedDataBanner>
            {senators.length} senadores y {representatives.length} representantes reales, verificados cruzando
            al menos 2 fuentes de prensa independientes el 2026-07-28. Sin bio, comisión ni índice de alineación
            fabricados — esos campos quedan vacíos hasta verificarse con fuentes oficiales.
          </VerifiedDataBanner>
        ) : (
          <MockDataBanner />
        )}

        <VerifiedSenateRoster />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatTile label="Senadores" value={senators.length} icon={Landmark} accent="red" />
          <StatTile label="Representantes" value={representatives.length} icon={Users} accent="red" />
          <StatTile label="Alertas críticas recientes" value={criticalAlerts.length} icon={AlertOctagon} />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">Senado</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {senators.map((p) => (
              <ParliamentarianCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Cámara de Representantes {hasRealData && `(${representatives.length} de ~30 verificados)`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {representatives.map((p) => (
              <ParliamentarianCard key={p.id} p={p} />
            ))}
          </div>
          {hasRealData && (
            <div className="mt-3 rounded-lg border border-dashed p-3 text-xs text-slate-500" style={{ borderColor: "var(--border)" }}>
              <p className="font-medium mb-1">Departamentos pendientes de completar (sin fuente confiable localizada):</p>
              <p>{PENDING_CAMARA_DEPARTMENTS.join(" · ")}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
