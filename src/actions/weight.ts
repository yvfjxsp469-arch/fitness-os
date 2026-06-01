"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { weightSchema } from "@/validators/weight";
import {
  upsertDailySummaryWeight,
  syncDailySummaryAfterDelete,
} from "@/lib/fitness/sync-daily-summary";

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
    where: { userId_date: { userId, date: new Date(date) } },
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

  const old = await prisma.weightRecord.findUnique({
    where: { id },
    select: { date: true },
  });

  const record = await prisma.weightRecord.update({
    where: { id, userId },
    data: { date: new Date(date), weightKg, notes },
  });

  await upsertDailySummaryWeight(userId, record.date, weightKg);

  if (old && old.date.toISOString().slice(0, 10) !== record.date.toISOString().slice(0, 10)) {
    await syncDailySummaryAfterDelete(userId, old.date);
  }

  revalidatePath("/weight");
  revalidatePath("/");
  return { success: true };
}

export async function deleteWeightRecord(id: string) {
  const userId = await getUserId();

  const record = await prisma.weightRecord.delete({
    where: { id, userId },
  });

  await syncDailySummaryAfterDelete(userId, record.date);

  revalidatePath("/weight");
  revalidatePath("/");
  return { success: true };
}
