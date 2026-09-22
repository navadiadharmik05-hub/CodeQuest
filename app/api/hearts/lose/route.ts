// app/api/hearts/lose/route.ts
// POST /api/hearts/lose
// Deducts one heart. Returns remaining hearts and next regen timestamp.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const user   = await prisma.user.findUniqueOrThrow({
    where:  { id: userId },
    select: { hearts: true, lastHeartLossAt: true },
  });

  if (user.hearts <= 0)
    return NextResponse.json({ hearts: 0, blocked: true });

  const now    = new Date();
  const hearts = user.hearts - 1;

  await prisma.user.update({
    where: { id: userId },
    data:  {
      hearts,
      // Only update lastHeartLossAt when regen clock should restart
      lastHeartLossAt: hearts < 5 ? now : null,
    },
  });

  // Time until next regen (+1 heart in 30 min)
  const regenAt = new Date(now.getTime() + 30 * 60 * 1000);

  return NextResponse.json({ hearts, regenAt: hearts < 5 ? regenAt.toISOString() : null });
}
