"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { mockBills, mockNews, mockControlAlerts } from "@/lib/mock-data";
import { searchReal, type SearchResult } from "@/lib/actions/search";
import { Search, FileSearch, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SUGGESTIONS = [
  "proyectos presentados sobre reforma tributaria por el Partido Liberal",
  "últimas declaraciones sobre el presupuesto nacional",
  "informes de Fedesarrollo sobre inflación",
  "alertas de la Procuraduría con impacto alto",
];

/**
 * Búsqueda por coincidencia de palabras clave (ignorando stopwords) sobre
 * datos MOCK — solo se usa como respaldo cuando Supabase no está
 * configurado. Con Supabase real, la búsqueda va por `searchReal()`
 * (lib/actions/search.ts), que sí consulta contenido real (aunque
 * tampoco es semántica/vectorial de verdad todavía).
 */
const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "un", "una", "por", "para", "con",
  "sobre", "en", "y", "o", "a", "al", "que", "se", "su", "sus",
]);

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  if (haystack.includes(query)) return true;
  const queryWords = significantWords(query);
  return queryWords.some((w) => haystack.includes(w));
}

function fakeSemanticSearch(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return [
    ...mockBills
      .filter((b) => matchesQuery(q, b.title, b.topic, b.summary))
      .map((b) => ({
        id: b.id,
        kind: "proyecto_ley" as const,
        title: b.title,
        snippet: b.summary ?? "",
        url: b.source_url,
        date: b.filed_at,
      })),
    ...mockNews
      .filter((n) => matchesQuery(q, n.headline, n.topic, n.summary))
      .map((n) => ({
        id: n.id,
        kind: "noticia" as const,
        title: n.headline,
        snippet: n.summary ?? "",
        url: n.source_url,
        date: n.published_at,
      })),
    ...mockControlAlerts
      .filter((a) => matchesQuery(q, a.title, a.source_entity, a.summary))
      .map((a) => ({
        id: a.id,
        kind: "alerta_control" as const,
        title: a.title,
        snippet: a.summary ?? "",
        url: a.source_url,
        date: a.published_at,
      })),
  ];
}

const KIND_LABEL: Record<SearchResult["kind"], string> = {
  proyecto_ley: "Proyecto de Ley",
  noticia: "Noticia",
  alerta_control: "Alerta de Control",
};

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [realResults, setRealResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [usedReal, setUsedReal] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setRealResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const results = await searchReal(query);
      setLoading(false);
      if (results !== null) {
        setUsedReal(true);
        setRealResults(results);
      } else {
        setUsedReal(false);
        setRealResults(null);
      }
    }, 400); // debounce — evita una consulta al servidor por cada tecla
    return () => clearTimeout(timeout);
  }, [query]);

  const mockResults = useMemo(() => fakeSemanticSearch(query), [query]);
  const results = usedReal ? realResults ?? [] : mockResults;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: proyectos presentados sobre reforma tributaria por el Partido Liberal"
          className="w-full rounded-xl border py-2.5 pl-9 pr-9 text-sm outline-none focus:border-[var(--color-dnl-red)]"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        />
        {loading && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>

      {query && (
        <p className="text-[11px] text-slate-400">
          {usedReal ? "Buscando en tus datos reales (Archivo, Bancada, Entes de Control)." : "Buscando en datos de ejemplo — conecta Supabase para buscar en datos reales."}
        </p>
      )}

      {!query && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="rounded-full border px-3 py-1 text-xs text-slate-500 hover:text-[var(--color-dnl-red)] hover:border-[var(--color-dnl-red)] transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {query && !loading && results.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <FileSearch size={16} /> Sin resultados para &quot;{query}&quot;.
          </p>
        )}
        {results.map((r) => (
          <a key={`${r.kind}-${r.id}`} href={r.url} target="_blank" rel="noopener noreferrer">
            <Card className="p-3 hover:border-[var(--color-dnl-red)] transition-colors">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{r.title}</p>
                <Badge>{KIND_LABEL[r.kind]}</Badge>
              </div>
              {r.snippet && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{r.snippet}</p>}
              <p className="mt-1 text-[11px] text-slate-400">{formatDate(r.date)}</p>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
