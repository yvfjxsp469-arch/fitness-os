"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrainingChartData } from "@/lib/analytics/training";

interface TrainingChartProps {
  data: TrainingChartData[];
}

export function TrainingChart({ data }: TrainingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-zinc-500">
        暂无训练数据
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-400">训练频率 (12周)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="week"
            stroke="#71717a"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            stroke="#71717a"
            tick={{ fontSize: 11 }}
            allowDecimals={false}
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
          <Bar dataKey="strength" stackId="a" fill="#f4f4f5" name="力量" />
          <Bar dataKey="cardio" stackId="a" fill="#71717a" name="有氧" />
          <Bar dataKey="rest" stackId="a" fill="#22c55e" name="休息" />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-white" />
          力量
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-zinc-500" />
          有氧
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-green-500" />
          休息
        </span>
      </div>
    </div>
  );
}
