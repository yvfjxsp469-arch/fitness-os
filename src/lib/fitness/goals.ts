export interface GoalProgressResult {
  percentage: number;
  current: number;
  target: number;
  start: number;
  total: number;
  achieved: number;
  remaining: number;
}

export function calculateGoalProgress(
  currentValue: number,
  startValue: number,
  targetValue: number
): GoalProgressResult {
  const total = Math.abs(startValue - targetValue);
  const achieved = Math.abs(currentValue - startValue);
  const remaining = Math.abs(targetValue - currentValue);
  const percentage = total > 0 ? Math.min(100, Math.max(0, (achieved / total) * 100)) : 0;

  return {
    percentage: Math.round(percentage * 10) / 10,
    current: currentValue,
    target: targetValue,
    start: startValue,
    total,
    achieved,
    remaining,
  };
}

export function estimateTargetDate(
  currentWeight: number,
  targetWeight: number,
  weeklyRateKg: number
): Date | null {
  if (weeklyRateKg <= 0) return null;
  const weeksNeeded = Math.abs(currentWeight - targetWeight) / weeklyRateKg;
  const daysNeeded = Math.ceil(weeksNeeded * 7);
  const estimated = new Date();
  estimated.setDate(estimated.getDate() + daysNeeded);
  return estimated;
}

export function calculateWeeklyRate(
  currentMA7: number,
  previousMA7: number
): number {
  return Math.round((previousMA7 - currentMA7) * 100) / 100;
}
