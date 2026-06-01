import { StatCard } from "./stat-card";
import { calculateGoalProgress } from "@/lib/fitness/goals";

interface GoalProgressProps {
  currentWeight: number | null;
  targetWeight: number | null;
  startWeight: number | null;
}

export function GoalProgress({ currentWeight, targetWeight, startWeight }: GoalProgressProps) {
  if (!targetWeight || !startWeight) {
    return (
      <StatCard
        title="目标进度"
        value="—"
        subtitle="尚未设置目标"
        trend="neutral"
      />
    );
  }

  if (!currentWeight) {
    return (
      <StatCard
        title="目标进度"
        value="0%"
        subtitle={`${startWeight} kg → ${targetWeight} kg`}
        trend="neutral"
      />
    );
  }

  const progress = calculateGoalProgress(currentWeight, startWeight, targetWeight);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">目标进度</p>
      <p className="mt-1 text-2xl font-bold text-white">
        {progress.percentage}%
      </p>
      <div className="mt-2 h-2 rounded-full bg-zinc-800">
        <div
          className="h-2 rounded-full bg-white transition-all"
          style={{ width: `${Math.min(100, progress.percentage)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>{progress.start} kg</span>
        <span>{progress.target} kg</span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        已减 {progress.achieved.toFixed(1)} kg，还剩 {progress.remaining.toFixed(1)} kg
      </p>
    </div>
  );
}
