"use server";

import { prisma } from "@/lib/prisma";
import { setSession, clearSession } from "@/lib/auth";
import { loginSchema } from "@/validators/auth";
import bcrypt from "bcryptjs";

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "请输入用户名和密码" };
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  if (!user) {
    return { error: "用户名或密码错误" };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "用户名或密码错误" };
  }

  await setSession(user.id);
  return { success: true };
}

export async function logout() {
  await clearSession();
}
