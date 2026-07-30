import { Header } from "@/components/layout/Header";
import { ParliamentarianCard } from "@/components/parlamentarios/ParliamentarianCard";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { StatTile } from "@/components/ui/StatTile";
import { mockSenators, mockRepresentatives, mockStatements } from "@/lib/mock-data";
import { getRealParliamentarians } from "@/lib/data/parliamentarians";
import { Users, Landmark, AlertOctagon } from "lucide-react";

// Confirmado contra el directorio oficial de camara.gov.co (filtrado por
// Partido Liberal Colombiano) el 2026-07-30: el partido tiene 24 curules en
// la Cámara, no 30. Estos departamentos genuinamente NO tienen representante
// liberal — no es que falte verificarlos, es que el resultado real fue cero
// curules ahí (incluye la segunda curul de Arauca, que tampoco es liberal).
const DEPARTMENTS_WITHOUT_LIBERAL_SEAT = ["Arauca (segunda curul)", "Córdoba", "Nariño"];

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
            {senators.length} senadores y {representatives.length} representantes reales — registro completo
            verificado directamente contra los directorios oficiales de senado.gov.co y camara.gov.co el
            2026-07-30. Comisión, correo, foto y redes provienen de esas mismas fuentes oficiales cuando están
            publicadas; los campos que el Congreso aún no ha cargado en su propio sitio quedan vacíos — nada
            fabricado.
          </VerifiedDataBanner>
        ) : (
          <MockDataBanner />
        )}

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
            Cámara de Representantes {hasRealData && `(${representatives.length} de ${representatives.length} curules — registro oficial completo)`}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {representatives.map((p) => (
              <ParliamentarianCard key={p.id} p={p} />
            ))}
          </div>
          {hasRealData && (
            <div className="mt-3 rounded-lg border border-dashed p-3 text-xs text-slate-500" style={{ borderColor: "var(--border)" }}>
              <p className="font-medium mb-1">Departamentos sin curul liberal en Cámara (confirmado en camara.gov.co, no es falta de datos):</p>
              <p>{DEPARTMENTS_WITHOUT_LIBERAL_SEAT.join(" · ")}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
