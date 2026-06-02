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
  const twelveWeeksAgo = getChinaDaysAgo(today, 83); // 12 * 7 = 84 days, -1 for inclusive
  const range = getChinaDateRange(twelveWeeksAgo, today);

  const workouts = await prisma.workout.findMany({
    where: { userId, date: range },
    include: {
      exercises: {
        include: {
          exercise: { select: { id: true, name: true, muscleGroup: true } },
          sets: {
            where: {
              isWarmup: false,
              weightKg: { not: null },
              reps: { not: null },
            },
            select: { weightKg: true, reps: true },
          },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  // --- Monthly stats ---
  const monthRange = getChinaMonthRange(today);
  let monthlyWorkouts = 0;
  let monthlyMinutes = 0;

  // --- Weekly grouping ---
  const currentMonday = getChinaMonday(today);
  const weeklyTemplate = new Map<string, TrainingChartData>();

  // Pre-fill 12 weeks
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

    // Monthly aggregation
    if (w.date >= monthRange.gte && w.date <= monthRange.lte) {
      monthlyWorkouts++;
      monthlyMinutes += w.durationMin ?? 0;
    }

    // Weekly aggregation
    const weekKey = getChinaMonday(dateStr);
    const week = weeklyTemplate.get(weekKey);
    if (week) {
      week.count++;
      week.minutes += w.durationMin ?? 0;
      if (w.type === "STRENGTH") week.strength++;
      else if (w.type === "CARDIO") week.cardio++;
      else week.rest++;
    }

    // Muscle groups + PRs
    for (const we of w.exercises) {
      const mg = we.exercise.muscleGroup;
      muscleCount.set(mg, (muscleCount.get(mg) ?? 0) + 1);

      const eid = we.exercise.id;
      for (const s of we.sets) {
        const weight = Number(s.weightKg);
        const reps = s.reps!;
        const rm1 = epley1RM(weight, reps);
        const volume = weight * reps;

        const existing = prMap.get(eid);
        if (!existing) {
          prMap.set(eid, {
            exerciseId: eid,
            exerciseName: we.exercise.name,
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

  // Weekly data in order
  const weeklyData = [...weeklyTemplate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  // Avg workouts per week (only weeks with data)
  const activeWeeks = weeklyData.filter((w) => w.count > 0);
  const avgWorkoutsPerWeek =
    activeWeeks.length > 0
      ? Math.round((activeWeeks.reduce((s, w) => s + w.count, 0) / activeWeeks.length) * 10) / 10
      : 0;

  // Top muscle groups (sorted descending, top 6)
  const topMuscleGroups = [...muscleCount.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([group, count]) => ({ group, count }));

  // PRs sorted by best1RM descending
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
