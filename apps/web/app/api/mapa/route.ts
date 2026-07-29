import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mockTerritorialPower } from "@/lib/mock-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/mapa — Mapa del poder territorial liberal (Módulo 4).
 * Query params: ?department=&office=gobernacion|alcaldia|concejal|diputado
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const department = searchParams.get("department");
  const office = searchParams.get("office");

  if (!isSupabaseConfigured()) {
    let data = mockTerritorialPower;
    if (department) data = data.filter((t) => t.department === department);
    if (office) data = data.filter((t) => t.office === office);
    return NextResponse.json({ data, source: "mock" });
  }

  const supabase = await createClient();
  let query = supabase.from("territorial_power").select("*").order("department");

  if (department) query = query.eq("department", department);
  if (office) query = query.eq("office", office);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data, source: "supabase" });
}
