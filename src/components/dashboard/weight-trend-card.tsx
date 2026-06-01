import { StatCard } from "./stat-card";
import { WeightWithMA7 } from "@/lib/fitness/weight";

interface WeightTrendCardProps {
  records: WeightWithMA7[];
}

export function WeightTrendCard({ records }: WeightTrendCardProps) {
  const latestMA7 = records.filter((r) => r.ma7 !== null).at(-1)?.ma7 ?? null;

  if (!latestMA7) {
    return (
      <StatCard
        title="7日均重"
        value="—"
        subtitle="需要至少3天数据"
        trend="neutral"
      />
    );
  }

  // Compare to 7 days ago MA7 for trend
  const weekAgo = records.filter((r) => r.ma7 !== null).at(-8)?.ma7 ?? null;
  const delta = weekAgo ? latestMA7 - weekAgo : null;

  return (
    <StatCard
      title="7日均重"
      value={`${latestMA7.toFixed(1)} kg`}
      subtitle={
        delta !== null
          ? `较7天前 ${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`
          : "数据收集中..."
      }
      trend={delta !== null ? (delta > 0 ? "up" : "down") : "neutral"}
    />
  );
}
