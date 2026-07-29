import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { VerifiedDataBanner } from "@/components/ui/VerifiedDataBanner";
import { getRealTerritorialPower } from "@/lib/data/territorial";
import { Landmark } from "lucide-react";

export async function VerifiedGovernors() {
  const real = await getRealTerritorialPower();
  const governors = real.filter((t) => t.office === "gobernacion");
  if (governors.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark size={15} className="text-[var(--color-dnl-red)]" />
          Gobernaciones Liberales Reales ({governors.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <VerifiedDataBanner>
          Verificado cruzando Wikipedia + prensa el 2026-07-29. Alcaldías, concejales y diputados abajo en el mapa
          siguen siendo datos de ejemplo — son miles de registros, pendientes de una fuente masiva verificada.
        </VerifiedDataBanner>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {governors.map((g) => (
            <div key={g.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs text-slate-500">{g.department}</p>
              <p className="text-sm font-medium">{g.official_name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
