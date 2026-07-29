import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { Parliamentarian } from "@/lib/types";

/**
 * Congresistas REALES y verificados guardados en Supabase
 * (is_mock_data = false). Retorna [] si Supabase no está configurado, si
 * hay un error, o si todavía no se ha poblado la tabla — el llamador decide
 * si eso significa "mostrar los datos mock en su lugar".
 */
export async function getRealParliamentarians(): Promise<Parliamentarian[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parliamentarians")
    .select("*")
    .eq("is_mock_data", false)
    .order("chamber")
    .order("department", { nullsFirst: true })
    .order("full_name");

  if (error || !data) return [];
  return data as Parliamentarian[];
}

export async function getRealParliamentarianById(id: string): Promise<Parliamentarian | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parliamentarians")
    .select("*")
    .eq("id", id)
    .eq("is_mock_data", false)
    .maybeSingle();

  if (error || !data) return null;
  return data as Parliamentarian;
}
