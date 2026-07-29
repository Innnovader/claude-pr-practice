import { createClient } from "@/lib/supabase/server";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * Herramientas (tool use) que el chat puede invocar para buscar en los
 * datos REALES de Radar Liberal DNL — así las respuestas se basan en el
 * Archivo/Bancada real de la plataforma en vez de inventar información.
 */

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "buscar_archivo",
    description:
      "Busca noticias reales en el Archivo de Radar Liberal DNL (coyuntura_news), filtrando por palabra clave y opcionalmente por tema (Gobierno ADLE, Economia, Salud, Pensiones, Seguridad, Medio ambiente, Justicia, Congreso, Otros). Usa esto para responder cualquier pregunta sobre noticias, coyuntura o temas recientes.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Palabra o frase clave a buscar en titulares/resúmenes" },
        topic: { type: "string", description: "Tema opcional para filtrar (ver lista en la descripción)" },
      },
      required: ["query"],
    },
  },
  {
    name: "buscar_parlamentario",
    description:
      "Busca congresistas reales y verificados de la bancada liberal (senadores y representantes) por nombre o departamento. Usa esto para cualquier pregunta sobre un senador o representante específico.",
    input_schema: {
      type: "object",
      properties: {
        nombre_o_departamento: { type: "string", description: "Nombre completo o parcial, o departamento" },
      },
      required: ["nombre_o_departamento"],
    },
  },
  {
    name: "buscar_alertas_control",
    description:
      "Busca alertas reales de entes de control y centros de pensamiento (Procuraduría, Contraloría, IPL, Fedesarrollo, Dejusticia, ANIF) por palabra clave.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Palabra o frase clave a buscar" },
      },
      required: ["query"],
    },
  },
];

export async function executeChatTool(name: string, input: Record<string, unknown>): Promise<string> {
  const supabase = await createClient();

  if (name === "buscar_archivo") {
    const query = String(input.query ?? "");
    const topic = input.topic ? String(input.topic) : null;
    let q = supabase
      .from("coyuntura_news")
      .select("headline, summary, source_name, source_url, topic, published_at")
      .ilike("headline", `%${query}%`)
      .order("published_at", { ascending: false })
      .limit(10);
    if (topic) q = q.eq("topic", topic);
    const { data, error } = await q;
    if (error) return `Error buscando en el archivo: ${error.message}`;
    if (!data || data.length === 0) return "No se encontraron noticias reales para esa búsqueda.";
    return JSON.stringify(data);
  }

  if (name === "buscar_parlamentario") {
    const term = String(input.nombre_o_departamento ?? "");
    const { data, error } = await supabase
      .from("parliamentarians")
      .select("full_name, chamber, department, commission, is_mock_data")
      .or(`full_name.ilike.%${term}%,department.ilike.%${term}%`)
      .eq("is_mock_data", false)
      .limit(10);
    if (error) return `Error buscando parlamentario: ${error.message}`;
    if (!data || data.length === 0) return "No se encontró ningún congresista real verificado con ese nombre/departamento.";
    return JSON.stringify(data);
  }

  if (name === "buscar_alertas_control") {
    const query = String(input.query ?? "");
    const { data, error } = await supabase
      .from("control_alerts")
      .select("source_entity, title, summary, impact_level, source_url, published_at")
      .ilike("title", `%${query}%`)
      .order("published_at", { ascending: false })
      .limit(10);
    if (error) return `Error buscando alertas: ${error.message}`;
    if (!data || data.length === 0) return "No se encontraron alertas reales para esa búsqueda.";
    return JSON.stringify(data);
  }

  return `Herramienta desconocida: ${name}`;
}
