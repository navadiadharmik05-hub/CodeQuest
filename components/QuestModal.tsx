'use client';
// components/QuestModal.tsx
// Full interactive game implementations for all 6 quests, wrapped in GameModalAdapter:
// 1. Syntax Dungeon (Compiler / Token Placement Game)
// 2. Execution Arena (IDE Debugger / Line Stepper)
// 3. Sort Arena (Bubble Sort Bar Visualizer)
// 4. Tower of Hanoi (Futuristic Laser Peg Puzzle)
// 5. Binary Search Tree (Neural SVG Graph Explorer)
// 6. Stack & Queue Boss (LIFO / FIFO Cybernetic Arena)
//
// Each quest has a unique theme, responsive UI, rich interactive states, and animated feedback.

import React, { useState, useEffect, useRef } from "react";
import { GameModalAdapter, useGameModal } from "@/components/GameModalAdapter";
import { QUEST_CONFIG, QuestConfig } from "@/lib/questConfig";
import { useGameStore } from "@/store/gameStore";

// =============================================================================
// 1. SYNTAX DUNGEON
// =============================================================================
interface BlankDef {
  a: string;
  opts: string[];
}

interface PuzzleItem {
  title: string;
  desc: string;
  lang: string;
  code: string[];
  blanks: Record<string, BlankDef>;
}

const PUZZLES: Record<"js" | "py", PuzzleItem[]> = {
  js: [
    {
      title: "Reverse a String",
      desc: "Drop the correct array method into the blank.",
      lang: "JavaScript",
      code: [
        "function reverseStr(str) {",
        "  return str.split('')",
        "    .__B1__()",
        "    .join('');",
        "}",
      ],
      blanks: { B1: { a: "reverse", opts: ["reverse", "sort", "slice", "concat"] } },
    },
    {
      title: "Loop to Sum",
      desc: "Complete the for-loop header to sum an array.",
      lang: "JavaScript",
      code: [
        "function sum(arr) {",
        "  let total = 0;",
        "  for (let i=__B1__; i __B2__ arr.length; i++) {",
        "    total += arr[i];",
        "  }",
        "  return total;",
        "}",
      ],
      blanks: {
        B1: { a: "0", opts: ["0", "1", "-1", "arr.length"] },
        B2: { a: "<", opts: ["<", "<=", ">", "=="] },
      },
    },
    {
      title: "Arrow Function",
      desc: "Fill in the variable keyword and arrow operator.",
      lang: "JavaScript",
      code: [
        "__B1__ square = (n) __B2__ n * n;",
        "square(9); // 81",
      ],
      blanks: {
        B1: { a: "const", opts: ["const", "let", "print", "func"] },
        B2: { a: "=>", opts: ["=>", "->", ":=", "="] },
      },
    },
  ],
  py: [
    {
      title: "Define a Function",
      desc: "Python uses a special keyword to define routines.",
      lang: "Python",
      code: [
        "__B1__ greet(name):",
        '    __B2__(f"Hello, {name}!")',
        "",
        'greet("Ada")',
      ],
      blanks: {
        B1: { a: "def", opts: ["def", "function", "void", "fn"] },
        B2: { a: "print", opts: ["print", "echo", "log", "return"] },
      },
    },
    {
      title: "List Comprehension",
      desc: "Python power move — insert the exponent operator.",
      lang: "Python",
      code: [
        "squares = [n __B1__ 2 for n in range(5)]",
        "__B2__(squares)",
      ],
      blanks: {
        B1: { a: "**", opts: ["*", "**", "^", "//"] },
        B2: { a: "print", opts: ["print", "echo", "show", "return"] },
      },
    },
    {
      title: "While Loop",
      desc: "Countdown from 5 — select the condition and keyword.",
      lang: "Python",
      code: [
        "n = 5",
        "__B1__ n __B2__ 0:",
        "    print(n)",
        "    n -= 1",
      ],
      blanks: {
        B1: { a: "while", opts: ["while", "for", "loop", "if"] },
        B2: { a: ">", opts: [">", "<", "==", ">="] },
      },
    },
  ],
};

