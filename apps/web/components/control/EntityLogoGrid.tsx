import Image from "next/image";
import Link from "next/link";
import type { MonitoredEntity } from "@/lib/entity-logos";

function EntityTile({ entity, count, delayMs }: { entity: MonitoredEntity; count: number; delayMs: number }) {
  return (
    <Link
      href={`/entes-control/${entity.slug}`}
      className="card-interactive glass-card animate-fade-in-up flex flex-col items-center gap-2 rounded-2xl border p-4 text-center"
      style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card)", animationDelay: `${delayMs}ms` }}
    >
      <div className="flex h-14 w-full items-center justify-center">
        {entity.logo ? (
          <Image
            src={entity.logo}
            alt={entity.name}
            width={120}
            height={48}
            className="h-12 w-auto max-w-[120px] object-contain"
            unoptimized
          />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundImage: "var(--gradient-accent)" }}
            title="Sin logo disponible — el sitio oficial bloquea la descarga automática"
          >
            {entity.initials}
          </div>
        )}
      </div>
      <p className="text-xs font-medium leading-snug">{entity.name}</p>
      <p className="text-[11px] text-slate-500">{count} {count === 1 ? "registro" : "registros"}</p>
    </Link>
  );
}

export function EntityLogoGrid({
  entities,
  counts,
}: {
  entities: MonitoredEntity[];
  counts: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {entities.map((entity, i) => (
        <EntityTile key={entity.slug} entity={entity} count={counts[entity.name] ?? 0} delayMs={i * 50} />
      ))}
    </div>
  );
}
