import { Header } from "@/components/layout/Header";
import { ControlAlertCard } from "@/components/control/ControlAlertCard";
import { EntityLogoGrid } from "@/components/control/EntityLogoGrid";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { mockControlAlerts } from "@/lib/mock-data";
import { getRealControlAlerts } from "@/lib/data/control-alerts";
import { MONITORED_ENTITIES } from "@/lib/entity-logos";

export default async function EntesControlPage() {
  const realAlerts = await getRealControlAlerts();
  const realEntesControl = realAlerts.filter((a) => a.source_category === "ente_control");
  const realCentros = realAlerts.filter((a) => a.source_category === "centro_pensamiento");
  // Fiscalía y Defensoría ya tienen scraper real (ver services/scraper/app/
  // sources/control_entities.py); Procuraduría y Contraloría siguen
  // pendientes de Playwright — por eso "entes de control" puede tener una
  // mezcla real/vacía según qué fuente haya traído algo en el último ciclo.
  const hasRealEntesControl = realEntesControl.length > 0;
  const hasRealCentros = realCentros.length > 0;

  const entesControl = hasRealEntesControl ? realEntesControl : mockControlAlerts.filter((a) => a.source_category === "ente_control");
  const centrosPensamiento = hasRealCentros ? realCentros : mockControlAlerts.filter((a) => a.source_category === "centro_pensamiento");
  const allAlerts = hasRealEntesControl || hasRealCentros ? realAlerts : mockControlAlerts;

  const countsByEntity: Record<string, number> = {};
  for (const alert of allAlerts) {
    countsByEntity[alert.source_entity] = (countsByEntity[alert.source_entity] ?? 0) + 1;
  }

  return (
    <div>
      <Header
        title="Vigía de Entes de Control y Centros de Pensamiento"
        subtitle="Procuraduría · Contraloría · Fiscalía · Defensoría · IPL · Fedesarrollo · Dejusticia · ANIF · Banco de la República"
      />
      <div className="p-4 md:p-6 space-y-6">
        {!hasRealEntesControl && !hasRealCentros && <MockDataBanner />}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Entidades monitoreadas — clic para ver el histórico
          </h2>
          <EntityLogoGrid entities={MONITORED_ENTITIES} counts={countsByEntity} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Entes de Control{" "}
            {!hasRealEntesControl && (
              <span className="normal-case text-slate-400">(ejemplo — Procuraduría/Contraloría pendientes de Playwright)</span>
            )}
          </h2>
          {hasRealEntesControl && (
            <VerifiedDataBanner>
              {entesControl.length} alertas reales de Fiscalía y/o Defensoría, scrapeadas en vivo. El nivel de
              &quot;impacto&quot; es un valor por defecto hasta activar la clasificación con IA.
            </VerifiedDataBanner>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {entesControl.map((a) => (
              <ControlAlertCard key={a.id} alert={a} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-500 uppercase tracking-wide">Centros de Pensamiento y Análisis Económico</h2>
          {hasRealCentros && (
            <VerifiedDataBanner>
              {centrosPensamiento.length} publicaciones reales de IPL, Fedesarrollo, Dejusticia, ANIF y/o Banco de la
              República, scrapeadas en vivo. El nivel de &quot;impacto&quot; es un valor por defecto hasta activar la
              clasificación con IA — no es una evaluación real todavía.
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
