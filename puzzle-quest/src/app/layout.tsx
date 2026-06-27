import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/hooks/useGameState";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Puzzle Quest | Real-Time Cyber Multiplayer Challenge",
  description: "Join your team, solve neon cyber puzzle grids, and compete in real-time esports-style gaming action. Will you solve the grid first?",
  keywords: ["puzzle game", "real-time multiplayer", "cyberpunk game", "nextjs puzzle", "framer motion game"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-cyber-bg text-slate-100 overflow-x-hidden selection:bg-neon-pink selection:text-white">
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}

