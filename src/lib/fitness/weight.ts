import { WeightRecord } from "@prisma/client";

export interface WeightWithMA7 {
  date: Date;
  weightKg: number;
  ma7: number | null;
}

export function calcMovingAverage(
  records: { date: Date; weightKg: number }[],
  windowSize: number = 7
): WeightWithMA7[] {
  return records.map((r, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const window = records.slice(start, i + 1);
    const sum = window.reduce((s, w) => s + Number(w.weightKg), 0);
    const ma7 = window.length >= 3 ? sum / window.length : null;
    return {
      date: r.date,
      weightKg: Number(r.weightKg),
      ma7: ma7 !== null ? Math.round(ma7 * 100) / 100 : null,
    };
  });
}

export function getLatestMA7(records: WeightWithMA7[]): number | null {
  const withMA = records.filter((r) => r.ma7 !== null);
  if (withMA.length === 0) return null;
  return withMA[withMA.length - 1].ma7;
}
