"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  createMealSchema,
  addFoodToMealSchema,
  updateMealFoodSchema,
  createCustomFoodSchema,
} from "@/validators/nutrition";
import { syncDailySummaryNutrition } from "@/lib/fitness/sync-daily-summary";
import type { FoodCategory, Prisma } from "@prisma/client";

async function getUserId() {
  const userId = await getSession();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

function calcSnapshot(food: {
  caloriesPerServing: Prisma.Decimal;
  proteinPerServing: Prisma.Decimal;
  carbsPerServing: Prisma.Decimal;
  fatPerServing: Prisma.Decimal;
  fiberPerServing: Prisma.Decimal | null;
  servingSize: Prisma.Decimal;
}, servings: number) {
  const ratio = servings / Number(food.servingSize);
  const round = (v: number) => Math.round(v * 10) / 10;
  return {
    calories: round(Number(food.caloriesPerServing) * ratio),
    protein: round(Number(food.proteinPerServing) * ratio),
    carbs: round(Number(food.carbsPerServing) * ratio),
    fat: round(Number(food.fatPerServing) * ratio),
    fiber: food.fiberPerServing ? round(Number(food.fiberPerServing) * ratio) : null,
  };
}

export async function createMeal(formData: FormData) {
  const userId = await getUserId();
  const parsed = createMealSchema.safeParse({
    date: formData.get("date"),
    mealType: formData.get("mealType"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, mealType } = parsed.data;

  const existing = await prisma.meal.findFirst({
    where: { userId, date: new Date(date), mealType },
  });
  if (existing) {
    return { success: true, mealId: existing.id };
  }

  const meal = await prisma.meal.create({
    data: { userId, date: new Date(date), mealType },
  });

  revalidatePath("/nutrition");
  return { success: true, mealId: meal.id };
}

export async function deleteMeal(id: string) {
  const userId = await getUserId();

  const meal = await prisma.meal.findUnique({
    where: { id, userId },
    select: { date: true },
  });
  if (!meal) return { error: "餐次不存在" };

  await prisma.$transaction(async (tx) => {
    await tx.meal.delete({ where: { id, userId } });
    await syncDailySummaryNutrition(userId, meal.date);
  });

  revalidatePath("/nutrition");
  revalidatePath("/");
  return { success: true };
}

export async function addFoodToMeal(formData: FormData) {
  const userId = await getUserId();
  const parsed = addFoodToMealSchema.safeParse({
    mealId: formData.get("mealId"),
    foodId: formData.get("foodId"),
    servings: formData.get("servings"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { mealId, foodId, servings } = parsed.data;

  const [meal, food] = await Promise.all([
    prisma.meal.findUnique({ where: { id: mealId, userId }, select: { date: true } }),
    prisma.food.findUnique({ where: { id: foodId } }),
  ]);

  if (!meal) return { error: "餐次不存在" };
  if (!food) return { error: "食物不存在" };

  const snapshot = calcSnapshot(food, servings);

  await prisma.$transaction(async (tx) => {
    await tx.mealFood.create({
      data: { mealId, foodId, servings, ...snapshot },
    });
    await syncDailySummaryNutrition(userId, meal.date);
  });

  revalidatePath("/nutrition");
  revalidatePath("/");
  return { success: true };
}

export async function updateMealFoodServings(formData: FormData) {
  const userId = await getUserId();
  const parsed = updateMealFoodSchema.safeParse({
    id: formData.get("id"),
    servings: formData.get("servings"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { id, servings } = parsed.data;

  const mealFood = await prisma.mealFood.findUnique({
    where: { id },
    include: {
      meal: { select: { userId: true, date: true } },
      food: true,
    },
  });

  if (!mealFood || mealFood.meal.userId !== userId) {
    return { error: "记录不存在" };
  }

  const snapshot = calcSnapshot(mealFood.food, servings);

  await prisma.$transaction(async (tx) => {
    await tx.mealFood.update({
      where: { id },
      data: { servings, ...snapshot },
    });
    await syncDailySummaryNutrition(userId, mealFood.meal.date);
  });

  revalidatePath("/nutrition");
  revalidatePath("/");
  return { success: true };
}

export async function removeFoodFromMeal(id: string) {
  const userId = await getUserId();

  const mealFood = await prisma.mealFood.findUnique({
    where: { id },
    include: { meal: { select: { userId: true, date: true } } },
  });

  if (!mealFood || mealFood.meal.userId !== userId) {
    return { error: "记录不存在" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.mealFood.delete({ where: { id } });
    await syncDailySummaryNutrition(userId, mealFood.meal.date);
  });

  revalidatePath("/nutrition");
  revalidatePath("/");
  return { success: true };
}

export async function createCustomFood(formData: FormData) {
  const userId = await getUserId();
  const parsed = createCustomFoodSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    servingSize: formData.get("servingSize"),
    servingUnit: formData.get("servingUnit"),
    caloriesPerServing: formData.get("caloriesPerServing"),
    proteinPerServing: formData.get("proteinPerServing"),
    carbsPerServing: formData.get("carbsPerServing"),
    fatPerServing: formData.get("fatPerServing"),
    fiberPerServing: formData.get("fiberPerServing") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  await prisma.food.create({
    data: {
      name: data.name,
      category: data.category as FoodCategory,
      servingSize: data.servingSize,
      servingUnit: data.servingUnit,
      caloriesPerServing: data.caloriesPerServing,
      proteinPerServing: data.proteinPerServing,
      carbsPerServing: data.carbsPerServing,
      fatPerServing: data.fatPerServing,
      fiberPerServing: data.fiberPerServing ?? null,
      isCustom: true,
      creatorId: userId,
    },
  });

  revalidatePath("/nutrition");
  return { success: true };
}

// Cursor-based food search (not a Server Action — called from RSC)
export async function searchFoods(params: {
  userId: string;
  search?: string;
  category?: string;
  cursor?: string;
  take?: number;
}) {
  const { userId, search, category, cursor, take = 20 } = params;

  const where: Prisma.FoodWhereInput = {
    isDeleted: false,
    OR: [{ isCustom: false }, { creatorId: userId }],
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
    ...(category && { category: category as FoodCategory }),
  };

  const foods = await prisma.food.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = foods.length > take;
  const items = hasMore ? foods.slice(0, take) : foods;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return { items, nextCursor };
}
