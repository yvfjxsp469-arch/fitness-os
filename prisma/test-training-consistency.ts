// Fitness OS — Training ↔ DailySummary Consistency Test
// Run: npx tsx prisma/test-training-consistency.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

const TEST_USER = "___test_training___";
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

// Mirror syncDailySummaryTraining for independent verification
async function syncTraining(userId: string, date: string) {
  const workouts = await prisma.workout.findMany({
    where: { userId, date: new Date(date) },
    select: { durationMin: true },
  });

  const workoutCount = workouts.length;
  const totalMinutes = workouts.reduce((s, w) => s + (w.durationMin ?? 0), 0);
  const workoutMinutes = totalMinutes > 0 ? totalMinutes : null;

  if (workoutCount === 0) {
    const summary = await prisma.dailySummary.findUnique({
      where: { userId_date: { userId, date: new Date(date) } },
    });
    if (!summary) return;

    const hasOther =
      summary.weightKg !== null ||
      summary.totalCalories !== null;

    if (!hasOther) {
      await prisma.dailySummary.delete({
        where: { userId_date: { userId, date: new Date(date) } },
      });
    } else {
      await prisma.dailySummary.update({
        where: { userId_date: { userId, date: new Date(date) } },
        data: { workoutCount: 0, workoutMinutes: null },
      });
    }
    return;
  }

  await prisma.dailySummary.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    update: { workoutCount, workoutMinutes },
    create: { userId, date: new Date(date), workoutCount, workoutMinutes },
  });
}

