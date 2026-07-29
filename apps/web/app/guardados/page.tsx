import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSavedNews } from "@/lib/data/saved-news";
import { formatRelativeTime } from "@/lib/utils";
import { FolderOpen, ExternalLink, Bookmark } from "lucide-react";
import { MoveFolderSelect } from "@/components/dashboard/MoveFolderSelect";

export default async function GuardadosPage() {
  const saved = await getSavedNews();

  const byFolder = new Map<string, typeof saved>();
  for (const item of saved) {
    if (!byFolder.has(item.folder)) byFolder.set(item.folder, []);
    byFolder.get(item.folder)!.push(item);
  }
  // "Favoritos" primero, luego el resto alfabético
  const folders = Array.from(byFolder.keys()).sort((a, b) =>
    a === "Favoritos" ? -1 : b === "Favoritos" ? 1 : a.localeCompare(b)
  );
  const allFolderNames = folders;

  return (
    <div>
      <Header title="Favoritos" subtitle="Lo que cada quien de la Dirección guarda manualmente — solo visible para tu usuario. Para el archivo automático por tema, ve a Archivo." />
      <div className="p-4 md:p-6 space-y-6">
        {saved.length === 0 ? (
          <Card className="p-8 text-center">
            <Bookmark size={24} className="mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500">
              Todavía no has guardado ninguna noticia. Usa el ícono de guardar en el Live Feed de Coyuntura
              Nacional.
            </p>
          </Card>
        ) : (
          folders.map((folder) => (
            <section key={folder}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                <FolderOpen size={14} />
                {folder} ({byFolder.get(folder)!.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {byFolder.get(folder)!.map((item) => (
                  <Card key={item.saved_id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={item.news.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium leading-snug hover:text-[var(--color-dnl-red)]"
                      >
                        {item.news.headline}
                      </a>
                      <a href={item.news.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={13} className="shrink-0 mt-0.5 text-slate-400" />
                      </a>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge>{item.news.source_name}</Badge>
                      <span className="text-[11px] text-slate-400">Guardado {formatRelativeTime(item.saved_at)}</span>
                      <MoveFolderSelect savedId={item.saved_id} currentFolder={item.folder} folders={allFolderNames} />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
