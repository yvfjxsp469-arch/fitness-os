import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DatePicker } from "@/components/nutrition/date-picker";
import { TemplateSelector } from "@/components/training/template-selector";
import { WorkoutCard } from "@/components/training/workout-card";
import { WorkoutHistory } from "@/components/training/workout-history";
import { LogoutButton } from "@/components/layout/logout-button";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function TrainingPage({ searchParams }: PageProps) {
  const userId = await getSession();
  if (!userId) redirect("/login");

  const params = await searchParams;
  const dateStr = params.date || new Date().toISOString().slice(0, 10);
  const dayStart = new Date(dateStr);
  const dayEnd = new Date(dateStr + "T23:59:59.999Z");

  // Templates for selector
  const templates = await prisma.trainingTemplate.findMany({
    where: { userId, isActive: true },
    select: { id: true, name: true, description: true },
  });

  // Today's workouts with full details
  const workouts = await prisma.workout.findMany({
    where: { userId, date: { gte: dayStart, lte: dayEnd } },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: {
          exercise: { select: { id: true, name: true, muscleGroup: true } },
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Recent history (last 7 days, excluding today)
  const sevenDaysAgo = new Date(dateStr);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentWorkouts = await prisma.workout.findMany({
    where: {
      userId,
      date: { gte: sevenDaysAgo, lt: dayStart },
    },
    include: {
      exercises: { select: { id: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-500 hover:text-white">
              ←
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">训练记录</h1>
              <p className="text-xs text-zinc-500">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DatePicker />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <TemplateSelector date={dateStr} templates={templates} />
        </div>

        {/* Today's workouts */}
        {workouts.length > 0 ? (
          <div className="space-y-3">
            {workouts.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={{
                  id: w.id,
                  name: w.name,
                  type: w.type,
                  durationMin: w.durationMin,
                  rpe: w.rpe,
                  notes: w.notes,
                  exercises: w.exercises.map((we) => ({
                    id: we.id,
                    exercise: we.exercise,
                    sets: we.sets.map((s) => ({
                      id: s.id,
                      setNumber: s.setNumber,
                      weightKg: s.weightKg?.toString() ?? null,
                      reps: s.reps,
                      rpe: s.rpe,
                      isWarmup: s.isWarmup,
                    })),
                  })),
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-600 py-8">
            暂无训练，从模板或自定义开始
          </p>
        )}

        {/* Recent history */}
        {recentWorkouts.length > 0 && (
          <WorkoutHistory
            workouts={recentWorkouts.map((w) => ({
              id: w.id,
              date: w.date,
              name: w.name,
              type: w.type,
              exerciseCount: w.exercises.length,
            }))}
          />
        )}
      </main>
    </div>
  );
}
