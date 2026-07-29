import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Client Components. Usa la clave anon pública —
 * segura de exponer en el navegador porque el acceso real lo controla RLS
 * (ver supabase/migrations/0001_init_schema.sql).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
