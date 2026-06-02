import { prisma } from "@/lib/prisma";
import { getChinaToday, getChinaDaysAgo, getChinaDateRange } from "@/lib/date";

export interface NutritionAnalytics {
  avgCalories30d: number;
  avgProtein30d: number;
  complianceRate: number;
  macroRatio: { protein: number; carbs: number; fat: number } | null;
  dailyData: { date: string; calories: number; protein: number }[];
}

export async function getNutritionAnalytics(userId: string): Promise<NutritionAnalytics> {
  const today = getChinaToday();
  const thirtyDaysAgo = getChinaDaysAgo(today, 29);
  const range = getChinaDateRange(thirtyDaysAgo, today);

  const summaries = await prisma.dailySummary.findMany({
    where: {
      userId,
      date: range,
      totalCalories: { not: null },
    },
    orderBy: { date: "asc" },
    select: {
      date: true,
      totalCalories: true,
      totalProtein: true,
      totalCarbs: true,
      totalFat: true,
    },
  });

  const daysWithData = summaries.length;
  const totalDays = 30;

  const dailyData = summaries.map((s) => ({
    date: s.date.toISOString().slice(0, 10),
    calories: s.totalCalories ?? 0,
    protein: s.totalProtein ? Number(s.totalProtein) : 0,
  }));

  let avgCalories30d = 0;
  let avgProtein30d = 0;
  let macroRatio: NutritionAnalytics["macroRatio"] = null;

  if (daysWithData > 0) {
    avgCalories30d = Math.round(dailyData.reduce((s, d) => s + d.calories, 0) / daysWithData);
    avgProtein30d = Math.round(dailyData.reduce((s, d) => s + d.protein, 0) * 10 / daysWithData) / 10;

    const totalProteinG = summaries.reduce((s, r) => s + (r.totalProtein ? Number(r.totalProtein) : 0), 0);
    const totalCarbsG = summaries.reduce((s, r) => s + (r.totalCarbs ? Number(r.totalCarbs) : 0), 0);
    const totalFatG = summaries.reduce((s, r) => s + (r.totalFat ? Number(r.totalFat) : 0), 0);
    const totalEnergy =
      totalProteinG * 4 + totalCarbsG * 4 + totalFatG * 9;

    if (totalEnergy > 0) {
      macroRatio = {
        protein: Math.round((totalProteinG * 4) / totalEnergy * 1000) / 10,
        carbs: Math.round((totalCarbsG * 4) / totalEnergy * 1000) / 10,
        fat: Math.round((totalFatG * 9) / totalEnergy * 1000) / 10,
      };
    }
  }

  const complianceRate = totalDays > 0 ? Math.round(daysWithData / totalDays * 100) / 100 : 0;

  return {
    avgCalories30d,
    avgProtein30d,
    complianceRate,
    macroRatio,
    dailyData,
  };
}
