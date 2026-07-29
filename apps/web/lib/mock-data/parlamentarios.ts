import type { Bill, Parliamentarian, ParliamentarianStatement } from "@/lib/types";

/**
 * DATOS FICTICIOS DE MARCADOR DE POSICIÓN (placeholder).
 *
 * Ninguno de estos nombres corresponde a personas reales. Se generaron
 * únicamente para poblar la UI durante desarrollo. ANTES de usar esta
 * plataforma en producción, reemplazar por el registro verificado de la
 * bancada liberal 2026-2030 desde fuentes oficiales (Congreso Visible,
 * Registraduría Nacional, reporte oficial de la DNL). `is_mock_data: true`
 * marca cada fila para que la UI pueda mostrar la advertencia visible.
 */

const COMMISSIONS = [
  "Comisión Primera",
  "Comisión Segunda",
  "Comisión Tercera",
  "Comisión Cuarta",
  "Comisión Quinta",
  "Comisión Sexta",
  "Comisión Séptima",
  "Comisión Legal",
];

export const mockSenators: Parliamentarian[] = Array.from({ length: 13 }, (_, i) => ({
  id: `senador-mock-${i + 1}`,
  full_name: `Senador(a) de Ejemplo ${i + 1}`,
  chamber: "senado",
  department: null,
  commission: COMMISSIONS[i % COMMISSIONS.length],
  photo_url: null,
  bio: "Perfil de marcador de posición — reemplazar con datos verificados oficiales.",
  is_dnl_aligned: true,
  alignment_index: 60 + ((i * 7) % 40),
  social_x_handle: `@senador_ejemplo${i + 1}`,
  social_instagram_handle: `senador.ejemplo${i + 1}`,
  contact_email: `senador.ejemplo${i + 1}@congreso.example.co`,
  is_mock_data: true,
}));

// 30 circunscripciones de ejemplo (illustrative — el conteo real verificado
// de curules de Cámara del Partido Liberal es 24, según la tabla de
// resultados de Wikipedia; ver nota en README sobre la discrepancia con
// otras fuentes de prensa que reportaron 21/22/31 en distintos momentos).
const DEPARTMENTS = [
  "Antioquia", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas",
  "Cauca", "Cesar", "Córdoba", "Cundinamarca", "Huila", "Magdalena",
  "Meta", "Nariño", "Norte de Santander", "Risaralda", "Santander",
  "Tolima", "Valle del Cauca", "La Guajira", "Sucre", "Quindío", "Chocó",
  "Arauca", "Casanare", "Putumayo", "Caquetá", "San Andrés y Providencia",
  "Amazonas", "Guaviare",
];

export const mockRepresentatives: Parliamentarian[] = DEPARTMENTS.map((dept, i) => ({
  id: `representante-mock-${i + 1}`,
  full_name: `Representante de Ejemplo ${i + 1}`,
  chamber: "camara",
  department: dept,
  commission: COMMISSIONS[i % COMMISSIONS.length],
  photo_url: null,
  bio: "Perfil de marcador de posición — reemplazar con datos verificados oficiales.",
  is_dnl_aligned: true,
  alignment_index: 55 + ((i * 5) % 45),
  social_x_handle: `@rep_ejemplo${i + 1}`,
  social_instagram_handle: `rep.ejemplo${i + 1}`,
  contact_email: `representante.ejemplo${i + 1}@congreso.example.co`,
  is_mock_data: true,
}));

export const mockParliamentarians: Parliamentarian[] = [...mockSenators, ...mockRepresentatives];

const TOPICS = ["Reforma tributaria", "Reforma laboral", "Orden público", "Presupuesto nacional", "Reforma a la salud"];
const STATUSES: Bill["status"][] = ["radicado", "primer_debate", "segundo_debate", "tercer_debate", "conciliacion"];

export const mockBills: Bill[] = Array.from({ length: 18 }, (_, i) => {
  const author = mockParliamentarians[i % mockParliamentarians.length];
  return {
    id: `bill-mock-${i + 1}`,
    bill_number: `PL ${String(20 + i).padStart(3, "0")}/2026 ${author.chamber === "senado" ? "Senado" : "Cámara"}`,
    title: `Proyecto de ley de ejemplo sobre ${TOPICS[i % TOPICS.length].toLowerCase()}`,
    summary: "Resumen ejecutivo de marcador de posición (a generar por IA a partir del texto radicado real).",
    author_parliamentarian_id: author.id,
    rapporteur: `Representante de Ejemplo ${((i + 3) % DEPARTMENTS.length) + 1}`,
    status: STATUSES[i % STATUSES.length],
    chamber_origin: author.chamber,
    dnl_relevance: (["alto", "medio", "bajo"] as const)[i % 3],
    topic: TOPICS[i % TOPICS.length],
    source_url: "https://www.congreso.gov.co/",
    filed_at: new Date(2026, 6, 20 + (i % 10)).toISOString(),
    last_action_at: new Date(2026, 6, 21 + (i % 10)).toISOString(),
  };
});

export const mockStatements: ParliamentarianStatement[] = Array.from({ length: 10 }, (_, i) => {
  const author = mockParliamentarians[i % mockParliamentarians.length];
  const critical = i % 4 === 0;
  return {
    id: `statement-mock-${i + 1}`,
    parliamentarian_id: author.id,
    channel: (["x", "medios", "boletin", "congreso"] as const)[i % 4],
    content: critical
      ? "Declaración de ejemplo con tono crítico hacia una decisión reciente del gobierno."
      : "Declaración de ejemplo sobre la agenda legislativa de la semana.",
    is_critical: critical,
    sentiment: critical ? "negativo" : (["neutro", "positivo"] as const)[i % 2],
    source_url: "https://x.com/",
    published_at: new Date(Date.now() - i * 3600_000).toISOString(),
  };
});
