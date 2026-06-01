"use client";

import { useRouter, useSearchParams } from "next/navigation";

const D = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export function DatePicker() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("date") || D(0);
  const isToday = current === D(0);

  const display = new Date(current + "T00:00:00").toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const go = (offset: number) => {
    const d = new Date(current + "T00:00:00");
    d.setDate(d.getDate() + offset);
    router.push(`/nutrition?date=${d.toISOString().slice(0, 10)}`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(-1)}
        className="rounded-lg border border-zinc-700 px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
      >
        ←
      </button>
      <span className="text-sm font-medium text-white min-w-[140px] text-center">
        {display}
      </span>
      <button
        onClick={() => go(1)}
        className="rounded-lg border border-zinc-700 px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
      >
        →
      </button>
      {!isToday && (
        <button
          onClick={() => router.push("/nutrition")}
          className="rounded-lg border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          今天
        </button>
      )}
    </div>
  );
}
