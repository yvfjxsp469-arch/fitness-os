"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  addExerciseToWorkoutSchema,
  setSchema,
  updateSetSchema,
} from "@/validators/training";
import { syncDailySummaryTraining } from "@/lib/fitness/sync-daily-summary";
import { calculateExercisePRs, type ExercisePR } from "@/lib/fitness/pr";
import type { WorkoutType } from "@prisma/client";

async function getUserId() {
  const userId = await getSession();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function createWorkout(formData: FormData) {
  const userId = await getUserId();
  const parsed = createWorkoutSchema.safeParse({
    date: formData.get("date"),
    templateId: formData.get("templateId") || undefined,
    name: formData.get("name") || undefined,
    type: formData.get("type") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, templateId, name: inputName, type } = parsed.data;

  await prisma.$transaction(async (tx) => {
    let workoutExercises: { exerciseId: string; order: number; notes?: string }[] = [];

    if (templateId) {
      const template = await tx.trainingTemplate.findUnique({
        where: { id: templateId },
        include: { exercises: { orderBy: { order: "asc" } } },
      });

      if (!template || template.userId !== userId) {
        throw new Error("模板不存在");
      }

      workoutExercises = template.exercises.map((te) => ({
        exerciseId: te.exerciseId,
        order: te.order,
      }));
    }

    const workout = await tx.workout.create({
      data: {
        userId,
        date: new Date(date),
        type: (type as WorkoutType) || "STRENGTH",
        name: inputName || templateId
          ? (await tx.trainingTemplate.findUnique({ where: { id: templateId } }))?.name || "训练"
          : "自定义训练",
        templateId: templateId || null,
        ...(workoutExercises.length > 0
          ? {
              exercises: {
                create: workoutExercises,
              },
            }
          : {}),
      },
    });

    await syncDailySummaryTraining(userId, workout.date);
  });

  revalidatePath("/training");
  revalidatePath("/");
  return { success: true };
}

export async function updateWorkout(id: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = updateWorkoutSchema.safeParse({
    name: formData.get("name") || undefined,
    type: formData.get("type") || undefined,
    durationMin: formData.get("durationMin") || undefined,
    rpe: formData.get("rpe") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const workout = await prisma.workout.findUnique({
    where: { id, userId },
    select: { date: true },
  });
  if (!workout) return { error: "训练不存在" };

  await prisma.$transaction(async (tx) => {
    await tx.workout.update({
      where: { id, userId },
      data: parsed.data,
    });
    await syncDailySummaryTraining(userId, workout.date);
  });

  revalidatePath("/training");
  revalidatePath("/");
  return { success: true };
}

export async function deleteWorkout(id: string) {
  const userId = await getUserId();

  const workout = await prisma.workout.findUnique({
    where: { id, userId },
    select: { date: true },
  });
  if (!workout) return { error: "训练不存在" };

  await prisma.$transaction(async (tx) => {
    await tx.workout.delete({ where: { id, userId } });
    await syncDailySummaryTraining(userId, workout.date);
  });

  revalidatePath("/training");
  revalidatePath("/");
  return { success: true };
}

export async function addExerciseToWorkout(formData: FormData) {
  const userId = await getUserId();
  const parsed = addExerciseToWorkoutSchema.safeParse({
    workoutId: formData.get("workoutId"),
    exerciseId: formData.get("exerciseId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { workoutId, exerciseId } = parsed.data;

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId, userId },
    select: { id: true },
  });
  if (!workout) return { error: "训练不存在" };

  const maxOrder = await prisma.workoutExercise.findFirst({
    where: { workoutId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.workoutExercise.create({
    data: {
      workoutId,
      exerciseId,
      order: (maxOrder?.order ?? 0) + 1,
    },
  });

  revalidatePath("/training");
  return { success: true };
}

export async function removeExerciseFromWorkout(id: string) {
  const userId = await getUserId();

  const we = await prisma.workoutExercise.findUnique({
    where: { id },
    include: { workout: { select: { userId: true } } },
  });
  if (!we || we.workout.userId !== userId) {
    return { error: "动作不存在" };
  }

  await prisma.workoutExercise.delete({ where: { id } });

  revalidatePath("/training");
  return { success: true };
}

export async function addSet(formData: FormData) {
  const userId = await getUserId();
  const parsed = setSchema.safeParse({
    workoutExerciseId: formData.get("workoutExerciseId"),
    setNumber: formData.get("setNumber"),
    weightKg: formData.get("weightKg") || undefined,
    reps: formData.get("reps") || undefined,
    rpe: formData.get("rpe") || undefined,
    isWarmup: formData.get("isWarmup") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const we = await prisma.workoutExercise.findUnique({
    where: { id: parsed.data.workoutExerciseId },
    include: { workout: { select: { userId: true } } },
  });
  if (!we || we.workout.userId !== userId) {
    return { error: "动作不存在" };
  }

  await prisma.exerciseSet.create({
    data: parsed.data,
  });

  revalidatePath("/training");
  return { success: true };
}

export async function updateSet(id: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = updateSetSchema.safeParse({
    weightKg: formData.get("weightKg") || undefined,
    reps: formData.get("reps") || undefined,
    rpe: formData.get("rpe") || undefined,
    isWarmup: formData.get("isWarmup") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const set = await prisma.exerciseSet.findUnique({
    where: { id },
    include: { workoutExercise: { include: { workout: { select: { userId: true } } } } },
  });
  if (!set || set.workoutExercise.workout.userId !== userId) {
    return { error: "组不存在" };
  }

  await prisma.exerciseSet.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/training");
  return { success: true };
}

export async function deleteSet(id: string) {
  const userId = await getUserId();

  const set = await prisma.exerciseSet.findUnique({
    where: { id },
    include: { workoutExercise: { include: { workout: { select: { userId: true } } } } },
  });
  if (!set || set.workoutExercise.workout.userId !== userId) {
    return { error: "组不存在" };
  }

  await prisma.exerciseSet.delete({ where: { id } });

  revalidatePath("/training");
  return { success: true };
}

export async function checkExercisePR(exerciseId: string): Promise<{ pr: ExercisePR | null }> {
  const userId = await getUserId();
  const prs = await calculateExercisePRs(userId);
  return { pr: prs.get(exerciseId) ?? null };
}
