import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { CoyunturaNews } from "@/lib/types";

/**
 * Noticias reales scrapeadas de RSS en vivo (public.coyuntura_news).
 * `sentiment`/`topic`/`dnl_relevance` llegan en null hasta que se active la
 * clasificación con Claude (app/ai.py en el servicio de scraping) — el
 * frontend debe tratarlos como opcionales, no asumir que siempre hay valor.
 */
export async function getRealNews(limit = 60): Promise<CoyunturaNews[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  // Se trae un pool más grande que `limit` (en vez de pedir directo los N
  // más recientes) porque fuentes de alto volumen (Infobae, Las2Orillas)
  // pueden publicar decenas de notas por hora y desplazan por completo a
  // fuentes de menor frecuencia (El Espectador, Blu Radio, Caracol/YouTube)
  // fuera de una ventana simple de "los N más recientes" — con eso, esas
  // fuentes nunca aparecían en el panel aunque sí tuvieran nota del día.
  const poolSize = Math.max(limit * 8, 400);
  const { data, error } = await supabase
    .from("coyuntura_news")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(poolSize);

  if (error || !data) return [];
  return balanceBySource(data as CoyunturaNews[], limit);
}

/**
 * Reparte `limit` noticias en round-robin por `source_name` (una por fuente
 * por ronda, en orden de recencia dentro de cada fuente) para que ninguna
 * fuente de bajo volumen quede invisible frente a una de alto volumen.
 * El resultado final se reordena por fecha para que la vista siga siendo
 * cronológica.
 */
function balanceBySource(items: CoyunturaNews[], limit: number): CoyunturaNews[] {
  const bySource = new Map<string, CoyunturaNews[]>();
  for (const item of items) {
    const list = bySource.get(item.source_name);
    if (list) list.push(item);
    else bySource.set(item.source_name, [item]);
  }

  const sourceLists = Array.from(bySource.values());
  const picked: CoyunturaNews[] = [];
  let round = 0;
  while (picked.length < limit && sourceLists.some((list) => round < list.length)) {
    for (const list of sourceLists) {
      if (picked.length >= limit) break;
      if (round < list.length) picked.push(list[round]);
    }
    round += 1;
  }

  return picked.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export function realNewsBySource(news: CoyunturaNews[]) {
  const counts = new Map<string, number>();
  for (const n of news) {
    counts.set(n.source_name, (counts.get(n.source_name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([topic, menciones]) => ({ topic, menciones }))
    .sort((a, b) => b.menciones - a.menciones);
}
