// app/layout.tsx
// Root layout — loads Orbitron / Space Grotesk / JetBrains Mono from Google Fonts,
// injects global CSS variables, ambient background atmosphere, particle canvas,
// HUD navbar, and wraps everything in <Providers>.

import type { Metadata, Viewport } from "next";
import { Orbitron, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { HUD } from "@/components/HUD";
import { ParticleBackground } from "@/components/ParticleBackground";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-game",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

export const metadata: Metadata = {
  title:       "CodeQuest — Learn DSA Through Adventure",
  description: "Cyberpunk code-learning RPG. Master Data Structures & Algorithms through interactive quests, skill trees, and badges.",
  manifest:    "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CodeQuest" },
  openGraph: {
    title:       "CodeQuest — Learn DSA Through Adventure",
    description: "Cyberpunk DSA learning RPG with 6 interactive quests",
    type:        "website",
  },
};

export const viewport: Viewport = {
  width:               "device-width",
  initialScale:        1,
  maximumScale:        1,
  themeColor:          "#7b6ff7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* PWA icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Orbitron:wght@600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var i = 0; i < regs.length; i++) {
                    regs[i].unregister();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body>
        {/* Ambient background layers */}
        <div className="ambient-bg" aria-hidden="true" />
        <div className="ambient-grid" aria-hidden="true" />
        <ParticleBackground />

        <Providers>
          <HUD />
          <main>{children}</main>

          {/* Footer */}
          <footer className="site-footer">
            <div className="site-footer__brand">⚡ CODEQUEST</div>
            <div className="site-footer__tagline">
              Master Data Structures & Algorithms through cyberpunk adventure
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
