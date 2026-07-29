import type { TerritorialPower } from "@/lib/types";

/**
 * Poder territorial — datos ficticios de marcador de posición.
 * Reemplazar con el conteo verificado de gobernaciones/alcaldías/concejales/
 * diputados liberales o en coalición tras los comicios regionales.
 */

const DEPARTMENTS_WITH_COORDS: { department: string; lat: number; lng: number }[] = [
  { department: "Antioquia", lat: 6.55, lng: -75.83 },
  { department: "Atlántico", lat: 10.68, lng: -74.96 },
  { department: "Bogotá D.C.", lat: 4.71, lng: -74.07 },
  { department: "Bolívar", lat: 9.0, lng: -74.5 },
  { department: "Boyacá", lat: 5.63, lng: -73.36 },
  { department: "Cauca", lat: 2.7, lng: -76.83 },
  { department: "Cesar", lat: 9.74, lng: -73.63 },
  { department: "Córdoba", lat: 8.28, lng: -75.75 },
  { department: "Cundinamarca", lat: 5.03, lng: -74.03 },
  { department: "Huila", lat: 2.55, lng: -75.53 },
  { department: "Magdalena", lat: 10.41, lng: -74.4 },
  { department: "Meta", lat: 3.5, lng: -73.5 },
  { department: "Nariño", lat: 1.28, lng: -77.35 },
  { department: "Norte de Santander", lat: 7.94, lng: -72.9 },
  { department: "Risaralda", lat: 5.31, lng: -75.99 },
  { department: "Santander", lat: 7.13, lng: -73.13 },
  { department: "Tolima", lat: 4.44, lng: -75.24 },
  { department: "Valle del Cauca", lat: 3.8, lng: -76.65 },
  { department: "La Guajira", lat: 11.35, lng: -72.52 },
  { department: "Caldas", lat: 5.3, lng: -75.5 },
];

export const departmentCoords: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  DEPARTMENTS_WITH_COORDS.map((d) => [d.department, { lat: d.lat, lng: d.lng }])
);

export const mockTerritorialPower: TerritorialPower[] = DEPARTMENTS_WITH_COORDS.flatMap((d, i) => {
  const rows: TerritorialPower[] = [];
  if (i % 3 === 0) {
    rows.push({
      id: `gob-mock-${i}`,
      office: "gobernacion",
      department: d.department,
      municipality: null,
      official_name: `Gobernador(a) de Ejemplo ${i + 1}`,
      is_coalition: i % 6 === 0,
      coalition_partners: i % 6 === 0 ? ["Partido de Ejemplo X"] : null,
      contact_email: `gobernacion.ejemplo${i + 1}@example.gov.co`,
      management_notes: "Gestión de ejemplo — pendiente de verificación con fuente oficial.",
      is_mock_data: true,
    });
  }
  const alcaldias = 1 + (i % 3);
  for (let j = 0; j < alcaldias; j++) {
    rows.push({
      id: `alc-mock-${i}-${j}`,
      office: "alcaldia",
      department: d.department,
      municipality: `Municipio de Ejemplo ${i}-${j + 1}`,
      official_name: `Alcalde(sa) de Ejemplo ${i}-${j + 1}`,
      is_coalition: (i + j) % 4 === 0,
      coalition_partners: (i + j) % 4 === 0 ? ["Partido de Ejemplo Y"] : null,
      contact_email: null,
      management_notes: null,
      is_mock_data: true,
    });
  }
  const concejales = 2 + (i % 4);
  for (let j = 0; j < concejales; j++) {
    rows.push({
      id: `concejal-mock-${i}-${j}`,
      office: "concejal",
      department: d.department,
      municipality: `Municipio de Ejemplo ${i}-${(j % alcaldias) + 1}`,
      official_name: `Concejal(a) de Ejemplo ${i}-${j + 1}`,
      is_coalition: false,
      coalition_partners: null,
      contact_email: null,
      management_notes: null,
      is_mock_data: true,
    });
  }
  const diputados = 1 + (i % 3);
  for (let j = 0; j < diputados; j++) {
    rows.push({
      id: `diputado-mock-${i}-${j}`,
      office: "diputado",
      department: d.department,
      municipality: null,
      official_name: `Diputado(a) de Ejemplo ${i}-${j + 1}`,
      is_coalition: false,
      coalition_partners: null,
      contact_email: null,
      management_notes: null,
      is_mock_data: true,
    });
  }
  return rows;
});

export function territorialSummaryByDepartment() {
  const byDept = new Map<string, { gobernacion: number; alcaldia: number; concejal: number; diputado: number }>();
  for (const row of mockTerritorialPower) {
    if (!byDept.has(row.department)) {
      byDept.set(row.department, { gobernacion: 0, alcaldia: 0, concejal: 0, diputado: 0 });
    }
    byDept.get(row.department)![row.office] += 1;
  }
  return Array.from(byDept.entries()).map(([department, counts]) => ({
    department,
    ...counts,
    total: counts.gobernacion + counts.alcaldia + counts.concejal + counts.diputado,
    coords: departmentCoords[department],
  }));
}
