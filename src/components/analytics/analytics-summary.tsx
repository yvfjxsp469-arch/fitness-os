import { StatCard } from "@/components/dashboard/stat-card";
import type { WeightAnalytics } from "@/lib/analytics/weight";
import type { NutritionAnalytics } from "@/lib/analytics/nutrition";
import type { TrainingAnalytics } from "@/lib/analytics/training";

interface AnalyticsSummaryProps {
  weight: WeightAnalytics;
  nutrition: NutritionAnalytics;
  training: TrainingAnalytics;
}

export function AnalyticsSummary({ weight, nutrition, training }: AnalyticsSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        title="当前体重"
        value={weight.currentWeight ? `${weight.currentWeight.toFixed(1)} kg` : "—"}
        subtitle={
          weight.weeklyRate && weight.weeklyRate > 0
            ? `↓${weight.weeklyRate.toFixed(1)}kg/周`
            : undefined
        }
        trend="neutral"
      />
      <StatCard
        title="7日均值"
        value={weight.currentMA7 ? `${weight.currentMA7.toFixed(1)} kg` : "—"}
        subtitle={
          weight.weekChange !== null
            ? `${weight.weekChange > 0 ? "↑" : "↓"}${Math.abs(weight.weekChange).toFixed(1)}kg`
            : undefined
        }
        trend="neutral"
      />
      <StatCard
        title="月均热量"
        value={nutrition.avgCalories30d > 0 ? `${nutrition.avgCalories30d} kcal` : "—"}
        subtitle={`达标率 ${Math.round(nutrition.complianceRate * 100)}%`}
        trend="neutral"
      />
      <StatCard
        title="月训练"
        value={training.monthlyWorkouts > 0 ? `${training.monthlyWorkouts} 次` : "—"}
        subtitle={
          training.monthlyMinutes > 0
            ? `${(training.monthlyMinutes / 60).toFixed(1)}h`
            : undefined
        }
        trend="neutral"
      />
    </div>
  );
}
