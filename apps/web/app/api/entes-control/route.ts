import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mockControlAlerts } from "@/lib/mock-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/entes-control — Vigía de entes de control y centros de
 * pensamiento (Módulo 3). Query params: ?category=ente_control|centro_pensamiento&impact=alto|medio|bajo
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const impact = searchParams.get("impact");

  if (!isSupabaseConfigured()) {
    let data = mockControlAlerts;
    if (category) data = data.filter((a) => a.source_category === category);
    if (impact) data = data.filter((a) => a.impact_level === impact);
    return NextResponse.json({ data, source: "mock" });
  }

  const supabase = await createClient();
  let query = supabase.from("control_alerts").select("*").order("published_at", { ascending: false });

  if (category) query = query.eq("source_category", category);
  if (impact) query = query.eq("impact_level", impact);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data, source: "supabase" });
}
