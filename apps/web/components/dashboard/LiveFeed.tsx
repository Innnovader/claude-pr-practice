import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SaveButton } from "@/components/dashboard/SaveButton";
import { formatRelativeTime } from "@/lib/utils";
import type { CoyunturaNews } from "@/lib/types";
import { ExternalLink, Radio } from "lucide-react";

export function LiveFeed({
  news,
  isReal = false,
  savedIds,
}: {
  news: CoyunturaNews[];
  isReal?: boolean;
  savedIds?: Set<string>;
}) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="live-dot absolute inline-flex h-full w-full rounded-full bg-[var(--color-dnl-red)]" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-dnl-red)]" />
          </span>
          <Radio size={15} className="text-[var(--color-dnl-red)]" />
          Live Feed Multifuente
        </CardTitle>
        <Badge variant="dnl">{news.length} activas</Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto scrollbar-thin max-h-[560px] space-y-3">
        {news.map((item, index) => (
          <a
            key={item.id}
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-interactive glass-card animate-fade-in-up block rounded-xl border p-3 hover:border-[var(--color-dnl-red)]"
            style={{
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-card)",
              animationDelay: `${Math.min(index, 12) * 45}ms`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-snug">{item.headline}</p>
              <div className="flex items-center gap-1 shrink-0">
                {isReal && <SaveButton newsId={item.id} initiallySaved={savedIds?.has(item.id) ?? false} />}
                <ExternalLink size={13} className="mt-0.5 text-slate-400" />
              </div>
            </div>
            {item.summary && (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.summary}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={item.sentiment ?? "neutro"}>{item.sentiment ?? "neutro"}</Badge>
              {item.dnl_relevance && <Badge variant={item.dnl_relevance}>relevancia {item.dnl_relevance}</Badge>}
              {item.topic && <Badge>{item.topic}</Badge>}
              <span className="ml-auto text-[11px] text-slate-400">
                {item.source_name} · {formatRelativeTime(item.published_at)}
              </span>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
