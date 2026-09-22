'use client';
// components/GameModalAdapter.tsx
// Wraps each game modal with:
//   1. Local demo auth state (always allowed)
//   2. Heart gate — blocks entry when hearts === 0
//   3. Quest submit hook — local XP + badge + skill calculation
//   4. Mistake hook — deducts heart in local Zustand store
//   5. Phase 7 Quest Completion Victory Panel with real XP, level progress, hearts, badges, and Next Quest CTA.
//
// Usage:
//   <GameModalAdapter questId="syntax-dungeon" minTimeSecs={10} onNextQuest={...} onClose={...}>
//     <SyntaxDungeonGame />
//   </GameModalAdapter>
//
// Children receive the context via useGameModal():
//   const { onComplete, onMistake, isBlocked, isCompleted, resetCompletion } = useGameModal();

import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import { useGameStore, calcLevel, calcXpToNext, calcXpInLevel, BadgeState } from "@/store/gameStore";
import { QUEST_CONFIG } from "@/lib/questConfig";

export interface QuestCompletionData {
  questId: string;
  xpEarned: number;
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
  xpInLevel: number;
  xpToNext: number;
  hearts: number;
  newBadges: BadgeState[];
  nextQuestId: string | null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface GameModalContextValue {
  /** Call this when the player finishes the quest successfully */
  onComplete: (opts?: { isOptimal?: boolean }) => Promise<void>;
  /** Call this when the player makes a mistake (loses a heart) */
  onMistake: () => Promise<void>;
  /** True when hearts === 0 — render a "No hearts" overlay in the game */
  isBlocked: boolean;
  /** True while the submit request is in-flight */
  isSubmitting: boolean;
  /** True if quest completion overlay is active */
  isCompleted: boolean;
  /** Reset completion state for replaying */
  resetCompletion: () => void;
}

const GameModalContext = createContext<GameModalContextValue | null>(null);

export function useGameModal(): GameModalContextValue {
  const ctx = useContext(GameModalContext);
  if (!ctx) throw new Error("useGameModal must be used inside <GameModalAdapter>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Static badge catalogue
// ---------------------------------------------------------------------------
export const ALL_BADGES: BadgeState[] = [
  { id: "first-login",     icon: "🌟", name: "FIRST LOGIN",     description: "Opened CodeQuest" },
  { id: "bug-squasher",    icon: "🐛", name: "BUG SQUASHER",    description: "Completed a syntax puzzle" },
  { id: "time-traveler",   icon: "⏪", name: "TIME TRAVELER",   description: "Stepped backward in execution" },
  { id: "debugger",        icon: "🧭", name: "DEBUGGER",        description: "Ran a program to completion" },
  { id: "sort-master",     icon: "🫧", name: "SORT MASTER",     description: "Finished bubble sort visualizer" },
  { id: "tower-conqueror", icon: "🏰", name: "TOWER CONQUEROR", description: "Solved Tower of Hanoi" },
  { id: "tree-whisperer",  icon: "🌳", name: "TREE WHISPERER",  description: "Built a BST with 5+ nodes" },
  { id: "stack-overflow",  icon: "📚", name: "STACK OVERFLOW",  description: "Pushed 5 items on the stack" },
  { id: "queue-master",    icon: "🚶", name: "QUEUE MASTER",    description: "Dequeued 5 items from a queue" },
  { id: "on-a-roll",       icon: "🔥", name: "ON A ROLL",       description: "Earned XP three times" },
  { id: "perfect-hanoi",   icon: "💎", name: "OPTIMAL MOVER",   description: "Solved Hanoi in minimum moves" },
  { id: "completionist",   icon: "🏆", name: "COMPLETIONIST",   description: "Cleared all six games" },
];

const QUEST_BADGES: Record<string, string[]> = {
  "syntax-dungeon": ["bug-squasher"],
  "exec-arena":     ["debugger"],
  "sort-arena":     ["sort-master"],
  "hanoi":          ["tower-conqueror"],
  "bst":            ["tree-whisperer"],
  "stack-boss":     ["stack-overflow", "queue-master"],
};

const QUEST_UNLOCK_SKILLS: Record<string, string[]> = {
  "syntax-dungeon": ["functions", "execution"],
  "exec-arena":     ["recursion", "sorting"],
  "sort-arena":     ["sorting", "hanoi"],
  "hanoi":          ["hanoi", "trees"],
  "bst":            ["trees", "stacks"],
  "stack-boss":     ["stacks"],
};

const QUEST_SEQUENCE = [
  "syntax-dungeon",
  "exec-arena",
  "sort-arena",
  "hanoi",
  "bst",
  "stack-boss",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface GameModalAdapterProps {
  questId: string;
  minTimeSecs: number;
  children: React.ReactNode;
  onNextQuest?: (nextQuestId: string) => void;
  onClose?: () => void;
}

export function GameModalAdapter({
  questId,
  minTimeSecs,
  children,
  onNextQuest,
  onClose,
}: GameModalAdapterProps) {
  const loseHeart        = useGameStore((s) => s.loseHeart);
  const hearts           = useGameStore((s) => s.hearts);
  const applyQuestResult = useGameStore((s) => s.applyQuestResult);

  const startTimeRef     = useRef<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionData, setCompletionData] = useState<QuestCompletionData | null>(null);

  const resetCompletion = useCallback(() => {
    setCompletionData(null);
    startTimeRef.current = Date.now();
  }, []);

  // -------------------------------------------------------------------
  // onComplete — local demo mode (no DB / server required)
  // -------------------------------------------------------------------
  const onComplete = useCallback(async (opts: { isOptimal?: boolean } = {}) => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (elapsed < minTimeSecs) {
      console.warn(`Quest completed fast (${elapsed}s < ${minTimeSecs}s)`);
    }

    setIsSubmitting(true);
    try {
      // Find quest metadata
      const quest = QUEST_CONFIG.find((q) => q.id === questId);
      const baseXp = quest?.baseXp ?? 30;

      const store = useGameStore.getState();
      const streak = store.streakCount || 1;
      const streakMultiplier = Math.min(1 + streak * 0.1, 2.0);
      const xpEarned = Math.round(baseXp * streakMultiplier);

      const newTotalXp = store.totalXp + xpEarned;
      const newLevel   = calcLevel(newTotalXp);
      const leveledUp  = newLevel > store.level;
      const xpToNext   = calcXpToNext(newLevel);
      const xpInLevel  = calcXpInLevel(newTotalXp, newLevel);

      // Evaluate new badges
      const existingBadgeIds = new Set(store.badges.map((b) => b.id));
      const newBadgeIds: string[] = [];

      for (const bId of QUEST_BADGES[questId] ?? []) {
        if (!existingBadgeIds.has(bId)) newBadgeIds.push(bId);
      }

      if (questId === "hanoi" && opts.isOptimal && !existingBadgeIds.has("perfect-hanoi")) {
        newBadgeIds.push("perfect-hanoi");
      }

      // Check on-a-roll: 3 quest completions
      const clearedCount = Object.keys(store.cleared).length;
      if (clearedCount + 1 >= 3 && !existingBadgeIds.has("on-a-roll")) {
        newBadgeIds.push("on-a-roll");
      }

      // Check completionist: all 6 quests cleared
      const allQuestIds = QUEST_CONFIG.map((q) => q.id);
      const willHaveAll = allQuestIds.every((id) => id === questId || store.cleared[id]);
      if (willHaveAll && !existingBadgeIds.has("completionist")) {
        newBadgeIds.push("completionist");
      }

      // Skills to unlock
      const updatedSkills = QUEST_UNLOCK_SKILLS[questId] ?? [];

      // Determine next quest in sequence
      const currIdx = QUEST_SEQUENCE.indexOf(questId);
      const nextQId = currIdx >= 0 && currIdx < QUEST_SEQUENCE.length - 1
        ? QUEST_SEQUENCE[currIdx + 1]
        : null;

      const newBadgesList = newBadgeIds
        .map((bId) => ALL_BADGES.find((b) => b.id === bId))
        .filter(Boolean) as BadgeState[];

      applyQuestResult({
        questId,
        xpEarned,
        newTotalXp,
        newLevel,
        leveledUp,
        xpToNext,
        newBadges: newBadgeIds,
        updatedSkills,
      }, ALL_BADGES);

      // Save for Victory Panel display
      setCompletionData({
        questId,
        xpEarned,
        newTotalXp,
        newLevel,
        leveledUp,
        xpInLevel,
        xpToNext,
        hearts: store.hearts,
        newBadges: newBadgesList,
        nextQuestId: nextQId,
      });

    } finally {
      setIsSubmitting(false);
    }
  }, [applyQuestResult, minTimeSecs, questId]);

  // -------------------------------------------------------------------
  // onMistake — local heart deduction
  // -------------------------------------------------------------------
  const onMistake = useCallback(async () => {
    loseHeart();
  }, [loseHeart]);

  const isBlocked = hearts <= 0;
  const isCompleted = completionData !== null;

  return (
    <GameModalContext.Provider
      value={{
        onComplete,
        onMistake,
        isBlocked,
        isSubmitting,
        isCompleted,
        resetCompletion,
      }}
    >
      {/* ── HEARTS BLOCKED OVERLAY ── */}
      {isBlocked && (
        <div className="hearts-blocked-overlay" role="alert">
          <div className="hearts-blocked-inner">
            <span className="hearts-blocked-icon">💔</span>
            <h2 className="hearts-blocked-title">OUT OF HEARTS</h2>
            <p className="hearts-blocked-body">
              Your neural energy has depleted.<br />
              Hearts regenerate passively (+1 every 30 mins) or reset demo progress via your avatar in the HUD!
            </p>
            <div style={{ marginTop: 20 }}>
              <button
                className="btn btn--secondary"
                onClick={() => {
                  useGameStore.getState().setHearts(5);
                }}
              >
                ⚡ RECHARGE HEARTS (DEMO)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 7: QUEST COMPLETION VICTORY PANEL ── */}
      {completionData && (
        <div className="quest-completion-overlay" role="dialog" aria-label="Quest completed">
          <div className="quest-completion-card">
            {/* Victory Badge */}
            <div className="quest-completion-icon-wrap">
              <span className="quest-completion-icon">🏆</span>
            </div>

            <span className="quest-completion-tag">MISSION ACCOMPLISHED</span>
            <h2 className="quest-completion-title">QUEST COMPLETE</h2>
            <p className="quest-completion-subtitle">
              Challenge validated and registered to the Neural Grid!
            </p>

            {/* XP Reward Banner */}
            <div className="quest-completion-reward">
              <span className="quest-completion-xp-label">EXPERIENCE ACCRUED</span>
              <span className="quest-completion-xp-val">+{completionData.xpEarned} XP</span>
            </div>

            {/* Progress Telemetry */}
            <div className="quest-completion-progress-box">
              <div className="quest-completion-progress-header">
                <span>
                  LEVEL {completionData.newLevel}
                  {completionData.leveledUp && <b className="quest-completion-levelup-tag"> ★ LEVEL UP!</b>}
                </span>
                <span>{completionData.xpInLevel} / {completionData.xpToNext} XP</span>
              </div>
              <div className="quest-completion-bar-track">
                <div
                  className="quest-completion-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.round((completionData.xpInLevel / completionData.xpToNext) * 100))}%`,
                  }}
                />
              </div>

              <div className="quest-completion-vitals">
                <span className="quest-completion-hearts-label">HEARTS REMAINING:</span>
                <span className="quest-completion-hearts">
                  {"❤".repeat(completionData.hearts) + "🖤".repeat(Math.max(0, 5 - completionData.hearts))}
                </span>
              </div>
            </div>

            {/* Unlocked Badges */}
            {completionData.newBadges.length > 0 && (
              <div className="quest-completion-badges-box">
                <span className="quest-completion-badges-title">NEW TROPHIES UNLOCKED:</span>
                <div className="quest-completion-badges-list">
                  {completionData.newBadges.map((b) => (
                    <div key={b.id} className="quest-completion-badge-pill">
                      <span>{b.icon}</span>
                      <span>{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Actions */}
            <div className="quest-completion-actions">
              {completionData.nextQuestId && onNextQuest ? (
                <button
                  className="btn btn--primary quest-completion-btn-next"
                  onClick={() => {
                    const nextId = completionData.nextQuestId!;
                    resetCompletion();
                    onNextQuest(nextId);
                  }}
                >
                  NEXT QUEST →
                </button>
              ) : null}

              <button
                className="btn btn--secondary"
                onClick={() => {
                  resetCompletion();
                  onClose?.();
                }}
              >
                🗺 QUEST MAP
              </button>

              <button
                className="btn btn--ghost btn-sm"
                onClick={resetCompletion}
              >
                ↺ Replay Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actual Game Content */}
      {children}
    </GameModalContext.Provider>
  );
}
