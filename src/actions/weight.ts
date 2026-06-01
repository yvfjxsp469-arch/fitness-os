"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { weightSchema } from "@/validators/weight";

async function getUserId() {
  const userId = await getSession();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function createWeightRecord(formData: FormData) {
  const userId = await getUserId();
  const parsed = weightSchema.safeParse({
    date: formData.get("date"),
    weightKg: formData.get("weightKg"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, weightKg, notes } = parsed.data;

  await prisma.weightRecord.upsert({
    where: {
      userId_date: { userId, date: new Date(date) },
    },
    update: { weightKg, notes },
    create: { userId, date: new Date(date), weightKg, notes },
  });

  await upsertDailySummaryWeight(userId, new Date(date), weightKg);

  revalidatePath("/weight");
  revalidatePath("/");
  return { success: true };
}

export async function updateWeightRecord(id: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = weightSchema.safeParse({
    date: formData.get("date"),
    weightKg: formData.get("weightKg"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, weightKg, notes } = parsed.data;

  const record = await prisma.weightRecord.update({
    where: { id, userId },
    data: { date: new Date(date), weightKg, notes },
  });

  await upsertDailySummaryWeight(userId, record.date, weightKg);

  revalidatePath("/weight");
  revalidatePath("/");
  return { success: true };
}

export async function deleteWeightRecord(id: string) {
  const userId = await getUserId();

  const record = await prisma.weightRecord.delete({
    where: { id, userId },
  });

  // Sync DailySummary: remove weight or set to latest remaining
  await syncDailySummaryAfterDelete(userId, record.date);

  revalidatePath("/weight");
  revalidatePath("/");
  return { success: true };
}

async function upsertDailySummaryWeight(
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

async function syncDailySummaryAfterDelete(userId: string, deletedDate: Date) {
  const latest = await prisma.weightRecord.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
  });

  const summary = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: deletedDate } },
  });

  if (summary) {
    if (latest && latest.date.getTime() === deletedDate.getTime()) {
      // Deleted record was the one in this day's summary; find the actual latest for that date
      const sameDay = await prisma.weightRecord.findFirst({
        where: { userId, date: deletedDate },
        orderBy: { createdAt: "desc" },
      });
      await prisma.dailySummary.update({
        where: { userId_date: { userId, date: deletedDate } },
        data: { weightKg: sameDay?.weightKg ?? null },
      });
    }
  }
}
