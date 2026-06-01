import { z } from "zod";

export const mealTypeEnum = z.enum([
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK1",
  "SNACK2",
]);

export const createMealSchema = z.object({
  date: z.string().min(1, "请选择日期"),
  mealType: mealTypeEnum,
});

export const addFoodToMealSchema = z.object({
  mealId: z.string().min(1),
  foodId: z.string().min(1),
  servings: z
    .string()
    .min(1, "请输入份数")
    .transform(Number)
    .pipe(z.number().min(0.1).max(100)),
});

export const updateMealFoodSchema = z.object({
  id: z.string().min(1),
  servings: z
    .string()
    .min(1, "请输入份数")
    .transform(Number)
    .pipe(z.number().min(0.1).max(100)),
});

export const createCustomFoodSchema = z.object({
  name: z.string().min(1, "请输入食物名称").max(100),
  category: z.enum([
    "STAPLE",
    "MEAT",
    "DAIRY",
    "VEGETABLE",
    "FRUIT",
    "FAT",
    "CONDIMENT",
    "SNACK",
  ]),
  servingSize: z
    .string()
    .min(1)
    .transform(Number)
    .pipe(z.number().min(1).max(10000)),
  servingUnit: z.string().min(1).max(10),
  caloriesPerServing: z
    .string()
    .min(1)
    .transform(Number)
    .pipe(z.number().min(0).max(9000)),
  proteinPerServing: z
    .string()
    .min(1)
    .transform(Number)
    .pipe(z.number().min(0).max(1000)),
  carbsPerServing: z
    .string()
    .min(1)
    .transform(Number)
    .pipe(z.number().min(0).max(1000)),
  fatPerServing: z
    .string()
    .min(1)
    .transform(Number)
    .pipe(z.number().min(0).max(1000)),
  fiberPerServing: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().min(0).max(1000).optional()),
});
