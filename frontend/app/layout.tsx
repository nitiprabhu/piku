import type { Metadata } from "next";
import { Anton, Plus_Jakarta_Sans, Noto_Sans_Devanagari, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LangProvider } from "@/components/AppShell";

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "700", "800"],
  variable: "--font-devanagari",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReelCraft — AI Reels in 60 Seconds",
  description:
    "AI-powered short video creation for Indian content creators. Type a prompt, get a viral reel in under 60 seconds. Hindi, English, Hinglish supported.",
  keywords: "AI video, reels creator, Hindi content, viral reels, Instagram reels",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${plusJakarta.variable} ${notoDevanagari.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
