"use client";

import { useState, useEffect, useCallback } from "react";
import { addExerciseToWorkout } from "@/actions/training";

interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
}

const MUSCLE_GROUPS: Record<string, string> = {
  CHEST: "胸",
  BACK: "背",
  SHOULDERS: "肩",
  BICEPS: "二头",
  TRICEPS: "三头",
  QUADS: "股四头",
  HAMSTRINGS: "腘绳",
  GLUTES: "臀",
  CALVES: "小腿",
  CORE: "核心",
};

export function AddExerciseDialog({ workoutId }: { workoutId: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const searchExercises = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (muscleGroup) params.set("muscleGroup", muscleGroup);
    params.set("take", "30");

    const res = await fetch(`/api/exercises?${params.toString()}`);
    const data = await res.json();
    setExercises(data.items);
  }, [search, muscleGroup]);

  useEffect(() => {
    if (open) searchExercises();
  }, [open, searchExercises]);

  async function handleAdd(exerciseId: string) {
    setLoading(true);
    const fd = new FormData();
    fd.set("workoutId", workoutId);
    fd.set("exerciseId", exerciseId);
    await addExerciseToWorkout(fd);
    setLoading(false);
    setOpen(false);
    setSearch("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        + 添加动作
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        + 添加动作
      </button>

      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-4 mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">添加动作</h3>
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索动作..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
            >
              <option value="">全部肌群</option>
              {Object.entries(MUSCLE_GROUPS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleAdd(ex.id)}
                disabled={loading}
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm flex justify-between items-center hover:bg-zinc-800 disabled:opacity-40 transition-colors"
              >
                <span className="text-zinc-300">{ex.name}</span>
                <span className="text-[10px] text-zinc-500">{MUSCLE_GROUPS[ex.muscleGroup] || ex.muscleGroup}</span>
              </button>
            ))}
            {exercises.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-4">无匹配动作</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
