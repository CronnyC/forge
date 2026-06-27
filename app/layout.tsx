import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/PageTransition";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FORMA — Dynamic Fitness",
  description: "Home-first bodyweight fitness. No decision fatigue. Real workouts.",
};

export const viewport: Viewport = {
  themeColor: "#0D0D10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
