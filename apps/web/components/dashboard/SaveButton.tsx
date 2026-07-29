"use client";

import { saveNews, unsaveNews } from "@/lib/actions/saved-news";
import { cn } from "@/lib/utils";
import { Bookmark } from "lucide-react";
import { useState, useTransition } from "react";

export function SaveButton({ newsId, initiallySaved }: { newsId: string; initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next); // optimista
    startTransition(async () => {
      const result = next ? await saveNews(newsId) : await unsaveNews(newsId);
      if (result.error) setSaved(!next); // revertir si falló
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={saved ? "Quitar de guardados" : "Guardar noticia"}
      aria-pressed={saved}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md shrink-0 transition-colors disabled:opacity-50",
        saved ? "text-[var(--color-dnl-red)]" : "text-slate-400 hover:text-[var(--color-dnl-red)]"
      )}
    >
      <Bookmark size={15} className={saved ? "fill-current" : ""} />
    </button>
  );
}
