/**
 * Registro OFICIAL verificado — Senadores del Partido Liberal Colombiano,
 * periodo 2026-2030.
 *
 * A diferencia de todo lo demás en lib/mock-data/, esta lista contiene
 * personas reales. Por eso NO lleva bio, alignment_index, declaraciones ni
 * ningún otro campo analítico fabricado — solo el hecho verificado (nombre
 * + curul) con su cita. Adjuntar datos inventados (puntajes de alineación,
 * declaraciones falsas, votos ficticios) a una persona real e identificable
 * sería desinformación, no un simple "placeholder".
 *
 * Verificación: cruzado el 2026-07-23 contra 3 fuentes de prensa
 * independientes que reportaron listas idénticas (ver `sources`). El CNE es
 * la autoridad electoral; estas notas de prensa citan sus resultados.
 * Advertencia de una de las fuentes: la lista está "sujeta a alguna pequeña
 * variación por cuota repartidora" (mecanismo de asignación de curules).
 *
 * La Cámara de Representantes (24 curules liberales) NO está incluida aquí:
 * no se pudo verificar la lista completa nombre-por-nombre con la misma
 * confianza cruzada — requiere completarse desde la fuente oficial:
 * https://www.camara.gov.co/representantes-a-la-camara-elegidos-para-el-periodo-legislativo-2026-2030/
 */

export interface VerifiedSenator {
  fullName: string;
}

export const VERIFIED_LIBERAL_SENATORS_2026_2030: VerifiedSenator[] = [
  { fullName: "Lidio Arturo García Turbay" },
  { fullName: "Yessid Enrique Pulgar Daza" },
  { fullName: "María Eugenia Lopera Monsalve" },
  { fullName: "Alix Yirley Vargas Torrado" },
  { fullName: "Gersson Vargas Valdeleón" },
  { fullName: "Camilo Andrés Torres Villalba" },
  { fullName: "Leonardo de Jesús Gallego Arroyave" },
  { fullName: "Óscar Hernán Sánchez León" },
  { fullName: "Héctor Olimpo Espinosa Oliver" },
  { fullName: "Fabio Raúl Amín Saleme" },
  { fullName: "Santiago Montoya Montoya" },
  { fullName: "Álvaro Henry Monedero Rivera" },
  { fullName: "Laura Ester Fortich Sánchez" },
];

export const VERIFIED_SENATE_SOURCES = [
  { name: "La FM", url: "https://www.lafm.com.co/politica/consejo-nacional-electoral-lista-103-senadores-2026-2030-404943" },
  { name: "El Nuevo Siglo", url: "https://www.elnuevosiglo.com.co/politica/lista-de-senadores-elegidos-2026" },
  { name: "Valora Analitik", url: "https://www.valoraanalitik.com/lista-senadores-elegidos-congreso-colombia-2026-2030/" },
];

export const VERIFIED_SENATE_RETRIEVED_AT = "2026-07-23";
