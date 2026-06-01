import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { FoodCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = request.nextUrl.searchParams.get("search") || undefined;
  const category = request.nextUrl.searchParams.get("category") || undefined;
  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
  const take = Math.min(Number(request.nextUrl.searchParams.get("take")) || 20, 50);

  const foods = await prisma.food.findMany({
    where: {
      isDeleted: false,
      OR: [{ isCustom: false }, { creatorId: userId }],
      ...(search && {
        name: { contains: search, mode: "insensitive" as const },
      }),
      ...(category && { category: category as FoodCategory }),
    },
    select: {
      id: true,
      name: true,
      category: true,
      servingSize: true,
      servingUnit: true,
      caloriesPerServing: true,
      proteinPerServing: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = foods.length > take;
  const items = hasMore ? foods.slice(0, take) : foods;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return NextResponse.json({ items, nextCursor });
}
