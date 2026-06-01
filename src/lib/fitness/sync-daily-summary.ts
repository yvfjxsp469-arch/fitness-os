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
