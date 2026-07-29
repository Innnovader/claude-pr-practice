"use client";

import { moveSavedNews } from "@/lib/actions/saved-news";
import { FolderInput } from "lucide-react";
import { useTransition } from "react";

const NEW_FOLDER_VALUE = "__nueva__";

export function MoveFolderSelect({
  savedId,
  currentFolder,
  folders,
}: {
  savedId: string;
  currentFolder: string;
  folders: string[];
}) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    let target = e.target.value;
    if (target === NEW_FOLDER_VALUE) {
      const name = window.prompt("Nombre de la nueva carpeta:");
      if (!name || !name.trim()) return;
      target = name.trim();
    }
    if (target === currentFolder) return;
    startTransition(() => {
      moveSavedNews(savedId, target);
    });
  }

  return (
    <label className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
      <FolderInput size={12} />
      <select
        value={currentFolder}
        onChange={handleChange}
        disabled={pending}
        className="rounded border bg-transparent px-1 py-0.5 text-[11px] outline-none"
        style={{ borderColor: "var(--border)" }}
      >
        {folders.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
        <option value={NEW_FOLDER_VALUE}>+ Nueva carpeta…</option>
      </select>
    </label>
  );
}
