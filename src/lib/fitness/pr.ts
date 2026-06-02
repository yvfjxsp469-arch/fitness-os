import { prisma } from "@/lib/prisma";

export interface ExercisePR {
  exerciseId: string;
  exerciseName: string;
  best1RM: number | null;
  best1RMReps: number | null;
  best1RMWeight: number | null;
  bestWeight: number | null;
  bestWeightReps: number | null;
  bestVolume: number | null;
  bestVolumeReps: number | null;
  bestVolumeWeight: number | null;
}

function epley1RM(weightKg: number, reps: number): number {
  if (reps > 12) return weightKg; // Beyond 12 reps, 1RM formula unreliable
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export async function calculateExercisePRs(userId: string): Promise<Map<string, ExercisePR>> {
  const sets = await prisma.exerciseSet.findMany({
    where: {
      isWarmup: false,
      weightKg: { not: null },
      reps: { not: null },
      workoutExercise: {
        workout: { userId },
      },
    },
    select: {
      weightKg: true,
      reps: true,
      workoutExercise: {
        select: {
          exerciseId: true,
          exercise: { select: { name: true } },
        },
      },
    },
  });

  const prMap = new Map<string, ExercisePR>();

  for (const s of sets) {
    const eid = s.workoutExercise.exerciseId;
    const w = Number(s.weightKg);
    const r = Number(s.reps);
    const volume = w * r;
    const rm1 = epley1RM(w, r);

    const existing = prMap.get(eid);
    if (!existing) {
      prMap.set(eid, {
        exerciseId: eid,
        exerciseName: s.workoutExercise.exercise.name,
        best1RM: rm1,
        best1RMReps: r,
        best1RMWeight: w,
        bestWeight: w,
        bestWeightReps: r,
        bestVolume: volume,
        bestVolumeReps: r,
        bestVolumeWeight: w,
      });
      continue;
    }

    if (rm1 > (existing.best1RM ?? 0)) {
      existing.best1RM = rm1;
      existing.best1RMReps = r;
      existing.best1RMWeight = w;
    }
    if (w > (existing.bestWeight ?? 0)) {
      existing.bestWeight = w;
      existing.bestWeightReps = r;
    }
    if (volume > (existing.bestVolume ?? 0)) {
      existing.bestVolume = volume;
      existing.bestVolumeReps = r;
      existing.bestVolumeWeight = w;
    }
  }

  return prMap;
}

export async function getExercisePR(userId: string, exerciseId: string): Promise<ExercisePR | null> {
  const prs = await calculateExercisePRs(userId);
  return prs.get(exerciseId) ?? null;
}
