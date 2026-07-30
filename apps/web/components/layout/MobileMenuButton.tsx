"use client";

import { Menu } from "lucide-react";
import { useMobileNav } from "@/components/layout/MobileNavContext";

export function MobileMenuButton() {
  const { setOpen } = useMobileNav();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
      aria-label="Abrir menú de navegación"
    >
      <Menu size={20} />
    </button>
  );
}
