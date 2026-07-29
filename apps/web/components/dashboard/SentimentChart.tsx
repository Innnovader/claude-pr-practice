"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function SentimentChart({
  data,
}: {
  data: { fecha: string; positivo: number; neutro: number; negativo: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Matriz de Sentimiento del Entorno Político</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="var(--border)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--border)" />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="positivo" stackId="1" stroke="#10b981" fill="#10b98133" />
            <Area type="monotone" dataKey="neutro" stackId="1" stroke="#64748b" fill="#64748b33" />
            <Area type="monotone" dataKey="negativo" stackId="1" stroke="#d32f2f" fill="#d32f2f33" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
