// Fitness OS — Weight ↔ DailySummary Consistency Test
// Run: npx tsx prisma/test-weight-consistency.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_USER = "___test_consistency___";
const T = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ ${msg}`);
  }
}

// ── Sync helpers (mirrors src/lib/fitness/sync-daily-summary.ts) ──

async function upsertSummary(userId: string, date: string, weightKg: number) {
  await prisma.dailySummary.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    update: { weightKg },
    create: { userId, date: new Date(date), weightKg, workoutCount: 0 },
  });
}

async function syncAfterDelete(userId: string, date: string) {
  const summary = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: new Date(date) } },
  });
  if (!summary) return;

  const remaining = await prisma.weightRecord.findFirst({
    where: { userId, date: new Date(date) },
    orderBy: { createdAt: "desc" },
    select: { weightKg: true },
  });

  const hasOther =
    summary.totalCalories !== null ||
    summary.totalProtein !== null ||
    summary.totalCarbs !== null ||
    summary.totalFat !== null ||
    summary.totalFiber !== null ||
    summary.workoutCount > 0 ||
    summary.workoutMinutes !== null;

  if (!remaining && !hasOther) {
    await prisma.dailySummary.delete({
      where: { userId_date: { userId, date: new Date(date) } },
    });
  } else if (!remaining) {
    await prisma.dailySummary.update({
      where: { userId_date: { userId, date: new Date(date) } },
      data: { weightKg: null },
    });
  } else {
    await prisma.dailySummary.update({
      where: { userId_date: { userId, date: new Date(date) } },
      data: { weightKg: remaining.weightKg },
    });
  }
}

// ── Tests ──

async function main() {
  console.log("🧪 Weight ↔ DailySummary Consistency Tests\n");

  const user = await prisma.user.upsert({
    where: { username: TEST_USER },
    update: {},
    create: { username: TEST_USER, passwordHash: "test", displayName: "Test" },
  });
  const userId = user.id;

  await prisma.weightRecord.deleteMany({ where: { userId } });
  await prisma.dailySummary.deleteMany({ where: { userId } });

  // ── T1: Create weight → Summary created ──
  console.log("T1: Create weight record → DailySummary created");
  const r1 = await prisma.weightRecord.create({
    data: { userId, date: new Date(T(0)), weightKg: 115.0 },
  });
  await upsertSummary(userId, T(0), 115.0);
  const ds1 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: new Date(T(0)) } },
  });
  assert(ds1 !== null, "DailySummary exists after create");
  assert(Number(ds1!.weightKg) === 115.0, "weightKg = 115.0");

  // ── T2: Upsert (update) same date → single summary, weight updated ──
  console.log("T2: Upsert same date → summary updated, no duplicate");
  await prisma.weightRecord.upsert({
    where: { userId_date: { userId, date: new Date(T(0)) } },
    update: { weightKg: 114.8 },
    create: { userId, date: new Date(T(0)), weightKg: 114.8 },
  });
  await upsertSummary(userId, T(0), 114.8);
  const count = await prisma.dailySummary.count({
    where: { userId, date: new Date(T(0)) },
  });
  assert(count === 1, "Single DailySummary on T(0)");
  const ds2 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: new Date(T(0)) } },
  });
  assert(Number(ds2!.weightKg) === 114.8, "weightKg = 114.8 after upsert");

  // ── T3: Delete record, no other data → summary deleted ──
  console.log("T3: Delete weight, no other data → DailySummary deleted");
  await prisma.weightRecord.delete({ where: { id: r1.id } });
  await syncAfterDelete(userId, T(0));
  const ds3 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: new Date(T(0)) } },
  });
  assert(ds3 === null, "DailySummary removed");

  // ── T4: Delete weight, other data exists → weightKg = null ──
  console.log("T4: Delete weight, other data exists → weightKg = null");
  const r4 = await prisma.weightRecord.create({
    data: { userId, date: new Date(T(-1)), weightKg: 114.0 },
  });
  await upsertSummary(userId, T(-1), 114.0);
  // Simulate workout data on same date
  await prisma.dailySummary.update({
    where: { userId_date: { userId, date: new Date(T(-1)) } },
    data: { workoutCount: 1, workoutMinutes: 60 },
  });

  await prisma.weightRecord.delete({ where: { id: r4.id } });
  await syncAfterDelete(userId, T(-1));
  const ds4 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: new Date(T(-1)) } },
  });
  assert(ds4 !== null, "DailySummary preserved (has workout)");
  assert(ds4!.weightKg === null, "weightKg = null");
  assert(ds4!.workoutCount === 1, "workoutCount preserved");

  // ── T5: Edit date change → old cleaned, new created ──
  console.log("T5: Edit date change → old summary cleaned, new created");
  const r5 = await prisma.weightRecord.create({
    data: { userId, date: new Date(T(-3)), weightKg: 113.5 },
  });
  await upsertSummary(userId, T(-3), 113.5);

  // Move to T(-2)
  await prisma.weightRecord.update({
    where: { id: r5.id },
    data: { date: new Date(T(-2)), weightKg: 113.0 },
  });
  await upsertSummary(userId, T(-2), 113.0);
  await syncAfterDelete(userId, T(-3));

  const dsNew = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: new Date(T(-2)) } },
  });
  const dsOld = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: new Date(T(-3)) } },
  });
  assert(dsNew !== null, "new date has summary");
  assert(dsOld === null, "old date summary deleted");

  // ── T6: Multiple dates, each has own summary ──
  console.log("T6: Multiple dates → each has independent summary");
  const dates = [T(-7), T(-8), T(-9)];
  for (const d of dates) {
    await prisma.weightRecord.upsert({
      where: { userId_date: { userId, date: new Date(d) } },
      update: { weightKg: 115.0 },
      create: { userId, date: new Date(d), weightKg: 115.0 },
    });
    await upsertSummary(userId, d, 115.0);
  }
  const totalSummaries = await prisma.dailySummary.count({ where: { userId } });
  assert(totalSummaries >= dates.length, `${dates.length}+ summaries exist (got ${totalSummaries})`);

  // Delete 1 of 3 past records
  const toDelete = await prisma.weightRecord.findFirst({
    where: { userId, date: new Date(T(-7)) },
  });
  await prisma.weightRecord.delete({ where: { id: toDelete!.id } });
  await syncAfterDelete(userId, T(-7));
  const ds6 = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: new Date(T(-7)) } },
  });
  assert(ds6 === null, "T(-7) summary deleted");
  // Other dates unaffected
  const dsOther = await prisma.dailySummary.findUnique({
    where: { userId_date: { userId, date: new Date(T(-8)) } },
  });
  assert(dsOther !== null, "T(-8) summary unaffected");

  // ── Cleanup ──
  console.log("\n───────────────────────────────────");
  await prisma.weightRecord.deleteMany({ where: { userId } });
  await prisma.dailySummary.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });

  if (process.exitCode === 1) {
    console.log("\n❌ Some tests failed.");
  } else {
    console.log("✅ All 6 tests passed.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
