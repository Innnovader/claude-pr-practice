"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { XTweet } from "@/lib/types";
import { Heart, Repeat2, AtSign } from "lucide-react";
import { useState } from "react";

const CATEGORY_LABELS: Record<XTweet["author_category"], string> = {
  gobierno: "Gobierno",
  oposicion: "Oposición",
  aliados: "Aliados",
  dnl_liderazgo: "Liderazgo DNL",
  medios: "Medios",
};

export function TwitterRadar({ tweets }: { tweets: XTweet[] }) {
  const [filter, setFilter] = useState<XTweet["author_category"] | "todos">("todos");
  const filtered = filter === "todos" ? tweets : tweets.filter((t) => t.author_category === filter);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AtSign size={15} className="text-[var(--color-dnl-red)]" />
          Radar de X
        </CardTitle>
      </CardHeader>
      <div className="flex flex-wrap gap-1.5 px-4 pb-2">
        {(["todos", ...Object.keys(CATEGORY_LABELS)] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as typeof filter)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors",
              filter === cat
                ? "bg-[var(--color-dnl-red)] text-white border-[var(--color-dnl-red)]"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
            style={{ borderColor: filter === cat ? undefined : "var(--border)" }}
          >
            {cat === "todos" ? "Todos" : CATEGORY_LABELS[cat as XTweet["author_category"]]}
          </button>
        ))}
      </div>
      <CardContent className="flex-1 overflow-y-auto scrollbar-thin max-h-[500px] space-y-3">
        {filtered.map((tweet) => (
          <a
            key={tweet.id}
            href={tweet.tweet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border p-3 hover:border-[var(--color-dnl-red)] transition-colors"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{tweet.author_name}</p>
                <p className="text-xs text-slate-500">{tweet.author_handle}</p>
              </div>
              <Badge>{CATEGORY_LABELS[tweet.author_category]}</Badge>
            </div>
            <p className="mt-2 text-sm">{tweet.content}</p>
            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Heart size={12} /> {tweet.engagement_likes}</span>
              <span className="flex items-center gap-1"><Repeat2 size={12} /> {tweet.engagement_reposts}</span>
              <Badge variant={tweet.sentiment ?? "neutro"} className="ml-auto">{tweet.sentiment}</Badge>
              <span>{formatRelativeTime(tweet.posted_at)}</span>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
