// store/gameStore.ts
// Zustand store — single source of truth for all HUD and game state.
// Backed by localStorage via `persist` middleware for offline/demo play.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SkillNodeState {
  id: string;
  icon: string;
  name: string;
  questId: string | null;
  status: "unlocked" | "active" | "locked";
}

export interface BadgeState {
  id: string;
  icon: string;
  name: string;
  description: string;
}

export interface QuestCleared {
  [questId: string]: boolean;
}

export interface GameState {
  // HUD
  xp:          number;
  totalXp:     number;
  level:       number;
  xpToNext:    number;
  hearts:      number;
  streakCount: number;

  // Timestamps for local simulation
  lastHeartLossAt: number | null;
  lastActiveDate:  string | null;

  // Progress
  badges:     BadgeState[];
  skillNodes: SkillNodeState[];
  cleared:    QuestCleared;

  // Auth / Player
  userId:     string | null;
  userName:   string | null;
  userImage:  string | null;

  // Toast queue (for level-up / badge toasts)
  toasts: { id: string; type: "badge" | "levelup" | "xp"; payload: any }[];
}

export interface GameActions {
  // Local demo initialization on app load (streak check + passive heart regen)
  initializeDemo: () => void;

  // Called after /api/profile returns (if backend is connected)
  syncFromServer: (profile: {
    user: { id: string; name: string | null; image: string | null; totalXp: number; level: number; hearts: number; streakCount: number };
    earnedBadges: BadgeState[];
    skillNodes: SkillNodeState[];
    clearedQuestIds: string[];
  }) => void;

  // Called after quest completion (local or server)
  applyQuestResult: (result: {
    questId?: string;
    xpEarned: number;
    newTotalXp: number;
    newLevel: number;
    leveledUp: boolean;
    xpToNext: number;
    newBadges: string[];
    updatedSkills: string[];
  }, allBadges: BadgeState[]) => void;

  // Local heart updates
  loseHeart:   () => void;
  setHearts:   (n: number) => void;

  // Streak
  setStreak:   (n: number) => void;

  // Toasts
  pushToast:   (t: GameState["toasts"][number]) => void;
  dismissToast:(id: string) => void;

