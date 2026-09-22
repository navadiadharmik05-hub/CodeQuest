# CodeQuest — Full-Stack DSA Learning Platform

> A cyberpunk RPG for learning Data Structures & Algorithms, built with **Next.js 14**, **PostgreSQL**, **Prisma**, **NextAuth**, **Zustand**, and **Capacitor** for iOS/Android.

---

## 📁 Project Structure

```
codequest-app/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth App Router handler
│   │   ├── quests/submit/route.ts        # Quest XP + badge + skill submit
│   │   ├── hearts/route.ts               # GET hearts (with regen)
│   │   ├── hearts/lose/route.ts          # POST lose heart
│   │   ├── profile/route.ts              # GET full profile
│   │   └── streak/check/route.ts         # POST streak check
│   ├── globals.css                        # All CSS variables from prototype
│   ├── layout.tsx                         # Root layout + fonts + providers
│   ├── page.tsx                           # Home: Hero + Lobby + SkillTree + Badges
│   └── providers.tsx                      # Client: SessionProvider + store hydration
├── components/
│   ├── BadgesHall.tsx                     # 12-badge hall of fame
│   ├── GameModalAdapter.tsx               # Auth gate + heart gate + quest submit
│   ├── HUD.tsx                            # Fixed cyberpunk HUD with XP bar + toasts
│   ├── InstallButton.tsx                  # PWA install prompt
│   └── SkillTree.tsx                      # 9-node skill tree grid
├── lib/
│   ├── auth.ts                            # NextAuth config (GitHub + Credentials)
│   ├── prisma.ts                          # Prisma singleton
│   └── questConfig.ts                     # Static quest metadata
├── migrations/
│   └── 001_initial_schema.sql             # PostgreSQL DDL + RLS + seed data
├── prisma/
│   └── schema.prisma                      # Prisma schema (mirrors SQL)
├── public/
│   └── manifest.json                      # PWA manifest (cyberpunk theme)
├── scripts/
│   └── build-android.sh                   # Capacitor Android build script
├── store/
│   └── gameStore.ts                       # Zustand store (persist middleware)
├── worker/
│   └── index.ts                           # Custom service worker (network/cache strategies)
├── .env.example                           # Environment variable template
├── capacitor.config.ts                    # Capacitor mobile config
├── next.config.js                         # Next.js + @ducanh2912/next-pwa config
├── package.json                           # All dependencies
└── tsconfig.json                          # (generate with: npx create-next-app or tsc --init)
```

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd codequest-app
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
```

### 3. Set up the database

```bash
# Run the PostgreSQL DDL migration (requires psql on PATH)
npm run db:seed

# Generate the Prisma client
npm run db:generate
```

### 4. Run the dev server

```bash
npm run dev
# open http://localhost:3000
```

---

## 🎮 Game Mechanics

| Quest | Difficulty | Base XP | Min Time | Badge Unlocked |
|---|---|---|---|---|
| Syntax Dungeon | EASY | 30 | 10s | 🐛 Bug Squasher |
| Execution Arena | MEDIUM | 20 | 15s | 🧭 Debugger |
| Sort Arena | MEDIUM | 40 | 8s | 🫧 Sort Master |
| Tower of Hanoi | HARD | 50 | 20s | 🏰 Tower Conqueror |
| Binary Search Tree | HARD | 60 | 12s | 🌳 Tree Whisperer |
| Stack Boss | BOSS | 35 | 10s | 📚 Stack Overflow + 🚶 Queue Master |

**XP formula:** `xpEarned = baseXp × min(1 + streak × 0.1, 2.0)`  
**Level formula:** `level = floor((totalXp/100)^(2/3)) + 1`  
**Heart regen:** +1 every 30 minutes (max 5), serverside — prevents clock manipulation

---

## 📱 PWA & Mobile

```bash
# Sync Capacitor and open Android Studio
npm run cap:sync
npm run cap:android          # builds debug APK via Gradle

# iOS (macOS only)
npm run cap:ios              # opens Xcode
```

Manifest theme: `#0f0d23` background · `#7b6ff7` primary

---

## 🔐 Authentication

- **GitHub OAuth** — one-click sign-in (`GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET`)
- **Credentials** — email/password with bcrypt (extend `lib/auth.ts` with a passwords table)
- Session strategy: **JWT** (stateless, compatible with Capacitor mobile)

---

## 🔒 Security

- Row Level Security on all user tables — users can only read their own rows
- Server-side anti-cheat: `timeSpentSeconds ≥ minTimeSecs` per quest
- Atomic Prisma transactions for quest submit: XP + badges + skills all-or-nothing
- `NEXTAUTH_SECRET` rotatable without data loss (JWT)

---

## 🏗️ Connecting the original game modals

`GameModalAdapter` wraps any game component and provides the `useGameModal()` hook:

```tsx
import { GameModalAdapter, useGameModal } from '@/components/GameModalAdapter';

// In your game component:
function SyntaxDungeonGame() {
  const { onComplete, onMistake, isBlocked } = useGameModal();
  // call onMistake() when player makes an error
  // call onComplete({ isOptimal: false }) when puzzle is solved
}

// In the page:
<GameModalAdapter questId="syntax-dungeon" minTimeSecs={10}>
  <SyntaxDungeonGame />
</GameModalAdapter>
```

The HUD auto-updates from the Zustand store.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Vanilla CSS + custom properties |
| State | Zustand 4 + persist middleware |
| Auth | NextAuth.js v4 (PrismaAdapter) |
| Database | PostgreSQL 15 + Prisma 5 |
| PWA | @ducanh2912/next-pwa + Workbox |
| Mobile | Capacitor 6 (Android + iOS) |
| Fonts | Orbitron · Space Grotesk · JetBrains Mono |
