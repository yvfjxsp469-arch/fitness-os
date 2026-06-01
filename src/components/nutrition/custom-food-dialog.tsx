"use client";

import { useState } from "react";
import { createCustomFood } from "@/actions/nutrition";

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

const CATEGORIES = Object.entries(CATEGORY_LABELS);

export function CustomFoodDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const result = await createCustomFood(fd);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    (e.target as HTMLFormElement).reset();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
      >
        + 自定义食物
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-4 mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">添加自定义食物</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-zinc-500 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">名称</label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">分类</label>
            <select
              name="category"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
            >
              {CATEGORIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">每份量</label>
              <input
                name="servingSize"
                type="number"
                step="0.1"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">单位</label>
              <input
                name="servingUnit"
                required
                placeholder="g/ml/个"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {[
            { name: "caloriesPerServing", label: "热量 (kcal)" },
            { name: "proteinPerServing", label: "蛋白质 (g)" },
            { name: "carbsPerServing", label: "碳水 (g)" },
            { name: "fatPerServing", label: "脂肪 (g)" },
            { name: "fiberPerServing", label: "纤维 (g, 可选)" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-xs text-zinc-400 mb-1">
                {f.label}
              </label>
              <input
                name={f.name}
                type="number"
                step="0.1"
                required={f.name !== "fiberPerServing"}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-zinc-500 focus:outline-none"
              />
            </div>
          ))}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-white disabled:opacity-40"
            >
              {loading ? "创建中..." : "创建"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
