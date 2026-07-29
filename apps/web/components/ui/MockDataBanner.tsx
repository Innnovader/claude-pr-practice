import { AlertTriangle } from "lucide-react";

export function MockDataBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
      <AlertTriangle size={14} className="shrink-0" />
      Datos de ejemplo (mock) para desarrollo — no representan hechos, personas o instituciones reales verificadas. Conectar el pipeline de scraping y Supabase antes de producción.
    </div>
  );
}
