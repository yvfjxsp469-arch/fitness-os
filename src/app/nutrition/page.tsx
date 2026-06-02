import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DatePicker } from "@/components/nutrition/date-picker";
import { NutritionSummary } from "@/components/nutrition/nutrition-summary";
import { CreateMealButton } from "@/components/nutrition/create-meal-button";
import { CustomFoodDialog } from "@/components/nutrition/custom-food-dialog";
import { MealCard } from "@/components/nutrition/meal-card";
import { LogoutButton } from "@/components/layout/logout-button";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function NutritionPage({ searchParams }: PageProps) {
  const userId = await getSession();
  if (!userId) redirect("/login");

  const params = await searchParams;
  const dateStr = params.date || new Date().toISOString().slice(0, 10);
  const dayStart = new Date(dateStr);
  const dayEnd = new Date(dateStr + "T23:59:59.999Z");

  // Single query: all meals with foods for the date
  const meals = await prisma.meal.findMany({
    where: { userId, date: { gte: dayStart, lte: dayEnd } },
    include: {
      mealFoods: {
        include: {
          food: {
            select: { name: true, servingSize: true, servingUnit: true },
          },
        },
      },
    },
    orderBy: { mealType: "asc" },
  });

  // DailySummary totals
  const summary = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: dayStart } },
    select: {
      totalCalories: true,
      totalProtein: true,
      totalCarbs: true,
      totalFat: true,
      totalFiber: true,
    },
  });

  const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK1", "SNACK2"] as const;
  const mealsByType = new Map(mealTypes.map((mt) => [mt, meals.filter((m) => m.mealType === mt)]));

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-500 hover:text-white">
              ←
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">营养记录</h1>
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
        {/* Daily Summary */}
        <NutritionSummary
          totalCalories={summary?.totalCalories ?? null}
          totalProtein={summary?.totalProtein ? Number(summary.totalProtein) : null}
          totalCarbs={summary?.totalCarbs ? Number(summary.totalCarbs) : null}
          totalFat={summary?.totalFat ? Number(summary.totalFat) : null}
          totalFiber={summary?.totalFiber ? Number(summary.totalFiber) : null}
        />

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <CreateMealButton date={dateStr} />
          <CustomFoodDialog />
        </div>

        {/* Meal cards by type */}
        <div className="space-y-3">
          {mealTypes.map((mt) => {
            const mealsOfType = mealsByType.get(mt) || [];
            return mealsOfType.map((meal) => (
              <MealCard
                key={meal.id}
                meal={{
                  id: meal.id,
                  mealType: meal.mealType,
                  mealFoods: meal.mealFoods.map((mf) => ({
                    id: mf.id,
                    servings: mf.servings.toString(),
                    calories: Number(mf.calories),
                    protein: Number(mf.protein),
                    carbs: Number(mf.carbs),
                    fat: Number(mf.fat),
                    fiber: mf.fiber ? Number(mf.fiber) : null,
                    food: {
                      name: mf.food.name,
                      servingSize: mf.food.servingSize.toString(),
                      servingUnit: mf.food.servingUnit,
                    },
                  })),
                }}
                userId={userId}
              />
            ));
          })}
        </div>

        {meals.length === 0 && (
          <p className="text-center text-sm text-zinc-600 py-8">
            暂无记录，点击「添加餐次」开始记录
          </p>
        )}
      </main>
    </div>
  );
}
