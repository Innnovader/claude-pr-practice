import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { CoyunturaNews } from "@/lib/types";

/**
 * Archivo automático: todas las noticias reales agrupadas por tema
 * (public.coyuntura_news.topic, asignado por reglas — ver services/
 * scraper/app/topic_classifier.py). A diferencia de "Favoritos"
 * (saved_news), esto NO es por usuario — es el archivo compartido de todo
 * el equipo de la DNL, poblado automáticamente por el scraper.
 */
export async function getArchivoByTopic(): Promise<Map<string, CoyunturaNews[]>> {
  const byTopic = new Map<string, CoyunturaNews[]>();
  if (!isSupabaseConfigured()) return byTopic;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coyuntura_news")
    .select("*")
    .not("topic", "is", null)
    .order("published_at", { ascending: false })
    .limit(500);

  if (error || !data) return byTopic;

  for (const news of data as CoyunturaNews[]) {
    const topic = news.topic ?? "Otros";
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic)!.push(news);
  }
  return byTopic;
}

export async function getNewsByTopic(topic: string): Promise<CoyunturaNews[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coyuntura_news")
    .select("*")
    .eq("topic", topic)
    .order("published_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];
  return data as CoyunturaNews[];
}

// Orden de despliegue: los temas de interés explícito de la DNL primero,
// "Otros" al final. Cualquier tema nuevo que aparezca (agregado en
// topic_classifier.py) se muestra igual, solo que después de estos.
export const TOPIC_DISPLAY_ORDER = [
  "Gobierno ADLE",
  "Economia",
  "Salud",
  "Pensiones",
  "Seguridad",
  "Medio ambiente",
  "Justicia",
  "Congreso",
];
