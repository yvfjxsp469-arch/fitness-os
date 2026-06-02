"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface NutritionChartProps {
  data: { date: string; calories: number; protein: number }[];
}

export function NutritionChart({ data }: NutritionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-zinc-500">
        暂无营养数据
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    shortDate: new Date(d.date).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-400">营养趋势 (30天)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="shortDate"
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#22c55e"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${v}g`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#f4f4f5",
              fontSize: "13px",
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="calories"
            fill="#a1a1aa"
            radius={[2, 2, 0, 0]}
            name="热量"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="protein"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="蛋白质"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-zinc-400" />
          热量 (kcal)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-green-500" />
          蛋白质 (g)
        </span>
      </div>
    </div>
  );
}
