import { prisma } from "@/lib/prisma";

export async function upsertDailySummaryWeight(
  userId: string,
  date: Date,
  weightKg: number
) {
  await prisma.dailySummary.upsert({
    where: { userId_date: { userId, date } },
    update: { weightKg },
    create: { userId, date, weightKg, workoutCount: 0 },
  });
}

export async function syncDailySummaryAfterDelete(userId: string, date: Date) {
  const summary = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date } },
  });

  if (!summary) return;

  const remainingWeight = await prisma.weightRecord.findFirst({
    where: { userId, date },
    orderBy: { createdAt: "desc" },
    select: { weightKg: true },
  });

  const hasOtherData =
    summary.totalCalories !== null ||
    summary.totalProtein !== null ||
    summary.totalCarbs !== null ||
    summary.totalFat !== null ||
    summary.totalFiber !== null ||
    summary.workoutCount > 0 ||
    summary.workoutMinutes !== null;

  if (!remainingWeight && !hasOtherData) {
    await prisma.dailySummary.delete({
      where: { userId_date: { userId, date } },
    });
  } else if (!remainingWeight) {
    await prisma.dailySummary.update({
      where: { userId_date: { userId, date } },
      data: { weightKg: null },
    });
  } else {
    await prisma.dailySummary.update({
      where: { userId_date: { userId, date } },
      data: { weightKg: remainingWeight.weightKg },
    });
  }
}

export async function syncDailySummaryNutrition(userId: string, date: Date) {
  const meals = await prisma.meal.findMany({
    where: { userId, date },
    include: {
      mealFoods: {
        select: { calories: true, protein: true, carbs: true, fat: true, fiber: true },
      },
    },
  });

  const allFoods = meals.flatMap((m) => m.mealFoods);

  if (allFoods.length === 0) {
    const summary = await prisma.dailySummary.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!summary) return;

    const hasOther =
      summary.weightKg !== null ||
      summary.workoutCount > 0 ||
      summary.workoutMinutes !== null;

    if (!hasOther) {
      await prisma.dailySummary.delete({
        where: { userId_date: { userId, date } },
      });
    } else {
      await prisma.dailySummary.update({
        where: { userId_date: { userId, date } },
        data: {
          totalCalories: null,
          totalProtein: null,
          totalCarbs: null,
          totalFat: null,
          totalFiber: null,
        },
      });
    }
    return;
  }

  const sum = (key: "calories" | "protein" | "carbs" | "fat") =>
    allFoods.reduce((s, f) => s + Number(f[key]), 0);

  const fiberSum = allFoods.reduce((s, f) => s + (f.fiber ? Number(f.fiber) : 0), 0);

  await prisma.dailySummary.upsert({
    where: { userId_date: { userId, date } },
    update: {
      totalCalories: Math.round(sum("calories")),
      totalProtein: Math.round(sum("protein") * 10) / 10,
      totalCarbs: Math.round(sum("carbs") * 10) / 10,
      totalFat: Math.round(sum("fat") * 10) / 10,
      totalFiber: fiberSum > 0 ? Math.round(fiberSum * 10) / 10 : null,
    },
    create: {
      userId,
      date,
      totalCalories: Math.round(sum("calories")),
      totalProtein: Math.round(sum("protein") * 10) / 10,
      totalCarbs: Math.round(sum("carbs") * 10) / 10,
      totalFat: Math.round(sum("fat") * 10) / 10,
      totalFiber: fiberSum > 0 ? Math.round(fiberSum * 10) / 10 : null,
      workoutCount: 0,
    },
  });
}
