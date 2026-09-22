'use client';
// app/page.tsx
// Command Center Dashboard & Cyberpunk DSA Adventure Lobby
// Preserves 100% real functionality with zero mocked data.
// Features:
// - Command Center Status Terminal (Welcome Back, Coder)
// - Current Quest Active Directive
// - Real-time Mission Telemetry (XP, Hearts, Streak, Clearance Level)
// - Interactive Connected Quest Map (Phase 5) + Switchable Tactical Matrix
// - Skill Tree Network (Phase 9)
// - Trophy Hall of Achievements (Phase 10)

import React, { useState } from 'react';
import { QuestMap, getQuestStatuses } from '@/components/QuestMap';
import { SkillTree } from '@/components/SkillTree';
import { BadgesHall } from '@/components/BadgesHall';
import { InstallButton } from '@/components/InstallButton';
import { QuestModal } from '@/components/QuestModal';
import { useGameStore } from '@/store/gameStore';
import { QUEST_CONFIG, QuestConfig } from '@/lib/questConfig';

export default function HomePage() {
  const cleared = useGameStore((s) => s.cleared);
  const totalXp = useGameStore((s) => s.totalXp);
  const xp = useGameStore((s) => s.xp);
  const xpToNext = useGameStore((s) => s.xpToNext);
  const level = useGameStore((s) => s.level);
  const hearts = useGameStore((s) => s.hearts);
  const streakCount = useGameStore((s) => s.streakCount);
  const badges = useGameStore((s) => s.badges);
  const userName = useGameStore((s) => s.userName);

  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'matrix'>('map');

  function openQuest(questId: string) {
    setActiveQuestId(questId);
  }

  // Real stats calculation
  const totalQuests = QUEST_CONFIG.length;
  const clearedQuestIds = Object.keys(cleared).filter((id) => cleared[id]);
  const clearedCount = clearedQuestIds.length;
  const completionPercentage = Math.round((clearedCount / totalQuests) * 100);
  const totalAvailableXp = QUEST_CONFIG.reduce((sum, q) => sum + q.baseXp, 0);

  // Determine current active quest
  const statuses = getQuestStatuses(cleared);
  const currentQuest =
    QUEST_CONFIG.find((q) => statuses[q.id]?.state === 'CURRENT') ||
    QUEST_CONFIG.find((q) => statuses[q.id]?.state === 'AVAILABLE') ||
    QUEST_CONFIG[0];

  return (
    <div className="container" id="command-center">
      {/* ── 1. COMMAND CENTER HERO / TELEMETRY ── */}
      <section className="command-hero" aria-label="Command Center">
        {/* Terminal Telemetry Bar */}
        <div className="telemetry-bar">
          <div className="telemetry-item">
            <span className="telemetry-dot telemetry-dot--active" />
            <span className="telemetry-label">SYSTEM:</span>
            <span className="telemetry-val">ONLINE // NEURAL LINK</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">OPERATIVE:</span>
            <span className="telemetry-val">{userName?.toUpperCase() || 'CYBER QUESTER'}</span>
          </div>
          <div className="telemetry-item telemetry-item--highlight">
            <span className="telemetry-label">CLEARANCE:</span>
            <span className="telemetry-val">LEVEL {level}</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">DSA MASTERY:</span>
            <span className="telemetry-val">{completionPercentage}%</span>
          </div>
        </div>

        {/* Main Branding Header */}
        <div className="hero-brand-wrap">
          <div className="hero-brand-top">
            <span className="hero-badge-tag">NEXT-GEN DSA MASTERY ENGINE</span>
            <span className="hero-version-tag">v2.4 LOCAL ACTIVE</span>
          </div>

          <h1 className="hero__title">
            CODE<span className="hero__title-accent">QUEST</span>
          </h1>

          <p className="hero__subtitle">
            Master Data Structures &amp; Algorithms through immersive cyberpunk simulations,
            live code debugging, and visual algorithm arenas.
          </p>
        </div>

        {/* Command Center Action & Directive Card */}
        <div className="command-grid">
          {/* Active Directive Card */}
          <div className="directive-card">
            <div className="directive-card__header">
              <span className="directive-tag">CURRENT DIRECTIVE</span>
              <span className={`quest-badge quest-badge--${currentQuest.difficulty.toLowerCase()}`}>
                {currentQuest.difficulty}
              </span>
            </div>

            <div className="directive-card__body">
              <span className="directive-card__icon">{currentQuest.icon}</span>
              <div className="directive-card__info">
                <h2 className="directive-card__title">{currentQuest.name}</h2>
                <p className="directive-card__desc">{currentQuest.description}</p>
                <div className="directive-card__meta">
                  <span className="directive-xp">+{currentQuest.baseXp} Base XP</span>
                  <span className="directive-sep">•</span>
                  <span className="directive-status">
                    {cleared[currentQuest.id] ? 'STATUS: COMPLETED (REPLAYABLE)' : 'STATUS: IN PROGRESS'}
                  </span>
                </div>
              </div>
            </div>

            <div className="directive-card__actions">
              <button
                className="btn btn--primary btn--pulse"
                onClick={() => openQuest(currentQuest.id)}
              >
                ⚔ {cleared[currentQuest.id] ? 'REPLAY MISSION' : 'ENGAGE OBJECTIVE'}
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => {
                  const mapEl = document.getElementById('quest-map-section');
                  mapEl?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                VIEW MAP →
              </button>
            </div>
          </div>

          {/* Player Telemetry Panel */}
          <div className="telemetry-panel">
            <h3 className="telemetry-panel__title">PILOT TELEMETRY</h3>

            <div className="telemetry-stats-grid">
              {/* Level & XP */}
              <div className="telemetry-stat-box">
                <span className="telemetry-stat-label">TOTAL XP</span>
                <span className="telemetry-stat-num telemetry-stat-num--gold">{totalXp}</span>
                <span className="telemetry-stat-sub">{xp}/{xpToNext} to Level {level + 1}</span>
              </div>

              {/* Quests Cleared */}
              <div className="telemetry-stat-box">
                <span className="telemetry-stat-label">QUESTS CLEARED</span>
                <span className="telemetry-stat-num telemetry-stat-num--mint">
                  {clearedCount} <small>/ {totalQuests}</small>
                </span>
                <span className="telemetry-stat-sub">{totalQuests - clearedCount} remaining</span>
              </div>

              {/* Vitality */}
              <div className="telemetry-stat-box">
                <span className="telemetry-stat-label">VITALITY</span>
                <span className="telemetry-stat-num telemetry-stat-num--coral">{hearts} / 5</span>
                <span className="telemetry-stat-sub">{hearts === 5 ? 'Max Health' : 'Passive regen active'}</span>
              </div>

              {/* Streak */}
              <div className="telemetry-stat-box">
                <span className="telemetry-stat-label">CYBER STREAK</span>
                <span className="telemetry-stat-num telemetry-stat-num--violet">{streakCount}d</span>
                <span className="telemetry-stat-sub">+{Math.min(streakCount * 10, 100)}% XP Boost</span>
              </div>
            </div>

            <div className="telemetry-install-slot">
              <InstallButton />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. QUEST SYSTEM (MAP OR TACTICAL MATRIX) ── */}
      <section className="quest-section" id="quest-map-section" aria-label="Quest progression">
        <div className="section-header-row">
          <div>
            <span className="section-tag">TACTICAL OPERATIONS</span>
            <h2 className="section-title">⚔ QUEST OPERATIONS</h2>
          </div>

          {/* View Mode Toggle */}
          <div className="view-mode-toggle" role="group" aria-label="View mode">
            <button
              className={`view-mode-btn ${viewMode === 'map' ? 'view-mode-btn--active' : ''}`}
              onClick={() => setViewMode('map')}
              aria-pressed={viewMode === 'map'}
            >
              ◈ CYBER MAP
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'matrix' ? 'view-mode-btn--active' : ''}`}
              onClick={() => setViewMode('matrix')}
              aria-pressed={viewMode === 'matrix'}
            >
              ▦ TACTICAL MATRIX
            </button>
          </div>
        </div>

        {viewMode === 'map' ? (
          /* Visual Journey Map */
          <QuestMap onOpenQuest={openQuest} />
        ) : (
          /* Tactical Matrix Grid */
          <div className="quest-grid">
            {QUEST_CONFIG.map((q) => {
              const st = statuses[q.id];
              const isCleared = !!cleared[q.id];
              const isCurrent = st?.state === 'CURRENT';
              const isLocked = st?.state === 'LOCKED';

              return (
                <div
                  key={q.id}
                  id={`quest-card-${q.id}`}
                  className={`quest-card quest-card--${q.difficulty.toLowerCase()} ${
                    isCleared ? 'quest-card--cleared' : isCurrent ? 'quest-card--current' : ''
                  }`}
                >
                  <div className="quest-card__header">
                    <span className="quest-card__icon" aria-hidden="true">
                      {isLocked ? '🔒' : q.icon}
                    </span>
                    <span className={`quest-badge quest-badge--${q.difficulty.toLowerCase()}`}>
                      {q.difficulty}
                    </span>
                  </div>

                  <h3 className="quest-card__name">{q.name}</h3>
                  <p className="quest-card__desc">{q.description}</p>

                  <div className="quest-card__footer">
                    <span className="quest-card__xp">+{q.baseXp} XP</span>
                    {isCleared ? (
                      <span className="quest-card__done">✓ CLEARED</span>
                    ) : isCurrent ? (
                      <span className="quest-card__current-tag">◉ CURRENT</span>
                    ) : isLocked ? (
                      <span className="quest-card__locked-tag">🔒 LOCKED</span>
                    ) : null}
                  </div>

                  <button
                    className={`btn ${
                      isCleared
                        ? 'btn--secondary'
                        : isCurrent
                        ? 'btn--primary quest-card__cta--pulse'
                        : isLocked
                        ? 'btn--locked'
                        : 'btn--primary'
                    } quest-card__cta`}
                    onClick={() => openQuest(q.id)}
                    aria-label={`${isCleared ? 'Replay' : 'Start'} ${q.name}`}
                  >
                    {isCleared ? 'REPLAY MISSION' : isLocked ? 'UNLOCK QUEST' : 'ENGAGE MISSION'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. SKILL MATRIX ── */}
      <div id="skill-tree-section">
        <SkillTree onQuestOpen={openQuest} />
      </div>

      {/* ── 4. TROPHY HALL ── */}
      <div id="badges-hall-section">
        <BadgesHall />
      </div>

      {/* ── 5. QUEST MODAL ── */}
      {activeQuestId && (
        <QuestModal
          questId={activeQuestId}
          onClose={() => setActiveQuestId(null)}
        />
      )}
    </div>
  );
}
