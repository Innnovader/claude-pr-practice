import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components / Route Handlers. Lee/escribe
 * cookies de sesión de Supabase Auth para mantener el usuario autenticado
 * entre requests. Sigue usando la clave anon — RLS decide qué puede ver
 * cada rol (super_admin / analyst / reader).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // set() llamado desde un Server Component sin middleware de
            // refresco de sesión — se puede ignorar si hay middleware.ts
            // renovando la sesión en cada request.
          }
        },
      },
    }
  );
}
