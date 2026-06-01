# Fitness OS — Architecture & Module Design v2.0

## 1. 系统架构总览

### 1.1 技术选型

| 层 | 技术 | 选型理由 |
|---|------|----------|
| 框架 | Next.js 15 (App Router) | RSC + Server Actions，减少 API 层代码 |
| 语言 | TypeScript (strict) | 类型安全 |
| 样式 | Tailwind CSS v4 | 原子化 CSS，移动优先 |
| 组件库 | Shadcn/ui (new-york style) | 无 runtime 依赖，Radix 底层 |
| ORM | Prisma 6 | PostgreSQL 最佳 ORM，类型安全 |
| 数据库 | PostgreSQL (Supabase) | 免费额度，自带 RLS |
| 图表 | Recharts | 自托管，React 原生 |
| 表单 | React Hook Form + Zod | 验证 + 类型推导 |
| 部署 | Vercel / Docker 自托管 | Next.js 原生 |
| 认证 | bcrypt + JWT cookie | 单用户够用，无外部依赖 |

### 1.2 目录结构

```
fitness-os/
├── prisma/
│   ├── schema.prisma              # 数据库 Schema
│   └── seed.ts                    # 初始化数据
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx               # 仪表盘 /
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── weight/
│   │   │   └── page.tsx           # /weight
│   │   ├── nutrition/
│   │   │   ├── page.tsx           # /nutrition
│   │   │   └── foods/
│   │   │       └── page.tsx       # /nutrition/foods
│   │   ├── workout/
│   │   │   ├── page.tsx           # /workout
│   │   │   ├── templates/
│   │   │   │   └── page.tsx       # /workout/templates
│   │   │   ├── exercises/
│   │   │   │   └── page.tsx       # /workout/exercises
│   │   │   └── [id]/
│   │   │       └── page.tsx       # /workout/[id] (训练详情)
│   │   ├── measurements/
│   │   │   └── page.tsx           # /measurements
│   │   ├── goals/
│   │   │   └── page.tsx           # /goals
│   │   ├── weekly-report/
│   │   │   └── page.tsx           # /weekly-report
│   │   ├── login/
│   │   │   └── page.tsx           # /login
│   │   └── api/
│   │       └── auth/              # 认证 API (JWT 签发 / 验证)
│   ├── components/
│   │   ├── ui/                    # Shadcn UI 组件
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── header.tsx
│   │   ├── dashboard/
│   │   │   ├── weight-mini-chart.tsx
│   │   │   ├── calorie-progress.tsx
│   │   │   ├── macro-rings.tsx
│   │   │   ├── weekly-training-summary.tsx
│   │   │   ├── streak-badge.tsx
│   │   │   ├── current-phase-card.tsx
│   │   │   ├── latest-pr-card.tsx
│   │   │   └── milestone-progress.tsx
│   │   ├── weight/
│   │   │   ├── weight-form.tsx
│   │   │   ├── weight-chart.tsx
│   │   │   └── weight-table.tsx
│   │   ├── nutrition/
│   │   │   ├── meal-form.tsx
│   │   │   ├── meal-card.tsx
│   │   │   ├── food-search.tsx
│   │   │   ├── food-form.tsx
│   │   │   ├── macro-progress.tsx
│   │   │   └── meal-timeline.tsx
│   │   ├── workout/
│   │   │   ├── workout-form.tsx
│   │   │   ├── workout-calendar.tsx
│   │   │   ├── exercise-selector.tsx
│   │   │   ├── exercise-set-table.tsx
│   │   │   ├── exercise-history.tsx
│   │   │   ├── training-template-selector.tsx
│   │   │   ├── training-volume-chart.tsx
│   │   │   └── personal-record-card.tsx
│   │   ├── measurements/
│   │   │   ├── measurement-form.tsx
│   │   │   ├── measurement-chart.tsx
│   │   │   └── measurement-history.tsx
│   │   ├── goals/
│   │   │   ├── goal-progress-bar.tsx
│   │   │   ├── milestone-list.tsx
│   │   │   └── estimated-date.tsx
│   │   └── shared/
│   │       ├── date-picker.tsx
│   │       ├── stat-card.tsx
│   │       ├── quick-add-button.tsx
│   │       └── empty-state.tsx
│   ├── lib/
│   │   ├── prisma.ts              # Prisma Client 单例
│   │   ├── auth.ts                # 认证工具 (JWT sign/verify)
│   │   ├── bootstrap.ts           # 首次启动初始化
│   │   ├── tdee.ts                # TDEE 计算
│   │   ├── macros.ts              # 宏观营养素分配
│   │   ├── personal-records.ts    # PR 检测与追踪
│   │   ├── milestones.ts          # 里程碑检测与更新
│   │   └── utils.ts               # 通用工具
│   ├── hooks/
│   │   ├── use-user.ts
│   │   ├── use-weight.ts
│   │   ├── use-today.ts
│   │   └── use-personal-records.ts
│   ├── actions/                    # Server Actions
│   │   ├── weight.ts
│   │   ├── nutrition.ts
│   │   ├── workout.ts
│   │   ├── measurements.ts
│   │   ├── goals.ts
│   │   └── templates.ts
│   └── validators/                 # Zod Schemas
│       ├── weight.ts
│       ├── nutrition.ts
│       ├── workout.ts
│       ├── measurements.ts
│       └── goals.ts
├── docs/
│   ├── PRD.md
│   └── ARCHITECTURE.md
├── public/
├── .env
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

### 1.3 数据流架构

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Dashboard│  │  Weight  │  │ Workout  │  │ Nutrition / Goal │ │
│  │ (RSC)    │  │ (Client) │  │ (Client) │  │ (Client+Server)  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │             │                  │            │
├───────┼─────────────┼─────────────┼──────────────────┼────────────┤
│       │     Server  │  Actions    │                  │            │
│       │     ┌───────┴─────────────┴──────────────────┘            │
│       └─────┤  Next.js 15 App Router                              │
│             │  ┌──────────┐  ┌───────────┐  ┌──────────────┐     │
│             │  │ actions/ │  │  lib/     │  │  validators/ │     │
│             │  │ (Server  │  │ (TDEE,    │  │  (Zod)       │     │
│             │  │ Actions) │  │ PR, etc)  │  │              │     │
│             │  └────┬─────┘  └─────┬─────┘  └──────────────┘     │
│             │       └──────────────┘                               │
│             │              │                                       │
│             │     ┌────────┴────────┐                              │
│             │     │  Prisma Client   │                             │
│             │     └────────┬────────┘                              │
│             │              │                                       │
├─────────────┼──────────────┼───────────────────────────────────────┤
│             │     ┌────────┴────────┐                              │
│             │     │  PostgreSQL      │                             │
│             │     │  (Supabase)      │                             │
│             │     └─────────────────┘                               │
└─────────────┴──────────────────────────────────────────────────────┘
```

