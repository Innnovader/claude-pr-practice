import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { CoyunturaNews } from "@/lib/types";

export interface SavedNewsItem {
  saved_id: string;
  folder: string;
  saved_at: string;
  news: CoyunturaNews;
}

/** Noticias guardadas por el usuario autenticado actual, con el contenido
 * de la noticia incluido (join). Vacío si no hay sesión o Supabase no está
 * configurado. */
export async function getSavedNews(): Promise<SavedNewsItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_news")
    .select("id, folder, created_at, coyuntura_news(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .filter((row) => row.coyuntura_news)
    .map((row) => ({
      saved_id: row.id,
      folder: row.folder,
      saved_at: row.created_at,
      news: row.coyuntura_news as unknown as CoyunturaNews,
    }));
}

/** Set de news_id guardados por el usuario actual — para marcar el botón de
 * guardar como activo en el Live Feed sin traer el contenido completo. */
export async function getSavedNewsIds(): Promise<Set<string>> {
  if (!isSupabaseConfigured()) return new Set();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase.from("saved_news").select("news_id").eq("user_id", user.id);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.news_id));
}
