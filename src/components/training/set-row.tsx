"use client";

import { useState } from "react";
import { updateSet, deleteSet } from "@/actions/training";

interface SetData {
  id: string;
  setNumber: number;
  weightKg: string | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
}

export function SetRow({ s }: { s: SetData }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await updateSet(s.id, fd);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="flex items-center gap-1.5 py-0.5">
        <span className="text-[10px] text-zinc-600 w-5 text-right">{s.setNumber}</span>
        <input
          name="weightKg"
          type="number"
          step="0.5"
          defaultValue={s.weightKg ? Number(s.weightKg) : ""}
          placeholder="重量"
          className="w-14 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
        />
        <input
          name="reps"
          type="number"
          defaultValue={s.reps ?? ""}
          placeholder="次数"
          className="w-12 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
        />
        <input
          name="rpe"
          type="number"
          min="1"
          max="10"
          defaultValue={s.rpe ?? ""}
          placeholder="RPE"
          className="w-12 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
        />
        <label className="flex items-center gap-0.5 text-[10px] text-zinc-500">
          <input name="isWarmup" type="checkbox" value="true" defaultChecked={s.isWarmup} />
          热身
        </label>
        <button type="submit" disabled={saving} className="text-[10px] text-zinc-400 hover:text-white">
          {saving ? "..." : "保存"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-[10px] text-zinc-600 hover:text-zinc-400">
          取消
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1.5 py-0.5 group">
      <span className="text-[10px] text-zinc-600 w-5 text-right">{s.setNumber}</span>
      <span className="text-xs text-zinc-300 w-14 text-right">
        {s.weightKg ? `${Number(s.weightKg)}kg` : "—"}
      </span>
      <span className="text-xs text-zinc-300 w-10 text-right">
        {s.reps !== null ? `${s.reps}次` : "—"}
      </span>
      <span className="text-xs text-zinc-500 w-8 text-right">
        {s.rpe !== null ? `@${s.rpe}` : ""}
      </span>
      {s.isWarmup && (
        <span className="text-[10px] text-yellow-600">热身</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="text-[10px] text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
      >
        编辑
      </button>
      <button
        onClick={async () => { await deleteSet(s.id); }}
        className="text-[10px] text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        删除
      </button>
    </div>
  );
}
