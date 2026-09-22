// app/providers.tsx
// Client providers: Zustand store hydration for local demo play.
// No database or auth providers needed in demo mode.
'use client';

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

function StoreHydrator() {
  const initializeDemo = useGameStore((s) => s.initializeDemo);

  useEffect(() => {
    // Initialize demo state locally on mount:
    // streak calculation, passive heart regen, default skill tree & badge setup
    initializeDemo();
  }, [initializeDemo]);

  return null;
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StoreHydrator />
      {children}
    </>
  );
}
