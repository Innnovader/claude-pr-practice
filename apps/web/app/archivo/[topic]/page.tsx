import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getNewsByTopic } from "@/lib/data/archivo";
import { formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, ExternalLink, FolderOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ArchivoTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: encodedTopic } = await params;
  const topic = decodeURIComponent(encodedTopic);
  const news = await getNewsByTopic(topic);
  if (news.length === 0) notFound();

  return (
    <div>
      <Header title={topic} subtitle={`${news.length} noticias reales en esta carpeta`} />
      <div className="p-4 md:p-6 space-y-4">
        <Link
          href="/archivo"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-dnl-red)]"
        >
          <ArrowLeft size={15} />
          Volver al Archivo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {news.map((item) => (
            <a key={item.id} href={item.source_url} target="_blank" rel="noopener noreferrer">
              <Card className="p-3 h-full hover:border-[var(--color-dnl-red)] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{item.headline}</p>
                  <ExternalLink size={13} className="shrink-0 mt-0.5 text-slate-400" />
                </div>
                {item.summary && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.summary}</p>}
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge>
                    <FolderOpen size={10} className="mr-1 inline" />
                    {item.source_name}
                  </Badge>
                  <span className="ml-auto text-[11px] text-slate-400">{formatRelativeTime(item.published_at)}</span>
                </div>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
