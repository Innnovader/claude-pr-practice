"use client";

import { cn } from "@/lib/utils";
import { Send, Sparkles, UserRound, Loader2 } from "lucide-react";
import { useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Resume las noticias de hoy sobre Seguridad",
  "¿Qué congresistas liberales hay en Antioquia?",
  "Ayúdame a redactar un comunicado sobre la reforma pensional",
];

export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error desconocido.");
        return;
      }
      setMessages([...next, { role: "assistant", content: data.reply }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setError("No se pudo conectar con el chat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-dnl-red)]/10 text-[var(--color-dnl-red)]">
              <Sparkles size={22} />
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              Pregúntame sobre las noticias del Archivo, la Bancada Liberal, o pídeme ayuda redactando un texto.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border px-3 py-1.5 text-xs text-slate-500 hover:text-[var(--color-dnl-red)] hover:border-[var(--color-dnl-red)] transition-colors"
                  style={{ borderColor: "var(--border)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                m.role === "user"
                  ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  : "bg-[var(--color-dnl-red)]/10 text-[var(--color-dnl-red)]"
              )}
            >
              {m.role === "user" ? <UserRound size={14} /> : <Sparkles size={14} />}
            </div>
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm",
                m.role === "user" ? "bg-[var(--color-dnl-red)] text-white" : "border"
              )}
              style={m.role === "assistant" ? { borderColor: "var(--border)", background: "var(--surface)" } : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-9">
            <Loader2 size={13} className="animate-spin" />
            Buscando y pensando…
          </div>
        )}

        {error && <p className="text-xs text-rose-600 dark:text-rose-400 pl-9">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t pt-3"
        style={{ borderColor: "var(--border)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={loading}
          className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--color-dnl-red)] disabled:opacity-60"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-dnl-red)] text-white disabled:opacity-50"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
