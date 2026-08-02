import { Header } from "@/components/layout/Header";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { SemanticSearch } from "@/components/buscador/SemanticSearch";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BuscadorPage() {
  const configured = isSupabaseConfigured();

  return (
    <div>
      <Header title="Buscador Inteligente y Archivo Documental" subtitle="Búsqueda por palabra clave sobre proyectos de ley, noticias y alertas" />
      <div className="p-4 md:p-6 space-y-4 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-dnl-red)] transition-colors"
        >
          <ArrowLeft size={15} />
          Volver a Coyuntura Nacional
        </Link>
        {configured ? (
          <VerifiedDataBanner>
            Busca en tu contenido real (Archivo, Bancada, Entes de Control). Es búsqueda por palabra clave, no
            semántica de verdad todavía — eso requiere un proveedor de embeddings además de Supabase.
          </VerifiedDataBanner>
        ) : (
          <MockDataBanner />
        )}
        <SemanticSearch />
      </div>
    </div>
  );
}
