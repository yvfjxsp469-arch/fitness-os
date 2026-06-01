import { z } from "zod";

export const weightSchema = z.object({
  date: z.string().min(1, "请选择日期"),
  weightKg: z
    .string()
    .min(1, "请输入体重")
    .transform((v) => Number(v))
    .pipe(z.number().min(30, "体重不能低于30kg").max(300, "体重不能超过300kg")),
  notes: z.string().optional(),
});

export type WeightInput = z.infer<typeof weightSchema>;
