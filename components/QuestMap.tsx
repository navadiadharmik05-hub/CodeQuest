'use client';
// components/QuestMap.tsx
// Connected node-graph quest progression map.
// Visual hierarchy:
//            [1] Syntax Dungeon (Root)
//                     │
//                     ▼
//            [2] Execution Arena
//                  ╱    ╲
//                 ▼      ▼
//       [3] Sort Arena  [4] Tower of Hanoi
//                 ╲      ╱
//                  ▼    ▼
//               [5] BST Quest
//                     │
//                     ▼
//          [6] Stack & Queue Boss
//
// Calculates REAL quest state (COMPLETED, CURRENT, AVAILABLE, LOCKED) based on Zustand cleared store.
// Animates SVG connecting paths with flowing cyber pulses.

import React from 'react';
import { QUEST_CONFIG, QuestConfig } from '@/lib/questConfig';
import { useGameStore } from '@/store/gameStore';

export interface QuestNodeStatus {
  state: 'COMPLETED' | 'CURRENT' | 'AVAILABLE' | 'LOCKED';
  prereqText?: string;
}

export function getQuestStatuses(cleared: Record<string, boolean>): Record<string, QuestNodeStatus> {
  const isSyntaxDone = !!cleared['syntax-dungeon'];
  const isExecDone   = !!cleared['exec-arena'];
  const isSortDone   = !!cleared['sort-arena'];
  const isHanoiDone  = !!cleared['hanoi'];
  const isBstDone    = !!cleared['bst'];
  const isStackDone  = !!cleared['stack-boss'];

  // Determine availability based on prerequisites
  const statuses: Record<string, QuestNodeStatus> = {};

  // 1. Syntax Dungeon: Always available (or completed)
  statuses['syntax-dungeon'] = {
    state: isSyntaxDone ? 'COMPLETED' : 'CURRENT',
  };

  // 2. Execution Arena: Requires Syntax Dungeon
  if (isExecDone) {
    statuses['exec-arena'] = { state: 'COMPLETED' };
  } else if (isSyntaxDone) {
    statuses['exec-arena'] = {
      state: !isSyntaxDone ? 'AVAILABLE' : (statuses['syntax-dungeon'].state === 'COMPLETED' ? 'CURRENT' : 'AVAILABLE'),
    };
  } else {
    statuses['exec-arena'] = { state: 'LOCKED', prereqText: 'Requires Syntax Dungeon' };
  }

  // 3. Sort Arena: Requires Execution Arena
  if (isSortDone) {
    statuses['sort-arena'] = { state: 'COMPLETED' };
  } else if (isExecDone) {
    statuses['sort-arena'] = { state: 'AVAILABLE' };
  } else {
    statuses['sort-arena'] = { state: 'LOCKED', prereqText: 'Requires Execution Arena' };
  }

  // 4. Tower of Hanoi: Requires Execution Arena
  if (isHanoiDone) {
    statuses['hanoi'] = { state: 'COMPLETED' };
  } else if (isExecDone) {
    statuses['hanoi'] = { state: 'AVAILABLE' };
  } else {
    statuses['hanoi'] = { state: 'LOCKED', prereqText: 'Requires Execution Arena' };
  }

  // 5. BST: Requires Sort Arena OR Tower of Hanoi
  if (isBstDone) {
    statuses['bst'] = { state: 'COMPLETED' };
  } else if (isSortDone || isHanoiDone) {
    statuses['bst'] = { state: 'AVAILABLE' };
  } else {
    statuses['bst'] = { state: 'LOCKED', prereqText: 'Requires Sort Arena or Tower of Hanoi' };
  }

  // 6. Stack & Queue Boss: Requires BST
  if (isStackDone) {
    statuses['stack-boss'] = { state: 'COMPLETED' };
  } else if (isBstDone) {
    statuses['stack-boss'] = { state: 'AVAILABLE' };
  } else {
    statuses['stack-boss'] = { state: 'LOCKED', prereqText: 'Requires BST Quest' };
  }

  // Refine the single 'CURRENT' quest marker (first incomplete available quest in journey)
  const sequence = ['syntax-dungeon', 'exec-arena', 'sort-arena', 'hanoi', 'bst', 'stack-boss'];
  let currentAssigned = false;
  for (const qId of sequence) {
    if (statuses[qId].state !== 'COMPLETED' && statuses[qId].state !== 'LOCKED' && !currentAssigned) {
      statuses[qId].state = 'CURRENT';
      currentAssigned = true;
    }
  }

  return statuses;
}

