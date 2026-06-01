"use client";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-xs text-zinc-500 hover:text-white"
    >
      退出
    </Button>
  );
}
