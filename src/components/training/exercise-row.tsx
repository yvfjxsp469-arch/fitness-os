"use client";

import { useState } from "react";
import { removeExerciseFromWorkout, addSet } from "@/actions/training";
import { SetRow } from "./set-row";

interface SetData {
  id: string;
  setNumber: number;
  weightKg: string | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
}

interface ExerciseRowProps {
  id: string;
  exercise: { id: string; name: string; muscleGroup: string };
  sets: SetData[];
}

export function ExerciseRow({ id, exercise, sets }: ExerciseRowProps) {
  const [addingSet, setAddingSet] = useState(false);

  async function handleAddSet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("workoutExerciseId", id);
    const nextNum = sets.length > 0 ? Math.max(...sets.map((s) => s.setNumber)) + 1 : 1;
    fd.set("setNumber", String(nextNum));
    await addSet(fd);
    setAddingSet(false);
  }

  async function handleRemove() {
    if (!confirm(`移除「${exercise.name}」？所有组数据将被删除。`)) return;
    await removeExerciseFromWorkout(id);
  }

  return (
    <div className="border-t border-zinc-800 first:border-t-0">
      {/* Exercise header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div>
          <span className="text-sm text-white">{exercise.name}</span>
          <span className="ml-2 text-[10px] text-zinc-600">{exercise.muscleGroup}</span>
        </div>
        <button
          onClick={handleRemove}
          className="text-[10px] text-zinc-600 hover:text-red-400"
        >
          移除动作
        </button>
      </div>

      {/* Sets table header */}
      <div className="flex items-center gap-1.5 px-4 pb-1">
        <span className="text-[10px] text-zinc-600 w-5 text-right">#</span>
        <span className="text-[10px] text-zinc-600 w-14 text-right">重量</span>
        <span className="text-[10px] text-zinc-600 w-10 text-right">次数</span>
        <span className="text-[10px] text-zinc-600 w-8 text-right">RPE</span>
      </div>

      {/* Set rows */}
      <div className="px-4 pb-1">
        {sets.map((s) => (
          <SetRow key={s.id} s={s} />
        ))}
      </div>

      {/* Add set */}
      <div className="px-4 pb-2">
        {addingSet ? (
          <form onSubmit={handleAddSet} className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-600">新组</span>
            <input
              name="weightKg"
              type="number"
              step="0.5"
              placeholder="重量"
              className="w-14 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
            />
            <input
              name="reps"
              type="number"
              placeholder="次数"
              className="w-12 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
            />
            <input
              name="rpe"
              type="number"
              min="1"
              max="10"
              placeholder="RPE"
              className="w-12 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
            />
            <label className="flex items-center gap-0.5 text-[10px] text-zinc-500">
              <input name="isWarmup" type="checkbox" value="true" />
              热身
            </label>
            <button type="submit" className="text-[10px] text-zinc-400 hover:text-white">
              添加
            </button>
            <button type="button" onClick={() => setAddingSet(false)} className="text-[10px] text-zinc-600 hover:text-zinc-400">
              取消
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAddingSet(true)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            + 添加组
          </button>
        )}
      </div>
    </div>
  );
}
