// Fitness OS — Seed Script
// Run: npx prisma db seed
// Initializes: default user, exercises, training templates, food library, default goal

import { PrismaClient, FoodCategory, MuscleGroup, GoalType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Fitness OS...\n");

  // ══════════════════════════════════════
  // 0. Default User (required by templates & goals)
  // ══════════════════════════════════════
  console.log("Creating default user...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      displayName: "Admin",
    },
  });
  console.log(`  ✓ User "${user.username}" (id: ${user.id})\n`);

  // ══════════════════════════════════════
  // 1. Exercise Library (动作库)
  // ══════════════════════════════════════
  console.log("Creating exercise library...");

  const exercises = await Promise.all([
    // Push — Chest
    prisma.exercise.create({ data: { name: "卧推", muscleGroup: MuscleGroup.CHEST } }),
    prisma.exercise.create({ data: { name: "上斜哑铃卧推", muscleGroup: MuscleGroup.CHEST } }),
    prisma.exercise.create({ data: { name: "飞鸟", muscleGroup: MuscleGroup.CHEST } }),
    prisma.exercise.create({ data: { name: "器械推胸", muscleGroup: MuscleGroup.CHEST } }),
    // Push — Shoulders
    prisma.exercise.create({ data: { name: "器械肩推", muscleGroup: MuscleGroup.SHOULDERS } }),
    prisma.exercise.create({ data: { name: "绳索侧平举", muscleGroup: MuscleGroup.SHOULDERS } }),
    prisma.exercise.create({ data: { name: "哑铃侧平举", muscleGroup: MuscleGroup.SHOULDERS } }),
    // Push — Triceps
    prisma.exercise.create({ data: { name: "绳索臂屈伸", muscleGroup: MuscleGroup.TRICEPS } }),
    prisma.exercise.create({ data: { name: "双杠臂屈伸", muscleGroup: MuscleGroup.TRICEPS } }),
    // Pull — Back
    prisma.exercise.create({ data: { name: "对握高位下拉", muscleGroup: MuscleGroup.BACK } }),
    prisma.exercise.create({ data: { name: "胸托划船", muscleGroup: MuscleGroup.BACK } }),
    prisma.exercise.create({ data: { name: "单臂悍马划船", muscleGroup: MuscleGroup.BACK } }),
    prisma.exercise.create({ data: { name: "宽握坐姿划船", muscleGroup: MuscleGroup.BACK } }),
    prisma.exercise.create({ data: { name: "引体向上", muscleGroup: MuscleGroup.BACK } }),
    // Pull — Rear Delts
    prisma.exercise.create({ data: { name: "面拉", muscleGroup: MuscleGroup.SHOULDERS } }),
    // Pull — Biceps
    prisma.exercise.create({ data: { name: "上斜哑铃弯举", muscleGroup: MuscleGroup.BICEPS } }),
    prisma.exercise.create({ data: { name: "牧师凳弯举", muscleGroup: MuscleGroup.BICEPS } }),
    prisma.exercise.create({ data: { name: "哑铃锤式弯举", muscleGroup: MuscleGroup.BICEPS } }),
    // Legs — Quads
    prisma.exercise.create({ data: { name: "前蹲", muscleGroup: MuscleGroup.QUADS } }),
    prisma.exercise.create({ data: { name: "保加利亚分腿蹲", muscleGroup: MuscleGroup.QUADS } }),
    prisma.exercise.create({ data: { name: "腿举", muscleGroup: MuscleGroup.QUADS } }),
    prisma.exercise.create({ data: { name: "腿屈伸", muscleGroup: MuscleGroup.QUADS } }),
    // Legs — Hamstrings
    prisma.exercise.create({ data: { name: "罗马尼亚硬拉", muscleGroup: MuscleGroup.HAMSTRINGS } }),
    prisma.exercise.create({ data: { name: "腿弯举", muscleGroup: MuscleGroup.HAMSTRINGS } }),
    // Legs — Glutes
    prisma.exercise.create({ data: { name: "臀桥", muscleGroup: MuscleGroup.GLUTES } }),
    // Legs — Calves
    prisma.exercise.create({ data: { name: "提踵", muscleGroup: MuscleGroup.CALVES } }),
    // Core
    prisma.exercise.create({ data: { name: "平板支撑", muscleGroup: MuscleGroup.CORE } }),
    prisma.exercise.create({ data: { name: "卷腹", muscleGroup: MuscleGroup.CORE } }),
    prisma.exercise.create({ data: { name: "悬垂举腿", muscleGroup: MuscleGroup.CORE } }),
  ]);

  console.log(`  ✓ ${exercises.length} exercises created\n`);

  // ══════════════════════════════════════
  // 2. Food Library (食物库)
  // ══════════════════════════════════════
  console.log("Creating food library...");

  const foods = await Promise.all([
    // STAPLE 主食
    prisma.food.create({ data: { name: "白米饭", category: FoodCategory.STAPLE, servingSize: 150, servingUnit: "g", caloriesPerServing: 174, proteinPerServing: 3.9, carbsPerServing: 38.9, fatPerServing: 0.4, fiberPerServing: 0.5 } }),
    prisma.food.create({ data: { name: "馒头", category: FoodCategory.STAPLE, servingSize: 100, servingUnit: "g", caloriesPerServing: 223, proteinPerServing: 7.0, carbsPerServing: 44.2, fatPerServing: 1.1, fiberPerServing: 1.3 } }),
    prisma.food.create({ data: { name: "煮面条", category: FoodCategory.STAPLE, servingSize: 200, servingUnit: "g", caloriesPerServing: 220, proteinPerServing: 8.0, carbsPerServing: 44.0, fatPerServing: 1.0, fiberPerServing: 1.0 } }),
    prisma.food.create({ data: { name: "全麦面包", category: FoodCategory.STAPLE, servingSize: 50, servingUnit: "g", caloriesPerServing: 123, proteinPerServing: 5.5, carbsPerServing: 22.0, fatPerServing: 1.5, fiberPerServing: 3.0 } }),
    prisma.food.create({ data: { name: "即食燕麦", category: FoodCategory.STAPLE, servingSize: 40, servingUnit: "g", caloriesPerServing: 150, proteinPerServing: 5.0, carbsPerServing: 26.0, fatPerServing: 2.5, fiberPerServing: 3.5 } }),
    prisma.food.create({ data: { name: "红薯", category: FoodCategory.STAPLE, servingSize: 200, servingUnit: "g", caloriesPerServing: 172, proteinPerServing: 2.4, carbsPerServing: 40.0, fatPerServing: 0.2, fiberPerServing: 4.0 } }),
    prisma.food.create({ data: { name: "玉米", category: FoodCategory.STAPLE, servingSize: 200, servingUnit: "g", caloriesPerServing: 172, proteinPerServing: 6.0, carbsPerServing: 36.0, fatPerServing: 2.0, fiberPerServing: 4.0 } }),

    // MEAT 肉类
    prisma.food.create({ data: { name: "鸡胸肉", category: FoodCategory.MEAT, servingSize: 100, servingUnit: "g", caloriesPerServing: 133, proteinPerServing: 31.0, carbsPerServing: 0.0, fatPerServing: 1.2, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "鸡腿肉", category: FoodCategory.MEAT, servingSize: 100, servingUnit: "g", caloriesPerServing: 181, proteinPerServing: 20.0, carbsPerServing: 0.0, fatPerServing: 11.0, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "瘦牛肉", category: FoodCategory.MEAT, servingSize: 100, servingUnit: "g", caloriesPerServing: 150, proteinPerServing: 28.0, carbsPerServing: 0.0, fatPerServing: 4.0, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "猪里脊", category: FoodCategory.MEAT, servingSize: 100, servingUnit: "g", caloriesPerServing: 143, proteinPerServing: 20.0, carbsPerServing: 0.0, fatPerServing: 6.2, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "三文鱼", category: FoodCategory.MEAT, servingSize: 100, servingUnit: "g", caloriesPerServing: 208, proteinPerServing: 20.0, carbsPerServing: 0.0, fatPerServing: 13.0, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "虾仁", category: FoodCategory.MEAT, servingSize: 100, servingUnit: "g", caloriesPerServing: 99, proteinPerServing: 24.0, carbsPerServing: 0.2, fatPerServing: 0.3, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "巴沙鱼", category: FoodCategory.MEAT, servingSize: 100, servingUnit: "g", caloriesPerServing: 82, proteinPerServing: 15.0, carbsPerServing: 0.0, fatPerServing: 2.0, fiberPerServing: 0.0 } }),

    // DAIRY 蛋奶
    prisma.food.create({ data: { name: "鸡蛋（大）", category: FoodCategory.DAIRY, servingSize: 60, servingUnit: "g", caloriesPerServing: 86, proteinPerServing: 7.5, carbsPerServing: 0.5, fatPerServing: 5.8, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "鸡蛋清", category: FoodCategory.DAIRY, servingSize: 40, servingUnit: "g", caloriesPerServing: 21, proteinPerServing: 4.5, carbsPerServing: 0.0, fatPerServing: 0.0, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "全脂牛奶", category: FoodCategory.DAIRY, servingSize: 250, servingUnit: "ml", caloriesPerServing: 155, proteinPerServing: 8.0, carbsPerServing: 12.0, fatPerServing: 8.0, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "脱脂牛奶", category: FoodCategory.DAIRY, servingSize: 250, servingUnit: "ml", caloriesPerServing: 90, proteinPerServing: 8.5, carbsPerServing: 13.0, fatPerServing: 0.5, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "希腊酸奶", category: FoodCategory.DAIRY, servingSize: 150, servingUnit: "g", caloriesPerServing: 97, proteinPerServing: 15.0, carbsPerServing: 6.0, fatPerServing: 0.7, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "奶酪片", category: FoodCategory.DAIRY, servingSize: 20, servingUnit: "g", caloriesPerServing: 65, proteinPerServing: 4.0, carbsPerServing: 0.5, fatPerServing: 5.5, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "乳清蛋白粉", category: FoodCategory.DAIRY, servingSize: 30, servingUnit: "g", caloriesPerServing: 120, proteinPerServing: 24.0, carbsPerServing: 2.0, fatPerServing: 1.5, fiberPerServing: 0.0 } }),

    // VEGETABLE 蔬菜
    prisma.food.create({ data: { name: "西兰花", category: FoodCategory.VEGETABLE, servingSize: 100, servingUnit: "g", caloriesPerServing: 34, proteinPerServing: 2.8, carbsPerServing: 6.6, fatPerServing: 0.4, fiberPerServing: 2.6 } }),
    prisma.food.create({ data: { name: "菠菜", category: FoodCategory.VEGETABLE, servingSize: 100, servingUnit: "g", caloriesPerServing: 23, proteinPerServing: 2.9, carbsPerServing: 3.6, fatPerServing: 0.4, fiberPerServing: 2.2 } }),
    prisma.food.create({ data: { name: "番茄", category: FoodCategory.VEGETABLE, servingSize: 100, servingUnit: "g", caloriesPerServing: 18, proteinPerServing: 0.9, carbsPerServing: 3.9, fatPerServing: 0.2, fiberPerServing: 1.2 } }),
    prisma.food.create({ data: { name: "黄瓜", category: FoodCategory.VEGETABLE, servingSize: 100, servingUnit: "g", caloriesPerServing: 15, proteinPerServing: 0.7, carbsPerServing: 2.9, fatPerServing: 0.1, fiberPerServing: 0.5 } }),
    prisma.food.create({ data: { name: "生菜", category: FoodCategory.VEGETABLE, servingSize: 100, servingUnit: "g", caloriesPerServing: 13, proteinPerServing: 1.3, carbsPerServing: 2.2, fatPerServing: 0.3, fiberPerServing: 1.3 } }),
    prisma.food.create({ data: { name: "胡萝卜", category: FoodCategory.VEGETABLE, servingSize: 100, servingUnit: "g", caloriesPerServing: 41, proteinPerServing: 1.0, carbsPerServing: 9.6, fatPerServing: 0.2, fiberPerServing: 2.8 } }),
    prisma.food.create({ data: { name: "青椒", category: FoodCategory.VEGETABLE, servingSize: 100, servingUnit: "g", caloriesPerServing: 24, proteinPerServing: 1.0, carbsPerServing: 5.0, fatPerServing: 0.2, fiberPerServing: 1.7 } }),

    // FRUIT 水果
    prisma.food.create({ data: { name: "苹果", category: FoodCategory.FRUIT, servingSize: 200, servingUnit: "g", caloriesPerServing: 104, proteinPerServing: 0.6, carbsPerServing: 27.6, fatPerServing: 0.4, fiberPerServing: 4.8 } }),
    prisma.food.create({ data: { name: "香蕉", category: FoodCategory.FRUIT, servingSize: 120, servingUnit: "g", caloriesPerServing: 107, proteinPerServing: 1.3, carbsPerServing: 27.0, fatPerServing: 0.4, fiberPerServing: 3.1 } }),
    prisma.food.create({ data: { name: "橙子", category: FoodCategory.FRUIT, servingSize: 200, servingUnit: "g", caloriesPerServing: 94, proteinPerServing: 1.8, carbsPerServing: 23.0, fatPerServing: 0.2, fiberPerServing: 4.8 } }),
    prisma.food.create({ data: { name: "蓝莓", category: FoodCategory.FRUIT, servingSize: 100, servingUnit: "g", caloriesPerServing: 57, proteinPerServing: 0.7, carbsPerServing: 14.5, fatPerServing: 0.3, fiberPerServing: 2.4 } }),

    // FAT 油脂
    prisma.food.create({ data: { name: "橄榄油", category: FoodCategory.FAT, servingSize: 10, servingUnit: "ml", caloriesPerServing: 88, proteinPerServing: 0.0, carbsPerServing: 0.0, fatPerServing: 10.0, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "花生油", category: FoodCategory.FAT, servingSize: 10, servingUnit: "ml", caloriesPerServing: 88, proteinPerServing: 0.0, carbsPerServing: 0.0, fatPerServing: 10.0, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "黄油", category: FoodCategory.FAT, servingSize: 10, servingUnit: "g", caloriesPerServing: 72, proteinPerServing: 0.1, carbsPerServing: 0.0, fatPerServing: 8.1, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "牛油果", category: FoodCategory.FAT, servingSize: 100, servingUnit: "g", caloriesPerServing: 160, proteinPerServing: 2.0, carbsPerServing: 8.5, fatPerServing: 14.7, fiberPerServing: 6.7 } }),

    // CONDIMENT 调味
    prisma.food.create({ data: { name: "酱油", category: FoodCategory.CONDIMENT, servingSize: 10, servingUnit: "ml", caloriesPerServing: 10, proteinPerServing: 1.0, carbsPerServing: 1.0, fatPerServing: 0.0, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "蚝油", category: FoodCategory.CONDIMENT, servingSize: 10, servingUnit: "ml", caloriesPerServing: 15, proteinPerServing: 0.5, carbsPerServing: 3.0, fatPerServing: 0.0, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "辣椒酱", category: FoodCategory.CONDIMENT, servingSize: 10, servingUnit: "g", caloriesPerServing: 20, proteinPerServing: 0.5, carbsPerServing: 3.0, fatPerServing: 0.5, fiberPerServing: 0.5 } }),
    prisma.food.create({ data: { name: "沙拉酱", category: FoodCategory.CONDIMENT, servingSize: 15, servingUnit: "ml", caloriesPerServing: 70, proteinPerServing: 0.1, carbsPerServing: 2.5, fatPerServing: 6.9, fiberPerServing: 0.0 } }),

    // SNACK 零食
    prisma.food.create({ data: { name: "混合坚果", category: FoodCategory.SNACK, servingSize: 30, servingUnit: "g", caloriesPerServing: 172, proteinPerServing: 6.0, carbsPerServing: 6.0, fatPerServing: 15.0, fiberPerServing: 2.5 } }),
    prisma.food.create({ data: { name: "黑巧克力 (85%)", category: FoodCategory.SNACK, servingSize: 20, servingUnit: "g", caloriesPerServing: 119, proteinPerServing: 2.5, carbsPerServing: 5.0, fatPerServing: 9.4, fiberPerServing: 2.2 } }),
    prisma.food.create({ data: { name: "蛋白棒", category: FoodCategory.SNACK, servingSize: 60, servingUnit: "g", caloriesPerServing: 220, proteinPerServing: 20.0, carbsPerServing: 18.0, fatPerServing: 7.0, fiberPerServing: 3.0 } }),
    prisma.food.create({ data: { name: "牛肉干", category: FoodCategory.SNACK, servingSize: 30, servingUnit: "g", caloriesPerServing: 95, proteinPerServing: 15.0, carbsPerServing: 3.0, fatPerServing: 2.5, fiberPerServing: 0.0 } }),
    prisma.food.create({ data: { name: "零度可乐", category: FoodCategory.SNACK, servingSize: 330, servingUnit: "ml", caloriesPerServing: 0, proteinPerServing: 0.0, carbsPerServing: 0.0, fatPerServing: 0.0, fiberPerServing: 0.0 } }),
  ]);

  console.log(`  ✓ ${foods.length} foods created\n`);

  // ══════════════════════════════════════
  // 3. Training Templates (训练模板) — linked to user
  // ══════════════════════════════════════
  console.log("Creating training templates...");

  const findEx = (name: string) => exercises.find((e) => e.name === name)!;

  // Push A
  const pushA = await prisma.trainingTemplate.create({
    data: {
      userId: user.id,
      name: "Push A",
      description: "胸 + 肩 + 三头",
      exercises: {
        create: [
          { exerciseId: findEx("卧推").id, order: 1 },
          { exerciseId: findEx("上斜哑铃卧推").id, order: 2 },
          { exerciseId: findEx("飞鸟").id, order: 3 },
          { exerciseId: findEx("器械肩推").id, order: 4 },
          { exerciseId: findEx("绳索侧平举").id, order: 5 },
          { exerciseId: findEx("绳索臂屈伸").id, order: 6 },
        ],
      },
    },
    include: { exercises: true },
  });
  console.log(`  ✓ Push A (${pushA.exercises.length} exercises)`);

  // Pull A
  const pullA = await prisma.trainingTemplate.create({
    data: {
      userId: user.id,
      name: "Pull A",
      description: "背 + 二头 + 后束",
      exercises: {
        create: [
          { exerciseId: findEx("对握高位下拉").id, order: 1 },
          { exerciseId: findEx("胸托划船").id, order: 2 },
          { exerciseId: findEx("单臂悍马划船").id, order: 3 },
          { exerciseId: findEx("宽握坐姿划船").id, order: 4 },
          { exerciseId: findEx("面拉").id, order: 5 },
          { exerciseId: findEx("上斜哑铃弯举").id, order: 6 },
        ],
      },
    },
    include: { exercises: true },
  });
  console.log(`  ✓ Pull A (${pullA.exercises.length} exercises)`);

  // Legs A
  const legsA = await prisma.trainingTemplate.create({
    data: {
      userId: user.id,
      name: "Legs A",
      description: "腿 + 核心",
      exercises: {
        create: [
          { exerciseId: findEx("前蹲").id, order: 1 },
          { exerciseId: findEx("保加利亚分腿蹲").id, order: 2 },
          { exerciseId: findEx("罗马尼亚硬拉").id, order: 3 },
          { exerciseId: findEx("腿弯举").id, order: 4 },
          { exerciseId: findEx("提踵").id, order: 5 },
        ],
      },
    },
    include: { exercises: true },
  });
  console.log(`  ✓ Legs A (${legsA.exercises.length} exercises)\n`);

  // ══════════════════════════════════════
  // 4. Default Goal (默认目标) — linked to user
  // ══════════════════════════════════════
  console.log("Creating default goal with milestones...");

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      type: GoalType.WEIGHT,
      title: "减脂 115kg → 90kg",
      description: "通过热量缺口 + 力量训练，在 6-8 个月内完成 25kg 减脂",
      targetValue: 90.0,
      startValue: 115.0,
      unit: "kg",
      startDate: new Date(),
      milestones: {
        create: [
          { title: "110kg", targetValue: 110.0 },
          { title: "105kg", targetValue: 105.0 },
          { title: "100kg", targetValue: 100.0 },
          { title: "95kg", targetValue: 95.0 },
          { title: "90kg", targetValue: 90.0 },
        ],
      },
    },
    include: { milestones: true },
  });
  console.log(`  ✓ Goal "${goal.title}" with ${goal.milestones.length} milestones\n`);

  // ══════════════════════════════════════
  // Summary
  // ══════════════════════════════════════
  console.log("═══════════════════════════════════");
  console.log("✅ Seed complete!");
  console.log(`   ${exercises.length} exercises`);
  console.log(`   ${foods.length} foods`);
  console.log("   3 training templates (Push A / Pull A / Legs A)");
  console.log("   1 goal (115kg → 90kg, 5 milestones)");
  console.log(`   Default user: admin / admin123`);
  console.log("═══════════════════════════════════\n");
  console.log("Next: Start dev server and go to /login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
