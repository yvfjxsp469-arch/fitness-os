import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitness OS",
  description: "Personal Fitness Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark h-full antialiased">
      <body className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