**数据流原则：**
- Dashboard 使用 RSC 直接查数据库，零 API 开销
- 数据录入用 Server Actions，自动 revalidatePath
- 图表为 Client Component，通过 props 接收数据
- 不使用 React Query / SWR

---

## 2. 功能模块详细设计

### 2.1 仪表盘 (Dashboard)

**目标：** 5 秒看清今天全貌。

| 区域 | 内容 | 数据来源 |
|------|------|----------|
| 今日体重 | 最新称重 + 较昨日变化 Δ± | WeightRecord |
| 7日均重趋势 | 迷你折线图（7天） | WeightRecord |
| 热量进度 | 目标 / 已摄入 / 剩余，三色条 | DailySummary, Meal |
| 宏观营养素环 | 蛋白质/碳水/脂肪 实际 vs 目标 | Meal+MealFood, UserProfile |
| 本周训练 | "本周 Push 1/2 Pull 1/2 Legs 0/2" | Workout |
| 连续打卡 | "已坚持 42 天" + 热力图 | 综合统计 |
| 当前减脂阶段 | "稳定减脂期 105→95kg (已减 10/15kg)" | Goal, WeightRecord |
| 最近 PR | "卧推 100kg×5 3 天前" | ExerciseSet, PR 计算 |
| 里程碑进度 | 110✓ → 105✓ → 100→ 95→ 90 | GoalMilestone |
| 快速录入 | 浮动按钮：记体重 / 记饮食 / 开始训练 | — |

