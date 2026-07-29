import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mockNews } from "@/lib/mock-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/coyuntura — Live feed de coyuntura nacional (Módulo 1).
 * Query params: ?topic=&sentiment=&limit=
 *
 * Sin Supabase configurado (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY), sirve los
 * datos mock de lib/mock-data para que el frontend siga siendo utilizable
 * en desarrollo.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");
  const sentiment = searchParams.get("sentiment");
  const limit = Number(searchParams.get("limit") ?? "50");

  if (!isSupabaseConfigured()) {
    let data = mockNews;
    if (topic) data = data.filter((n) => n.topic === topic);
    if (sentiment) data = data.filter((n) => n.sentiment === sentiment);
    return NextResponse.json({ data: data.slice(0, limit), source: "mock" });
  }

  const supabase = await createClient();
  let query = supabase
    .from("coyuntura_news")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (topic) query = query.eq("topic", topic);
  if (sentiment) query = query.eq("sentiment", sentiment);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data, source: "supabase" });
}
