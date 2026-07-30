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
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMobileNav } from "@/components/layout/MobileNavContext";

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

function BrandHeader() {
  return (
    <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm shadow-[0_4px_12px_-2px_rgba(211,47,47,0.5)]"
        style={{ backgroundImage: "var(--gradient-accent)" }}
      >
        DNL
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">Radar Liberal</p>
        <p className="text-[11px] text-slate-500">Dirección Nacional Liberal</p>
      </div>
    </div>
  );
}

function NavLinks({ pathname, mounted, onNavigate }: { pathname: string; mounted: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-0.5 p-2">
      {NAV_ITEMS.map((item) => {
        const active = mounted && pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
              active
                ? "text-white shadow-[0_4px_14px_-4px_rgba(211,47,47,0.5)]"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
            style={active ? { backgroundImage: "var(--gradient-accent)" } : undefined}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PeriodFooter() {
  return (
    <div className="p-3 border-t text-[11px] text-slate-500 flex items-center gap-1.5" style={{ borderColor: "var(--border)" }}>
      <ScrollText size={13} />
      Periodo legislativo 2026–2030
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  // Evita un hydration mismatch: en el primer render del cliente, antes de
  // montar, se ignora `active` para que coincida exactamente con lo que
  // renderizó el servidor (que no puede saber con certeza el pathname del
  // cliente en rutas dinámicas). Después de montar, ya se resalta normal.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { open, setOpen } = useMobileNav();
  // Cierra el drawer móvil automáticamente al navegar a otra página.
  useEffect(() => setOpen(false), [pathname, setOpen]);

  return (
    <>
      {/* Desktop: sidebar fija, sin cambios de comportamiento */}
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col border-r"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <BrandHeader />
        <NavLinks pathname={pathname} mounted={mounted} />
        <PeriodFooter />
      </aside>

      {/* Móvil: drawer deslizable, oculto hasta que se abre desde el botón de hamburguesa del Header */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside
            className="relative flex w-72 max-w-[85vw] flex-col border-r shadow-xl"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between border-b" style={{ borderColor: "var(--border)" }}>
              <BrandHeader />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="mr-3 flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks pathname={pathname} mounted={mounted} onNavigate={() => setOpen(false)} />
            <PeriodFooter />
          </aside>
        </div>
      )}
    </>
  );
}
