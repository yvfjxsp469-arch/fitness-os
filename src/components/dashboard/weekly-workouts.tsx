import { StatCard } from "./stat-card";

interface WeeklyWorkoutsProps {
  count: number;
}

export function WeeklyWorkouts({ count }: WeeklyWorkoutsProps) {
  return (
    <StatCard
      title="本周训练"
      value={`${count} 次`}
      subtitle={count >= 3 ? "达标 ✓" : `目标: 3次/周`}
      trend={count >= 3 ? "down" : "neutral"}
    />
  );
}