### 2.2 体重模块 (Weight)

同 v1.0 设计，保持不变。

- 每日体重 CRUD
- 表格视图：日期、体重、较上日 Δ、7日均值
- 趋势图：折线 + 7日均线 + 目标参考线
- 时间范围：7/30/90天/全部
- 统计卡片：最新体重、30天最低、累计减重、距目标

### 2.3 身体围度模块 (Measurements)

**目标：** 追踪身体成分变化，防止被体重数字欺骗。

**核心功能：**
- 围度 CRUD：腰围、胸围、臀围、大腿围、手臂围、颈围
- 所有字段可选（某天只量了腰围也可以录入）
- 趋势图：多线图对比（腰围+胸围 vs 体重）
- 历史列表：按日期倒序
- 周报联动：本周腰围变化

**关键洞察：**
```
腰围下降 + 体重不变 = 正在减脂（肌肉保留） ✓
腰围不变 + 体重下降 = 可能掉肌肉 ✗
```

### 2.4 饮食模块 (Nutrition)

同 v1.0 设计，升级点：
- Food.category 改为 FoodCategory 枚举（防脏数据）
- MealFood 增加 fiber 快照
- 食物库预设 50+ 常见食物

**食物库预设（按 FoodCategory 枚举）：**

| 分类 | 枚举值 | 示例 |
|------|--------|------|
| 主食 | STAPLE | 米饭、馒头、面条、全麦面包、燕麦、红薯、玉米 |
| 肉类 | MEAT | 鸡胸肉、鸡腿肉、牛肉、猪肉、鱼、虾、三文鱼 |
| 蛋奶 | DAIRY | 鸡蛋、牛奶、酸奶、奶酪、蛋白粉 |
| 蔬菜 | VEGETABLE | 西兰花、菠菜、番茄、黄瓜、生菜、胡萝卜 |
| 水果 | FRUIT | 苹果、香蕉、橙子、蓝莓 |
| 油脂 | FAT | 橄榄油、花生油、黄油、牛油果 |
| 调味 | CONDIMENT | 酱油、蚝油、辣椒酱、沙拉酱 |
| 零食 | SNACK | 坚果、黑巧克力、蛋白棒、牛肉干 |

### 2.5 训练模块 (Workout) — 动作级

**目标：** 记录每一次训练的每一个动作的每一组数据，支撑 PR 追踪。

**数据模型：**
```
Workout (一次训练)
  ├── name: "Push A"
  ├── type: STRENGTH
  ├── templateId → TrainingTemplate
  │
  └── WorkoutExercise (训练中的动作) ×6
        ├── exerciseId → Exercise "卧推"
        ├── order: 1
        │
        └── ExerciseSet (组) ×3
              ├── setNumber: 1, weightKg: 80, reps: 8, rpe: 7
              ├── setNumber: 2, weightKg: 80, reps: 8, rpe: 8
              └── setNumber: 3, weightKg: 80, reps: 7, rpe: 9
```

**训练流程：**

1. 进入 /workout → 看到模板选择器
2. 选择 "Push A" → 自动创建 Workout + 6 个 WorkoutExercise
3. 开始训练 → 逐动作逐组录入
4. 每组录入后 → 系统检测是否新 PR（同动作同次数下的最大重量，或同动作同重量下的最大次数）
5. 所有组完成 → 标记训练完成 → 写入 DailySummary

**PR 检测逻辑（lib/personal-records.ts）：**
```typescript
// 为每个 weight × reps 组合计算 1RM 估值
// Epley formula: 1RM = weight × (1 + reps / 30)
function estimateOneRM(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

// PR 判断：本次估算 1RM > 历史最好估算 1RM
function isPR(exerciseId: string, weightKg: number, reps: number): boolean {
  const currentE1RM = estimateOneRM(weightKg, reps);
  const previousBest = getBestE1RM(exerciseId);
  return currentE1RM > previousBest;
}
```

