import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const jet = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "ahmadexe // Muhammad Ahmad",
  description:
    "Muhammad Ahmad (ahmadexe). Software engineer. Agentic AI, blockchain, and dev tools. Projects, awards, and writing.",
  openGraph: {
    title: "ahmadexe // Muhammad Ahmad",
    description:
      "Software engineer. Agentic AI, blockchain, and dev tools.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jet.variable} ${space.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-bg text-ink font-mono selection:bg-matrix selection:text-black"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
