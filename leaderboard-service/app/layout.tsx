import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "三国志昭烈传 · 战绩排行榜",
  description: "三国志昭烈传公共战绩排行榜服务。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
