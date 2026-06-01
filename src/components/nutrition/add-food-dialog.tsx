"use client";

import { useState, useEffect, useCallback } from "react";
import { addFoodToMeal } from "@/actions/nutrition";
import type { FoodCategory } from "@prisma/client";

interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: string;
  servingUnit: string;
  caloriesPerServing: string;
  proteinPerServing: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  STAPLE: "主食",
  MEAT: "肉类",
  DAIRY: "蛋奶",
  VEGETABLE: "蔬菜",
  FRUIT: "水果",
  FAT: "油脂",
  CONDIMENT: "调味",
  SNACK: "零食",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS);

export function AddFoodDialog({
  mealId,
  userId,
}: {
  mealId: string;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("");
  const [loading, setLoading] = useState(false);

  const searchFoods = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);

    const res = await fetch(`/api/foods?${params.toString()}`);
    const data = await res.json();
    setFoods(data.items);
  }, [search, category]);

  useEffect(() => {
    if (open) searchFoods();
  }, [open, searchFoods]);

  async function handleAdd() {
    if (!selectedFood || !servings) return;
    setLoading(true);
    const fd = new FormData();
    fd.set("mealId", mealId);
    fd.set("foodId", selectedFood.id);
    fd.set("servings", servings);
    await addFoodToMeal(fd);
    setLoading(false);
    setOpen(false);
    setSelectedFood(null);
    setServings("");
    setSearch("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        + 添加食物
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        + 添加食物
      </button>

      {/* Backdrop + Dialog */}
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-4 mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">添加食物</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-zinc-500 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Search + Category filter */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索食物..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
            >
              <option value="">全部分类</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Food list */}
          <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
            {foods.map((f) => {
              const cal = f.caloriesPerServing
                ? `${Number(f.caloriesPerServing)}kcal`
                : "";
              const prot = f.proteinPerServing
                ? `P${Number(f.proteinPerServing)}`
                : "";
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFood(f)}
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-sm flex justify-between items-center transition-colors ${
                    selectedFood?.id === f.id
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span>
                    {f.name}
                    <span className="ml-1 text-[10px] text-zinc-500">
                      {CATEGORY_LABELS[f.category]}
                    </span>
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {cal} {prot}
                  </span>
                </button>
              );
            })}
            {foods.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-4">
                无匹配食物
              </p>
            )}
          </div>

          {/* Servings input */}
          {selectedFood && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-zinc-400">
                {selectedFood.name} — 份数:
              </span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder={`1份=${Number(selectedFood.servingSize)}${selectedFood.servingUnit}`}
                className="w-20 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-600">
                1份={Number(selectedFood.servingSize)}{selectedFood.servingUnit}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedFood || !servings || loading}
              className="rounded-lg bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "添加中..." : "添加"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