interface QuestMapProps {
  onOpenQuest: (questId: string) => void;
}

export function QuestMap({ onOpenQuest }: QuestMapProps) {
  const cleared = useGameStore((s) => s.cleared);
  const statuses = getQuestStatuses(cleared);

  const questLookup = React.useMemo(() => {
    const map = new Map<string, QuestConfig>();
    for (const q of QUEST_CONFIG) map.set(q.id, q);
    return map;
  }, []);

  function renderQuestNode(id: string, branchClass = '') {
    const q = questLookup.get(id);
    if (!q) return null;
    const st = statuses[id];
    const isCleared = st.state === 'COMPLETED';
    const isCurrent = st.state === 'CURRENT';
    const isLocked = st.state === 'LOCKED';

    return (
      <div
        key={id}
        id={`quest-node-${id}`}
        className={`quest-node quest-node--${st.state.toLowerCase()} quest-node--${q.difficulty.toLowerCase()} ${branchClass}`}
      >
        {/* Radar wave for current objective */}
        {isCurrent && <div className="quest-node__radar" aria-hidden="true" />}

        {/* Node status ribbon */}
        <div className="quest-node__topbar">
          <span className={`quest-node__badge quest-node__badge--${q.difficulty.toLowerCase()}`}>
            {q.difficulty}
          </span>
          <span className={`quest-node__state-label quest-node__state-label--${st.state.toLowerCase()}`}>
            {isCleared && '✓ COMPLETED'}
            {isCurrent && '◉ CURRENT OBJECTIVE'}
            {st.state === 'AVAILABLE' && '⚡ AVAILABLE'}
            {isLocked && '🔒 LOCKED'}
          </span>
        </div>

        {/* Icon & Details */}
        <div className="quest-node__body">
          <div className="quest-node__icon-wrap">
            <span className="quest-node__icon">{isLocked ? '🔒' : q.icon}</span>
          </div>

          <div className="quest-node__info">
            <h4 className="quest-node__title">{q.name}</h4>
            <p className="quest-node__desc">{q.description}</p>
            {isLocked && st.prereqText && (
              <span className="quest-node__prereq">{st.prereqText}</span>
            )}
          </div>
        </div>

        {/* Footer & Action CTA */}
        <div className="quest-node__footer">
          <div className="quest-node__reward">
            <span className="quest-node__xp">+{q.baseXp} XP</span>
            <span className="quest-node__time">~{q.minTimeSecs}s</span>
          </div>

          <button
            className={`btn btn-sm ${
              isCleared
                ? 'btn--secondary'
                : isCurrent
                ? 'btn--primary quest-node__btn-pulse'
                : isLocked
                ? 'btn--locked'
                : 'btn--primary'
            }`}
            onClick={() => onOpenQuest(id)}
            aria-label={`${isCleared ? 'Replay' : 'Launch'} ${q.name}`}
          >
            {isCleared ? 'REPLAY' : isLocked ? 'UNLOCK QUEST' : 'LAUNCH QUEST'}
          </button>
        </div>
      </div>
    );
  }

  // Path connection states
  const p1to2 = !!cleared['syntax-dungeon'];
  const p2to3 = !!cleared['exec-arena'];
  const p2to4 = !!cleared['exec-arena'];
  const p3to5 = !!cleared['sort-arena'];
  const p4to5 = !!cleared['hanoi'];
  const p5to6 = !!cleared['bst'];

  return (
    <div className="quest-map-container" aria-label="Quest progression map">
      <div className="quest-map-header">
        <div className="quest-map-header__title-group">
          <span className="section-tag">PROGRESSION ROADMAP</span>
          <h3 className="quest-map-header__title">⚔ CYBERNETIC QUEST MATRIX</h3>
        </div>
        <div className="quest-map-legend">
          <span className="legend-item"><span className="legend-dot legend-dot--completed" /> Completed</span>
          <span className="legend-item"><span className="legend-dot legend-dot--current" /> Current</span>
          <span className="legend-item"><span className="legend-dot legend-dot--available" /> Available</span>
          <span className="legend-item"><span className="legend-dot legend-dot--locked" /> Locked</span>
        </div>
      </div>

      <div className="quest-map-flow">
        {/* LEVEL 1: ROOT */}
        <div className="map-level map-level--center">
          {renderQuestNode('syntax-dungeon')}
        </div>

        {/* CONNECTOR 1 -> 2 */}
        <div className="map-connector map-connector--vertical">
          <svg className="connector-svg" width="40" height="48" viewBox="0 0 40 48" fill="none">
            <line x1="20" y1="0" x2="20" y2="48" className={`connector-line ${p1to2 ? 'connector-line--active' : ''}`} />
            <polygon points="16,40 24,40 20,48" className={`connector-arrow ${p1to2 ? 'connector-arrow--active' : ''}`} />
          </svg>
        </div>

        {/* LEVEL 2: EXECUTION */}
        <div className="map-level map-level--center">
          {renderQuestNode('exec-arena')}
        </div>

        {/* CONNECTOR 2 -> SPLIT (3 & 4) */}
        <div className="map-connector map-connector--split">
          <svg className="connector-svg connector-svg--fork" viewBox="0 0 400 64" fill="none" preserveAspectRatio="none">
            {/* Left branch */}
            <path
              d="M 200 0 C 200 32, 100 24, 100 64"
              className={`connector-line ${p2to3 ? 'connector-line--active' : ''}`}
            />
            {/* Right branch */}
            <path
              d="M 200 0 C 200 32, 300 24, 300 64"
              className={`connector-line ${p2to4 ? 'connector-line--active' : ''}`}
            />
            <polygon points="96,56 104,56 100,64" className={`connector-arrow ${p2to3 ? 'connector-arrow--active' : ''}`} />
            <polygon points="296,56 304,56 300,64" className={`connector-arrow ${p2to4 ? 'connector-arrow--active' : ''}`} />
          </svg>
        </div>

        {/* LEVEL 3: BRANCHES (SORT & HANOI) */}
        <div className="map-level map-level--branch">
          <div className="map-branch-slot">
            {renderQuestNode('sort-arena', 'quest-node--branch-left')}
          </div>
          <div className="map-branch-slot">
            {renderQuestNode('hanoi', 'quest-node--branch-right')}
          </div>
        </div>

        {/* CONNECTOR (3 & 4) -> MERGE (5) */}
        <div className="map-connector map-connector--merge">
          <svg className="connector-svg connector-svg--fork" viewBox="0 0 400 64" fill="none" preserveAspectRatio="none">
            {/* Left merge */}
            <path
              d="M 100 0 C 100 32, 200 32, 200 64"
              className={`connector-line ${p3to5 ? 'connector-line--active' : ''}`}
            />
            {/* Right merge */}
            <path
              d="M 300 0 C 300 32, 200 32, 200 64"
              className={`connector-line ${p4to5 ? 'connector-line--active' : ''}`}
            />
            <polygon points="196,56 204,56 200,64" className={`connector-arrow ${p3to5 || p4to5 ? 'connector-arrow--active' : ''}`} />
          </svg>
        </div>

        {/* LEVEL 4: BST */}
        <div className="map-level map-level--center">
          {renderQuestNode('bst')}
        </div>

        {/* CONNECTOR 5 -> 6 */}
        <div className="map-connector map-connector--vertical">
          <svg className="connector-svg" width="40" height="48" viewBox="0 0 40 48" fill="none">
            <line x1="20" y1="0" x2="20" y2="48" className={`connector-line ${p5to6 ? 'connector-line--active' : ''}`} />
            <polygon points="16,40 24,40 20,48" className={`connector-arrow ${p5to6 ? 'connector-arrow--active' : ''}`} />
          </svg>
        </div>

        {/* LEVEL 5: BOSS */}
        <div className="map-level map-level--center">
          {renderQuestNode('stack-boss', 'quest-node--boss')}
        </div>
      </div>
    </div>
  );
}
