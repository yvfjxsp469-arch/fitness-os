"use client";

import { useState } from "react";
import { createMeal } from "@/actions/nutrition";

const MEAL_TYPES = [
  { value: "BREAKFAST", label: "早餐" },
  { value: "LUNCH", label: "午餐" },
  { value: "DINNER", label: "晚餐" },
  { value: "SNACK1", label: "加餐1" },
  { value: "SNACK2", label: "加餐2" },
] as const;

export function CreateMealButton({ date }: { date: string }) {
  const [open, setOpen] = useState(false);

  async function handleCreate(mealType: string) {
    const fd = new FormData();
    fd.set("date", date);
    fd.set("mealType", mealType);
    await createMeal(fd);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
      >
        + 添加餐次
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
            {MEAL_TYPES.map((mt) => (
              <button
                key={mt.value}
                onClick={() => handleCreate(mt.value)}
                className="w-full px-3 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                {mt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