### 2.6 训练模板模块 (Templates)

**目标：** 减少重复录入，保证训练结构一致。

**核心功能：**
- 模板 CRUD
- 模板内动作排序
- 从模板一键创建训练
- 模板使用次数统计
- 首次启动自动创建 Push A / Pull A / Legs A

### 2.7 目标模块 (Goals) + 里程碑

**目标：** 可视化进度 + 阶段庆祝，维持动力。

**里程碑自动生成：**
```
创建目标 "减脂 115→90kg" 时：
自动生成 5 个里程碑：
  110kg → 105kg → 100kg → 95kg → 90kg
```

**里程碑检测（lib/milestones.ts）：**
```typescript
// 每次体重录入后检查
function checkMilestones(goalId: string, currentWeight: number) {
  const pending = getPendingMilestones(goalId);  // achieved=false, 按 targetValue 升序
  for (const m of pending) {
    if (currentWeight <= m.targetValue) {
      markAchieved(m.id);  // achieved=true, achievedAt=now()
    }
  }
}
```

### 2.8 周报模块 (Weekly Report)

**报告内容（升级后）：**
- 本周均重 vs 上周均重（Δ kg）
- 本周腰围变化（如有录入）
- 本周热量日均摄入 vs 目标
- 本周训练次数 + 按模板分类：Push×N, Pull×N, Legs×N
- 本周训练总容量（Volume = Σ weight × reps）
- 本周 PR 记录
- 本周最高/最低体重
- 下周热量目标调整建议

---

## 3. 数据库设计

### 3.1 完整 ER 图

```
User (1) ──────┬──< WeightRecord (N)
                ├──< BodyMeasurement (N)     ← NEW
                ├──< Meal (N)
                ├──< Workout (N)
                ├──< Goal (N)
                ├──< TrainingTemplate (N)    ← NEW
                ├──< DailySummary (N)
                ├──< HealthMetric (N)        ← NEW (future)
                ├──< Food (N)               ← CustomFoods
                ├──< Exercise (N)           ← CustomExercises
                └── (1) ── UserProfile

Meal (1) ──────────< MealFood (N) >─── (1) Food

Workout (1) ───────< WorkoutExercise (N) >── (1) Exercise
Workout (N) >────── (1) TrainingTemplate      ← NEW (optional)

WorkoutExercise (1) ──< ExerciseSet (N)       ← NEW

TrainingTemplate (1) ──< TrainingTemplateExercise (N) >── (1) Exercise  ← NEW

Goal (1) ──────────< GoalProgress (N)
Goal (1) ──────────< GoalMilestone (N)        ← NEW
```

### 3.2 完整表清单（16 张表）

| # | 表名 | 说明 | v1.0 |
|---|------|------|------|
| 1 | users | 用户账户 | ✓ |
| 2 | user_profiles | 身体参数 | ✓ |
| 3 | weight_records | 每日体重 | ✓ |
| 4 | body_measurements | 身体围度 | ✓ NEW |
| 5 | foods | 食物库 | ✓ |
| 6 | meals | 一餐 | ✓ |
| 7 | meal_foods | 餐-食物关联（含快照） | ✓ |
| 8 | exercises | 动作库 | ✓ NEW |
| 9 | workouts | 训练记录 | ✓ |
| 10 | workout_exercises | 训练-动作关联 | ✓ NEW |
| 11 | exercise_sets | 组详情（重量/次数） | ✓ NEW |
| 12 | training_templates | 训练模板 | ✓ NEW |
| 13 | training_template_exercises | 模板-动作关联 | ✓ NEW |
| 14 | goals | 目标 | ✓ |
| 15 | goal_progresses | 目标进度日志 | ✓ |
| 16 | goal_milestones | 目标里程碑 | ✓ NEW |
| 17 | daily_summaries | 每日汇总缓存 | ✓ |
| 18 | health_metrics | Apple Watch 预留 | ✓ NEW |

### 3.3 新增字段详细设计

