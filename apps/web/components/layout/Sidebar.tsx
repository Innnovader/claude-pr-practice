"use client";

import { cn } from "@/lib/utils";
import {
  Radar,
  Users,
  ShieldAlert,
  Map,
  Search,
  ScrollText,
  Bookmark,
  Archive,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Coyuntura Nacional", icon: Radar },
  { href: "/parlamentarios", label: "Bancada Liberal", icon: Users },
  { href: "/entes-control", label: "Entes de Control", icon: ShieldAlert },
  { href: "/mapa", label: "Mapa Territorial", icon: Map },
  { href: "/archivo", label: "Archivo", icon: Archive },
  { href: "/buscador", label: "Buscador RAG", icon: Search },
  { href: "/guardados", label: "Favoritos", icon: Bookmark },
  { href: "/chat", label: "Asistente IA", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();
  // Evita un hydration mismatch: en el primer render del cliente, antes de
  // montar, se ignora `active` para que coincida exactamente con lo que
  // renderizó el servidor (que no puede saber con certeza el pathname del
  // cliente en rutas dinámicas). Después de montar, ya se resalta normal.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <aside
      className="hidden md:flex w-60 shrink-0 flex-col border-r"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-dnl-red)] text-white font-bold text-sm">
          DNL
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Radar Liberal</p>
          <p className="text-[11px] text-slate-500">Dirección Nacional Liberal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const active = mounted && pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-dnl-red)] text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t text-[11px] text-slate-500 flex items-center gap-1.5" style={{ borderColor: "var(--border)" }}>
        <ScrollText size={13} />
        Periodo legislativo 2026–2030
      </div>
    </aside>
  );
}
