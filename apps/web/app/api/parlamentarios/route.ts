import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mockParliamentarians } from "@/lib/mock-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/parlamentarios — Bancada liberal Congreso 2026-2030 (Módulo 2).
 * Query params: ?chamber=senado|camara&commission=
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chamber = searchParams.get("chamber");
  const commission = searchParams.get("commission");

  if (!isSupabaseConfigured()) {
    let data = mockParliamentarians;
    if (chamber) data = data.filter((p) => p.chamber === chamber);
    if (commission) data = data.filter((p) => p.commission === commission);
    return NextResponse.json({ data, source: "mock" });
  }

  const supabase = await createClient();
  let query = supabase.from("parliamentarians").select("*").order("full_name");

  if (chamber) query = query.eq("chamber", chamber);
  if (commission) query = query.eq("commission", commission);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data, source: "supabase" });
}
