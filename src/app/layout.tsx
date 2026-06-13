import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Job Apply Pipeline",
  description: "AI-powered job search, scoring, and application automation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
<body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen bg-slate-50">
          <Nav />
          <main className="max-w-4xl mx-auto px-5 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}