import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LumiProvider } from "@/components/providers/lumi-provider";
import { LumiShell } from "@/components/lumi-shell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LOOMY | Mode leveret fra København K",
  description:
    "LOOMY matcher dig med udvalgte butikker, live lager og hurtig levering — kunde, butik og bud i ét flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="da"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: extensions (e.g. Grammarly) mutate body/html attrs before hydration */}
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans text-stone-900"
      >
        <noscript>
          <div className="mx-auto max-w-lg p-6 text-center text-stone-800">
            <p className="font-serif text-lg font-medium">LOOMY kræver JavaScript</p>
            <p className="mt-2 text-sm text-stone-600">
              Slå JavaScript til i din browser, eller åbn siden i en anden browser.
            </p>
          </div>
        </noscript>
        <LumiProvider>
          <LumiShell>{children}</LumiShell>
        </LumiProvider>
      </body>
    </html>
  );
}
