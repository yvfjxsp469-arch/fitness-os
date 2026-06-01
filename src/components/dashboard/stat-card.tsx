import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  const trendColor = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-zinc-400",
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{title}</p>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <p className={`mt-1 text-2xl font-bold ${trend ? trendColor[trend] : "text-white"}`}>
        {value}
      </p>
      {subtitle && (
        <p className={`mt-1 text-xs ${trend ? trendColor[trend] : "text-zinc-500"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
