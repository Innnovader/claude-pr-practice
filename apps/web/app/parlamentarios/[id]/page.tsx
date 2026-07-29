import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { Tabs } from "@/components/ui/Tabs";
import { mockParliamentarians, mockBills, mockStatements } from "@/lib/mock-data";
import { getRealParliamentarianById } from "@/lib/data/parliamentarians";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { UserRound, Mail, AtSign, Instagram, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return mockParliamentarians.map((p) => ({ id: p.id }));
}

export const dynamicParams = true;

export default async function ParliamentarianProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mockMatch = mockParliamentarians.find((p) => p.id === id);
  const parliamentarian = mockMatch ?? (await getRealParliamentarianById(id));
  if (!parliamentarian) notFound();
  const isReal = !mockMatch;

  const bills = mockBills.filter((b) => b.author_parliamentarian_id === id);
  const statements = mockStatements.filter((s) => s.parliamentarian_id === id);

  return (
    <div>
      <Header title={parliamentarian.full_name} subtitle={parliamentarian.chamber === "senado" ? "Senado de la República" : `Cámara de Representantes — ${parliamentarian.department}`} />
      <div className="p-4 md:p-6 space-y-4">
        {isReal ? (
          <VerifiedDataBanner>
            Nombre y circunscripción verificados. Los campos de abajo (proyectos de ley, declaraciones,
            votaciones) todavía no tienen datos reales cargados — se llenan cuando se active el scraper.
          </VerifiedDataBanner>
        ) : (
          <MockDataBanner />
        )}

        <Card className="p-5">
          <div className="flex items-start gap-4">
            {parliamentarian.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL de foto viene de datos, dominio no conocido de antemano
              <img
                src={parliamentarian.photo_url}
                alt={parliamentarian.full_name}
                className="h-16 w-16 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 shrink-0">
                <UserRound size={28} />
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{parliamentarian.full_name}</h2>
                <Badge variant="dnl">Partido Liberal</Badge>
                {parliamentarian.commission && <Badge>{parliamentarian.commission}</Badge>}
              </div>
              {parliamentarian.bio && <p className="mt-1 text-sm text-slate-500">{parliamentarian.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                {parliamentarian.contact_email && (
                  <span className="flex items-center gap-1"><Mail size={13} /> {parliamentarian.contact_email}</span>
                )}
                {parliamentarian.social_x_handle && (
                  <span className="flex items-center gap-1"><AtSign size={13} /> {parliamentarian.social_x_handle}</span>
                )}
                {parliamentarian.social_instagram_handle && (
                  <span className="flex items-center gap-1"><Instagram size={13} /> {parliamentarian.social_instagram_handle}</span>
                )}
              </div>
            </div>
            {parliamentarian.alignment_index != null && (
              <div className="text-center shrink-0">
                <p className="text-2xl font-bold text-[var(--color-dnl-red)]">{parliamentarian.alignment_index}%</p>
                <p className="text-[11px] text-slate-500">alineación DNL</p>
              </div>
            )}
          </div>
        </Card>

        <Tabs
          tabs={[
            {
              value: "proyectos",
              label: `Proyectos de Ley (${bills.length})`,
              content: (
                <div className="space-y-2">
                  {bills.length === 0 && (
                    <p className="text-sm text-slate-500">
                      {isReal ? "Sin proyectos de ley cargados todavía — pendiente de activar el scraper del Congreso." : "Sin proyectos radicados en los datos mock."}
                    </p>
                  )}
                  {bills.map((bill) => (
                    <Card key={bill.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-500">{bill.bill_number}</p>
                          <p className="text-sm font-medium">{bill.title}</p>
                        </div>
                        <a href={bill.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={13} className="text-slate-400" />
                        </a>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge>{bill.status.replace("_", " ")}</Badge>
                        {bill.dnl_relevance && <Badge variant={bill.dnl_relevance}>relevancia {bill.dnl_relevance}</Badge>}
                        <span className="ml-auto text-[11px] text-slate-400">Radicado {formatDate(bill.filed_at)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              ),
            },
            {
              value: "declaraciones",
              label: `Declaraciones y Redes (${statements.length})`,
              content: (
                <div className="space-y-2">
                  {statements.length === 0 && (
                    <p className="text-sm text-slate-500">
                      {isReal ? "Sin declaraciones cargadas todavía — pendiente de activar el radar de X/medios." : "Sin declaraciones recientes en los datos mock."}
                    </p>
                  )}
                  {statements.map((s) => (
                    <Card key={s.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm">{s.content}</p>
                        {s.is_critical && <Badge variant="negativo">crítica</Badge>}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <Badge>{s.channel}</Badge>
                        {s.sentiment && <Badge variant={s.sentiment}>{s.sentiment}</Badge>}
                        <span className="ml-auto">{formatRelativeTime(s.published_at)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              ),
            },
            {
              value: "votaciones",
              label: "Votaciones Clave",
              content: (
                <Card>
                  <CardHeader>
                    <CardTitle>Registro de votaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">
                      Sin votaciones registradas en los datos mock — la tabla real
                      <code className="mx-1 rounded bg-slate-100 px-1 dark:bg-slate-800">parliamentarian_votes</code>
                      se puebla desde las actas de plenaria del Congreso.
                    </p>
                  </CardContent>
                </Card>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
