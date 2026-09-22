// app/api/streak/check/route.ts
// POST /api/streak/check
// Called on login / page load.
// - If user played yesterday → increment streak
// - If user played today already → no change
// - If user missed a day → reset to 1
// - Awards first-login badge on very first call

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function dateStr(d: Date) {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const user   = await prisma.user.findUniqueOrThrow({
    where:  { id: userId },
    select: { streakCount: true, lastActiveDate: true },
  });

  const today     = new Date();
  const todayStr  = dateStr(today);
  const lastStr   = user.lastActiveDate ? dateStr(user.lastActiveDate) : null;

  let newStreak = user.streakCount;

  if (lastStr === todayStr) {
    // Already checked in today — no change
  } else if (lastStr === dateStr(new Date(today.getTime() - 86_400_000))) {
    // Played yesterday — extend streak
    newStreak += 1;
  } else {
    // Gap or first time — start fresh
    newStreak = 1;
  }

  await prisma.user.update({
    where: { id: userId },
    data:  { streakCount: newStreak, lastActiveDate: today },
  });

  return NextResponse.json({ streakCount: newStreak });
}
