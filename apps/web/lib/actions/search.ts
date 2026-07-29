"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export interface SearchResult {
  id: string;
  kind: "proyecto_ley" | "noticia" | "alerta_control";
  title: string;
  snippet: string;
  url: string;
  date: string;
}

/**
 * Búsqueda por palabra clave (ILIKE) sobre los datos REALES de Supabase —
 * no es búsqueda semántica/vectorial de verdad (eso necesita un proveedor
 * de embeddings, ver services/scraper/app/ai.py::embed_text). Es un paso
 * intermedio honesto: ya busca en contenido real, no en datos de ejemplo.
 */
export async function searchReal(query: string): Promise<SearchResult[] | null> {
  if (!isSupabaseConfigured() || !query.trim()) return null;

  const supabase = await createClient();
  const term = `%${query.trim()}%`;

  const [bills, news, alerts] = await Promise.all([
    supabase
      .from("bills_tracker")
      .select("id, title, summary, source_url, filed_at")
      .or(`title.ilike.${term},summary.ilike.${term}`)
      .limit(10),
    supabase
      .from("coyuntura_news")
      .select("id, headline, summary, source_url, published_at")
      .or(`headline.ilike.${term},summary.ilike.${term}`)
      .order("published_at", { ascending: false })
      .limit(10),
    supabase
      .from("control_alerts")
      .select("id, title, summary, source_url, published_at, source_entity")
      .or(`title.ilike.${term},summary.ilike.${term},source_entity.ilike.${term}`)
      .order("published_at", { ascending: false })
      .limit(10),
  ]);

  const results: SearchResult[] = [
    ...(bills.data ?? []).map((b) => ({
      id: b.id,
      kind: "proyecto_ley" as const,
      title: b.title,
      snippet: b.summary ?? "",
      url: b.source_url,
      date: b.filed_at,
    })),
    ...(news.data ?? []).map((n) => ({
      id: n.id,
      kind: "noticia" as const,
      title: n.headline,
      snippet: n.summary ?? "",
      url: n.source_url,
      date: n.published_at,
    })),
    ...(alerts.data ?? []).map((a) => ({
      id: a.id,
      kind: "alerta_control" as const,
      title: a.title,
      snippet: a.summary ?? "",
      url: a.source_url,
      date: a.published_at,
    })),
  ];

  return results;
}
