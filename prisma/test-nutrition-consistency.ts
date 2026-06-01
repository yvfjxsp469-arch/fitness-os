// Fitness OS — Nutrition ↔ DailySummary Consistency Test
// Run: npx tsx prisma/test-nutrition-consistency.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

const TEST_USER = "___test_nutrition___";
const T = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

let passed = 0;
let failed = 0;

function check(cond: boolean, msg: string) {
  if (cond) { passed++; console.log("  PASS " + msg); }
  else { failed++; console.error("  FAIL " + msg); }
}

// Mirror of syncDailySummaryNutrition for independent verification
async function syncNutrition(userId: string, date: string) {
  const meals = await prisma.meal.findMany({
    where: { userId, date: new Date(date) },
    include: {
      mealFoods: { select: { calories: true, protein: true, carbs: true, fat: true, fiber: true } },
    },
  });

  const allFoods = meals.flatMap((m) => m.mealFoods);

  if (allFoods.length === 0) {
    const summary = await prisma.dailySummary.findUnique({
      where: { userId_date: { userId, date: new Date(date) } },
    });
    if (!summary) return;

    const hasOther =
      summary.weightKg !== null ||
      summary.workoutCount > 0 ||
      summary.workoutMinutes !== null;

    if (!hasOther) {
      await prisma.dailySummary.delete({
        where: { userId_date: { userId, date: new Date(date) } },
      });
    } else {
      await prisma.dailySummary.update({
        where: { userId_date: { userId, date: new Date(date) } },
        data: { totalCalories: null, totalProtein: null, totalCarbs: null, totalFat: null, totalFiber: null },
      });
    }
    return;
  }

  const sum = (key: "calories" | "protein" | "carbs" | "fat") =>
    allFoods.reduce((s, f) => s + Number(f[key]), 0);
  const fiberSum = allFoods.reduce((s, f) => s + (f.fiber ? Number(f.fiber) : 0), 0);

  await prisma.dailySummary.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    update: {
      totalCalories: Math.round(sum("calories")),
      totalProtein: Math.round(sum("protein") * 10) / 10,
      totalCarbs: Math.round(sum("carbs") * 10) / 10,
      totalFat: Math.round(sum("fat") * 10) / 10,
      totalFiber: fiberSum > 0 ? Math.round(fiberSum * 10) / 10 : null,
    },
    create: {
      userId, date: new Date(date),
      totalCalories: Math.round(sum("calories")),
      totalProtein: Math.round(sum("protein") * 10) / 10,
      totalCarbs: Math.round(sum("carbs") * 10) / 10,
      totalFat: Math.round(sum("fat") * 10) / 10,
      totalFiber: fiberSum > 0 ? Math.round(fiberSum * 10) / 10 : null,
      workoutCount: 0,
    },
  });
}

function calcSnapshot(
  food: {
    caloriesPerServing: { toNumber?: () => number } | number;
    proteinPerServing: { toNumber?: () => number } | number;
    carbsPerServing: { toNumber?: () => number } | number;
    fatPerServing: { toNumber?: () => number } | number;
    fiberPerServing: { toNumber?: () => number } | number | null;
    servingSize: { toNumber?: () => number } | number;
  },
  servings: number
) {
  const n = (v: { toNumber?: () => number } | number) =>
    typeof v === "number" ? v : v.toNumber?.() ?? Number(v);
  const ratio = servings / n(food.servingSize);
  const round = (v: number) => Math.round(v * 10) / 10;
  return {
    calories: round(n(food.caloriesPerServing) * ratio),
    protein: round(n(food.proteinPerServing) * ratio),
    carbs: round(n(food.carbsPerServing) * ratio),
    fat: round(n(food.fatPerServing) * ratio),
    fiber: food.fiberPerServing ? round(n(food.fiberPerServing!) * ratio) : null,
    servings,
  };
}

