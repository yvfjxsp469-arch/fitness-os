import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { MuscleGroup } from "@prisma/client";

export async function GET(request: NextRequest) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = request.nextUrl.searchParams.get("search") || undefined;
  const muscleGroup = request.nextUrl.searchParams.get("muscleGroup") || undefined;
  const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
  const take = Math.min(Number(request.nextUrl.searchParams.get("take")) || 20, 50);

  const exercises = await prisma.exercise.findMany({
    where: {
      isDeleted: false,
      OR: [{ isCustom: false }, { creatorId: userId }],
      ...(search && {
        name: { contains: search, mode: "insensitive" as const },
      }),
      ...(muscleGroup && { muscleGroup: muscleGroup as MuscleGroup }),
    },
    select: {
      id: true,
      name: true,
      muscleGroup: true,
    },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = exercises.length > take;
  const items = hasMore ? exercises.slice(0, take) : exercises;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return NextResponse.json({ items, nextCursor });
}