  // Reset (sign-out / reset demo)
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Canonical Initial Seed Data
// ---------------------------------------------------------------------------
export const INITIAL_SKILL_NODES: SkillNodeState[] = [
  { id: "vars",      icon: "📝", name: "Variables",       questId: "syntax-dungeon", status: "unlocked" },
  { id: "loops",     icon: "🔄", name: "Loops",           questId: "syntax-dungeon", status: "unlocked" },
  { id: "functions", icon: "λ",  name: "Functions",       questId: "syntax-dungeon", status: "active"   },
  { id: "execution", icon: "⚡", name: "Execution",       questId: "exec-arena",     status: "active"   },
  { id: "recursion", icon: "∞",  name: "Recursion",       questId: "exec-arena",     status: "locked"   },
  { id: "sorting",   icon: "🫧", name: "Sorting",         questId: "sort-arena",     status: "locked"   },
  { id: "hanoi",     icon: "🏰", name: "Recursion+",      questId: "hanoi",          status: "locked"   },
  { id: "trees",     icon: "🌳", name: "Trees",           questId: "bst",            status: "locked"   },
  { id: "stacks",    icon: "📚", name: "Stacks & Queues", questId: "stack-boss",     status: "locked"   },
];

export const FIRST_LOGIN_BADGE: BadgeState = {
  id: "first-login",
  icon: "🌟",
  name: "FIRST LOGIN",
  description: "Opened CodeQuest",
};

// ---------------------------------------------------------------------------
// Level helpers (matches server formula in /api/quests/submit)
// ---------------------------------------------------------------------------
export function calcLevel(totalXp: number): number {
  return Math.floor(Math.pow(totalXp / 100, 1 / 1.5)) + 1;
}

export function calcXpToNext(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export function calcXpInLevel(totalXp: number, level: number): number {
  const prevLevelXp = level > 1 ? Math.round(100 * Math.pow(level - 1, 1.5)) : 0;
  return totalXp - prevLevelXp;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const INITIAL: GameState = {
  xp:              0,
  totalXp:         0,
  level:           1,
  xpToNext:        100,
  hearts:          5,
  streakCount:     1,
  lastHeartLossAt: null,
  lastActiveDate:  null,
  badges:          [FIRST_LOGIN_BADGE],
  skillNodes:      INITIAL_SKILL_NODES,
  cleared:         {},
  userId:          "demo-user",
  userName:        "Cyber Quester",
  userImage:       null,
  toasts:          [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      initializeDemo() {
        const today = new Date().toISOString().slice(0, 10);
        const lastActive = get().lastActiveDate;
        let streak = get().streakCount || 1;

        if (!lastActive) {
          streak = 1;
        } else if (lastActive === today) {
          // Already logged in today
        } else {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (lastActive === yesterday) {
            streak += 1;
          } else {
            streak = 1;
          }
        }

        // Passive heart regeneration: +1 per 30 minutes
        let hearts = get().hearts ?? 5;
        let lastLoss = get().lastHeartLossAt;
        if (hearts < 5 && lastLoss) {
          const minutesSince = (Date.now() - lastLoss) / 60000;
          const regen = Math.floor(minutesSince / 30);
          if (regen > 0) {
            hearts = Math.min(5, hearts + regen);
            lastLoss = hearts === 5 ? null : lastLoss + regen * 30 * 60 * 1000;
          }
        }

        // Ensure skill nodes and badges are populated
        const currentNodes = get().skillNodes;
        const skillNodes = currentNodes && currentNodes.length > 0 ? currentNodes : INITIAL_SKILL_NODES;

        const currentBadges = get().badges || [];
        const hasFirstLogin = currentBadges.some((b) => b.id === "first-login");
        const badges = hasFirstLogin ? currentBadges : [FIRST_LOGIN_BADGE, ...currentBadges];

        set({
          userId:          get().userId || "demo-user",
          userName:        get().userName || "Cyber Quester",
          streakCount:     streak,
          lastActiveDate:  today,
          hearts,
          lastHeartLossAt: lastLoss,
          skillNodes,
          badges,
        });
      },

      syncFromServer({ user, earnedBadges, skillNodes, clearedQuestIds }) {
        const level    = calcLevel(user.totalXp);
        const xpToNext = calcXpToNext(level);
        const xp       = calcXpInLevel(user.totalXp, level);
        const cleared: QuestCleared = {};
        for (const id of clearedQuestIds) cleared[id] = true;

        set({
          userId:      user.id,
          userName:    user.name,
          userImage:   user.image,
          totalXp:     user.totalXp,
          level,
          xpToNext,
          xp,
          hearts:      user.hearts,
          streakCount: user.streakCount,
          badges:      earnedBadges,
          skillNodes,
          cleared,
        });
      },

      applyQuestResult(result, allBadges) {
        const { questId, newTotalXp, newLevel, leveledUp, xpToNext: xtn, newBadges, updatedSkills } = result;
        const xp = calcXpInLevel(newTotalXp, newLevel);

        const newToasts = [...get().toasts];

        // XP float toast
        newToasts.push({ id: `xp-${Date.now()}`, type: "xp", payload: { amount: result.xpEarned } });

        // Level-up toast
        if (leveledUp) {
          newToasts.push({ id: `lvl-${Date.now()}`, type: "levelup", payload: { level: newLevel } });
        }

        // Badge toasts
        for (const badgeId of newBadges) {
          const badge = allBadges.find((b) => b.id === badgeId);
          if (badge) {
            newToasts.push({ id: `badge-${badgeId}`, type: "badge", payload: badge });
          }
        }

        // Merge new badges into earned set
        const updatedBadgeIds = new Set(get().badges.map((b) => b.id));
        const mergedBadges = [...get().badges];
        for (const badgeId of newBadges) {
          if (!updatedBadgeIds.has(badgeId)) {
            const b = allBadges.find((b) => b.id === badgeId);
            if (b) mergedBadges.push(b);
          }
        }

        // Unlock skill nodes
        const updatedNodes = get().skillNodes.map((n) =>
          updatedSkills.includes(n.id) ? { ...n, status: "unlocked" as const } : n
        );

        set((s) => ({
          totalXp:    newTotalXp,
          level:      newLevel,
          xpToNext:   xtn,
          xp,
          badges:     mergedBadges,
          skillNodes: updatedNodes,
          cleared:    questId ? { ...s.cleared, [questId]: true } : s.cleared,
          toasts:     newToasts,
        }));
      },

      loseHeart() {
        set((s) => {
          const newHearts = Math.max(0, s.hearts - 1);
          return {
            hearts:          newHearts,
            lastHeartLossAt: newHearts < 5 ? (s.lastHeartLossAt ?? Date.now()) : null,
          };
        });
      },

      setHearts(n) {
        set((s) => ({
          hearts:          n,
          lastHeartLossAt: n < 5 ? (s.lastHeartLossAt ?? Date.now()) : null,
        }));
      },

      setStreak(n) {
        set({ streakCount: n });
      },

      pushToast(t) {
        set((s) => ({ toasts: [...s.toasts, t] }));
      },

      dismissToast(id) {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },

      reset() {
        set(INITIAL);
      },
    }),
    {
      name:    "codequest-game-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        totalXp:         s.totalXp,
        level:           s.level,
        xpToNext:        s.xpToNext,
        xp:              s.xp,
        hearts:          s.hearts,
        streakCount:     s.streakCount,
        cleared:         s.cleared,
        userId:          s.userId,
        userName:        s.userName,
        badges:          s.badges,
        skillNodes:      s.skillNodes,
        lastHeartLossAt: s.lastHeartLossAt,
        lastActiveDate:  s.lastActiveDate,
      }),
    }
  )
);
