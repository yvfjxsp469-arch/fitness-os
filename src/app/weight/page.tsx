import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { calcMovingAverage } from "@/lib/fitness/weight";
import { WeightForm } from "@/components/weight/weight-form";
import { WeightChart } from "@/components/weight/weight-chart";
import { WeightTable } from "@/components/weight/weight-table";
import { LogoutButton } from "@/components/layout/logout-button";
import Link from "next/link";

export default async function WeightPage() {
  const userId = await getSession();
  if (!userId) redirect("/login");

  const [records, goal] = await Promise.all([
    // Last 100 records, descending (for table + chart)
    prisma.weightRecord.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 100,
    }),
    // Active goal for target line
    prisma.goal.findFirst({
      where: { userId, type: "WEIGHT", status: "ACTIVE" },
    }),
  ]);

  // Build ascending data once, compute MA7 once
  const ascData = [...records].reverse().map((r) => ({
    date: r.date,
    weightKg: Number(r.weightKg),
  }));
  const withMA7 = calcMovingAverage(ascData);

  // Chart: filter to last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const chartData = withMA7.filter((r) => r.date >= ninetyDaysAgo);

  // Table: MA7 lookup from same computation
  const ma7Map = new Map(withMA7.map((r) => [r.date.toISOString().slice(0, 10), r.ma7]));
  const tableData = records.map((r) => ({
    id: r.id,
    date: r.date,
    weightKg: Number(r.weightKg),
    notes: r.notes,
    ma7: ma7Map.get(r.date.toISOString().slice(0, 10)) ?? null,
  }));

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-500 hover:text-white">
              ←
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">体重记录</h1>
              <p className="text-xs text-zinc-500">
                {records.length} 条记录
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Chart */}
        <WeightChart
          records={chartData}
          targetWeight={goal ? Number(goal.targetValue) : null}
        />

        {/* Form */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-400">
            新增体重记录
          </h3>
          <WeightForm />
        </div>

        {/* Table */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-400">
            最近记录
            {records.length === 100 && (
              <span className="ml-1 text-zinc-600">(显示最近100条)</span>
            )}
          </h3>
          <WeightTable records={tableData} />
        </div>
      </main>
    </div>
  );
}
