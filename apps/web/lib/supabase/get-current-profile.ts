import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export interface CurrentProfile {
  email: string;
  role: "super_admin" | "analyst" | "reader";
}

/**
 * Perfil del usuario autenticado, para Server Components. Retorna null si
 * Supabase no está configurado o no hay sesión — el llamador decide si eso
 * significa "modo desarrollo sin auth" o "mostrar botón de login".
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    email: user.email ?? "",
    role: profile?.role ?? "reader",
  };
}
