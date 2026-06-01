"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { WeightWithMA7 } from "@/lib/fitness/weight";

interface WeightChartProps {
  records: WeightWithMA7[];
  targetWeight: number | null;
}

export function WeightChart({ records, targetWeight }: WeightChartProps) {
  if (records.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-zinc-500">
        暂无数据，请先录入体重
      </div>
    );
  }

  const chartData = records.map((r) => ({
    date: new Date(r.date).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    }),
    weight: r.weightKg,
    ma7: r.ma7,
  }));

  const yMin = Math.min(
    ...records.map((r) => r.weightKg),
    targetWeight ?? Infinity
  );
  const yMax = Math.max(...records.map((r) => r.weightKg));
  const padding = Math.max(3, (yMax - yMin) * 0.3);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-400">体重趋势</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            domain={[yMin - padding, yMax + padding]}
            tickFormatter={(v: number) => v.toFixed(1)}
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
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#71717a"
            strokeWidth={1.5}
            dot={{ r: 2, fill: "#71717a" }}
            name="体重"
          />
          <Line
            type="monotone"
            dataKey="ma7"
            stroke="#f4f4f5"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="7日均值"
          />
          {targetWeight && (
            <ReferenceLine
              y={targetWeight}
              stroke="#22c55e"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `目标 ${targetWeight}kg`,
                fill: "#22c55e",
                fontSize: 12,
                position: "right",
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-zinc-500" />
          体重
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 bg-white" />
          7日均值
        </span>
        {targetWeight && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-green-500" />
            目标
          </span>
        )}
      </div>
    </div>
  );
}
