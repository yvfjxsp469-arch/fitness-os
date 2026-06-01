interface NutritionSummaryProps {
  totalCalories: number | null;
  totalProtein: number | null;
  totalCarbs: number | null;
  totalFat: number | null;
  totalFiber: number | null;
}

export function NutritionSummary({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  totalFiber,
}: NutritionSummaryProps) {
  const items = [
    { label: "热量", value: totalCalories, unit: "kcal" },
    { label: "蛋白质", value: totalProtein, unit: "g" },
    { label: "碳水", value: totalCarbs, unit: "g" },
    { label: "脂肪", value: totalFat, unit: "g" },
    { label: "纤维", value: totalFiber, unit: "g" },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-400">今日营养汇总</h3>
      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-lg font-bold text-white">
              {item.value !== null ? item.value : "—"}
            </p>
            <p className="text-[10px] text-zinc-500">
              {item.unit}
            </p>
            <p className="text-[10px] text-zinc-600">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
