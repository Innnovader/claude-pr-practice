import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { ControlAlert } from "@/lib/types";

/**
 * Alertas reales scrapeadas de centros de pensamiento (public.control_alerts).
 * `impact_level` llega como "medio" por defecto (ver services/scraper/app/
 * sources/think_tanks.py) hasta que se active la clasificación con Claude —
 * NO es una evaluación real de impacto todavía.
 */
export async function getRealControlAlerts(limit = 50): Promise<ControlAlert[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("control_alerts")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as ControlAlert[];
}
