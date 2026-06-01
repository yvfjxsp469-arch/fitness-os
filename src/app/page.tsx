import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const userId = await getSession();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Fitness OS</h1>
      <p className="text-zinc-400">
        欢迎回来，{user?.displayName || "用户"}
      </p>
      <p className="text-sm text-zinc-500">Dashboard 开发中...</p>
    </div>
  );
}
