// app/api/profile/route.ts
// GET /api/profile
// Full user profile: stats + badges + skill nodes + recent completions.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;

  const [user, earnedBadges, skillNodes, recentCompletions] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where:  { id: userId },
      select: {
        id: true, name: true, email: true, image: true,
        totalXp: true, level: true, hearts: true,
        streakCount: true, lastActiveDate: true, lastHeartLossAt: true,
        createdAt: true,
      },
    }),
    prisma.userBadge.findMany({
      where:   { userId },
      include: { badge: true },
      orderBy: { earnedAt: "asc" },
    }),
    prisma.userSkillNode.findMany({
      where:   { userId },
      include: { node: { include: { quest: true } } },
      orderBy: { node: { displayOrder: "asc" } },
    }),
    prisma.userQuestCompletion.findMany({
      where:   { userId },
      include: { quest: true },
      orderBy: { completedAt: "desc" },
      take:    20,
    }),
  ]);

  // Apply heart regen before returning
  let { hearts } = user;
  if (hearts < 5 && user.lastHeartLossAt) {
    const minutesSince = (Date.now() - user.lastHeartLossAt.getTime()) / 60_000;
    const regen        = Math.floor(minutesSince / 30);
    if (regen > 0) {
      hearts = Math.min(5, hearts + regen);
      await prisma.user.update({
        where: { id: userId },
        data:  { hearts, lastHeartLossAt: hearts === 5 ? null : user.lastHeartLossAt },
      });
    }
  }

  // Quests cleared (distinct)
  const clearedQuestIds = [
    ...new Set(recentCompletions.map((c) => c.questId)),
  ];

  return NextResponse.json({
    user:              { ...user, hearts },
    earnedBadges:      earnedBadges.map((b) => b.badge),
    skillNodes:        skillNodes.map((sn) => ({ ...sn.node, status: sn.status, unlockedAt: sn.unlockedAt })),
    recentCompletions,
    clearedQuestIds,
  });
}
