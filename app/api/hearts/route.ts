// app/api/hearts/route.ts
// GET /api/hearts
// Returns current heart count with passive regen applied.
// Regen formula: +1 heart per 30 minutes since last loss (max 5).

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
  const user   = await prisma.user.findUniqueOrThrow({
    where:  { id: userId },
    select: { hearts: true, lastHeartLossAt: true },
  });

  let hearts = user.hearts;
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

  return NextResponse.json({ hearts });
}
