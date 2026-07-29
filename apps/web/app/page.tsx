import { Header } from "@/components/layout/Header";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { TwitterRadar } from "@/components/dashboard/TwitterRadar";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { TopicsChart } from "@/components/dashboard/TopicsChart";
import { StatTile } from "@/components/ui/StatTile";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { mockNews, mockTweets, mockSentimentTrend, mockTopicVolume, mockControlAlerts } from "@/lib/mock-data";
import { getRealNews, realNewsBySource } from "@/lib/data/coyuntura";
import { getRealControlAlerts } from "@/lib/data/control-alerts";
import { getSavedNewsIds } from "@/lib/data/saved-news";
import { Newspaper, AtSign, ShieldAlert, TrendingUp, Sparkles } from "lucide-react";

export default async function CoyunturaPage() {
  const realNews = await getRealNews();
  const realAlerts = await getRealControlAlerts();
  const hasRealNews = realNews.length > 0;
  const savedIds = hasRealNews ? await getSavedNewsIds() : undefined;

  const news = hasRealNews ? realNews : mockNews;
  const highRelevance = news.filter((n) => n.dnl_relevance === "alto").length;

  return (
    <div>
      <Header title="Centro de Control de Coyuntura Nacional" subtitle="Monitoreo en tiempo real de la coyuntura política y económica" />
      <div className="p-4 md:p-6 space-y-4">
        {hasRealNews ? (
          <VerifiedDataBanner>
            Noticias reales, scrapeadas en vivo de {new Set(news.map((n) => n.source_name)).size} medios
            colombianos. El radar de X abajo sigue siendo de ejemplo (requiere activar la API de X/Twitter).
          </VerifiedDataBanner>
        ) : (
          <MockDataBanner />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Noticias hoy" value={news.length} icon={Newspaper} accent="red" />
          <StatTile label="Publicaciones en X" value={mockTweets.length} icon={AtSign} accent="red" />
          <StatTile label="Alertas entes de control" value={hasRealNews ? realAlerts.length : mockControlAlerts.length} icon={ShieldAlert} />
          <StatTile label="Relevancia alta hoy" value={hasRealNews ? `${highRelevance} (sin clasificar)` : highRelevance} icon={TrendingUp} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {hasRealNews ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles size={15} className="text-[var(--color-dnl-red)]" />
                  Matriz de Sentimiento del Entorno Político
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-center">
                <p className="text-sm text-slate-500 max-w-xs">
                  Este gráfico se activa cuando se conecta la clasificación con IA (Anthropic) —
                  hoy las {news.length} noticias reales de arriba no tienen sentimiento asignado todavía.
                </p>
              </CardContent>
            </Card>
          ) : (
            <SentimentChart data={mockSentimentTrend} />
          )}
          <TopicsChart
            data={hasRealNews ? realNewsBySource(news).slice(0, 6) : mockTopicVolume}
            title={hasRealNews ? "Noticias por Medio (real)" : "Temas Más Debatidos Hoy"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LiveFeed news={news} isReal={hasRealNews} savedIds={savedIds} />
          <TwitterRadar tweets={mockTweets} />
        </div>
      </div>
    </div>
  );
}
