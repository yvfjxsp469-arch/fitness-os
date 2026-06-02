import { z } from "zod";

export const createWorkoutSchema = z.object({
  date: z.string().min(1, "请选择日期"),
  templateId: z.string().optional(),
  name: z.string().min(1, "请输入训练名称").max(200).optional(),
  type: z.enum(["STRENGTH", "CARDIO", "REST"]).optional(),
});

export const updateWorkoutSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["STRENGTH", "CARDIO", "REST"]).optional(),
  durationMin: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().min(0).max(600).optional()),
  rpe: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().min(1).max(10).optional()),
  notes: z.string().optional(),
});

export const addExerciseToWorkoutSchema = z.object({
  workoutId: z.string().min(1),
  exerciseId: z.string().min(1),
});

export const setSchema = z.object({
  workoutExerciseId: z.string().min(1),
  setNumber: z
    .string()
    .min(1)
    .transform(Number)
    .pipe(z.number().int().min(1).max(50)),
  weightKg: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().min(0).max(999).optional()),
  reps: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(0).max(200).optional()),
  rpe: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().min(1).max(10).optional()),
  isWarmup: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const updateSetSchema = setSchema.omit({ workoutExerciseId: true, setNumber: true });
