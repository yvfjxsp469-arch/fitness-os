import type { ExercisePR } from "@/lib/fitness/pr";

interface PRCardProps {
  prs: ExercisePR[];
}

export function PRCard({ prs }: PRCardProps) {
  if (prs.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">个人最佳记录</h3>
        <p className="text-sm text-zinc-600">暂无PR数据，完成训练后自动计算</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-400">个人最佳记录</h3>
      <div className="divide-y divide-zinc-800">
        {prs.map((pr) => (
          <div
            key={pr.exerciseId}
            className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
          >
            <div>
              <p className="text-sm font-medium text-white">{pr.exerciseName}</p>
              <p className="text-xs text-zinc-500">
                {pr.best1RMWeight}kg × {pr.best1RMReps}
                {pr.bestVolume ? ` · ${pr.bestVolume}kg 总容量` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                {pr.best1RM ? `${pr.best1RM}kg` : "—"}
              </p>
              <p className="text-[10px] text-zinc-500">1RM</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
