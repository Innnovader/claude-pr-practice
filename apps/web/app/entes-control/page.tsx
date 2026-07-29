import { Header } from "@/components/layout/Header";
import { ControlAlertCard } from "@/components/control/ControlAlertCard";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { StatTile } from "@/components/ui/StatTile";
import { mockControlAlerts } from "@/lib/mock-data";
import { getRealControlAlerts } from "@/lib/data/control-alerts";
import { Landmark, BookOpen, AlertTriangle } from "lucide-react";

export default async function EntesControlPage() {
  const realAlerts = await getRealControlAlerts();
  const realCentros = realAlerts.filter((a) => a.source_category === "centro_pensamiento");
  // Los entes de control (Procuraduría/Contraloría/Fiscalía/Defensoría) aún
  // no tienen scraper real activo (requiere Playwright, ver services/scraper
  // README) — esa sección sigue en modo ejemplo aunque centros de
  // pensamiento ya tenga datos reales.
  const hasRealCentros = realCentros.length > 0;

  const entesControl = mockControlAlerts.filter((a) => a.source_category === "ente_control");
  const centrosPensamiento = hasRealCentros ? realCentros : mockControlAlerts.filter((a) => a.source_category === "centro_pensamiento");
  const highImpact = [...entesControl, ...centrosPensamiento].filter((a) => a.impact_level === "alto");

  return (
    <div>
      <Header
        title="Vigía de Entes de Control y Centros de Pensamiento"
        subtitle="Procuraduría · Contraloría · Fiscalía · Defensoría · IPL · Fedesarrollo · Dejusticia · ANIF · Banco de la República"
      />
      <div className="p-4 md:p-6 space-y-6">
        <MockDataBanner />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <StatTile label="Entes de control" value={entesControl.length} icon={Landmark} accent="red" />
          <StatTile label="Centros de pensamiento" value={centrosPensamiento.length} icon={BookOpen} accent="red" />
          <StatTile label="Impacto alto" value={highImpact.length} icon={AlertTriangle} />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Entes de Control <span className="normal-case text-slate-400">(ejemplo — scraper pendiente de Playwright)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {entesControl.map((a) => (
              <ControlAlertCard key={a.id} alert={a} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">Centros de Pensamiento y Análisis Económico</h2>
          {hasRealCentros && (
            <VerifiedDataBanner>
              {centrosPensamiento.length} publicaciones reales de IPL, Fedesarrollo, Dejusticia y ANIF, scrapeadas en
              vivo. El nivel de &quot;impacto&quot; es un valor por defecto hasta activar la clasificación con IA —
              no es una evaluación real todavía.
            </VerifiedDataBanner>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {centrosPensamiento.map((a) => (
              <ControlAlertCard key={a.id} alert={a} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
