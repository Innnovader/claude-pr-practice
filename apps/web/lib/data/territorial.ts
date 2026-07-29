import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { TerritorialPower } from "@/lib/types";

/**
 * Gobernaciones/alcaldías/concejales/diputados REALES y verificados
 * (is_mock_data = false). Hoy solo cubre los 3 gobernadores liberales
 * confirmados (Atlántico, Chocó, Risaralda) — alcaldías/concejales/
 * diputados siguen sin poblar (son miles de registros, requieren fuente
 * masiva verificada, no investigación uno-por-uno).
 */
export async function getRealTerritorialPower(): Promise<TerritorialPower[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("territorial_power")
    .select("*")
    .eq("is_mock_data", false)
    .order("department");

  if (error || !data) return [];
  return data as TerritorialPower[];
}
