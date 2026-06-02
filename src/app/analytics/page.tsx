import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getChinaToday } from "@/lib/date";
import { getWeightAnalytics } from "@/lib/analytics/weight";
import { getNutritionAnalytics } from "@/lib/analytics/nutrition";
import { getTrainingAnalytics } from "@/lib/analytics/training";
import { WeightChart } from "@/components/weight/weight-chart";
import { AnalyticsSummary } from "@/components/analytics/analytics-summary";
import { NutritionChart } from "@/components/analytics/nutrition-chart";
import { TrainingChart } from "@/components/analytics/training-chart";
import { PRCard } from "@/components/analytics/pr-card";
import { LogoutButton } from "@/components/layout/logout-button";
import Link from "next/link";

export default async function AnalyticsPage() {
  const userId = await getSession();
  if (!userId) redirect("/login");

  const today = getChinaToday();

  const [weight, nutrition, training] = await Promise.all([
    getWeightAnalytics(userId),
    getNutritionAnalytics(userId),
    getTrainingAnalytics(userId),
  ]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-500 hover:text-white">
              ←
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">数据分析</h1>
              <p className="text-xs text-zinc-500">{today}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <AnalyticsSummary
          weight={weight}
          nutrition={nutrition}
          training={training}
        />

        <WeightChart
          records={weight.records}
          targetWeight={weight.goal?.target ?? null}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <NutritionChart data={nutrition.dailyData} />
          <TrainingChart data={training.weeklyData} />
        </div>

        <PRCard prs={training.prs.slice(0, 10).map(([, pr]) => pr)} />
      </main>
    </div>
  );
}
