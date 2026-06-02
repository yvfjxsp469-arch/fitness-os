import { prisma } from "@/lib/prisma";
import {
  getChinaToday,
  getChinaDaysAgo,
  getChinaDateRange,
  getChinaMonthRange,
  getChinaMonday,
  formatChinaShortDate,
} from "@/lib/date";
import type { ExercisePR } from "@/lib/fitness/pr";

export interface TrainingChartData {
  week: string;
  strength: number;
  cardio: number;
  rest: number;
  count: number;
  minutes: number;
}

export interface TrainingAnalytics {
  monthlyWorkouts: number;
  monthlyMinutes: number;
  avgWorkoutsPerWeek: number;
  topMuscleGroups: { group: string; count: number }[];
  weeklyData: TrainingChartData[];
  prs: [string, ExercisePR][];
}

function epley1RM(weightKg: number, reps: number): number {
  if (reps > 12) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export async function getTrainingAnalytics(userId: string): Promise<TrainingAnalytics> {
  const today = getChinaToday();
  const twelveWeeksAgo = getChinaDaysAgo(today, 83);
  const range = getChinaDateRange(twelveWeeksAgo, today);

  // Round 1: workouts only (no includes)
  const workouts = await prisma.workout.findMany({
    where: { userId, date: range },
    orderBy: { date: "asc" },
  });

  if (workouts.length === 0) {
    const currentMonday = getChinaMonday(today);
    const weeklyTemplate = new Map<string, TrainingChartData>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(currentMonday);
      d.setUTCDate(d.getUTCDate() - (11 - i) * 7);
      const key = d.toISOString().slice(0, 10);
      weeklyTemplate.set(key, {
        week: formatChinaShortDate(d),
        strength: 0,
        cardio: 0,
        rest: 0,
        count: 0,
        minutes: 0,
      });
    }
    return {
      monthlyWorkouts: 0,
      monthlyMinutes: 0,
      avgWorkoutsPerWeek: 0,
      topMuscleGroups: [],
      weeklyData: [...weeklyTemplate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v),
      prs: [],
    };
  }

  const workoutIds = workouts.map((w) => w.id);

  // Round 2: workout exercises
  const workoutExercises = await prisma.workoutExercise.findMany({
    where: { workoutId: { in: workoutIds } },
    select: { id: true, workoutId: true, exerciseId: true },
  });

  const exerciseIds = [...new Set(workoutExercises.map((we) => we.exerciseId))];
  const weIds = workoutExercises.map((we) => we.id);

  // Round 3: exercises + filtered sets in parallel
  const [exercises, exerciseSets] = await Promise.all([
    exerciseIds.length > 0
      ? prisma.exercise.findMany({
          where: { id: { in: exerciseIds } },
          select: { id: true, name: true, muscleGroup: true },
        })
      : [],
    weIds.length > 0
      ? prisma.exerciseSet.findMany({
          where: {
            workoutExerciseId: { in: weIds },
            isWarmup: false,
            weightKg: { not: null },
            reps: { not: null },
          },
          select: { workoutExerciseId: true, weightKg: true, reps: true },
        })
      : [],
  ]);

  // Build lookup maps
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));
  const setsByWEId = new Map<string, { weightKg: number; reps: number }[]>();
  for (const s of exerciseSets) {
    if (s.weightKg === null || s.reps === null) continue;
    const arr = setsByWEId.get(s.workoutExerciseId);
    if (arr) arr.push({ weightKg: Number(s.weightKg), reps: s.reps });
    else setsByWEId.set(s.workoutExerciseId, [{ weightKg: Number(s.weightKg), reps: s.reps }]);
  }
  const weByWorkoutId = new Map<string, typeof workoutExercises>();
  for (const we of workoutExercises) {
    const arr = weByWorkoutId.get(we.workoutId);
    if (arr) arr.push(we);
    else weByWorkoutId.set(we.workoutId, [we]);
  }

  // --- Monthly stats ---
  const monthRange = getChinaMonthRange(today);
  let monthlyWorkouts = 0;
  let monthlyMinutes = 0;

  // --- Weekly grouping ---
  const currentMonday = getChinaMonday(today);
  const weeklyTemplate = new Map<string, TrainingChartData>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentMonday);
    d.setUTCDate(d.getUTCDate() - (11 - i) * 7);
    const key = d.toISOString().slice(0, 10);
    weeklyTemplate.set(key, {
      week: formatChinaShortDate(d),
      strength: 0,
      cardio: 0,
      rest: 0,
      count: 0,
      minutes: 0,
    });
  }

  // --- Muscle group counts ---
  const muscleCount = new Map<string, number>();

  // --- PR map ---
  const prMap = new Map<string, ExercisePR>();

  for (const w of workouts) {
    const dateStr = w.date.toISOString().slice(0, 10);

    if (w.date >= monthRange.gte && w.date <= monthRange.lte) {
      monthlyWorkouts++;
      monthlyMinutes += w.durationMin ?? 0;
    }

    const weekKey = getChinaMonday(dateStr);
    const week = weeklyTemplate.get(weekKey);
    if (week) {
      week.count++;
      week.minutes += w.durationMin ?? 0;
      if (w.type === "STRENGTH") week.strength++;
      else if (w.type === "CARDIO") week.cardio++;
      else week.rest++;
    }

    const weList = weByWorkoutId.get(w.id);
    if (!weList) continue;

    for (const we of weList) {
      const ex = exerciseMap.get(we.exerciseId);
      if (!ex) continue;

      const mg = ex.muscleGroup;
      muscleCount.set(mg, (muscleCount.get(mg) ?? 0) + 1);

      const eid = ex.id;
      const sList = setsByWEId.get(we.id);
      if (!sList) continue;

      for (const s of sList) {
        const weight = s.weightKg;
        const reps = s.reps;
        const rm1 = epley1RM(weight, reps);
        const volume = weight * reps;

        const existing = prMap.get(eid);
        if (!existing) {
          prMap.set(eid, {
            exerciseId: eid,
            exerciseName: ex.name,
            best1RM: rm1,
            best1RMReps: reps,
            best1RMWeight: weight,
            bestWeight: weight,
            bestWeightReps: reps,
            bestVolume: volume,
            bestVolumeReps: reps,
            bestVolumeWeight: weight,
          });
        } else {
          if (rm1 > (existing.best1RM ?? 0)) {
            existing.best1RM = rm1;
            existing.best1RMReps = reps;
            existing.best1RMWeight = weight;
          }
          if (weight > (existing.bestWeight ?? 0)) {
            existing.bestWeight = weight;
            existing.bestWeightReps = reps;
          }
          if (volume > (existing.bestVolume ?? 0)) {
            existing.bestVolume = volume;
            existing.bestVolumeReps = reps;
            existing.bestVolumeWeight = weight;
          }
        }
      }
    }
  }

  const weeklyData = [...weeklyTemplate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const activeWeeks = weeklyData.filter((w) => w.count > 0);
  const avgWorkoutsPerWeek =
    activeWeeks.length > 0
      ? Math.round((activeWeeks.reduce((s, w) => s + w.count, 0) / activeWeeks.length) * 10) / 10
      : 0;

  const topMuscleGroups = [...muscleCount.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([group, count]) => ({ group, count }));

  const prs = [...prMap.entries()].sort(
    ([, a], [, b]) => (b.best1RM ?? 0) - (a.best1RM ?? 0)
  );

  return {
    monthlyWorkouts,
    monthlyMinutes,
    avgWorkoutsPerWeek,
    topMuscleGroups,
    weeklyData,
    prs,
  };
}
