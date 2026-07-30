import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatRelativeTime } from "@/lib/utils";
import type { ControlAlert } from "@/lib/types";
import { ExternalLink, Landmark, BookOpen } from "lucide-react";

export function ControlAlertCard({ alert }: { alert: ControlAlert }) {
  const Icon = alert.source_category === "ente_control" ? Landmark : BookOpen;
  return (
    <a
      href={alert.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card className="card-interactive p-3 hover:border-[var(--color-dnl-red)]">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 shrink-0">
            <Icon size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">{alert.source_entity}</p>
            <p className="text-sm font-medium leading-snug">{alert.title}</p>
            {alert.summary && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{alert.summary}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={alert.impact_level}>impacto {alert.impact_level}</Badge>
              {alert.alert_type && <Badge>{alert.alert_type.replace("_", " ")}</Badge>}
              <span className="ml-auto text-[11px] text-slate-400">{formatRelativeTime(alert.published_at)}</span>
            </div>
          </div>
          <ExternalLink size={13} className="shrink-0 mt-0.5 text-slate-400" />
        </div>
      </Card>
    </a>
  );
}
