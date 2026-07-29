import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { CoyunturaNews } from "@/lib/types";

/**
 * Noticias reales scrapeadas de RSS en vivo (public.coyuntura_news).
 * `sentiment`/`topic`/`dnl_relevance` llegan en null hasta que se active la
 * clasificación con Claude (app/ai.py en el servicio de scraping) — el
 * frontend debe tratarlos como opcionales, no asumir que siempre hay valor.
 */
export async function getRealNews(limit = 50): Promise<CoyunturaNews[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coyuntura_news")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as CoyunturaNews[];
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
