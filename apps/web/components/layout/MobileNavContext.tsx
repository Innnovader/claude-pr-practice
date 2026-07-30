"use client";

import { createContext, useContext, useState } from "react";

type MobileNavState = { open: boolean; setOpen: (open: boolean) => void };

const MobileNavContext = createContext<MobileNavState | null>(null);

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav(): MobileNavState {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav debe usarse dentro de MobileNavProvider");
  return ctx;
}
