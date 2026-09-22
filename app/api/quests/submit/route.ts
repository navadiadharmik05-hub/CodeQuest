// app/api/quests/submit/route.ts
// POST /api/quests/submit
//
// Body: {
//   questId: string,
//   timeSpentSeconds: number,
//   isOptimal?: boolean,       // Hanoi only
//   metadata?: Record<string, unknown>
// }
//
// Returns: {
//   xpEarned: number, newTotalXp: number, newLevel: number,
//   leveledUp: boolean, newBadges: string[], updatedSkills: string[]
// }

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MIN_TIME: Record<string, number> = {
  "syntax-dungeon": 10,
  "exec-arena":     15,
  "sort-arena":      8,
  "hanoi":          20,
  "bst":            12,
  "stack-boss":     10,
};

// Badges awarded when a specific quest is first completed
const QUEST_BADGE: Record<string, string[]> = {
  "syntax-dungeon": ["bug-squasher"],
  "exec-arena":     ["debugger"],
  "sort-arena":     ["sort-master"],
  "hanoi":          ["tower-conqueror"],
  "bst":            ["tree-whisperer"],
  "stack-boss":     ["stack-overflow", "queue-master"],
};

/** level(totalXp) = floor((totalXp/100)^(2/3)) + 1 */
function calcLevel(totalXp: number): number {
  return Math.floor(Math.pow(totalXp / 100, 1 / 1.5)) + 1;
}

/** XP required to reach the NEXT level from current level */
function xpToNextLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body   = await req.json();
  const { questId, timeSpentSeconds, isOptimal = false } = body as {
    questId: string;
    timeSpentSeconds: number;
    isOptimal?: boolean;
  };

  // --- Validate quest exists ---
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest)
    return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  // --- Anti-cheat: minimum time ---
  const minTime = MIN_TIME[questId] ?? 0;
  if (timeSpentSeconds < minTime)
    return NextResponse.json(
      { error: `Quest requires at least ${minTime}s` },
      { status: 400 }
    );

  // --- Load current user state ---
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { totalXp: true, level: true, streakCount: true, hearts: true },
  });

  // --- Streak multiplier ---
  const streakMultiplier = Math.min(1 + user.streakCount * 0.1, 2.0);
  const xpEarned         = Math.round(quest.baseXp * streakMultiplier);

  const newTotalXp = user.totalXp + xpEarned;
  const oldLevel   = user.level;
  const newLevel   = calcLevel(newTotalXp);
  const leveledUp  = newLevel > oldLevel;

  // --- Check which badges to award ---
  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const earned = new Set(existingBadges.map((b) => b.badgeId));

  // Detect first-ever completion count (for "on-a-roll" — 3 completions)
  const totalCompletions = await prisma.userQuestCompletion.count({ where: { userId } });

  // All 6 quests cleared?
  const allQuestIds   = ["syntax-dungeon","exec-arena","sort-arena","hanoi","bst","stack-boss"];
  const clearedQuests = await prisma.userQuestCompletion.findMany({
    where: { userId },
    distinct: ["questId"],
    select: { questId: true },
  });
  const clearedSet = new Set(clearedQuests.map((c) => c.questId));
  clearedSet.add(questId); // include the one being submitted now

  const newBadgeIds: string[] = [];

  // Quest-specific badges (only on first clear of this quest)
  const isFirstClear = !clearedSet.has(questId) || clearedQuests.every((c) => c.questId !== questId);
  for (const bid of QUEST_BADGE[questId] ?? []) {
    if (!earned.has(bid)) newBadgeIds.push(bid);
  }

  // Hanoi optimal
  if (questId === "hanoi" && isOptimal && !earned.has("perfect-hanoi"))
    newBadgeIds.push("perfect-hanoi");

  // On-a-roll: 3 completions total (including this one)
  if (totalCompletions + 1 >= 3 && !earned.has("on-a-roll"))
    newBadgeIds.push("on-a-roll");

  // Completionist: all 6 cleared
  if (allQuestIds.every((id) => clearedSet.has(id)) && !earned.has("completionist"))
    newBadgeIds.push("completionist");

  // --- Skill nodes to unlock (the node tied to this quest) ---
  const questSkillNodes = await prisma.skillNode.findMany({
    where: { questId },
    select: { id: true },
  });
  const unlockNodeIds = questSkillNodes.map((n) => n.id);

  // ---------------------------------------------------------------------------
  // Atomic transaction
  // ---------------------------------------------------------------------------
  await prisma.$transaction(async (tx) => {
    // 1. Record completion
    await tx.userQuestCompletion.create({
      data: {
        userId,
        questId,
        xpEarned,
        timeSpentSecs: timeSpentSeconds,
        isOptimal,
        streakAtTime: user.streakCount,
      },
    });

    // 2. Award badges
    if (newBadgeIds.length > 0) {
      await tx.userBadge.createMany({
        data: newBadgeIds.map((badgeId) => ({ userId, badgeId })),
        skipDuplicates: true,
      });
    }

    // 3. Unlock skill nodes
    if (unlockNodeIds.length > 0) {
      await tx.userSkillNode.updateMany({
        where: { userId, nodeId: { in: unlockNodeIds }, status: "locked" },
        data:  { status: "unlocked", unlockedAt: new Date() },
      });
    }

    // 4. Update user XP + level
    await tx.user.update({
      where: { id: userId },
      data:  { totalXp: newTotalXp, level: newLevel },
    });
  });

  return NextResponse.json({
    xpEarned,
    newTotalXp,
    oldLevel,
    newLevel,
    leveledUp,
    xpToNext:     xpToNextLevel(newLevel),
    newBadges:    newBadgeIds,
    updatedSkills: unlockNodeIds,
    streakMultiplier,
  });
}
