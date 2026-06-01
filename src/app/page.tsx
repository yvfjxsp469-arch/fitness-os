import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { calcMovingAverage } from "@/lib/fitness/weight";
import { WeightOverview } from "@/components/dashboard/weight-overview";
import { WeightTrendCard } from "@/components/dashboard/weight-trend-card";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { WeeklyWorkouts } from "@/components/dashboard/weekly-workouts";
import { CalorieSummary } from "@/components/dashboard/calorie-summary";
import { StatCard } from "@/components/dashboard/stat-card";
import { LogoutButton } from "@/components/layout/logout-button";

export default async function DashboardPage() {
  const userId = await getSession();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  });

  // Latest 2 weight records for delta
  const latestWeights = await prisma.weightRecord.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 2,
  });

  // 90 days of weight records for MA7 calculation
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const weightRecords = await prisma.weightRecord.findMany({
    where: { userId, date: { gte: ninetyDaysAgo } },
    orderBy: { date: "asc" },
  });

  // Active weight goal
  const goal = await prisma.goal.findFirst({
    where: { userId, type: "WEIGHT", status: "ACTIVE" },
  });

  // Weekly workout count
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const workoutCount = await prisma.workout.count({
    where: {
      userId,
      date: { gte: startOfWeek, lte: endOfWeek },
    },
  });

  // First weight record for total lost calculation
  const firstWeight = await prisma.weightRecord.findFirst({
    where: { userId },
    orderBy: { date: "asc" },
    select: { weightKg: true, date: true },
  });

  // Today's nutrition summary
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySummary = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: today } },
    select: { totalCalories: true, totalProtein: true },
  });

  const withMA7 = calcMovingAverage(
    weightRecords.map((r) => ({
      date: r.date,
      weightKg: Number(r.weightKg),
    }))
  );

  const latestWeight = latestWeights[0]?.weightKg ?? null;
  const previousWeight = latestWeights[1]?.weightKg ?? null;
  const totalLost = firstWeight ? Number(firstWeight.weightKg) - (Number(latestWeight) || Number(firstWeight.weightKg)) : 0;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-white">Fitness OS</h1>
            <p className="text-xs text-zinc-500">
              {user?.displayName || "用户"}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <WeightOverview
            latestWeight={latestWeight ? Number(latestWeight) : null}
            previousWeight={previousWeight ? Number(previousWeight) : null}
          />
          <WeightTrendCard records={withMA7} />
          {firstWeight && (
            <StatCard
              title="累计减重"
              value={totalLost > 0 ? `${totalLost.toFixed(1)} kg` : "—"}
              subtitle={
                totalLost > 0
                  ? `自 ${new Date(firstWeight.date).toLocaleDateString("zh-CN")}`
                  : undefined
              }
              trend={totalLost > 0 ? "down" : "neutral"}
            />
          )}
          <WeeklyWorkouts count={workoutCount} />
        </div>

        {/* Goal Progress Bar */}
        <GoalProgress
          currentWeight={latestWeight ? Number(latestWeight) : null}
          targetWeight={goal ? Number(goal.targetValue) : null}
          startWeight={goal ? Number(goal.startValue) : null}
        />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/weight"
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
          >
            <p className="text-sm font-medium text-white">⚖️ 记录体重</p>
            <p className="mt-1 text-xs text-zinc-500">每日称重记录</p>
          </a>
          <CalorieSummary
            totalCalories={todaySummary?.totalCalories ?? null}
            totalProtein={todaySummary?.totalProtein ? Number(todaySummary.totalProtein) : null}
          />
        </div>
      </main>
    </div>
  );
}
