import { StatCard } from "./stat-card";

interface WeightOverviewProps {
  latestWeight: number | null;
  previousWeight: number | null;
}

export function WeightOverview({ latestWeight, previousWeight }: WeightOverviewProps) {
  if (!latestWeight) {
    return (
      <StatCard
        title="今日体重"
        value="—"
        subtitle="尚未录入体重"
        trend="neutral"
      />
    );
  }

  const delta = previousWeight
    ? latestWeight - previousWeight
    : null;
  const deltaStr =
    delta !== null
      ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`
      : undefined;

  return (
    <StatCard
      title="今日体重"
      value={`${latestWeight.toFixed(1)} kg`}
      subtitle={deltaStr ? `较上次 ${deltaStr}` : undefined}
      trend={delta !== null ? (delta > 0 ? "up" : "down") : "neutral"}
    />
  );
}
