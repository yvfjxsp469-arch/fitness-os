import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Fitness OS</h1>
          <p className="mt-1 text-sm text-zinc-400">登录以继续</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
