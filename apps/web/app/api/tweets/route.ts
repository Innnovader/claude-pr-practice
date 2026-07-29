import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mockTweets } from "@/lib/mock-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/tweets — Radar de X (Módulo 1).
 * Query params: ?category=gobierno|oposicion|aliados|dnl_liderazgo|medios
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!isSupabaseConfigured()) {
    let data = mockTweets;
    if (category) data = data.filter((t) => t.author_category === category);
    return NextResponse.json({ data, source: "mock" });
  }

  const supabase = await createClient();
  let query = supabase.from("x_tweets").select("*").order("posted_at", { ascending: false });

  if (category) query = query.eq("author_category", category);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data, source: "supabase" });
}
