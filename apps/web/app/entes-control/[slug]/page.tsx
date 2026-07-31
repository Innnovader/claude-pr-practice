import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ControlAlertCard } from "@/components/control/ControlAlertCard";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { mockControlAlerts } from "@/lib/mock-data";
import { getRealControlAlerts } from "@/lib/data/control-alerts";
import { MONITORED_ENTITIES, getEntityBySlug } from "@/lib/entity-logos";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  return MONITORED_ENTITIES.map((e) => ({ slug: e.slug }));
}

export default async function EntityHistoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);
  if (!entity) notFound();

  const realAlerts = await getRealControlAlerts();
  const realForEntity = realAlerts.filter((a) => a.source_entity === entity.name);
  const hasReal = realForEntity.length > 0;
  const alerts = hasReal ? realForEntity : mockControlAlerts.filter((a) => a.source_entity === entity.name);

  return (
    <div>
      <Header title={entity.name} subtitle="Histórico de comunicados y publicaciones recolectados" />
      <div className="p-4 md:p-6 space-y-4">
        <Link
          href="/entes-control"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-dnl-red)] transition-colors"
        >
          <ArrowLeft size={15} />
          Volver a Entes de Control
        </Link>

        <div className="glass-card flex items-center gap-4 rounded-2xl border p-5" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center">
            {entity.logo ? (
              <Image src={entity.logo} alt={entity.name} width={64} height={64} className="h-16 w-auto max-w-[64px] object-contain" unoptimized />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-xl text-base font-bold text-white"
                style={{ backgroundImage: "var(--gradient-accent)" }}
              >
                {entity.initials}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold">{entity.name}</p>
            <p className="text-sm text-slate-500">
              {alerts.length} {alerts.length === 1 ? "registro histórico" : "registros históricos"}
            </p>
          </div>
        </div>

        {hasReal ? (
          <VerifiedDataBanner>
            {realForEntity.length} comunicados reales scrapeados en vivo de {entity.name}.
          </VerifiedDataBanner>
        ) : (
          <MockDataBanner />
        )}

        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            Todavía no hay registros recolectados para esta entidad.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((a) => (
              <ControlAlertCard key={a.id} alert={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
