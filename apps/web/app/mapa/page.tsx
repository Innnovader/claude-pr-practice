import { Header } from "@/components/layout/Header";
import { MockDataBanner } from "@/components/ui/MockDataBanner";
import { MapaClient } from "@/components/mapa/MapaClient";
import { VerifiedGovernors } from "@/components/mapa/VerifiedGovernors";
import { territorialSummaryByDepartment } from "@/lib/mock-data";

export default function MapaPage() {
  const summary = territorialSummaryByDepartment();

  return (
    <div>
      <Header title="Mapa del Poder Territorial Liberal" subtitle="Gobernaciones · Alcaldías · Concejales · Diputados" />
      <div className="p-4 md:p-6 space-y-4">
        <VerifiedGovernors />
        <MockDataBanner />
        <MapaClient summary={summary} />
      </div>
    </div>
  );
}
