"use client";

import { cn } from "@/lib/utils";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { SemanticSearch } from "@/components/buscador/SemanticSearch";
import { MessageCircle, Search, Sparkles, X } from "lucide-react";
import { useState } from "react";

type Tab = "chat" | "buscar";

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <>
      {open && (
        <div
          className="glass-card animate-fade-in-up fixed bottom-20 right-4 z-40 flex h-[70vh] max-h-[600px] w-[92vw] max-w-sm flex-col rounded-2xl border overflow-hidden sm:right-6"
          style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-card-hover)" }}
        >
          <div className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: "var(--border)" }}>
            <div className="flex gap-1">
              <button
                onClick={() => setTab("chat")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  tab === "chat" ? "text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                style={tab === "chat" ? { backgroundImage: "var(--gradient-accent)" } : undefined}
              >
                <MessageCircle size={13} /> Asistente
              </button>
              <button
                onClick={() => setTab("buscar")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  tab === "buscar" ? "text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                style={tab === "buscar" ? { backgroundImage: "var(--gradient-accent)" } : undefined}
              >
                <Search size={13} /> Buscar
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={15} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
            {tab === "chat" ? <ChatWidget /> : <SemanticSearch />}
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-40 sm:right-6">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
          className="shine-sweep flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_-6px_rgba(211,47,47,0.6)] transition-transform hover:scale-105"
          style={{ backgroundImage: "var(--gradient-accent)" }}
        >
          {open ? <X size={22} /> : <Sparkles size={22} />}
        </button>
      </div>
    </>
  );
}
