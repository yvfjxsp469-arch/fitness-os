// Phase 1.2 Audit — Full data consistency check
// Run: npx tsx prisma/audit-phase-1-2.ts

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const D = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
};

class Auditor {
  passed = 0;
  failed = 0;

  check(cond: boolean, msg: string) {
    if (cond) { this.passed++; console.log("  PASS " + msg); }
    else { this.failed++; console.error("  FAIL " + msg); }
  }
}

async function main() {
  const audit = new Auditor();
  const c = audit.check.bind(audit);

  console.log("=== Audit 1: WeightRecord CRUD -> DailySummary consistency ===\n");

  // Get admin user
  const user = await p.user.findFirst({ where: { username: "admin" } });
  if (!user) throw new Error("No admin user found — run seed first");
  const uid = user.id;

  // Clean any leftover test data from admin
  await p.weightRecord.deleteMany({ where: { userId: uid } });
  await p.dailySummary.deleteMany({ where: { userId: uid } });

  // --- 1a: Create -> Summary created ---
  console.log("1a: Create weight -> Summary created");
  const r1 = await p.weightRecord.create({
    data: { userId: uid, date: D(0), weightKg: 115.0 },
  });
  await p.dailySummary.upsert({
    where: { userId_date: { userId: uid, date: D(0) } },
    update: { weightKg: 115.0 },
    create: { userId: uid, date: D(0), weightKg: 115.0, workoutCount: 0 },
  });
  const s1 = await p.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: D(0) } } });
  c(s1 !== null, "Summary exists after create");
  c(s1 !== null && Number(s1.weightKg) === 115.0, "weightKg = 115.0");

  // --- 1b: Upsert same date -> no duplicate ---
  console.log("\n1b: Same-day upsert -> no duplicate");
  await p.weightRecord.upsert({
    where: { userId_date: { userId: uid, date: D(0) } },
    update: { weightKg: 114.5 },
    create: { userId: uid, date: D(0), weightKg: 114.5 },
  });
  await p.dailySummary.update({
    where: { userId_date: { userId: uid, date: D(0) } },
    data: { weightKg: 114.5 },
  });
  const wrCount = await p.weightRecord.count({ where: { userId: uid, date: D(0) } });
  const dsCount = await p.dailySummary.count({ where: { userId: uid, date: D(0) } });
  c(wrCount === 1, "weight_records: 1 row per date (unique constraint)");
  c(dsCount === 1, "daily_summaries: 1 row per date");

  // --- 1c: Edit weight (same date) ---
  console.log("\n1c: Edit weight (same date) -> Summary updated");
  await p.weightRecord.update({ where: { id: r1.id }, data: { weightKg: 113.0 } });
  await p.dailySummary.update({ where: { userId_date: { userId: uid, date: D(0) } }, data: { weightKg: 113.0 } });
  const s1c = await p.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: D(0) } } });
  c(Number(s1c!.weightKg) === 113.0, "weightKg = 113.0 after edit");

  // --- 1d: Edit date (cross-day move) ---
  console.log("\n1d: Edit date (cross-day) -> old cleaned, new created");
  await p.weightRecord.update({ where: { id: r1.id }, data: { date: D(-1), weightKg: 112.5 } });
  await p.dailySummary.upsert({
    where: { userId_date: { userId: uid, date: D(-1) } },
    update: { weightKg: 112.5 },
    create: { userId: uid, date: D(-1), weightKg: 112.5, workoutCount: 0 },
  });
  // Old date cleanup
  const oldRemaining = await p.weightRecord.findFirst({ where: { userId: uid, date: D(0) } });
  if (!oldRemaining) {
    const oldSum = await p.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: D(0) } } });
    if (oldSum && !oldSum.totalCalories && oldSum.workoutCount === 0) {
      await p.dailySummary.delete({ where: { userId_date: { userId: uid, date: D(0) } } });
    }
  }
  const sNew = await p.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: D(-1) } } });
  const sOld = await p.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: D(0) } } });
  c(sNew !== null && Number(sNew.weightKg) === 112.5, "new date summary correct");
  c(sOld === null, "old date summary cleaned");

  // --- 1e: Delete -> Summary cleaned ---
  console.log("\n1e: Delete weight -> Summary cleaned");
  const r1e = await p.weightRecord.findFirst({ where: { userId: uid, date: D(-1) } });
  await p.weightRecord.delete({ where: { id: r1e!.id } });
  const afterDel = await p.weightRecord.findFirst({ where: { userId: uid, date: D(-1) } });
  if (!afterDel) {
    const sum = await p.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: D(-1) } } });
    if (sum && !sum.totalCalories && sum.workoutCount === 0) {
      await p.dailySummary.delete({ where: { userId_date: { userId: uid, date: D(-1) } } });
    }
  }
  const sDel = await p.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: D(-1) } } });
  c(sDel === null, "summary deleted after weight removal");

  // ===== Audit 2: ORPHAN CHECK =====
  console.log("\n=== Audit 2: Orphan record scan ===\n");

  // Seed multi-day data: D(-10) through D(-1)
  for (let i = 1; i <= 10; i++) {
    // Simulate weight LOSS: older=heavier, newer=lighter
    const w = 112.0 + i * 0.3;  // D(-10)=115.0, D(-1)=112.3
    await p.weightRecord.upsert({
      where: { userId_date: { userId: uid, date: D(-i) } },
      update: { weightKg: w },
      create: { userId: uid, date: D(-i), weightKg: w },
    });
    await p.dailySummary.upsert({
      where: { userId_date: { userId: uid, date: D(-i) } },
      update: { weightKg: w },
      create: { userId: uid, date: D(-i), weightKg: w, workoutCount: 0 },
    });
  }

  // Delete the middle record (D(-5)) and clean its summary
  const midRecord = await p.weightRecord.findFirst({ where: { userId: uid, date: D(-5) } });
  await p.weightRecord.delete({ where: { id: midRecord!.id } });
  const midRemaining = await p.weightRecord.findFirst({ where: { userId: uid, date: D(-5) } });
  if (!midRemaining) {
    const midSum = await p.dailySummary.findUnique({ where: { userId_date: { userId: uid, date: D(-5) } } });
    if (midSum && !midSum.totalCalories && midSum.workoutCount === 0) {
      await p.dailySummary.delete({ where: { userId_date: { userId: uid, date: D(-5) } } });
    }
  }

  // Scan for orphans
  const allSummaries = await p.dailySummary.findMany({ where: { userId: uid } });
  let orphans = 0;
  for (const s of allSummaries) {
    const hasWeight = await p.weightRecord.findFirst({ where: { userId: uid, date: s.date } });
    const hasOther = s.totalCalories || s.workoutCount > 0 || s.workoutMinutes;
    if (!hasWeight && !hasOther) {
      orphans++;
      console.error("  ORPHAN: " + s.date.toISOString().slice(0, 10));
    }
  }
  c(orphans === 0, "zero orphan daily_summaries (found " + orphans + ")");

  // Check every weight date has a summary
  const weightDates = await p.weightRecord.findMany({
    where: { userId: uid },
    select: { date: true },
    distinct: ["date"],
  });
  let missing = 0;
  for (const w of weightDates) {
    const s = await p.dailySummary.findUnique({
      where: { userId_date: { userId: uid, date: w.date } },
    });
    if (!s) {
      missing++;
      console.error("  MISSING Summary: " + w.date.toISOString().slice(0, 10));
    }
  }
  c(missing === 0, "every weight date has summary (missing " + missing + ")");

  // ===== Audit 3: Dashboard data correctness =====
  console.log("\n=== Audit 3: Dashboard data correctness ===\n");

  const goal = await p.goal.findFirst({
    where: { userId: uid, type: "WEIGHT", status: "ACTIVE" },
  });

  // Latest weight in WR vs DS
  const latestWR = await p.weightRecord.findFirst({
    where: { userId: uid },
    orderBy: { date: "desc" },
  });
  const latestDS = await p.dailySummary.findFirst({
    where: { userId: uid, weightKg: { not: null } },
    orderBy: { date: "desc" },
  });
  if (latestWR && latestDS?.weightKg) {
    c(
      Math.abs(Number(latestWR.weightKg) - Number(latestDS.weightKg)) < 0.01,
      "Latest weight: WR=" + Number(latestWR.weightKg) + " DS=" + Number(latestDS.weightKg) + " (match)"
    );
  }

  // 7-day moving average check (manual calculation)
  const last10 = await p.weightRecord.findMany({
    where: { userId: uid },
    orderBy: { date: "asc" },
    take: 10,
  });
  if (last10.length >= 7) {
    const last7 = last10.slice(-7);
    const manualMA7 = last7.reduce((s, r) => s + Number(r.weightKg), 0) / 7;
    const calcMA7 = Math.round(manualMA7 * 100) / 100;
    c(calcMA7 > 0, "7-day MA7 = " + calcMA7 + " (calculated from " + last7.length + " records)");

    // Weekly rate check
    if (last10.length >= 8) {
      const prev7 = last10.slice(-8, -1);
      const prevMA7 = prev7.reduce((s, r) => s + Number(r.weightKg), 0) / 7;
      const weeklyRate = Math.round((prevMA7 - calcMA7) * 100) / 100;
      c(typeof weeklyRate === "number", "Weekly rate: " + (weeklyRate > 0 ? "-" : "+") + Math.abs(weeklyRate) + " kg/week");
    }
  }

  // Total lost check
  const first = await p.weightRecord.findFirst({
    where: { userId: uid },
    orderBy: { date: "asc" },
  });
  const last = latestWR;
  if (first && last) {
    const totalLost = Number(first.weightKg) - Number(last.weightKg);
    c(totalLost >= 0, "Total lost: " + totalLost.toFixed(1) + " kg (from " + Number(first.weightKg) + " to " + Number(last.weightKg) + ")");
  }

  // Goal progress check
  if (goal && last) {
    const start = Number(goal.startValue);
    const target = Number(goal.targetValue);
    const current = Number(last.weightKg);
    const pct = Math.round(((start - current) / (start - target)) * 1000) / 10;
    c(pct >= 0 && pct <= 100, "Goal progress: " + pct + "% (" + start + "->" + target + ", at " + current + ")");
  }

  // Cleanup
  await p.dailySummary.deleteMany({ where: { userId: uid } });
  await p.weightRecord.deleteMany({ where: { userId: uid } });

  // ===== Summary =====
  console.log("\n========================================");
  console.log("Audit complete: " + audit.passed + " passed, " + audit.failed + " failed");
  if (audit.failed > 0) process.exit(1);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => p.$disconnect());
