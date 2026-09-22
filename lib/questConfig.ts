// lib/questConfig.ts
// Static quest metadata used by both the page and GameModalAdapter.
// Keep in sync with migrations/001_initial_schema.sql seed data.

export interface QuestConfig {
  id:          string;
  name:        string;
  icon:        string;
  difficulty:  "EASY" | "MEDIUM" | "HARD" | "BOSS";
  baseXp:      number;
  minTimeSecs: number;
  description: string;
}

export const QUEST_CONFIG: QuestConfig[] = [
  {
    id:          "syntax-dungeon",
    name:        "Syntax Dungeon",
    icon:        "🐛",
    difficulty:  "EASY",
    baseXp:      30,
    minTimeSecs: 10,
    description: "Hunt syntax errors in spooky dungeon code. Fix the bugs to escape!",
  },
  {
    id:          "exec-arena",
    name:        "Execution Arena",
    icon:        "⚡",
    difficulty:  "MEDIUM",
    baseXp:      20,
    minTimeSecs: 15,
    description: "Step through code execution line by line. Predict the output to win.",
  },
  {
    id:          "sort-arena",
    name:        "Sort Arena",
    icon:        "🫧",
    difficulty:  "MEDIUM",
    baseXp:      40,
    minTimeSecs: 8,
    description: "Visualise Bubble Sort in action. Guide the algorithm to victory!",
  },
  {
    id:          "hanoi",
    name:        "Tower of Hanoi",
    icon:        "🏰",
    difficulty:  "HARD",
    baseXp:      50,
    minTimeSecs: 20,
    description: "Move the discs. Recurse wisely. Conquer the ancient puzzle.",
  },
  {
    id:          "bst",
    name:        "Binary Search Tree",
    icon:        "🌳",
    difficulty:  "HARD",
    baseXp:      60,
    minTimeSecs: 12,
    description: "Insert nodes and traverse the BST to unlock the tree-whisperer badge.",
  },
  {
    id:          "stack-boss",
    name:        "Stack Boss",
    icon:        "📚",
    difficulty:  "BOSS",
    baseXp:      35,
    minTimeSecs: 10,
    description: "Push, pop, enqueue, dequeue. Master the Stack and Queue to claim victory.",
  },
];
