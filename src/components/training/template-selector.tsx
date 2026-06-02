"use client";

import { useState } from "react";
import { createWorkout } from "@/actions/training";

interface Template {
  id: string;
  name: string;
  description: string | null;
}

export function TemplateSelector({
  date,
  templates,
}: {
  date: string;
  templates: Template[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSelect(templateId?: string) {
    setLoading(true);
    const fd = new FormData();
    fd.set("date", date);
    if (templateId) fd.set("templateId", templateId);
    await createWorkout(fd);
    setLoading(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-40"
      >
        {loading ? "创建中..." : "从模板开始"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className="w-full px-3 py-2 text-left hover:bg-zinc-800 transition-colors"
              >
                <p className="text-sm text-white">{t.name}</p>
                {t.description && (
                  <p className="text-[10px] text-zinc-500">{t.description}</p>
                )}
              </button>
            ))}
            <div className="border-t border-zinc-800 my-1" />
            <button
              onClick={() => handleSelect(undefined)}
              className="w-full px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
            >
              自定义训练（空）
            </button>
          </div>
        </>
      )}
    </div>
  );
}
