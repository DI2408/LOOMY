import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LumiProvider } from "@/components/providers/lumi-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-loomy-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LOOMY | Fashion Q-Commerce Platform",
  description:
    "LOOMY er en multi-tenant platform for kunder og fashion-butikspartnere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="da"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LumiProvider>{children}</LumiProvider>
      </body>
    </html>
  );
}
