import { prisma } from "@/lib/prisma";
import { getChinaToday, getChinaDaysAgo, getChinaDateRange } from "@/lib/date";
import { calcMovingAverage, getLatestMA7, type WeightWithMA7 } from "@/lib/fitness/weight";
import { calculateGoalProgress, calculateWeeklyRate } from "@/lib/fitness/goals";

export interface WeightAnalytics {
  currentWeight: number | null;
  currentMA7: number | null;
  weekChange: number | null;
  monthChange: number | null;
  weeklyRate: number | null;
  totalLost: number;
  records: WeightWithMA7[];
  goal: { target: number; start: number; progress: number } | null;
}

export async function getWeightAnalytics(userId: string): Promise<WeightAnalytics> {
  const today = getChinaToday();
  const ninetyDaysAgo = getChinaDaysAgo(today, 89);
  const range = getChinaDateRange(ninetyDaysAgo, today);

  const [weightRecords, goal, firstWeight] = await Promise.all([
    prisma.weightRecord.findMany({
      where: { userId, date: range },
      orderBy: { date: "asc" },
    }),
    prisma.goal.findFirst({
      where: { userId, type: "WEIGHT", status: "ACTIVE" },
    }),
    prisma.weightRecord.findFirst({
      where: { userId },
      orderBy: { date: "asc" },
      select: { weightKg: true },
    }),
  ]);

  const rawRecords = weightRecords.map((r) => ({
    date: r.date,
    weightKg: Number(r.weightKg),
  }));

  const records = calcMovingAverage(rawRecords);
  const currentWeight = rawRecords.length > 0 ? rawRecords[rawRecords.length - 1].weightKg : null;
  const currentMA7 = getLatestMA7(records);

  // Week change: currentMA7 vs MA7 from ~7 days ago
  let weekChange: number | null = null;
  let weeklyRate: number | null = null;
  if (currentMA7 !== null) {
    const sevenDaysAgo = getChinaDaysAgo(today, 7);
    let prevMA7: number | null = null;
    for (let i = records.length - 1; i >= 0; i--) {
      const rDate = records[i].date.toISOString().slice(0, 10);
      if (rDate <= sevenDaysAgo && records[i].ma7 !== null) {
        prevMA7 = records[i].ma7;
        break;
      }
    }
    if (prevMA7 !== null) {
      weekChange = Math.round((currentMA7 - prevMA7) * 100) / 100;
      weeklyRate = calculateWeeklyRate(currentMA7, prevMA7);
    }
  }

  // Month change: currentWeight vs weight from ~30 days ago
  let monthChange: number | null = null;
  if (currentWeight !== null && rawRecords.length > 1) {
    const thirtyDaysAgo = getChinaDaysAgo(today, 30);
    let baseline = rawRecords[0];
    for (const r of rawRecords) {
      if (r.date.toISOString().slice(0, 10) > thirtyDaysAgo) break;
      baseline = r;
    }
    if (baseline.weightKg !== currentWeight) {
      monthChange = Math.round((currentWeight - baseline.weightKg) * 100) / 100;
    }
  }

  const totalLost = firstWeight && currentWeight ? Number(firstWeight.weightKg) - currentWeight : 0;

  let goalResult: WeightAnalytics["goal"] = null;
  if (goal && currentWeight !== null) {
    const progress = calculateGoalProgress(
      currentWeight,
      Number(goal.startValue),
      Number(goal.targetValue)
    );
    goalResult = {
      target: Number(goal.targetValue),
      start: Number(goal.startValue),
      progress: progress.percentage,
    };
  }

  return {
    currentWeight,
    currentMA7,
    weekChange,
    monthChange,
    weeklyRate,
    totalLost,
    records,
    goal: goalResult,
  };
}
