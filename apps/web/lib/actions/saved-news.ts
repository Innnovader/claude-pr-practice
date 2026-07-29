"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SaveActionState {
  error: string | null;
}

/** Guarda una noticia en una carpeta (por defecto "Favoritos"). Si ya estaba
 * guardada, actualiza su carpeta en vez de duplicar (unique user_id+news_id). */
export async function saveNews(newsId: string, folder = "Favoritos"): Promise<SaveActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión para guardar noticias." };

  const { error } = await supabase
    .from("saved_news")
    .upsert({ user_id: user.id, news_id: newsId, folder }, { onConflict: "user_id,news_id" });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/guardados");
  return { error: null };
}

export async function unsaveNews(newsId: string): Promise<SaveActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("saved_news")
    .delete()
    .eq("user_id", user.id)
    .eq("news_id", newsId);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/guardados");
  return { error: null };
}

export async function moveSavedNews(savedNewsId: string, folder: string): Promise<SaveActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("saved_news")
    .update({ folder })
    .eq("id", savedNewsId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/guardados");
  return { error: null };
}