async function main() {
  console.log("Training Consistency Tests\n");

  const user = await prisma.user.upsert({
    where: { username: TEST_USER },
    update: {},
    create: { username: TEST_USER, passwordHash: "test", displayName: "Test" },
  });
  const uid = user.id;

  // Cleanup
  await prisma.exerciseSet.deleteMany({ where: { workoutExercise: { workout: { userId: uid } } } });
  await prisma.workoutExercise.deleteMany({ where: { workout: { userId: uid } } });
  await prisma.workout.deleteMany({ where: { userId: uid } });
  await prisma.dailySummary.deleteMany({ where: { userId: uid } });
  await prisma.weightRecord.deleteMany({ where: { userId: uid } });

  const exercise = await prisma.exercise.findFirst({ where: { isDeleted: false } });
  if (!exercise) throw new Error("No exercise in library — run seed first");
  console.log(`Using exercise: ${exercise.name}\n`);

  // ── T1: Create Workout → DailySummary.workoutCount = 1 ──
  console.log("T1: Create Workout → DailySummary.workoutCount = 1");
  const w1 = await prisma.workout.create({
    data: { userId: uid, date: new Date(T(0)), type: "STRENGTH", name: "Test Push" },
  });
  await syncTraining(uid, T(0));

  const ds1 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(0)) } },
  });
  check(ds1 !== null, "DailySummary exists");
  check(ds1!.workoutCount === 1, "workoutCount = 1");

  // ── T2: Add Exercise → WorkoutExercise created ──
  console.log("\nT2: Add Exercise + Sets");
  const we1 = await prisma.workoutExercise.create({
    data: { workoutId: w1.id, exerciseId: exercise.id, order: 1 },
  });
  check(we1 !== null, "WorkoutExercise created");

  // Add sets
  const s1 = await prisma.exerciseSet.create({
    data: { workoutExerciseId: we1.id, setNumber: 1, weightKg: 60, reps: 10, rpe: 7, isWarmup: true },
  });
  const s2 = await prisma.exerciseSet.create({
    data: { workoutExerciseId: we1.id, setNumber: 2, weightKg: 80, reps: 8, rpe: 8, isWarmup: false },
  });
  const s3 = await prisma.exerciseSet.create({
    data: { workoutExerciseId: we1.id, setNumber: 3, weightKg: 85, reps: 6, rpe: 9, isWarmup: false },
  });

  const setCount = await prisma.exerciseSet.count({ where: { workoutExerciseId: we1.id } });
  check(setCount === 3, "3 sets created");

  // ── T3: Update Set → data changed ──
  console.log("\nT3: Update Set");
  await prisma.exerciseSet.update({
    where: { id: s3.id },
    data: { weightKg: 87.5, reps: 5 },
  });
  const s3u = await prisma.exerciseSet.findUnique({ where: { id: s3.id } });
  check(Number(s3u!.weightKg) === 87.5, "weight updated to 87.5");
  check(s3u!.reps === 5, "reps updated to 5");

  // ── T4: Delete Set → removed ──
  console.log("\nT4: Delete Set");
  await prisma.exerciseSet.delete({ where: { id: s1.id } });
  const s1d = await prisma.exerciseSet.findUnique({ where: { id: s1.id } });
  check(s1d === null, "set deleted");
  const remaining = await prisma.exerciseSet.count({ where: { workoutExerciseId: we1.id } });
  check(remaining === 2, "2 sets remain");

  // ── T5: Update Workout duration → DailySummary updated ──
  console.log("\nT5: Update Workout duration → DailySummary.workoutMinutes updated");
  await prisma.workout.update({
    where: { id: w1.id },
    data: { durationMin: 55, rpe: 8 },
  });
  await syncTraining(uid, T(0));

  const ds5 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(0)) } },
  });
  check(ds5!.workoutCount === 1, "workoutCount still = 1");
  check(ds5!.workoutMinutes === 55, "workoutMinutes = 55");

  // ── T6: Second Workout same date → workoutCount = 2 ──
  console.log("\nT6: Second Workout → workoutCount = 2");
  const w2 = await prisma.workout.create({
    data: { userId: uid, date: new Date(T(0)), type: "CARDIO", name: "HIIT", durationMin: 30 },
  });
  await syncTraining(uid, T(0));

  const ds6 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(0)) } },
  });
  check(ds6!.workoutCount === 2, "workoutCount = 2");
  check(ds6!.workoutMinutes === 85, "workoutMinutes = 55 + 30 = 85");

  // ── T7: Delete Workout → cascade + sync ──
  console.log("\nT7: Delete Workout → cascade + DailySummary sync");
  await prisma.workout.delete({ where: { id: w2.id } });
  await syncTraining(uid, T(0));

  const ds7 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(0)) } },
  });
  check(ds7!.workoutCount === 1, "workoutCount back to 1");
  check(ds7!.workoutMinutes === 55, "workoutMinutes back to 55");

  // Verify cascade: w2 exercises/sets should be gone
  const w2ex = await prisma.workoutExercise.count({ where: { workoutId: w2.id } });
  check(w2ex === 0, "cascaded: workout exercises deleted");

  // ── T8: Delete last Workout → DailySummary cleaned ──
  console.log("\nT8: Delete last Workout → DailySummary cleaned");
  await prisma.workout.delete({ where: { id: w1.id } });
  await syncTraining(uid, T(0));

  const ds8 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(0)) } },
  });
  check(ds8 === null, "DailySummary deleted (no other data)");

  // Verify cascade
  const w1ex = await prisma.workoutExercise.count({ where: { workoutId: w1.id } });
  check(w1ex === 0, "cascaded: all workout exercises deleted");
  const w1sets = await prisma.exerciseSet.count({ where: { workoutExercise: { workoutId: w1.id } } });
  check(w1sets === 0, "cascaded: all sets deleted");

  // ── T9: Training + Weight coexist ──
  console.log("\nT9: Training + Weight on same date → coexist");
  const w9 = await prisma.workout.create({
    data: { userId: uid, date: new Date(T(-1)), type: "STRENGTH", name: "Leg Day", durationMin: 60 },
  });
  await syncTraining(uid, T(-1));

  await prisma.weightRecord.create({
    data: { userId: uid, date: new Date(T(-1)), weightKg: 114.0 },
  });
  await prisma.dailySummary.upsert({
    where: { userId_date: { userId: uid, date: new Date(T(-1)) } },
    update: { weightKg: 114.0 },
    create: { userId: uid, date: new Date(T(-1)), weightKg: 114.0, workoutCount: 1, workoutMinutes: 60 },
  });

  const ds9 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(-1)) } },
  });
  check(ds9 !== null, "DailySummary exists");
  check(ds9!.workoutCount === 1, "workoutCount = 1");
  check(ds9!.workoutMinutes === 60, "workoutMinutes = 60");
  check(Number(ds9!.weightKg) === 114.0, "weightKg = 114.0");

  // Delete training → keep weight
  await prisma.workout.delete({ where: { id: w9.id } });
  await syncTraining(uid, T(-1));

  const ds9b = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(-1)) } },
  });
  check(ds9b !== null, "DailySummary kept (has weight)");
  check(ds9b!.workoutCount === 0, "workoutCount = 0");
  check(ds9b!.workoutMinutes === null, "workoutMinutes = null");
  check(Number(ds9b!.weightKg) === 114.0, "weight preserved");

  // Cleanup weight
  await prisma.weightRecord.deleteMany({ where: { userId: uid, date: new Date(T(-1)) } });
  const rr = await prisma.weightRecord.findFirst({ where: { userId: uid, date: new Date(T(-1)) } });
  if (!rr) {
    const sum = await prisma.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: new Date(T(-1)) } } });
    if (sum && sum.workoutCount === 0) {
      await prisma.dailySummary.delete({ where: { userId_date: { userId: uid, date: new Date(T(-1)) } } });
    }
  }

  // ── T10: Training + Nutrition coexist ──
  console.log("\nT10: Training + Nutrition on same date → coexist");
  const w10 = await prisma.workout.create({
    data: { userId: uid, date: new Date(T(-2)), type: "STRENGTH", name: "Push", durationMin: 45 },
  });
  await syncTraining(uid, T(-2));

  const meal10 = await prisma.meal.create({
    data: { userId: uid, date: new Date(T(-2)), mealType: "BREAKFAST" },
  });
  const snap10 = await prisma.food.findFirst({ where: { isDeleted: false } });
  await prisma.mealFood.create({
    data: {
      mealId: meal10.id,
      foodId: snap10!.id,
      servings: 2,
      calories: 164,
      protein: 30,
      carbs: 0,
      fat: 4,
    },
  });
  await prisma.dailySummary.upsert({
    where: { userId_date: { userId: uid, date: new Date(T(-2)) } },
    update: { totalCalories: 164, totalProtein: 30, totalCarbs: 0, totalFat: 4 },
    create: {
      userId: uid, date: new Date(T(-2)),
      totalCalories: 164, totalProtein: 30, totalCarbs: 0, totalFat: 4,
      workoutCount: 1, workoutMinutes: 45,
    },
  });

  const ds10 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(-2)) } },
  });
  check(ds10 !== null, "DailySummary exists");
  check(ds10!.workoutCount === 1, "workoutCount = 1");
  check(ds10!.totalCalories === 164, "totalCalories = 164");

  // Delete training → keep nutrition
  await prisma.workout.delete({ where: { id: w10.id } });
  await syncTraining(uid, T(-2));

  const ds10b = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(-2)) } },
  });
  check(ds10b !== null, "DailySummary kept (has nutrition)");
  check(ds10b!.workoutCount === 0, "workoutCount = 0");
  check(ds10b!.totalCalories === 164, "nutrition preserved");

  // Cleanup T(-2)
  await prisma.mealFood.deleteMany({ where: { meal: { userId: uid, date: new Date(T(-2)) } } });
  await prisma.meal.deleteMany({ where: { userId: uid, date: new Date(T(-2)) } });
  const remaining10 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId: uid, date: new Date(T(-2)) } },
  });
  if (remaining10 && remaining10.workoutCount === 0 && remaining10.totalCalories === null) {
    await prisma.dailySummary.delete({ where: { userId_date: { userId: uid, date: new Date(T(-2)) } } });
  }

  // ── T11: Orphan scan ──
  console.log("\nT11: Orphan scan — multi-day seed + delete");
  // Seed training on D(-3) through D(-9)
  for (let i = 3; i <= 9; i++) {
    const w = await prisma.workout.create({
      data: { userId: uid, date: new Date(T(-i)), type: "STRENGTH", name: "Training D" + i, durationMin: 30 + i },
    });
    await prisma.workoutExercise.create({
      data: { workoutId: w.id, exerciseId: exercise.id, order: 1 },
    });
    await syncTraining(uid, T(-i));
  }

  // Delete D(-6) workout
  const midW = await prisma.workout.findFirst({
    where: { userId: uid, date: new Date(T(-6)) },
  });
  await prisma.workout.delete({ where: { id: midW!.id } });
  await syncTraining(uid, T(-6));

  // Scan orphans
  const allSummaries = await prisma.dailySummary.findMany({ where: { userId: uid } });
  let orphans = 0;
  for (const s of allSummaries) {
    const hasWorkouts = await prisma.workout.findFirst({
      where: { userId: uid, date: s.date },
    });
    const hasOther =
      s.weightKg !== null ||
      s.totalCalories !== null;

    if (!hasWorkouts && !hasOther) {
      orphans++;
      console.error(`  ORPHAN: ${s.date.toISOString().slice(0, 10)}`);
    }
  }
  check(orphans === 0, `zero orphan daily_summaries (found ${orphans})`);

  // Every date with workouts must have a summary
  const workoutDates = await prisma.workout.findMany({
    where: { userId: uid },
    select: { date: true },
    distinct: ["date"],
  });
  let missing = 0;
  for (const w of workoutDates) {
    const s = await prisma.dailySummary.findUnique({
      where: { userId_date: { userId: uid, date: w.date } },
    });
    if (!s) {
      missing++;
      console.error(`  MISSING Summary: ${w.date.toISOString().slice(0, 10)}`);
    }
  }
  check(missing === 0, `every workout date has summary (missing ${missing})`);

  // ── T12: PR calculation ──
  console.log("\nT12: PR calculation (Epley 1RM)");

  // Create workout with 3 sets for PR testing
  const wPR = await prisma.workout.create({
    data: { userId: uid, date: new Date(T(-10)), type: "STRENGTH", name: "Bench PR Test" },
  });
  const wePR = await prisma.workoutExercise.create({
    data: { workoutId: wPR.id, exerciseId: exercise.id, order: 1 },
  });

  // 60kg × 10 → 1RM = 60 × (1 + 10/30) = 80.0
  // 80kg × 8 → 1RM = 80 × (1 + 8/30) = 101.3
  // 85kg × 5 → 1RM = 85 × (1 + 5/30) = 99.2
  // Best should be 80×8 = 101.3
  await prisma.exerciseSet.createMany({
    data: [
      { workoutExerciseId: wePR.id, setNumber: 1, weightKg: 60, reps: 10, isWarmup: true },
      { workoutExerciseId: wePR.id, setNumber: 2, weightKg: 80, reps: 8, isWarmup: false },
      { workoutExerciseId: wePR.id, setNumber: 3, weightKg: 85, reps: 5, isWarmup: false },
    ],
  });

  // Manual PR calculation
  const allSets = await prisma.exerciseSet.findMany({
    where: {
      isWarmup: false,
      weightKg: { not: null },
      reps: { not: null },
      workoutExercise: { exerciseId: exercise.id, workout: { userId: uid } },
    },
  });

  let best1RM = 0;
  let bestWeight = 0;
  let bestVolume = 0;
  for (const s of allSets) {
    const w = Number(s.weightKg);
    const r = Number(s.reps!);
    const rm1 = w * (1 + r / 30);
    if (rm1 > best1RM) best1RM = rm1;
    if (w > bestWeight) bestWeight = w;
    if (w * r > bestVolume) bestVolume = w * r;
  }

  // 80 × 8 = 80 × 1.267 = 101.3
  const expected1RM = Math.round(80 * (1 + 8 / 30) * 10) / 10;
  check(Math.abs(best1RM - expected1RM) < 0.1, `best 1RM = ${expected1RM} (from 80kg×8)`);
  check(bestWeight === 85, "best weight = 85kg");
  check(bestVolume === 640, "best volume = 80×8 = 640");

  // ── Cleanup ──
  console.log("\n───────────────────────────────────");
  await prisma.exerciseSet.deleteMany({ where: { workoutExercise: { workout: { userId: uid } } } });
  await prisma.workoutExercise.deleteMany({ where: { workout: { userId: uid } } });
  await prisma.workout.deleteMany({ where: { userId: uid } });
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
