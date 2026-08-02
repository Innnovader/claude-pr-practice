import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { isAnthropicConfigured } from "@/lib/is-anthropic-configured";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { AlertTriangle, ArrowLeft, Sparkles } from "lucide-react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import Link from "next/link";

export default function ChatPage() {
  const ready = isAnthropicConfigured() && isSupabaseConfigured();

  return (
    <div className="flex h-screen flex-col">
      <Header title="Asistente Radar Liberal" subtitle="Chat con IA sobre tus datos reales — noticias, congresistas y alertas" />
      <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col">
        <Link
          href="/"
          className="mb-3 inline-flex shrink-0 items-center gap-1.5 text-sm text-slate-500 hover:text-[var(--color-dnl-red)] transition-colors"
        >
          <ArrowLeft size={15} />
          Volver a Coyuntura Nacional
        </Link>
        <div className="flex-1 overflow-hidden">
        {ready ? (
          <ChatWidget />
        ) : (
          <Card className="mx-auto mt-8 max-w-md p-6">
            <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium mb-1">El chat con IA no está activado todavía</p>
                <p className="text-slate-500">
                  Falta configurar <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ANTHROPIC_API_KEY</code> en
                  el servidor (apps/web/.env.local). El resto de la plataforma sigue funcionando normal — esto es
                  opcional y tiene un costo de uso aparte.
                </p>
              </div>
            </div>
          </Card>
        )}
        </div>
      </div>
      {ready && (
        <div className="border-t px-4 py-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1" style={{ borderColor: "var(--border)" }}>
          <Sparkles size={11} />
          Responde usando tu Archivo y Bancada real — puede cometer errores, verifica antes de publicar.
        </div>
      )}
    </div>
  );
}
