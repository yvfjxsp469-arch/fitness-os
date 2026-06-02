"use client";

import { useState } from "react";
import { updateWorkout, deleteWorkout } from "@/actions/training";
import { ExerciseRow } from "./exercise-row";
import { AddExerciseDialog } from "./add-exercise-dialog";

interface SetData {
  id: string;
  setNumber: number;
  weightKg: string | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
}

interface WorkoutData {
  id: string;
  name: string;
  type: string;
  durationMin: number | null;
  rpe: number | null;
  notes: string | null;
  exercises: {
    id: string;
    exercise: { id: string; name: string; muscleGroup: string };
    sets: SetData[];
  }[];
}

const TYPE_LABELS: Record<string, string> = {
  STRENGTH: "力量",
  CARDIO: "有氧",
  REST: "休息",
};

export function WorkoutCard({ workout }: { workout: WorkoutData }) {
  const [editingHeader, setEditingHeader] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(true);

  async function handleHeaderSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await updateWorkout(workout.id, fd);
    setEditingHeader(false);
  }

  async function handleDelete() {
    if (!confirm("删除整个训练？所有动作和组数据将被移除。")) return;
    setDeleting(true);
    await deleteWorkout(workout.id);
    setDeleting(false);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-xs text-zinc-500">{expanded ? "▼" : "▶"}</span>
          <div>
            <p className="text-sm font-medium text-white">{workout.name}</p>
            <p className="text-[10px] text-zinc-500">
              {TYPE_LABELS[workout.type] || workout.type}
              {workout.durationMin ? ` · ${workout.durationMin}min` : ""}
              {workout.rpe ? ` · RPE ${workout.rpe}` : ""}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingHeader(!editingHeader)}
            className="text-[10px] text-zinc-600 hover:text-zinc-400"
          >
            {editingHeader ? "取消编辑" : "编辑"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[10px] text-zinc-600 hover:text-red-400 disabled:opacity-40"
          >
            {deleting ? "删除中..." : "删除训练"}
          </button>
        </div>
      </div>

      {/* Header edit form */}
      {editingHeader && (
        <form onSubmit={handleHeaderSave} className="px-4 py-3 border-b border-zinc-800 space-y-2">
          <input
            name="name"
            defaultValue={workout.name}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <select
              name="type"
              defaultValue={workout.type}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
            >
              <option value="STRENGTH">力量</option>
              <option value="CARDIO">有氧</option>
              <option value="REST">休息</option>
            </select>
            <input
              name="durationMin"
              type="number"
              defaultValue={workout.durationMin ?? ""}
              placeholder="时长(min)"
              className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
            <input
              name="rpe"
              type="number"
              min="1"
              max="10"
              defaultValue={workout.rpe ?? ""}
              placeholder="RPE 1-10"
              className="w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>
          <textarea
            name="notes"
            defaultValue={workout.notes ?? ""}
            placeholder="备注..."
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none resize-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-white"
          >
            保存
          </button>
        </form>
      )}

      {/* Exercises */}
      {expanded && (
        <div>
          {workout.exercises.map((we) => (
            <ExerciseRow
              key={we.id}
              id={we.id}
              exercise={we.exercise}
              sets={we.sets.map((s) => ({
                id: s.id,
                setNumber: s.setNumber,
                weightKg: s.weightKg,
                reps: s.reps,
                rpe: s.rpe,
                isWarmup: s.isWarmup,
              }))}
            />
          ))}
          <div className="px-4 py-2 border-t border-zinc-800">
            <AddExerciseDialog workoutId={workout.id} />
          </div>
        </div>
      )}

      {expanded && workout.notes && !editingHeader && (
        <div className="px-4 py-2 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">{workout.notes}</p>
        </div>
      )}
    </div>
  );
}
