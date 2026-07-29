import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { getArchivoByTopic, TOPIC_DISPLAY_ORDER } from "@/lib/data/archivo";
import { Archive, ChevronRight, Landmark, HeartPulse, PiggyBank, Shield, Leaf, Scale, Building2, FolderOpen } from "lucide-react";
import Link from "next/link";

const TOPIC_ICONS: Record<string, typeof Landmark> = {
  "Gobierno ADLE": Landmark,
  Economia: PiggyBank,
  Salud: HeartPulse,
  Pensiones: PiggyBank,
  Seguridad: Shield,
  "Medio ambiente": Leaf,
  Justicia: Scale,
  Congreso: Building2,
  Otros: FolderOpen,
};

export default async function ArchivoPage() {
  const byTopic = await getArchivoByTopic();
  const total = Array.from(byTopic.values()).reduce((sum, arr) => sum + arr.length, 0);

  const orderedTopics = [
    ...TOPIC_DISPLAY_ORDER.filter((t) => byTopic.has(t)),
    ...Array.from(byTopic.keys()).filter((t) => !TOPIC_DISPLAY_ORDER.includes(t)),
  ];

  return (
    <div>
      <Header title="Archivo" subtitle="Noticias clasificadas automáticamente por tema — compartido con todo el equipo" />
      <div className="p-4 md:p-6 space-y-6">
        {total === 0 ? (
          <Card className="p-8 text-center">
            <Archive size={24} className="mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500">
              Todavía no hay noticias clasificadas. Se llena automáticamente cuando corre el scraper.
            </p>
          </Card>
        ) : (
          <>
            <VerifiedDataBanner>
              {total} noticias reales clasificadas automáticamente por palabras clave (sin IA todavía). Entra a
              cada carpeta para ver las noticias de ese tema.
            </VerifiedDataBanner>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {orderedTopics.map((topic) => {
                const Icon = TOPIC_ICONS[topic] ?? FolderOpen;
                const count = byTopic.get(topic)!.length;
                return (
                  <Link key={topic} href={`/archivo/${encodeURIComponent(topic)}`}>
                    <Card className="p-4 h-full flex flex-col items-center text-center gap-2 hover:border-[var(--color-dnl-red)] transition-colors">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-dnl-red)]/10 text-[var(--color-dnl-red)]">
                        <Icon size={22} />
                      </div>
                      <p className="text-sm font-semibold">{topic}</p>
                      <p className="text-xs text-slate-500">{count} noticias</p>
                      <ChevronRight size={14} className="text-slate-400 mt-auto" />
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
