"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#d32f2f", "#a02323", "#64748b", "#334155", "#94a3b8"];

export function TopicsChart({
  data,
  title = "Temas Más Debatidos Hoy",
}: {
  data: { topic: string; menciones: number }[];
  title?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--foreground)" }} stroke="var(--border)" />
            <YAxis type="category" dataKey="topic" width={130} tick={{ fontSize: 11, fill: "var(--foreground)" }} stroke="var(--border)" />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="menciones" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
