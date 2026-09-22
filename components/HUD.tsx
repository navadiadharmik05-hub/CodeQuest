'use client';
// components/HUD.tsx
// Cyberpunk HUD navbar — glassmorphism design with animated XP bar shimmer,
// heart pulse, level badge glow, streak fire flicker, gradient avatar ring.
//
// Brand:
//   CODEQUEST
//   LEARN • PLAY • MASTER
//
// Legacy ID anchors preserved: #h-hearts #h-lvl #h-xp #h-streak #h-fill #h-lvl-badge
//
// All styles are in globals.css — no inline <style> tags.

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/gameStore";

export function HUD() {
  const {
    hearts, level, xp, xpToNext, streakCount, toasts, dismissToast, userName, userImage, cleared
  } = useGameStore();

  // XP fill percentage inside current level
  const fillPct = xpToNext > 0 ? Math.min((xp / xpToNext) * 100, 100) : 0;

  // Hearts string & state
  const isLowHearts = hearts <= 2 && hearts > 0;

  // Auto-dismiss toasts
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const t of toasts) {
      const delay = t.type === "xp" ? 2500 : 4000;
      timers.push(setTimeout(() => dismissToast(t.id), delay));
    }
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <>
      {/* Main HUD strip */}
      <header className="hud-bar" role="banner">
        {/* Left: Brand & Navigation */}
        <div className="hud-left">
          <a href="#" className="hud-logo-link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span className="hud-logo-icon">⚡</span>
            <div className="hud-brand-col">
              <span className="hud-logo-text">CODEQUEST</span>
              <span className="hud-tagline">LEARN • PLAY • MASTER</span>
            </div>
          </a>

          {/* Quick Section Nav */}
          <nav className="hud-nav" aria-label="Quick navigation">
            <button className="hud-nav-btn" onClick={() => scrollToSection('command-center')}>
              HQ
            </button>
            <button className="hud-nav-btn" onClick={() => scrollToSection('quest-map-section')}>
              QUEST MAP
            </button>
            <button className="hud-nav-btn" onClick={() => scrollToSection('skill-tree-section')}>
              SKILLS
            </button>
            <button className="hud-nav-btn" onClick={() => scrollToSection('badges-hall-section')}>
              TROPHIES
            </button>
          </nav>
        </div>

        {/* Right: stats */}
        <div className="hud-right">
          {/* Hearts */}
          <div
            className={`hud-hearts ${isLowHearts ? 'hud-hearts--low' : ''} ${hearts === 0 ? 'hud-hearts--zero' : ''}`}
            id="h-hearts"
            title={`${hearts} of 5 hearts available`}
            aria-label={`${hearts} of 5 hearts`}
          >
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`hud-heart-unit ${i < hearts ? 'hud-heart-unit--active' : 'hud-heart-unit--empty'}`}
              >
                {i < hearts ? '❤' : '🖤'}
              </span>
            ))}
          </div>

          {/* XP bar */}
          <div className="hud-xp" title={`Current Level Progress: ${xp} / ${xpToNext} XP`}>
            <div className="hud-xp-lbl">
              <span id="h-lvl" className="hud-xp-lvl-text">LVL {level}</span>
              <span id="h-xp" className="hud-xp-num">{xp}/{xpToNext} XP</span>
            </div>
            <div className="hud-xp-bar">
              <div
                className="hud-xp-fill"
                id="h-fill"
                style={{ width: `${fillPct}%` }}
                role="progressbar"
                aria-valuenow={Math.round(fillPct)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Level badge */}
          <div className="hud-lvl" id="h-lvl-badge">
            <span className="hud-lvl-symbol">⚡</span>
            <span>LVL {level}</span>
          </div>

          {/* Streak */}
          <div className="hud-streak" title={`Daily Streak: ${streakCount} Day${streakCount > 1 ? 's' : ''}`}>
            <span className="hud-streak-fire">🔥</span>
            <span id="h-streak" className="hud-streak-count">{streakCount}d</span>
          </div>

          {/* Avatar */}
          <button
            className="hud-avatar"
            onClick={() => {
              const totalXpVal = useGameStore.getState().totalXp;
              const clearedCount = Object.keys(useGameStore.getState().cleared).length;
              if (window.confirm(`[CYBER TERMINAL - PILOT PROFILE]\n\nAgent: ${userName ?? "Cyber Quester"}\nClearance: Level ${level}\nTotal XP: ${totalXpVal}\nQuests Cleared: ${clearedCount} / 6\nStreak: ${streakCount} Days\n\nReset quest progress to initial seed state?`)) {
                useGameStore.getState().reset();
                useGameStore.getState().initializeDemo();
              }
            }}
            title={`Pilot: ${userName ?? "Cyber Quester"} — click to view profile or reset`}
            aria-label="Player profile"
          >
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt={userName ?? "avatar"} width={28} height={28} />
            ) : (
              <span className="hud-avatar-initial">
                {(userName ?? "C")[0].toUpperCase()}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Toast area */}
      <div className="hud-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`hud-toast hud-toast--${t.type}`}
            onClick={() => dismissToast(t.id)}
          >
            {t.type === "xp" && (
              <div className="hud-toast-content">
                <span className="hud-toast-icon">⚡</span>
                <span>+{t.payload.amount} XP EARNED</span>
              </div>
            )}
            {t.type === "levelup" && (
              <div className="hud-toast-content">
                <span className="hud-toast-icon">🚀</span>
                <span>SYSTEM UPGRADE! LEVEL {t.payload.level} REACHED</span>
              </div>
            )}
            {t.type === "badge" && (
              <div className="hud-toast-content">
                <span className="hud-toast-icon">{t.payload.icon}</span>
                <span>ACHIEVEMENT UNLOCKED: {t.payload.name}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
