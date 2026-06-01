import { StatCard } from "./stat-card";

interface CalorieSummaryProps {
  totalCalories: number | null;
  totalProtein: number | null;
}

export function CalorieSummary({ totalCalories, totalProtein }: CalorieSummaryProps) {
  if (totalCalories === null) {
    return (
      <StatCard
        title="今日热量"
        value="—"
        subtitle="尚未记录饮食"
        trend="neutral"
      />
    );
  }

  return (
    <StatCard
      title="今日热量"
      value={`${totalCalories} kcal`}
      subtitle={totalProtein !== null ? `蛋白质 ${totalProtein}g` : undefined}
      trend={totalCalories > 0 ? "neutral" : "neutral"}
    />
  );
}
