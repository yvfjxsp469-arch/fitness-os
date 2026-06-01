"use client";

import { useState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-zinc-300">
          用户名
        </Label>
        <Input
          id="username"
          name="username"
          placeholder="admin"
          className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
          autoComplete="username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-zinc-300">
          密码
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          className="border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500"
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black hover:bg-zinc-200"
      >
        {loading ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
