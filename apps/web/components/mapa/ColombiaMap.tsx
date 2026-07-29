"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";

interface DeptSummary {
  department: string;
  gobernacion: number;
  alcaldia: number;
  concejal: number;
  diputado: number;
  total: number;
  coords?: { lat: number; lng: number };
}

const COLOMBIA_CENTER: [number, number] = [4.5, -74.3];

function FlyToDepartment({ coords }: { coords?: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 7, { duration: 0.6 });
  }, [coords, map]);
  return null;
}

export function ColombiaMap({
  data,
  selectedDepartment,
  onSelectDepartment,
}: {
  data: DeptSummary[];
  selectedDepartment?: string | null;
  onSelectDepartment: (department: string) => void;
}) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  const selected = data.find((d) => d.department === selectedDepartment);

  return (
    <MapContainer
      center={COLOMBIA_CENTER}
      zoom={6}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", background: "var(--surface-muted)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToDepartment coords={selected?.coords} />
      {data.map(
        (d) =>
          d.coords && (
            <CircleMarker
              key={d.department}
              center={[d.coords.lat, d.coords.lng]}
              radius={8 + (d.total / maxTotal) * 18}
              pathOptions={{
                color: "#d32f2f",
                fillColor: "#d32f2f",
                fillOpacity: d.department === selectedDepartment ? 0.75 : 0.4,
                weight: d.department === selectedDepartment ? 2.5 : 1,
              }}
              eventHandlers={{ click: () => onSelectDepartment(d.department) }}
            >
              <Tooltip>
                <div className="text-xs">
                  <strong>{d.department}</strong>
                  <br />
                  {d.total} cargos con presencia liberal/coalición
                </div>
              </Tooltip>
            </CircleMarker>
          )
      )}
    </MapContainer>
  );
}
