import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StackTrim | AI Spend Audit",
  description: "Find AI tool overspend, plan-fit issues, and Credex savings opportunities in under two minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
