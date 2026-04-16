import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Rental Property Wizard — Investment Analyzer",
  description:
    "Professional rental property investment analysis platform. Evaluate real estate deals with real data, projections, and decision-support tools.",
  keywords: ["rental property", "real estate", "investment analysis", "cap rate", "cash flow"],
  authors: [{ name: "RentalPropertyWizard" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 font-sans">{children}</body>
    </html>
  );
}
