'use client';
// components/BadgesHall.tsx
// Trophy Hall & Achievement Vault.
// Earned badges glow with gold radiance and detailed descriptions.
// Locked badges feature mystery silhouette and unlock criteria hints.
// Real-time progress bar shows X/12 earned.

import React from 'react';
import { useGameStore } from '@/store/gameStore';

// Full badge catalogue (mirroring DB seed order)
const ALL_BADGES = [
  { id: "first-login",     icon: "🌟", name: "FIRST LOGIN",     description: "Opened CodeQuest and initialized pilot interface", hint: "Automatic on first deployment" },
  { id: "bug-squasher",    icon: "🐛", name: "BUG SQUASHER",    description: "Completed a syntax puzzle in Syntax Dungeon", hint: "Clear Syntax Dungeon" },
  { id: "time-traveler",   icon: "⏪", name: "TIME TRAVELER",   description: "Stepped backward in program execution trace", hint: "Step backward in Execution Arena" },
  { id: "debugger",        icon: "🧭", name: "DEBUGGER",        description: "Ran an execution trace to completion", hint: "Finish Execution Arena" },
  { id: "sort-master",     icon: "🫧", name: "SORT MASTER",     description: "Finished bubble sort array visualizer", hint: "Complete Sort Arena" },
  { id: "tower-conqueror", icon: "🏰", name: "TOWER CONQUEROR", description: "Solved Tower of Hanoi puzzle", hint: "Solve Tower of Hanoi" },
  { id: "tree-whisperer",  icon: "🌳", name: "TREE WHISPERER",  description: "Constructed a BST with 5+ nodes", hint: "Insert 5 nodes in BST Quest" },
  { id: "stack-overflow",  icon: "📚", name: "STACK OVERFLOW",  description: "Pushed 5 items onto the cyber stack", hint: "Push 5 items in Stack Boss" },
  { id: "queue-master",    icon: "🚶", name: "QUEUE MASTER",    description: "Dequeued 5 packets from the conveyor queue", hint: "Dequeue 5 items in Stack Boss" },
  { id: "on-a-roll",       icon: "🔥", name: "ON A ROLL",       description: "Earned XP across 3 distinct missions", hint: "Clear any 3 quests" },
  { id: "perfect-hanoi",   icon: "💎", name: "OPTIMAL MOVER",   description: "Solved Hanoi in minimum theoretical moves", hint: "Solve Hanoi in 2^n - 1 moves" },
  { id: "completionist",   icon: "🏆", name: "COMPLETIONIST",   description: "Mastered all six DSA quest simulations", hint: "Clear all 6 quests" },
];

export function BadgesHall() {
  const earned = useGameStore((s) => s.badges);
  const earnedIds = new Set(earned.map((b) => b.id));
  const earnedCount = earnedIds.size;
  const totalBadges = ALL_BADGES.length;
  const progressPct = Math.round((earnedCount / totalBadges) * 100);

  return (
    <section className="badges-hall" aria-label="Trophy Hall">
      <div className="section-header-row">
        <div>
          <span className="section-tag">ACHIEVEMENT VAULT</span>
          <h2 className="section-title">🏅 TROPHY HALL // SYSTEM HONORS</h2>
        </div>
        <div className="badge-hall-progress-wrap">
          <div className="badge-hall-progress-text">
            <span>UNLOCKED: <b>{earnedCount}</b> / {totalBadges}</span>
            <span className="badge-hall-pct">{progressPct}%</span>
          </div>
          <div className="badge-hall-progress-track">
            <div
              className="badge-hall-progress-fill"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <div className="badges-hall__grid">
        {ALL_BADGES.map((badge) => {
          const isEarned = earnedIds.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`badge-card ${isEarned ? "badge-card--earned" : "badge-card--locked"}`}
              title={isEarned ? badge.description : `Locked: ${badge.hint}`}
              aria-label={`${badge.name}${isEarned ? " (earned)" : " (locked)"}`}
            >
              <div className="badge-card__icon-wrap">
                <span className="badge-card__icon" aria-hidden="true">
                  {isEarned ? badge.icon : "🔒"}
                </span>
              </div>

              <div className="badge-card__body">
                <span className="badge-card__name">
                  {isEarned ? badge.name : "CLASSIFIED // ???"}
                </span>
                <span className="badge-card__desc">
                  {isEarned ? badge.description : `Objective: ${badge.hint}`}
                </span>
              </div>

              <div className="badge-card__status-ribbon">
                {isEarned ? (
                  <span className="badge-card__earned-label">✓ UNLOCKED</span>
                ) : (
                  <span className="badge-card__locked-label">LOCKED</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
