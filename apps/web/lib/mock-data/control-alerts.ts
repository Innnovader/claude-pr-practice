import type { ControlAlert } from "@/lib/types";

/**
 * Alertas de entes de control y centros de pensamiento — datos ficticios
 * de marcador de posición. No representan investigaciones, fallos ni
 * publicaciones reales de la Procuraduría, Contraloría, Fiscalía,
 * Defensoría, IPL, Fedesarrollo, Dejusticia, ANIF o Banco de la República.
 */

const CONTROL_ENTITIES: { name: string; category: ControlAlert["source_category"] }[] = [
  { name: "Procuraduría General de la Nación", category: "ente_control" },
  { name: "Contraloría General de la República", category: "ente_control" },
  { name: "Fiscalía General de la Nación", category: "ente_control" },
  { name: "Defensoría del Pueblo", category: "ente_control" },
  { name: "Instituto de Pensamiento Liberal (IPL)", category: "centro_pensamiento" },
  { name: "Fedesarrollo", category: "centro_pensamiento" },
  { name: "Dejusticia", category: "centro_pensamiento" },
  { name: "ANIF", category: "centro_pensamiento" },
  { name: "Banco de la República", category: "centro_pensamiento" },
];

const ALERT_TYPES_BY_CATEGORY: Record<ControlAlert["source_category"], string[]> = {
  ente_control: ["investigacion", "fallo", "alerta_contratacion"],
  centro_pensamiento: ["informe_macro", "analisis"],
};

// Una alerta de ejemplo por institución (no varias por la misma) para que
// el listado no parezca tener instituciones "duplicadas" — en producción sí
// habrá varias alertas reales por institución a lo largo del tiempo, pero
// como marcador de posición genérico eso solo generaba confusión visual.
export const mockControlAlerts: ControlAlert[] = CONTROL_ENTITIES.map((entity, i) => {
  const types = ALERT_TYPES_BY_CATEGORY[entity.category];
  return {
    id: `alert-mock-${i + 1}`,
    source_entity: entity.name,
    source_category: entity.category,
    title: `Comunicado de ejemplo de ${entity.name}`,
    summary:
      "Resumen ilustrativo para desarrollo — el resumen y la clasificación de impacto reales se generan con Claude a partir del comunicado scrapeado.",
    alert_type: types[i % types.length],
    impact_level: (["alto", "medio", "bajo"] as const)[i % 3],
    source_url: "https://example.gov.co/",
    published_at: new Date(Date.now() - i * 5400_000).toISOString(),
  };
});
