'use client';
// components/InstallButton.tsx
// Captures the browser's `beforeinstallprompt` event and renders
// an install button when the PWA is installable. Hidden otherwise.

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled]           = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Check if already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (installed || !deferredPrompt) return null;

  return (
    <button className="install-btn" onClick={handleInstall} aria-label="Install CodeQuest app">
      📲 Install App
      <style>{`
        .install-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 20px;
          background: var(--violetg, linear-gradient(135deg,#7b6ff7,#a78bfa));
          border: none; border-radius: var(--rfull, 9999px);
          font-family: var(--font-game,'Orbitron',sans-serif);
          font-size: 0.7rem; letter-spacing: 0.1em;
          color: #fff; cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .install-btn:hover { opacity: 0.88; transform: translateY(-2px); }
      `}</style>
    </button>
  );
}
