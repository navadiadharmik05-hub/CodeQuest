'use client';
// components/SkillTree.tsx
// Interactive neural skill progression network.
// Shows 9 DSA core competencies with states: UNLOCKED, ACTIVE, LOCKED.
// Connected network visual, hover telemetry, direct quest launch integration.

import React from 'react';
import { useGameStore, SkillNodeState } from '@/store/gameStore';

const DIFFICULTIES: Record<string, string> = {
  'syntax-dungeon': 'EASY',
  'exec-arena':     'MEDIUM',
  'sort-arena':     'MEDIUM',
  'hanoi':          'HARD',
  'bst':            'HARD',
  'stack-boss':     'BOSS',
};

export function SkillTree({ onQuestOpen }: { onQuestOpen?: (questId: string) => void }) {
  const skillNodes = useGameStore((s) => s.skillNodes);
  const cleared    = useGameStore((s) => s.cleared);

  const unlockedCount = skillNodes.filter((n) => n.status === 'unlocked').length;
  const totalCount    = skillNodes.length;
  const masteryPct    = Math.round((unlockedCount / totalCount) * 100);

  return (
    <section className="skill-tree" aria-label="Skill matrix">
      <div className="section-header-row">
        <div>
          <span className="section-tag">NEURAL PROGRESSION NETWORK</span>
          <h2 className="section-title">🧠 SKILL MATRIX // DSA DISCIPLINES</h2>
        </div>
        <div className="skill-matrix-telemetry">
          <span className="skill-matrix-count">
            <b>{unlockedCount}</b> / {totalCount} Disciplines Unlocked
          </span>
          <span className="skill-matrix-pct">({masteryPct}%)</span>
        </div>
      </div>

      <div className="skill-tree__grid">
        {skillNodes.map((node) => {
          const isCleared = node.questId ? !!cleared[node.questId] : false;
          const isUnlocked = node.status === 'unlocked';
          const isLocked   = node.status === 'locked';
          const isActive   = node.status === 'active';

          return (
            <button
              key={node.id}
              className={[
                'skill-node',
                isUnlocked ? 'skill-node--cleared' : '',
                isLocked   ? 'skill-node--locked'  : '',
                isActive   ? 'skill-node--active'  : '',
              ].join(' ').trim()}
              disabled={isLocked}
              onClick={() => node.questId && onQuestOpen?.(node.questId)}
              title={
                isLocked
                  ? `${node.name} (Locked — clear prerequisite quests to unlock)`
                  : `${node.name} (${node.status.toUpperCase()}) — Click to train in linked quest`
              }
              aria-label={`${node.name}${isLocked ? ' (locked)' : isUnlocked ? ' (unlocked)' : ' (active)'}`}
            >
              <div className="skill-node__icon-wrap">
                <span className="skill-node__icon" aria-hidden="true">
                  {isLocked ? '🔒' : node.icon}
                </span>
              </div>

              <div className="skill-node__info">
                <span className="skill-node__name">{node.name}</span>
                <span className="skill-node__status-label">
                  {isUnlocked ? 'UNLOCKED' : isActive ? 'TRAINING READY' : 'LOCKED'}
                </span>
              </div>

              {node.questId && (
                <span className={`skill-node__difficulty skill-node__difficulty--${DIFFICULTIES[node.questId]?.toLowerCase()}`}>
                  {DIFFICULTIES[node.questId]}
                </span>
              )}

              {isUnlocked && <span className="skill-node__check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