#### BodyMeasurement
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | UUID FK | |
| date | DATE | 测量日期 |
| waistCm | DECIMAL(5,1)? | 腰围 |
| chestCm | DECIMAL(5,1)? | 胸围 |
| hipCm | DECIMAL(5,1)? | 臀围 |
| thighCm | DECIMAL(5,1)? | 大腿围 |
| armCm | DECIMAL(5,1)? | 手臂围 |
| neckCm | DECIMAL(5,1)? | 颈围 |
| weightKg | DECIMAL(5,2)? | 当日体重（可选，方便交叉参考） |
| notes | TEXT? | |

唯一约束：(userId, date)

#### Exercise
| 字段 | 类型 | 说明 |
|------|------|------|
| name | VARCHAR(100) | 动作名称 |
| muscleGroup | MuscleGroup ENUM | 主要肌群 |
| isCustom | BOOLEAN | 是否用户自定义 |
| creatorId | UUID? FK | |
| isDeleted | BOOLEAN | 软删除 |

#### WorkoutExercise
| 字段 | 类型 | 说明 |
|------|------|------|
| workoutId | UUID FK | |
| exerciseId | UUID FK | |
| order | INT | 动作顺序 |
| notes | TEXT? | 备注（如「慢速离心」） |

#### ExerciseSet
| 字段 | 类型 | 说明 |
|------|------|------|
| workoutExerciseId | UUID FK | |
| setNumber | INT | 组号 |
| weightKg | DECIMAL(6,1)? | 重量 |
| reps | INT? | 次数 |
| durationSec | INT? | 时长（有氧） |
| distanceM | DECIMAL(6,1)? | 距离（有氧） |
| rpe | INT? | 1-10 |
| isWarmup | BOOLEAN | 是否热身组 |
| notes | TEXT? | |

#### TrainingTemplate
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | UUID FK | |
| name | VARCHAR(100) | Push A |
| description | TEXT? | |
| isActive | BOOLEAN | 是否启用 |

#### TrainingTemplateExercise
| 字段 | 类型 | 说明 |
|------|------|------|
| templateId | UUID FK | |
| exerciseId | UUID FK | |
| order | INT | |
| notes | TEXT? | 如 "3×8-12" |

#### GoalMilestone
| 字段 | 类型 | 说明 |
|------|------|------|
| goalId | UUID FK | |
| title | VARCHAR(100) | 110kg |
| targetValue | DECIMAL(8,2) | 110.00 |
| achieved | BOOLEAN | |
| achievedAt | TIMESTAMP? | 达成时间 |

#### HealthMetric
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | UUID FK | |
| date | DATE | |
| source | VARCHAR(50) | apple_health / manual |
| metricType | VARCHAR(50) | steps / active_calories / heart_rate / exercise_minutes |
| value | DECIMAL(10,1) | |
| unit | VARCHAR(20) | steps / kcal / bpm / min |

### 3.4 Workout 表变更

| 变更 | 说明 |
|------|------|
| + templateId | UUID? FK → training_templates，可空 |
| type | STRENGTH/CARDIO/REST（不变） |

### 3.5 Food 表变更

| 变更 | 说明 |
|------|------|
| category | String → FoodCategory Enum |

### 3.6 MealFood 表变更

| 变更 | 说明 |
|------|------|
| + fiber | DECIMAL(5,1)?，膳食纤维快照 |

### 3.7 DailySummary 表变更

| 变更 | 说明 |
|------|------|
| + totalFiber | DECIMAL(5,1)? |

---

## 4. 索引策略（完整）