async function main() {
  console.log("Nutrition Consistency Tests\n");

  const user = await prisma.user.upsert({
    where: { username: TEST_USER },
    update: {},
    create: { username: TEST_USER, passwordHash: "test", displayName: "Test" },
  });
  const uid = user.id;

  // Cleanup
  await prisma.mealFood.deleteMany({ where: { meal: { userId: uid } } });
  await prisma.meal.deleteMany({ where: { userId: uid } });
  await prisma.dailySummary.deleteMany({ where: { userId: uid } });
  await prisma.weightRecord.deleteMany({ where: { userId: uid } });

  // Get a food from the library
  const food = await prisma.food.findFirst({ where: { isDeleted: false } });
  if (!food) throw new Error("No food in library — run seed first");
  console.log(`Using food: ${food.name} (${food.caloriesPerServing}kcal/${food.servingSize}${food.servingUnit})\n`);

  // ── T1: Create Meal + MealFood → Summary created ──
  console.log("T1: Create Meal + MealFood → DailySummary created");
  const meal = await prisma.meal.create({
    data: { userId: uid, date: new Date(T(0)), mealType: "BREAKFAST" },
  });
  const snap1 = calcSnapshot(food as any, 2);
  await prisma.mealFood.create({
    data: { mealId: meal.id, foodId: food.id, ...snap1 },
  });
  await syncNutrition(uid, T(0));

  const ds1 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(0)) } },
  });
  check(ds1 !== null, "DailySummary exists");
  check(ds1!.totalCalories === Math.round(snap1.calories), `totalCalories = ${Math.round(snap1.calories)}`);
  check(Number(ds1!.totalProtein) === snap1.protein, `totalProtein = ${snap1.protein}`);

  // ── T2: Modify servings → Summary updated ──
  console.log("\nT2: Update servings → Summary updated");
  const mf = await prisma.mealFood.findFirst({ where: { mealId: meal.id } });
  const snap2 = calcSnapshot(food as any, 1.5);
  await prisma.mealFood.update({
    where: { id: mf!.id },
    data: { ...snap2 },
  });
  await syncNutrition(uid, T(0));

  const ds2 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(0)) } },
  });
  check(ds2!.totalCalories === Math.round(snap2.calories), `totalCalories = ${Math.round(snap2.calories)} (after servings change)`);

  // ── T3: Delete MealFood → Summary reduced ──
  console.log("\nT3: Delete MealFood → Summary cleaned");
  await prisma.mealFood.delete({ where: { id: mf!.id } });
  await syncNutrition(uid, T(0));

  const ds3 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(0)) } },
  });
  // Should be null/cleaned since meal has no foods and no other data
  check(ds3 === null, "DailySummary removed when no food data");

  // ── T4: Delete Meal (with foods) → Summary cleaned ──
  console.log("\nT4: Delete Meal → Summary cleaned");
  const meal4 = await prisma.meal.create({
    data: { userId: uid, date: new Date(T(-1)), mealType: "LUNCH" },
  });
  const snap4 = calcSnapshot(food as any, 3);
  await prisma.mealFood.create({
    data: { mealId: meal4.id, foodId: food.id, ...snap4 },
  });
  await syncNutrition(uid, T(-1));

  await prisma.meal.delete({ where: { id: meal4.id } });
  await syncNutrition(uid, T(-1));

  const ds4 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(-1)) } },
  });
  check(ds4 === null, "DailySummary removed after meal delete");

  // ── T5: Nutrition + Weight same date → coexist ──
  console.log("\nT5: Nutrition + Weight on same date → coexist");
  const meal5 = await prisma.meal.create({
    data: { userId: uid, date: new Date(T(-2)), mealType: "DINNER" },
  });
  const snap5 = calcSnapshot(food as any, 2);
  await prisma.mealFood.create({
    data: { mealId: meal5.id, foodId: food.id, ...snap5 },
  });
  await syncNutrition(uid, T(-2));

  // Add weight on same date
  await prisma.weightRecord.create({
    data: { userId: uid, date: new Date(T(-2)), weightKg: 114.0 },
  });
  await prisma.dailySummary.upsert({
    where: { userId_date: { userId: uid, date: new Date(T(-2)) } },
    update: { weightKg: 114.0 },
    create: { userId: uid, date: new Date(T(-2)), weightKg: 114.0, workoutCount: 0 },
  });

  const ds5 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(-2)) } },
  });
  check(ds5 !== null, "DailySummary exists");
  check(ds5!.totalCalories === Math.round(snap5.calories), "nutrition data preserved");
  check(Number(ds5!.weightKg) === 114.0, "weight data preserved");
  check(ds5!.workoutCount === 0, "workoutCount preserved");

  // Now delete the meal — should keep weight, clear nutrition
  await prisma.meal.delete({ where: { id: meal5.id } });
  await syncNutrition(uid, T(-2));

  const ds5b = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(-2)) } },
  });
  check(ds5b !== null, "DailySummary kept (has weight data)");
  check(ds5b!.totalCalories === null, "nutrition cleared");
  check(Number(ds5b!.weightKg) === 114.0, "weight still present");

  // Clean up weight
  await prisma.weightRecord.deleteMany({ where: { userId: uid, date: new Date(T(-2)) } });
  const remainingWR = await prisma.weightRecord.findFirst({ where: { userId: uid, date: new Date(T(-2)) } });
  if (!remainingWR) {
    const sumT2 = await prisma.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: new Date(T(-2)) } } });
    if (sumT2 && !sumT2.totalCalories && sumT2.workoutCount === 0) {
      await prisma.dailySummary.delete({ where: { userId_date: { userId: uid, date: new Date(T(-2)) } } });
    }
  }

  // ── T6: No orphan nutrition summaries ──
  console.log("\nT6: Orphan scan — multi-day seed + delete");
  // Seed 5 days of meals
  for (let i = 3; i <= 7; i++) {
    const m = await prisma.meal.create({
      data: { userId: uid, date: new Date(T(-i)), mealType: "BREAKFAST" },
    });
    const s = calcSnapshot(food as any, 1 + (i % 3));
    await prisma.mealFood.create({
      data: { mealId: m.id, foodId: food.id, ...s },
    });
    await syncNutrition(uid, T(-i));
  }

  // Delete middle day (T(-5))
  const midMeals = await prisma.meal.findMany({
    where: { userId: uid, date: new Date(T(-5)) },
  });
  for (const m of midMeals) {
    await prisma.meal.delete({ where: { id: m.id } });
  }
  await syncNutrition(uid, T(-5));

  // Scan for orphans
  const allSummaries = await prisma.dailySummary.findMany({ where: { userId: uid } });
  let orphans = 0;
  for (const s of allSummaries) {
    const hasMeals = await prisma.meal.findFirst({ where: { userId: uid, date: s.date } });
    const hasFoods = hasMeals
      ? await prisma.mealFood.findFirst({
          where: { meal: { userId: uid, date: s.date } },
        })
      : false;
    const hasWeight = await prisma.weightRecord.findFirst({ where: { userId: uid, date: s.date } });
    const hasOther = s.workoutCount > 0 || s.workoutMinutes !== null;

    if (!hasFoods && !hasWeight && !hasOther) {
      orphans++;
      console.error(`  ORPHAN: ${s.date.toISOString().slice(0, 10)}`);
    }

    // Check: if has nutrition data, must have mealFoods
    if (s.totalCalories !== null && !hasFoods) {
      orphans++;
      console.error(`  ORPHAN (has calories but no mealFoods): ${s.date.toISOString().slice(0, 10)}`);
    }
  }
  check(orphans === 0, `zero orphan daily_summaries (found ${orphans})`);

  // Check every date with MealFoods has a summary (empty meals don't need one)
  const datesWithFoods = await prisma.mealFood.findMany({
    where: { meal: { userId: uid } },
    select: { meal: { select: { date: true } } },
    distinct: ["mealId"],
  });
  const uniqueDates = [...new Set(datesWithFoods.map((mf) => mf.meal.date.toISOString().slice(0, 10)))];
  let missing = 0;
  for (const dateStr of uniqueDates) {
    const s = await prisma.dailySummary.findUnique({
      where: { userId_date: { userId: uid, date: new Date(dateStr) } },
    });
    if (!s) {
      missing++;
      console.error(`  MISSING Summary: ${dateStr}`);
    }
  }
  check(missing === 0, `every date with nutrition data has summary (missing ${missing})`);

  // ── Cleanup ──
  console.log("\n───────────────────────────────────");
  await prisma.mealFood.deleteMany({ where: { meal: { userId: uid } } });
  await prisma.meal.deleteMany({ where: { userId: uid } });
  await prisma.dailySummary.deleteMany({ where: { userId: uid } });
  await prisma.weightRecord.deleteMany({ where: { userId: uid } });
  await prisma.user.delete({ where: { id: uid } });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
