import type { CoyunturaNews, XTweet } from "@/lib/types";

/**
 * Datos mock de coyuntura y radar de X. Titulares y contenidos son
 * genéricos/ilustrativos — no citan medios reales de forma textual ni
 * atribuyen declaraciones a personas reales. Reemplazar con el pipeline de
 * scraping real (services/scraper) antes de producción.
 */

const TOPICS = ["Reforma tributaria", "Economía", "Orden público", "Elecciones regionales", "Presupuesto nacional"];
const SOURCES = ["Medio de Ejemplo A", "Medio de Ejemplo B", "Medio de Ejemplo C", "Agencia de Ejemplo"];
const SENTIMENTS: CoyunturaNews["sentiment"][] = ["positivo", "neutro", "negativo"];

export const mockNews: CoyunturaNews[] = Array.from({ length: 24 }, (_, i) => ({
  id: `news-mock-${i + 1}`,
  headline: `Titular de ejemplo ${i + 1}: avance en el debate sobre ${TOPICS[i % TOPICS.length].toLowerCase()}`,
  summary:
    "Resumen ejecutivo de marcador de posición generado para desarrollo — el resumen real se produce con Claude a partir del cuerpo de la noticia scrapeada.",
  source_name: SOURCES[i % SOURCES.length],
  source_url: "https://example.com/noticia",
  topic: TOPICS[i % TOPICS.length],
  sentiment: SENTIMENTS[i % SENTIMENTS.length],
  entities: [
    { name: "Congreso de la República", type: "organizacion" },
    { name: "Bogotá", type: "lugar" },
  ],
  dnl_relevance: (["alto", "medio", "bajo"] as const)[i % 3],
  published_at: new Date(Date.now() - i * 1800_000).toISOString(),
}));

const CATEGORIES: XTweet["author_category"][] = ["gobierno", "oposicion", "aliados", "dnl_liderazgo", "medios"];

export const mockTweets: XTweet[] = Array.from({ length: 20 }, (_, i) => ({
  id: `tweet-mock-${i + 1}`,
  author_handle: `@cuenta_ejemplo${i + 1}`,
  author_name: `Figura Pública de Ejemplo ${i + 1}`,
  author_category: CATEGORIES[i % CATEGORIES.length],
  content: `Publicación de ejemplo ${i + 1} sobre la coyuntura política del día — texto ilustrativo para desarrollo.`,
  tweet_url: "https://x.com/",
  sentiment: (["positivo", "neutro", "negativo"] as const)[i % 3],
  topic: TOPICS[i % TOPICS.length],
  engagement_likes: 50 + i * 37,
  engagement_reposts: 10 + i * 9,
  posted_at: new Date(Date.now() - i * 900_000).toISOString(),
}));

export const mockTopicVolume = TOPICS.map((topic, i) => ({
  topic,
  menciones: 40 + i * 23 + ((i * 13) % 30),
}));

export const mockSentimentTrend = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    fecha: date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }),
    positivo: 20 + ((i * 5) % 25),
    neutro: 30 + ((i * 3) % 20),
    negativo: 15 + ((i * 7) % 20),
  };
});
