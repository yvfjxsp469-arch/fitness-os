"use client";

import { useState } from "react";
import { deleteMeal, removeFoodFromMeal, updateMealFoodServings } from "@/actions/nutrition";
import { AddFoodDialog } from "./add-food-dialog";
import type { FoodCategory } from "@prisma/client";

interface MealFoodData {
  id: string;
  servings: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  food: {
    name: string;
    servingSize: string;
    servingUnit: string;
  };
}

interface MealData {
  id: string;
  mealType: string;
  mealFoods: MealFoodData[];
}

const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: "早餐",
  LUNCH: "午餐",
  DINNER: "晚餐",
  SNACK1: "加餐1",
  SNACK2: "加餐2",
};

export function MealCard({ meal, userId }: { meal: MealData; userId: string }) {
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editServings, setEditServings] = useState("");

  const mealCalories = meal.mealFoods.reduce((s, f) => s + f.calories, 0);
  const mealProtein = meal.mealFoods.reduce((s, f) => s + f.protein, 0);

  async function handleDelete() {
    if (!confirm("删除整个餐次？所有食物记录将被移除。")) return;
    setDeleting(true);
    await deleteMeal(meal.id);
    setDeleting(false);
  }

  async function handleRemoveFood(id: string) {
    await removeFoodFromMeal(id);
  }

  async function handleUpdateServings(id: string) {
    if (!editServings) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("servings", editServings);
    await updateMealFoodServings(fd);
    setEditingId(null);
    setEditServings("");
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">
            {MEAL_TYPE_LABELS[meal.mealType] || meal.mealType}
          </span>
          {meal.mealFoods.length > 0 && (
            <span className="text-[10px] text-zinc-500">
              {Math.round(mealCalories)}kcal | P{Math.round(mealProtein * 10) / 10}g
            </span>
          )}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
        >
          {deleting ? "删除中..." : "删除餐次"}
        </button>
      </div>

      {/* Food rows */}
      {meal.mealFoods.length > 0 && (
        <div className="divide-y divide-zinc-800">
          {meal.mealFoods.map((mf) => (
            <div
              key={mf.id}
              className="flex items-center justify-between px-4 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">
                  {mf.food.name}
                </p>
                {editingId === mf.id ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={editServings}
                      onChange={(e) => setEditServings(e.target.value)}
                      className="w-16 rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-xs text-white focus:border-zinc-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateServings(mf.id)}
                      className="text-[10px] text-zinc-400 hover:text-white"
                    >
                      确认
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-[10px] text-zinc-600 hover:text-zinc-400"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500">
                    {Number(mf.servings)}份 ({Number(mf.food.servingSize)}{mf.food.servingUnit}/份)
                    {" · "}
                    {mf.calories}kcal P{mf.protein} C{mf.carbs} F{mf.fat}
                    {mf.fiber ? ` Fib${mf.fiber}` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-2">
                {editingId !== mf.id && (
                  <button
                    onClick={() => {
                      setEditingId(mf.id);
                      setEditServings(Number(mf.servings).toString());
                    }}
                    className="text-[10px] text-zinc-600 hover:text-zinc-400"
                  >
                    编辑
                  </button>
                )}
                <button
                  onClick={() => handleRemoveFood(mf.id)}
                  className="text-[10px] text-zinc-600 hover:text-red-400"
                >
                  移除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add food */}
      <div className="px-4 py-2">
        <AddFoodDialog mealId={meal.id} userId={userId} />
      </div>
    </div>
  );
}