function SyntaxDungeonGame() {
  const { onComplete, onMistake, isBlocked } = useGameModal();
  const hearts = useGameStore((s) => s.hearts);
  const pushToast = useGameStore((s) => s.pushToast);

  const [lang, setLang] = useState<"js" | "py">("js");
  const [idx, setIdx] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [clearedPuzzles, setClearedPuzzles] = useState<Record<string, boolean>>({});
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  const pset = PUZZLES[lang];
  const puzzle = pset[idx];

  const allWords = Array.from(
    new Set(Object.values(puzzle.blanks).flatMap((b) => b.opts))
  ).sort();

  function handleSelectWord(w: string) {
    setSelectedWord(w === selectedWord ? null : w);
  }

  function handlePlaceWord(blankId: string) {
    if (isBlocked || !selectedWord) return;
    const expected = puzzle.blanks[blankId]?.a;

    if (selectedWord === expected) {
      const nextAnswers = { ...answers, [blankId]: selectedWord };
      setAnswers(nextAnswers);
      setSelectedWord(null);

      const allFilled = Object.keys(puzzle.blanks).every((k) => nextAnswers[k] === puzzle.blanks[k].a);
      if (allFilled) {
        const puzzleKey = `${lang}-${idx}`;
        if (!clearedPuzzles[puzzleKey]) {
          setClearedPuzzles((prev) => ({ ...prev, [puzzleKey]: true }));
          onComplete();
          pushToast({ id: `sd-win-${Date.now()}`, type: "badge", payload: { icon: "🐛", name: "BUG SQUASHER" } });
        }
      }
    } else {
      setWrongKey(blankId);
      setTimeout(() => setWrongKey(null), 600);
      onMistake();
      pushToast({ id: `wrong-${Date.now()}`, type: "xp", payload: { amount: -1 } });
    }
  }

  function nextPuzzle() {
    if (idx < pset.length - 1) {
      setIdx(idx + 1);
      setAnswers({});
      setSelectedWord(null);
    }
  }

  function resetCurrent() {
    setAnswers({});
    setSelectedWord(null);
  }

  const isCurrentDone = Object.keys(puzzle.blanks).every((k) => answers[k] === puzzle.blanks[k].a);

  return (
    <div className="game-layout game-layout--syntax">
      <div className="game-main">
        {/* Language Tabs & Progress */}
        <div className="game-toolbar">
          <div className="game-tab-group">
            <button
              className={`game-tab-btn ${lang === "js" ? "game-tab-btn--active" : ""}`}
              onClick={() => { setLang("js"); setIdx(0); setAnswers({}); setSelectedWord(null); }}
            >
              JavaScript
            </button>
            <button
              className={`game-tab-btn ${lang === "py" ? "game-tab-btn--active" : ""}`}
              onClick={() => { setLang("py"); setIdx(0); setAnswers({}); setSelectedWord(null); }}
            >
              Python
            </button>
          </div>

          <div className="puzzle-progress-pills" title={`Puzzle ${idx + 1} of ${pset.length}`}>
            {pset.map((_, i) => (
              <span
                key={i}
                className={`puzzle-pill ${
                  clearedPuzzles[`${lang}-${i}`]
                    ? "puzzle-pill--cleared"
                    : i === idx
                    ? "puzzle-pill--active"
                    : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* Puzzle Card */}
        <div className="card game-card">
          <div className="game-card__header">
            <div>
              <span className="game-card__badge">SYNTAX PUZZLE #{idx + 1}</span>
              <h3 className="game-card__title">{puzzle.title}</h3>
            </div>
            <span className="game-card__hint">{puzzle.desc}</span>
          </div>

          {/* IDE Terminal Code Display */}
          <div className="code-editor-box">
            <div className="code-editor-gutter-top">
              <span className="editor-dot editor-dot--red" />
              <span className="editor-dot editor-dot--gold" />
              <span className="editor-dot editor-dot--mint" />
              <span className="editor-filename">{lang === "js" ? "solution.js" : "solution.py"}</span>
            </div>

            <div className="code-display">
              {puzzle.code.map((line, lineIndex) => {
                const parts = line.split(/__(B\d+)__/g);
                return (
                  <div key={lineIndex} className="code-line">
                    <span className="code-ln">{lineIndex + 1}</span>
                    <span className="code-tokens">
                      {parts.map((p, pIndex) => {
                        if (puzzle.blanks[p]) {
                          const filled = answers[p];
                          const isWrong = wrongKey === p;
                          return (
                            <button
                              key={pIndex}
                              type="button"
                              onClick={() => handlePlaceWord(p)}
                              className={`code-blank ${filled ? "code-blank--filled" : ""} ${
                                isWrong ? "code-blank--wrong" : ""
                              } ${selectedWord && !filled ? "code-blank--target" : ""}`}
                              title={filled ? `Filled: ${filled}` : selectedWord ? `Place '${selectedWord}' here` : "Select a token below first"}
                            >
                              {filled || (selectedWord ? "CLICK TO PLACE" : "[ ? ]")}
                            </button>
                          );
                        }
                        return <span key={pIndex}>{p}</span>;
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Token Bank */}
          <div className="token-bank-wrap">
            <span className="token-bank-label">SYNTAX TOKEN REPOSITORY:</span>
            <div className="token-bank-grid">
              {allWords.map((w) => {
                const isUsed = Object.values(answers).includes(w);
                const isSelected = selectedWord === w;
                return (
                  <button
                    key={w}
                    disabled={isUsed || isBlocked}
                    onClick={() => handleSelectWord(w)}
                    className={`token-btn ${isSelected ? "token-btn--selected" : ""} ${
                      isUsed ? "token-btn--used" : ""
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Puzzle Cleared Success Banner */}
          {isCurrentDone && (
            <div className="puzzle-success-banner">
              <div className="puzzle-success-title">✓ SYNTAX VERIFIED!</div>
              <div className="puzzle-success-xp">+30 XP EARNED</div>
              {idx < pset.length - 1 ? (
                <button className="btn btn--primary btn-sm" onClick={nextPuzzle}>
                  Next Puzzle →
                </button>
              ) : (
                <span className="puzzle-all-done-tag">All {lang.toUpperCase()} modules completed!</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="game-sidebar">
        <div className="sidebar-card">
          <div className="sidebar-label">VITALITY MATRIX</div>
          <div className="sidebar-hearts">
            {"❤".repeat(hearts) + "🖤".repeat(Math.max(0, 5 - hearts))}
          </div>
          <span className="sidebar-hearts-sub">Incorrect token loses 1 vitality</span>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-label">MISSION PROTOCOL</div>
          <p className="sidebar-desc">
            1. Select a token from the repository below.<br />
            2. Click the corresponding bracket blank in the code editor.<br />
            3. Fix syntax errors to escape the dungeon!
          </p>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-label">REWARDS</div>
          <p className="sidebar-desc">
            +30 XP per verified puzzle. Clears unlock the <b style={{ color: "var(--gold)" }}>Bug Squasher</b> badge.
          </p>
        </div>

        <button className="btn btn--secondary btn-sm sidebar-reset-btn" onClick={resetCurrent}>
          ↺ Reset Current Puzzle
        </button>
      </aside>
    </div>
  );
}

// =============================================================================
// 2. EXECUTION ARENA
// =============================================================================
interface ExecStep {
  l: number;
  v: Record<string, string>;
  s: string[];
  o: string;
}

const EXEC_PROGS: Record<string, { title: string; lines: string[]; trace: ExecStep[] }> = {
  sumArr: {
    title: "Array Sum Accumulator",
    lines: [
      "function sum(arr) {",
      "  let total = 0;",
      "  for (let i=0; i<arr.length; i++) {",
      "    total += arr[i];",
      "  }",
      "  return total;",
      "}",
      "sum([3, 7, 2]);",
    ],
    trace: [
      { l: 8, v: {}, s: [], o: "> sum([3, 7, 2]) invoked" },
      { l: 1, v: { arr: "[3, 7, 2]" }, s: ["sum(arr=[3,7,2])"], o: "Entering scope sum()" },
      { l: 2, v: { arr: "[3, 7, 2]", total: "0" }, s: ["sum(...)"], o: "total initialized to 0" },
      { l: 3, v: { arr: "[3, 7, 2]", total: "0", i: "0" }, s: ["sum(...)"], o: "Loop iteration i=0 (0 < 3)" },
      { l: 4, v: { arr: "[3, 7, 2]", total: "3", i: "0" }, s: ["sum(...)"], o: "total += 3 → 3" },
      { l: 3, v: { arr: "[3, 7, 2]", total: "3", i: "1" }, s: ["sum(...)"], o: "Loop iteration i=1 (1 < 3)" },
      { l: 4, v: { arr: "[3, 7, 2]", total: "10", i: "1" }, s: ["sum(...)"], o: "total += 7 → 10" },
      { l: 3, v: { arr: "[3, 7, 2]", total: "10", i: "2" }, s: ["sum(...)"], o: "Loop iteration i=2 (2 < 3)" },
      { l: 4, v: { arr: "[3, 7, 2]", total: "12", i: "2" }, s: ["sum(...)"], o: "total += 2 → 12" },
      { l: 3, v: { arr: "[3, 7, 2]", total: "12", i: "3" }, s: ["sum(...)"], o: "Loop condition i=3 (3 < 3) false — exit" },
      { l: 6, v: { arr: "[3, 7, 2]", total: "12" }, s: ["sum(...)"], o: "Returning 12" },
      { l: 8, v: {}, s: [], o: "< Function returned 12" },
    ],
  },
  factorial: {
    title: "Recursive Factorial Call Stack",
    lines: [
      "function factorial(n) {",
      "  if (n <= 1) return 1;",
      "  return n * factorial(n - 1);",
      "}",
      "factorial(4);",
    ],
    trace: [
      { l: 5, v: {}, s: [], o: "> factorial(4) invoked" },
      { l: 1, v: { n: "4" }, s: ["factorial(4)"], o: "Stack frame factorial(4)" },
      { l: 2, v: { n: "4" }, s: ["factorial(4)"], o: "Condition 4 <= 1 is false" },
      { l: 3, v: { n: "4" }, s: ["factorial(4)"], o: "Recursive call: factorial(3)" },
      { l: 1, v: { n: "3" }, s: ["factorial(4)", "factorial(3)"], o: "Stack frame factorial(3)" },
      { l: 2, v: { n: "3" }, s: ["factorial(4)", "factorial(3)"], o: "Condition 3 <= 1 is false" },
      { l: 3, v: { n: "3" }, s: ["factorial(4)", "factorial(3)"], o: "Recursive call: factorial(2)" },
      { l: 1, v: { n: "2" }, s: ["factorial(4)", "factorial(3)", "factorial(2)"], o: "Stack frame factorial(2)" },
      { l: 2, v: { n: "2" }, s: ["factorial(4)", "factorial(3)", "factorial(2)"], o: "Condition 2 <= 1 is false" },
      { l: 3, v: { n: "2" }, s: ["factorial(4)", "factorial(3)", "factorial(2)"], o: "Recursive call: factorial(1)" },
      { l: 1, v: { n: "1" }, s: ["factorial(4)", "factorial(3)", "factorial(2)", "factorial(1)"], o: "Stack frame factorial(1)" },
      { l: 2, v: { n: "1" }, s: ["factorial(4)", "factorial(3)", "factorial(2)", "factorial(1)"], o: "Condition 1 <= 1 is true → Base case reached!" },
      { l: 3, v: { n: "2" }, s: ["factorial(4)", "factorial(3)", "factorial(2)"], o: "factorial(2) resumes: 2 * 1 = 2" },
      { l: 3, v: { n: "3" }, s: ["factorial(4)", "factorial(3)"], o: "factorial(3) resumes: 3 * 2 = 6" },
      { l: 3, v: { n: "4" }, s: ["factorial(4)"], o: "factorial(4) resumes: 4 * 6 = 24" },
      { l: 5, v: {}, s: [], o: "< Call stack unwound. Final result = 24" },
    ],
  },
};

function ExecutionArenaGame() {
  const { onComplete } = useGameModal();
  const [progKey, setProgKey] = useState<"sumArr" | "factorial">("sumArr");
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const [cleared, setCleared] = useState(false);

  const prog = EXEC_PROGS[progKey];
  const currentStep = prog.trace[stepIdx] || prog.trace[0];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setStepIdx((prev) => {
          if (prev >= prog.trace.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, prog.trace.length]);

  useEffect(() => {
    if (stepIdx === prog.trace.length - 1 && !cleared) {
      setCleared(true);
      onComplete();
    }
  }, [stepIdx, prog.trace.length, cleared, onComplete]);

  function handleSwitchProg(k: "sumArr" | "factorial") {
    setIsPlaying(false);
    setProgKey(k);
    setStepIdx(0);
    setCleared(false);
  }

  // Accumulated output logs
  const outLines = prog.trace
    .slice(0, stepIdx + 1)
    .map((t) => t.o)
    .filter(Boolean);

  return (
    <div className="game-layout game-layout--exec">
      <div className="game-main">
        {/* Program Switcher & Controls Toolbar */}
        <div className="game-toolbar">
          <div className="game-tab-group">
            <button
              className={`game-tab-btn ${progKey === "sumArr" ? "game-tab-btn--active" : ""}`}
              onClick={() => handleSwitchProg("sumArr")}
            >
              1. Array Loop Sum
            </button>
            <button
              className={`game-tab-btn ${progKey === "factorial" ? "game-tab-btn--active" : ""}`}
              onClick={() => handleSwitchProg("factorial")}
            >
              2. Factorial Recursion
            </button>
          </div>

          <div className="exec-stepper-controls">
            <button
              className="btn btn--secondary btn-sm"
              disabled={stepIdx === 0}
              onClick={() => { setIsPlaying(false); setStepIdx(0); }}
              title="Restart execution"
            >
              ⏮ Reset
            </button>
            <button
              className="btn btn--secondary btn-sm"
              disabled={stepIdx === 0}
              onClick={() => { setIsPlaying(false); setStepIdx((s) => Math.max(0, s - 1)); }}
              title="Step backward"
            >
              ◀ Step
            </button>
            <button
              className={`btn btn-sm ${isPlaying ? "btn--secondary" : "btn--primary"}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? "⏸ Pause" : "▶ Run"}
            </button>
            <button
              className="btn btn--secondary btn-sm"
              disabled={stepIdx === prog.trace.length - 1}
              onClick={() => { setIsPlaying(false); setStepIdx((s) => Math.min(prog.trace.length - 1, s + 1)); }}
              title="Step forward"
            >
              Step ▶
            </button>
          </div>
        </div>

        {/* IDE Stepper View */}
        <div className="card game-card">
          <div className="game-card__header">
            <div>
              <span className="game-card__badge">EXECUTION ENGINE // STEP {stepIdx + 1} OF {prog.trace.length}</span>
              <h3 className="game-card__title">{prog.title}</h3>
            </div>
            <div className="exec-speed-ctrl">
              <span>SPEED:</span>
              <button
                className={`speed-pill ${speed === 1400 ? "speed-pill--active" : ""}`}
                onClick={() => setSpeed(1400)}
              >
                0.5x
              </button>
              <button
                className={`speed-pill ${speed === 900 ? "speed-pill--active" : ""}`}
                onClick={() => setSpeed(900)}
              >
                1x
              </button>
              <button
                className={`speed-pill ${speed === 400 ? "speed-pill--active" : ""}`}
                onClick={() => setSpeed(400)}
              >
                2x
              </button>
            </div>
          </div>

          {/* Code Viewer with active line highlight */}
          <div className="code-editor-box">
            <div className="code-editor-gutter-top">
              <span className="editor-dot editor-dot--red" />
              <span className="editor-dot editor-dot--gold" />
              <span className="editor-dot editor-dot--mint" />
              <span className="editor-filename">debug_runner.ts — Line {currentStep.l}</span>
            </div>

            <div className="code-display">
              {prog.lines.map((line, i) => {
                const lineNum = i + 1;
                const isCurrent = lineNum === currentStep.l;
                return (
                  <div
                    key={i}
                    className={`code-line ${isCurrent ? "code-line--executing" : ""}`}
                  >
                    <span className="code-ln">
                      {isCurrent ? "▶" : lineNum}
                    </span>
                    <span className="code-tokens">{line}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: Memory & Call Stack & Output */}
      <aside className="game-sidebar">
        {/* Variables Inspector */}
        <div className="sidebar-card">
          <div className="sidebar-label">MEMORY / SCOPE VARIABLES</div>
          <div className="var-inspector-list">
            {Object.keys(currentStep.v).length > 0 ? (
              Object.entries(currentStep.v).map(([k, v]) => (
                <div key={k} className="var-pill">
                  <span className="var-pill-key">{k}</span>
                  <span className="var-pill-val">{v}</span>
                </div>
              ))
            ) : (
              <span className="var-empty-text">— Global Scope (No Locals) —</span>
            )}
          </div>
        </div>

        {/* Call Stack */}
        <div className="sidebar-card">
          <div className="sidebar-label">CALL STACK (DEPTH: {currentStep.s.length})</div>
          <div className="call-stack-list">
            {currentStep.s.length > 0 ? (
              currentStep.s.map((f, i) => {
                const isTop = i === currentStep.s.length - 1;
                return (
                  <div
                    key={i}
                    className={`stack-frame-pill ${isTop ? "stack-frame-pill--top" : ""}`}
                  >
                    <span className="frame-depth">#{currentStep.s.length - i}</span>
                    <span className="frame-name">{f}</span>
                  </div>
                );
              })
            ) : (
              <span className="var-empty-text">— Idle / Main Thread —</span>
            )}
          </div>
        </div>

        {/* Console Logs */}
        <div className="sidebar-card">
          <div className="sidebar-label">TERMINAL STREAM</div>
          <div className="console-stream-box">
            {outLines.length > 0 ? (
              outLines.map((l, i) => (
                <div key={i} className="console-line">
                  <span className="console-prompt">$</span> {l}
                </div>
              ))
            ) : (
              <span className="console-idle-text">Waiting for execution trigger...</span>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

// =============================================================================
// 3. SORT ARENA (BUBBLE SORT)
// =============================================================================
interface SortFrame {
  a: number[];
  cmp: number[];
  sorted: number[];
  c: number;
  s: number;
}

function buildBubbleFrames(arr: number[]): SortFrame[] {
  const a = [...arr];
  const n = a.length;
  const frames: SortFrame[] = [];
  let c = 0;
  let s = 0;

  frames.push({ a: [...a], cmp: [], sorted: [], c, s });
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      c++;
      frames.push({ a: [...a], cmp: [j, j + 1], sorted: [], c, s });
      if (a[j] > a[j + 1]) {
        const t = a[j];
        a[j] = a[j + 1];
        a[j + 1] = t;
        s++;
        frames.push({ a: [...a], cmp: [j, j + 1], sorted: [], c, s });
      }
    }
    frames.push({ a: [...a], cmp: [], sorted: Array.from({ length: i + 1 }, (_, k) => n - 1 - k), c, s });
  }
  frames.push({ a: [...a], cmp: [], sorted: Array.from({ length: n }, (_, k) => k), c, s });
  return frames;
}

function SortArenaGame() {
  const { onComplete } = useGameModal();
  const [frames, setFrames] = useState<SortFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(250);
  const [cleared, setCleared] = useState(false);

  function shuffle() {
    setIsPlaying(false);
    const newArr = Array.from({ length: 14 }, () => Math.floor(Math.random() * 85) + 12);
    const f = buildBubbleFrames(newArr);
    setFrames(f);
    setFrameIdx(0);
    setCleared(false);
  }

  useEffect(() => {
    shuffle();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setFrameIdx((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, frames.length]);

  useEffect(() => {
    if (frames.length > 0 && frameIdx === frames.length - 1 && !cleared) {
      setCleared(true);
      onComplete();
    }
  }, [frameIdx, frames.length, cleared, onComplete]);

  const currentFrame = frames[frameIdx];
  const maxVal = currentFrame ? Math.max(...currentFrame.a) : 100;
  const isAllSorted = currentFrame && currentFrame.sorted.length === currentFrame.a.length;

  return (
    <div className="game-card">
      <div className="game-card__header">
        <div>
          <span className="game-card__badge">ALGORITHMIC ARENA // BUBBLE SORT</span>
          <h3 className="game-card__title">Adaptive Partition Visualizer</h3>
        </div>
        <div className="sort-status-tag">
          {isAllSorted ? (
            <span className="sort-status-tag--done">✓ ARRAY STABLY SORTED!</span>
          ) : isPlaying ? (
            <span className="sort-status-tag--active">⚙ SORTING ACTIVE...</span>
          ) : (
            <span>PAUSED</span>
          )}
        </div>
      </div>

      {/* Visual Bars Arena */}
      <div className="sort-bars-arena">
        {currentFrame?.a.map((val, i) => {
          const isCmp = currentFrame.cmp.includes(i);
          const isSorted = currentFrame.sorted.includes(i);
          const heightPct = Math.max(12, (val / maxVal) * 100);

          return (
            <div
              key={i}
              className={`sort-bar ${
                isCmp ? "sort-bar--compare" : isSorted ? "sort-bar--sorted" : ""
              }`}
              style={{ height: `${heightPct}%` }}
            >
              <span className="sort-bar-num">{val}</span>
            </div>
          );
        })}
      </div>

      {/* Real-time Telemetry Metrics */}
      <div className="sort-telemetry-row">
        <div className="sort-metric">
          <span className="sort-metric-label">COMPARISONS</span>
          <span className="sort-metric-val sort-metric-val--cyan">{currentFrame?.c ?? 0}</span>
        </div>
        <div className="sort-metric">
          <span className="sort-metric-label">SWAPS</span>
          <span className="sort-metric-val sort-metric-val--coral">{currentFrame?.s ?? 0}</span>
        </div>
        <div className="sort-metric">
          <span className="sort-metric-label">TIME COMPLEXITY</span>
          <span className="sort-metric-val sort-metric-val--gold">O(n²)</span>
        </div>
        <div className="sort-metric">
          <span className="sort-metric-label">FRAME</span>
          <span className="sort-metric-val">{frameIdx + 1} / {frames.length}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="sort-controls-toolbar">
        <button className="btn btn--secondary btn-sm" onClick={shuffle}>
          🎲 Randomize
        </button>
        <button
          className="btn btn--secondary btn-sm"
          disabled={frameIdx === 0}
          onClick={() => { setIsPlaying(false); setFrameIdx((f) => Math.max(0, f - 1)); }}
        >
          ◀ Step
        </button>
        <button
          className={`btn btn-sm ${isPlaying ? "btn--secondary" : "btn--primary"}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          className="btn btn--secondary btn-sm"
          disabled={frameIdx === frames.length - 1}
          onClick={() => { setIsPlaying(false); setFrameIdx((f) => Math.min(frames.length - 1, f + 1)); }}
        >
          Step ▶
        </button>

        <div className="sort-speed-slider">
          <span>SPEED:</span>
          <input
            type="range"
            min={40}
            max={500}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            style={{ accentColor: "var(--violet)", width: 120 }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="sort-legend-strip">
        <span className="sort-legend-item">
          <span className="sort-legend-color sort-legend-color--cyan" /> Cyan: Comparing adjacent pair
        </span>
        <span className="sort-legend-item">
          <span className="sort-legend-color sort-legend-color--mint" /> Green: Stable sorted partition
        </span>
        <span className="sort-legend-item">
          <span className="sort-legend-color sort-legend-color--violet" /> Violet: Unsorted partition
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// 4. TOWER OF HANOI
// =============================================================================
function TowerOfHanoiGame() {
  const { onComplete, onMistake, isBlocked } = useGameModal();
  const [numDisks, setNumDisks] = useState(3);
  const [pegs, setPegs] = useState<number[][]>([[3, 2, 1], [], []]);
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const DISK_COLORS = ["#f9c74f", "#ff6b9d", "#7b6ff7", "#43e97b", "#00d4ff"];
  const MIN_MOVES = [0, 1, 3, 7, 15, 31];

  function resetGame(disks: number) {
    setNumDisks(disks);
    const initialPeg: number[] = [];
    for (let i = disks; i >= 1; i--) initialPeg.push(i);
    setPegs([initialPeg, [], []]);
    setSelectedPeg(null);
    setMoves(0);
    setWon(false);
    setErrorMsg(null);
  }

  function handlePegClick(targetPeg: number) {
    if (won || isBlocked) return;
    setErrorMsg(null);

    if (selectedPeg === null) {
      if (pegs[targetPeg].length === 0) return;
      setSelectedPeg(targetPeg);
    } else {
      if (selectedPeg === targetPeg) {
        setSelectedPeg(null);
        return;
      }

      const sourceDisks = pegs[selectedPeg];
      const diskToMove = sourceDisks[sourceDisks.length - 1];
      const destDisks = pegs[targetPeg];
      const topDest = destDisks[destDisks.length - 1];

      // Illegal move rule: larger on smaller
      if (destDisks.length > 0 && topDest < diskToMove) {
        onMistake();
        setErrorMsg(`Illegal move: cannot place Disk #${diskToMove} on smaller Disk #${topDest}!`);
        setSelectedPeg(null);
        return;
      }

      // Valid move
      const nextPegs = pegs.map((p, idx) => {
        if (idx === selectedPeg) return p.slice(0, -1);
        if (idx === targetPeg) return [...p, diskToMove];
        return p;
      });

      const nextMoves = moves + 1;
      setPegs(nextPegs);
      setMoves(nextMoves);
      setSelectedPeg(null);

      // Check win: all disks on Peg C (index 2)
      if (nextPegs[2].length === numDisks) {
        setWon(true);
        const isOptimal = nextMoves === MIN_MOVES[numDisks];
        onComplete({ isOptimal });
      }
    }
  }

  const optimalMoves = MIN_MOVES[numDisks];

  return (
    <div className="game-layout game-layout--hanoi">
      <div className="game-main">
        <div className="card game-card">
          <div className="game-card__header">
            <div>
              <span className="game-card__badge">RECURSION MATRIX // STRATEGY PUZZLE</span>
              <h3 className="game-card__title">🏰 Tower of Hanoi</h3>
            </div>
            <div className="game-tab-group">
              {[3, 4, 5].map((d) => (
                <button
                  key={d}
                  className={`game-tab-btn ${numDisks === d ? "game-tab-btn--active" : ""}`}
                  onClick={() => resetGame(d)}
                >
                  {d} Disks
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="hanoi-error-banner">
              ⚠️ {errorMsg} (-1 Vitality)
            </div>
          )}

          {/* Pegs Arena Canvas */}
          <div className="hanoi-arena">
            {/* 3 Interactive Pegs */}
            {[0, 1, 2].map((pIdx) => {
              const diskStack = pegs[pIdx];
              const isSelected = selectedPeg === pIdx;
              return (
                <div
                  key={pIdx}
                  onClick={() => handlePegClick(pIdx)}
                  className={`hanoi-peg-col ${isSelected ? "hanoi-peg-col--selected" : ""}`}
                >
                  {/* Glowing Peg Pole */}
                  <div className={`hanoi-pole ${isSelected ? "hanoi-pole--selected" : ""}`} />

                  {/* Disks on Peg */}
                  <div className="hanoi-disk-stack">
                    {diskStack.map((d, dIdx) => {
                      const isTop = dIdx === diskStack.length - 1;
                      const isElevated = isSelected && isTop;
                      const widthPct = 28 + d * 14;

                      return (
                        <div
                          key={d}
                          className={`hanoi-disk ${isElevated ? "hanoi-disk--elevated" : ""}`}
                          style={{
                            width: `${widthPct}%`,
                            background: `linear-gradient(135deg, ${DISK_COLORS[d - 1]}, rgba(255,255,255,0.2))`,
                            boxShadow: isElevated ? `0 0 20px ${DISK_COLORS[d - 1]}` : undefined,
                          }}
                        >
                          <span className="hanoi-disk-label">#{d}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Peg Label Badge */}
                  <div className="hanoi-peg-label">
                    {["PEG A (SOURCE)", "PEG B (AUX)", "PEG C (TARGET)"][pIdx]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Win Banner */}
          {won && (
            <div className="puzzle-success-banner">
              <div className="puzzle-success-title">🏆 TOWER CONQUERED!</div>
              <div className="puzzle-success-xp">
                Solved in {moves} moves {moves === optimalMoves ? "(OPTIMAL!)" : `(Optimal was ${optimalMoves})`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="game-sidebar">
        <div className="sidebar-card">
          <div className="sidebar-label">MOVE TELEMETRY</div>
          <div className="sidebar-stat-big">
            <span className="sidebar-stat-num">{moves}</span>
            <span className="sidebar-stat-den">/ {optimalMoves} Min</span>
          </div>
          <span className="sidebar-hearts-sub">
            {moves === optimalMoves ? "★ Perfect optimal play!" : "Formula: 2^n - 1"}
          </span>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-label">GOAL &amp; RULES</div>
          <p className="sidebar-desc">
            1. Move all disks from <b>PEG A</b> to <b>PEG C</b>.<br />
            2. Only one disk can be moved at a time.<br />
            3. A larger disk can <b>NEVER</b> be placed atop a smaller disk!
          </p>
        </div>

        <button className="btn btn--secondary btn-sm sidebar-reset-btn" onClick={() => resetGame(numDisks)}>
          ↺ Reset Hanoi
        </button>
      </aside>
    </div>
  );
}

// =============================================================================
// 5. BINARY SEARCH TREE
// =============================================================================
interface BSTNode {
  v: number;
  l: BSTNode | null;
  r: BSTNode | null;
}

function bstInsert(root: BSTNode | null, v: number): BSTNode {
  if (!root) return { v, l: null, r: null };
  if (v < root.v) return { ...root, l: bstInsert(root.l, v) };
  if (v > root.v) return { ...root, r: bstInsert(root.r, v) };
  return root;
}

function bstInorder(root: BSTNode | null, res: number[] = []): number[] {
  if (!root) return res;
  bstInorder(root.l, res);
  res.push(root.v);
  bstInorder(root.r, res);
  return res;
}

function bstHeight(root: BSTNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(bstHeight(root.l), bstHeight(root.r));
}

function BinarySearchTreeGame() {
  const { onComplete, isBlocked } = useGameModal();
  const [root, setRoot] = useState<BSTNode | null>(null);
  const [insertedList, setInsertedList] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchVal, setSearchVal] = useState("");
  const [searchPath, setSearchPath] = useState<number[]>([]);
  const [cleared, setCleared] = useState(false);

  function handleInsert(val?: number) {
    if (isBlocked) return;
    const v = val ?? parseInt(inputValue, 10);
    setInputValue("");
    if (isNaN(v) || v < 1 || v > 999) return;
    if (insertedList.includes(v)) return;

    const nextRoot = bstInsert(root, v);
    const nextList = [...insertedList, v];
    setRoot(nextRoot);
    setInsertedList(nextList);

    if (nextList.length >= 5 && !cleared) {
      setCleared(true);
      onComplete();
    }
  }

  function handleSearch() {
    const v = parseInt(searchVal, 10);
    setSearchVal("");
    if (isNaN(v)) return;

    const path: number[] = [];
    let curr = root;
    while (curr) {
      path.push(curr.v);
      if (curr.v === v) break;
      curr = v < curr.v ? curr.l : curr.r;
    }
    setSearchPath(path);
  }

  // Assign coordinate positions for rendering
  const positions: Record<number, { x: number; y: number }> = {};
  let xi = 0;
  function assignPos(node: BSTNode | null, depth: number) {
    if (!node) return;
    assignPos(node.l, depth + 1);
    positions[node.v] = { x: xi * 56 + 48, y: depth * 64 + 48 };
    xi++;
    assignPos(node.r, depth + 1);
  }
  if (root) assignPos(root, 0);

  const lines: React.ReactNode[] = [];
  const circles: React.ReactNode[] = [];

  function drawNodes(node: BSTNode | null) {
    if (!node) return;
    const pos = positions[node.v];

    if (node.l && positions[node.l.v]) {
      const lPos = positions[node.l.v];
      const isBranchHl = searchPath.includes(node.v) && searchPath.includes(node.l.v);
      lines.push(
        <line
          key={`l-${node.v}-${node.l.v}`}
          x1={pos.x}
          y1={pos.y}
          x2={lPos.x}
          y2={lPos.y}
          stroke={isBranchHl ? "var(--gold)" : "rgba(123,111,247,0.4)"}
          strokeWidth={isBranchHl ? "3" : "2"}
        />
      );
    }

    if (node.r && positions[node.r.v]) {
      const rPos = positions[node.r.v];
      const isBranchHl = searchPath.includes(node.v) && searchPath.includes(node.r.v);
      lines.push(
        <line
          key={`r-${node.v}-${node.r.v}`}
          x1={pos.x}
          y1={pos.y}
          x2={rPos.x}
          y2={rPos.y}
          stroke={isBranchHl ? "var(--gold)" : "rgba(123,111,247,0.4)"}
          strokeWidth={isBranchHl ? "3" : "2"}
        />
      );
    }

    const isHl = searchPath.includes(node.v);
    circles.push(
      <g key={node.v} className="bst-node-group">
        <circle
          cx={pos.x}
          cy={pos.y}
          r={20}
          fill={isHl ? "var(--gold)" : "var(--panel2-solid)"}
          stroke={isHl ? "var(--gold2)" : "var(--cyan)"}
          strokeWidth="2"
        />
        <text
          x={pos.x}
          y={pos.y + 5}
          textAnchor="middle"
          fill={isHl ? "#000" : "var(--ink)"}
          style={{ fontFamily: "var(--font-code)", fontSize: "13px", fontWeight: 700 }}
        >
          {node.v}
        </text>
      </g>
    );

    drawNodes(node.l);
    drawNodes(node.r);
  }

  if (root) drawNodes(root);

  return (
    <div className="game-layout game-layout--bst">
      <div className="game-main">
        <div className="card game-card">
          <div className="game-card__header">
            <div>
              <span className="game-card__badge">GRAPH VISUALIZER // NEURAL TREE</span>
              <h3 className="game-card__title">🌳 Binary Search Tree</h3>
            </div>
            <div className="bst-action-row">
              <input
                type="number"
                placeholder="Insert (1-999)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInsert()}
                className="bst-input"
              />
              <button className="btn btn--primary btn-sm" onClick={() => handleInsert()}>
                + Insert
              </button>
              <button
                className="btn btn--secondary btn-sm"
                onClick={() => handleInsert(Math.floor(Math.random() * 90) + 10)}
              >
                + Random
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bst-search-toolbar">
            <span className="bst-search-label">TRAVERSAL SEARCH:</span>
            <input
              type="number"
              placeholder="Search value..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bst-input bst-input--search"
            />
            <button className="btn btn--secondary btn-sm" onClick={handleSearch}>
              🔍 Trace Path
            </button>
            {searchPath.length > 0 && (
              <span className="bst-path-indicator">
                Path: {searchPath.join(" → ")}
              </span>
            )}
          </div>

          {/* Tree SVG Canvas */}
          <div className="bst-canvas-box">
            {root ? (
              <svg width={Math.max(480, xi * 56 + 96)} height={Math.max(260, bstHeight(root) * 64 + 64)}>
                {lines}
                {circles}
              </svg>
            ) : (
              <div className="bst-empty-placeholder">
                <span>🌱 Tree is empty. Insert nodes to begin neural construction!</span>
              </div>
            )}
          </div>

          {/* In-Order Traversal Output Strip */}
          <div className="bst-inorder-strip">
            <span className="bst-inorder-label">IN-ORDER TRAVERSAL (SORTED):</span>
            <span className="bst-inorder-stream">
              {bstInorder(root).join("  →  ") || "— None —"}
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="game-sidebar">
        <div className="sidebar-card">
          <div className="sidebar-label">TREE METRICS</div>
          <div className="sidebar-stat-pair">
            <div className="sidebar-stat-box">
              <span className="stat-label">NODES</span>
              <span className="stat-val stat-val--cyan">{insertedList.length}</span>
            </div>
            <div className="sidebar-stat-box">
              <span className="stat-label">HEIGHT</span>
              <span className="stat-val stat-val--gold">{bstHeight(root)}</span>
            </div>
          </div>
        </div>

        <div className="sidebar-card">
          <div className="sidebar-label">DIRECTIVE</div>
          <p className="sidebar-desc">
            Insert 5+ distinct nodes to master the Binary Search Tree and unlock the <b style={{ color: "var(--mint)" }}>Tree Whisperer</b> trophy!
          </p>
          <div className="bst-goal-progress">
            Progress: {Math.min(5, insertedList.length)} / 5 Nodes
          </div>
        </div>

        <button
          className="btn btn--secondary btn-sm sidebar-reset-btn"
          onClick={() => { setRoot(null); setInsertedList([]); setSearchPath([]); setCleared(false); }}
        >
          ↺ Clear Tree
        </button>
      </aside>
    </div>
  );
}

// =============================================================================
// 6. STACK & QUEUE BOSS
// =============================================================================
function StackBossGame() {
  const { onComplete, onMistake, isBlocked } = useGameModal();
  const [stackData, setStackData] = useState<string[]>(["KERNEL", "SYS_INIT", "AUTH"]);
  const [queueData, setQueueData] = useState<string[]>(["PACKET_01", "PACKET_02"]);
  const [stackInput, setStackInput] = useState("");
  const [queueInput, setQueueInput] = useState("");
  const [pushes, setPushes] = useState(0);
  const [deqs, setDeqs] = useState(0);
  const [cleared, setCleared] = useState(false);

  function pushStack() {
    if (isBlocked || !stackInput.trim()) return;
    setStackData((prev) => [...prev, stackInput.trim().toUpperCase()]);
    setStackInput("");
    const newPushes = pushes + 1;
    setPushes(newPushes);

    if (newPushes >= 5 && !cleared) {
      setCleared(true);
      onComplete();
    }
  }

  function popStack() {
    if (isBlocked) return;
    if (stackData.length === 0) {
      onMistake();
      return;
    }
    setStackData((prev) => prev.slice(0, -1));
  }

  function enqueueQueue() {
    if (isBlocked || !queueInput.trim()) return;
    setQueueData((prev) => [...prev, queueInput.trim().toUpperCase()]);
    setQueueInput("");
  }

  function dequeueQueue() {
    if (isBlocked) return;
    if (queueData.length === 0) {
      onMistake();
      return;
    }
    setQueueData((prev) => prev.slice(1));
    const newDeqs = deqs + 1;
    setDeqs(newDeqs);

    if (newDeqs >= 5 && !cleared) {
      setCleared(true);
      onComplete();
    }
  }

  return (
    <div className="game-card">
      <div className="game-card__header">
        <div>
          <span className="game-card__badge">FINAL BOSS CONSTRUCT // LIFO vs FIFO</span>
          <h3 className="game-card__title">📚 Stack &amp; Queue Arena</h3>
        </div>
        <div className="boss-meter-wrap">
          <span className="boss-meter-label">BOSS STABILITY:</span>
          <div className="boss-meter-bar">
            <div
              className="boss-meter-fill"
              style={{
                width: `${Math.max(0, 100 - (pushes + deqs) * 10)}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="boss-arena-grid">
        {/* STACK CHAMBER */}
        <div className="card boss-sub-card">
          <div className="boss-card-top">
            <h4 className="boss-card-title">📚 THE STACK (LIFO)</h4>
            <span className="boss-card-tag">Last-In, First-Out</span>
          </div>

          <div className="boss-input-row">
            <input
              type="text"
              placeholder="Item name..."
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pushStack()}
              className="boss-input"
            />
            <button className="btn btn--primary btn-sm" onClick={pushStack}>
              + Push
            </button>
            <button className="btn btn--secondary btn-sm" onClick={popStack}>
              - Pop
            </button>
          </div>

          {/* Vertical Stack Elevator Shaft */}
          <div className="stack-shaft-box">
            <span className="stack-shaft-top-pointer">▼ TOP OF STACK</span>
            <div className="stack-items-stack">
              {stackData.length > 0 ? (
                stackData.slice().reverse().map((item, i) => (
                  <div
                    key={i}
                    className={`stack-chamber-item ${i === 0 ? "stack-chamber-item--top" : ""}`}
                  >
                    <span>{item}</span>
                    {i === 0 && <span className="top-badge">TOP</span>}
                  </div>
                ))
              ) : (
                <div className="empty-chamber-msg">Empty stack (Stack Underflow on pop)</div>
              )}
            </div>
          </div>

          <div className="boss-objective-sub">
            Stack Objective: <b>{pushes}/5 Pushes</b> to earn <b>Stack Overflow</b>
          </div>
        </div>

        {/* QUEUE CONVEYOR */}
        <div className="card boss-sub-card">
          <div className="boss-card-top">
            <h4 className="boss-card-title">🚶 THE QUEUE (FIFO)</h4>
            <span className="boss-card-tag">First-In, First-Out</span>
          </div>

          <div className="boss-input-row">
            <input
              type="text"
              placeholder="Packet name..."
              value={queueInput}
              onChange={(e) => setQueueInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enqueueQueue()}
              className="boss-input"
            />
            <button className="btn btn--primary btn-sm" onClick={enqueueQueue}>
              + Enqueue
            </button>
            <button className="btn btn--secondary btn-sm" onClick={dequeueQueue}>
              - Dequeue
            </button>
          </div>

          {/* Horizontal Queue Conveyor */}
          <div className="queue-conveyor-box">
            <div className="queue-conveyor-arrows">
              <span>← FRONT (DEQUEUE)</span>
              <span>REAR (ENQUEUE) ←</span>
            </div>
            <div className="queue-items-conveyor">
              {queueData.length > 0 ? (
                queueData.map((item, i) => (
                  <div
                    key={i}
                    className={`queue-conveyor-item ${
                      i === 0 ? "queue-conveyor-item--front" : i === queueData.length - 1 ? "queue-conveyor-item--rear" : ""
                    }`}
                  >
                    <span className="queue-item-name">{item}</span>
                    <span className="queue-item-pos">
                      {i === 0 ? "FRONT" : i === queueData.length - 1 ? "REAR" : `#${i + 1}`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty-chamber-msg">Empty queue (Queue Underflow on dequeue)</div>
              )}
            </div>
          </div>

          <div className="boss-objective-sub">
            Queue Objective: <b>{deqs}/5 Dequeues</b> to earn <b>Queue Master</b>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN QUEST MODAL WRAPPER
// =============================================================================
export function QuestModal({
  questId: initialQuestId,
  onClose,
}: {
  questId: string;
  onClose: () => void;
}) {
  const [currentQuestId, setCurrentQuestId] = useState(initialQuestId);
  const quest = QUEST_CONFIG.find((q) => q.id === currentQuestId);
  const minTimeSecs = quest?.minTimeSecs ?? 10;

  // ESC key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function renderGame() {
    switch (currentQuestId) {
      case "syntax-dungeon":
        return <SyntaxDungeonGame />;
      case "exec-arena":
        return <ExecutionArenaGame />;
      case "sort-arena":
        return <SortArenaGame />;
      case "hanoi":
        return <TowerOfHanoiGame />;
      case "bst":
        return <BinarySearchTreeGame />;
      case "stack-boss":
        return <StackBossGame />;
      default:
        return <div>Quest module not found.</div>;
    }
  }

  return (
    <div className="quest-modal-overlay" role="dialog" aria-modal="true">
      <div className="quest-modal-inner">
        {/* Modal Header */}
        <div className="quest-modal-header">
          <div className="quest-modal-header__info">
            <span className="quest-modal-header__icon">{quest?.icon || "⚔"}</span>
            <div>
              <div className="quest-modal-header__meta-row">
                <span className={`quest-badge quest-badge--${quest?.difficulty.toLowerCase()}`}>
                  {quest?.difficulty}
                </span>
                <span className="quest-modal-header__meta">
                  +{quest?.baseXp} XP · Min {quest?.minTimeSecs}s
                </span>
              </div>
              <h2 className="quest-modal-header__title">
                {quest?.name || "QUEST MISSION"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn--secondary btn-sm"
            aria-label="Close quest modal"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Game Body with Adapter */}
        <GameModalAdapter
          questId={currentQuestId}
          minTimeSecs={minTimeSecs}
          onNextQuest={(nextId) => setCurrentQuestId(nextId)}
          onClose={onClose}
        >
          {renderGame()}
        </GameModalAdapter>
      </div>
    </div>
  );
}
