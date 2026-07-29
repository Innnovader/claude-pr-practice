import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Parliamentarian } from "@/lib/types";
import Link from "next/link";
import { UserRound } from "lucide-react";

export function ParliamentarianCard({ p }: { p: Parliamentarian }) {
  return (
    <Link href={`/parlamentarios/${p.id}`}>
      <Card className="p-4 h-full hover:border-[var(--color-dnl-red)] transition-colors">
        <div className="flex items-start gap-3">
          {p.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL de foto viene de datos, dominio no conocido de antemano
            <img
              src={p.photo_url}
              alt={p.full_name}
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 shrink-0">
              <UserRound size={20} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{p.full_name}</p>
            <p className="text-xs text-slate-500">
              {p.chamber === "senado" ? "Senado" : `Cámara — ${p.department}`}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {p.commission && <Badge>{p.commission}</Badge>}
          {p.alignment_index != null && (
            <Badge variant={p.alignment_index >= 70 ? "positivo" : p.alignment_index >= 40 ? "neutro" : "negativo"}>
              alineación {p.alignment_index}%
            </Badge>
          )}
          {!p.commission && p.alignment_index == null && (
            <span className="text-[11px] text-slate-400">pendiente de completar</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
