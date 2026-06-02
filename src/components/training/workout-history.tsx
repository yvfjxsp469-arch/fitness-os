import Link from "next/link";

interface HistoryWorkout {
  id: string;
  date: Date;
  name: string;
  type: string;
  exerciseCount: number;
}

export function WorkoutHistory({ workouts }: { workouts: HistoryWorkout[] }) {
  if (workouts.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-zinc-400">最近训练</h3>
      <div className="space-y-1">
        {workouts.map((w) => (
          <Link
            key={w.id}
            href={`/training?date=${w.date.toISOString().slice(0, 10)}`}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 hover:border-zinc-700 transition-colors"
          >
            <div>
              <p className="text-sm text-zinc-300">{w.name}</p>
              <p className="text-[10px] text-zinc-600">
                {w.date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", weekday: "short" })}
                {" · "}{w.type === "STRENGTH" ? "力量" : w.type === "CARDIO" ? "有氧" : "休息"}
              </p>
            </div>
            <span className="text-xs text-zinc-500">{w.exerciseCount} 动作</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