| 表 | 索引 | 说明 |
|----|------|------|
| weight_records | (userId, date DESC) | 体重趋势查询 |
| body_measurements | (userId, date DESC) | 围度趋势查询 |
| meals | (userId, date) | 每日饮食 |
| meal_foods | (mealId) | JOIN 查询 |
| foods | (category, isDeleted) | 食物搜索 |
| foods | (name) | 名称搜索 |
| exercises | (muscleGroup, isDeleted) | 按肌群筛选 |
| exercises | (name) | 名称搜索 |
| workouts | (userId, date DESC) | 训练记录 |
| workout_exercises | (workoutId) | JOIN 查询 |
| exercise_sets | (workoutExerciseId) | JOIN 查询 |
| training_template_exercises | (templateId) | JOIN 查询 |
| goal_progresses | (goalId, date DESC) | 进度趋势 |
| goal_milestones | (goalId) | 里程碑列表 |
| daily_summaries | (userId, date) UNIQUE | Dashboard |
| health_metrics | (userId, date DESC) | 健康数据 |
| health_metrics | (userId, metricType, date DESC) | 按类型查询 |

---

## 5. Bootstrap 初始化系统

### 5.1 触发时机

首次启动检测：User 表为空 → 执行 bootstrap 流程。

### 5.2 Bootstrap 内容（lib/bootstrap.ts）

```
1. 创建默认动作库（~30 个预设动作）
2. 创建训练模板（Push A / Pull A / Legs A）
3. 创建食物库（~50 个常见食物）
4. 创建默认目标（115kg → 90kg + 5 个里程碑）
5. 返回初始化完成状态
```

### 5.3 默认动作库

| 动作 | 肌群 | 用于模板 |
|------|------|----------|
| 卧推 | CHEST | Push A |
| 上斜哑铃卧推 | CHEST | Push A |
| 飞鸟 | CHEST | Push A |
| 器械肩推 | SHOULDERS | Push A |
| 绳索侧平举 | SHOULDERS | Push A |
| 绳索臂屈伸 | TRICEPS | Push A |
| 双杠臂屈伸 | TRICEPS | — |
| 对握高位下拉 | BACK | Pull A |
| 胸托划船 | BACK | Pull A |
| 单臂悍马划船 | BACK | Pull A |
| 宽握坐姿划船 | BACK | Pull A |
| 面拉 | SHOULDERS | Pull A |
| 上斜哑铃弯举 | BICEPS | Pull A |
| 牧师凳弯举 | BICEPS | — |
| 前蹲 | QUADS | Legs A |
| 保加利亚分腿蹲 | QUADS | Legs A |
| 腿举 | QUADS | — |
| 罗马尼亚硬拉 | HAMSTRINGS | Legs A |
| 腿弯举 | HAMSTRINGS | Legs A |
| 提踵 | CALVES | Legs A |
| 臀桥 | GLUTES | — |
| 平板支撑 | CORE | — |
| 卷腹 | CORE | — |
| 悬垂举腿 | CORE | — |

### 5.4 默认食物库（部分）

见 `prisma/seed.ts`。

---

## 6. 安全设计

与 v1.0 相同，单用户 bcrypt + JWT httpOnly cookie。

---

## 7. 关键算法

### 7.1 TDEE 计算（同 v1.0）

### 7.2 宏观营养素分配（同 v1.0）

### 7.3 PR 检测

```typescript
// Epley 1RM 估算公式
function estimateOneRM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

// 查询某个动作的历史最佳估算 1RM
async function getPersonalRecord(exerciseId: string): Promise<{
  weightKg: number;
  reps: number;
  e1rm: number;
  date: Date;
} | null> {
  // 查询该动作所有正式组（非热身组）
  // 计算每组 e1rm，取最大值
}
```

### 7.4 训练容量计算

```typescript
// Volume = Σ(weight × reps) for all sets
function calculateVolume(sets: ExerciseSet[]): number {
  return sets
    .filter(s => !s.isWarmup)
    .reduce((sum, s) => sum + (Number(s.weightKg) || 0) * (s.reps || 0), 0);
}
```

---

## 8. Migration 计划

### Migration 1: Core
```
users
user_profiles
weight_records
```

### Migration 2: Nutrition
```
foods
meals
meal_foods
```

### Migration 3: Training
```
exercises
workouts
workout_exercises
exercise_sets
training_templates
training_template_exercises
```

### Migration 4: Goals & Health
```
goals
goal_progresses
goal_milestones
body_measurements
daily_summaries
health_metrics
```

**执行顺序：** 按 Migration 1→2→3→4 依次执行，确保外键依赖正确。
