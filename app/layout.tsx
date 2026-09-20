import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "하루의 환율 · USD/KRW",
  description: "달러·원화 일일 기준 환율과 출처를 확인하고 날짜별 변화를 기록합니다.",
  other: {
    "codex-preview": "development",
  },
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
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
