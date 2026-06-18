import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import { ToastProvider } from "@/components/common/Toast";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TrendMind — AI Trend Prediction",
  description: "Discover emerging products before market saturation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        <ToastProvider>
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="page-container flex items-center justify-between h-14">
              <Link href="/" className="text-lg font-bold text-blue-600 tracking-tight">
                TrendMind
              </Link>
              <nav className="flex items-center gap-6 text-sm text-gray-600">
                <Link href="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                <Link href="/login" className="hover:text-blue-600 transition-colors">Login</Link>
              </nav>
            </div>
          </header>
          <main className="page-container py-6">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
