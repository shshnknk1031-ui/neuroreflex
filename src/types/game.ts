/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'TITLE_MENU' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY';

export type GameMode = 
  | 'PRECISION_STRIKE'     // 綜合精準度與反應時間 (Aim & Reaction)
  | 'KINETIC_TRACKING'     // 動態軌跡追蹤與高速攔截 (Kinetic Intercept)
  | 'DUAL_COORDINATION'    // 雙腦鍵鼠多維協調 (WASD + Aim)
  | 'RAW_REFLEX_BENCH';    // 瞬間生理反應測速 (Raw Reflex Bench)

export type CrosshairStyle = 'cross' | 'dot' | 'circle' | 'tactical';

export type KeyboardControlMode = 'direct_keys' | 'cursor_nav';

export type KeyLayout = 'full' | 'wasd_only' | 'arrows_wasd';

export interface GameSettings {
  crosshairStyle: CrosshairStyle;
  crosshairColor: string;
  soundVolume: number;
  soundMuted: boolean;
  roundDuration: number; // in seconds, e.g. 45
  targetSizeMultiplier: number; // 0.8 to 1.3
  enableDecoys: boolean; // Go/No-Go targets
  keyboardControlMode: KeyboardControlMode; // 'direct_keys' or 'cursor_nav'
  keyLayout: KeyLayout;
}

export type TargetType = 'standard' | 'kinetic' | 'decoy' | 'directional';

export type DirectionKey = 'W' | 'A' | 'S' | 'D' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface GameTarget {
  id: number;
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  createdAt: number;
  lifespan: number;       // total duration in ms
  type: TargetType;
  color: string;
  assignedKey?: string;   // e.g. 'W', 'A', 'S', 'D', 'J', 'K', 'L', 'SPACE'
  displayKey?: string;    // e.g. 'W', 'A', 'S', 'D', 'J', 'K', 'L', 'SPC', '↑', '↓', '←', '→'
  vx?: number;            // velocity for kinetic targets
  vy?: number;
  directionRequired?: DirectionKey; // for dual coordination
  hit?: boolean;
  active: boolean;
}

export interface HitRecord {
  timestamp: number;
  reactionTimeMs: number;
  distanceFromCenter: number; // in pixels
  normalizedAccuracy: number; // 0 to 1
  scoreEarned: number;
  isPerfect: boolean;
  targetType: TargetType;
  directionCorrect?: boolean;
}

export interface RoundStats {
  mode: GameMode;
  totalTargetsSpawned: number;
  targetsHit: number;
  targetsMissed: number;
  decoysAvoided: number;
  decoysHit: number;
  avgReactionTimeMs: number;
  bestReactionTimeMs: number;
  accuracyRate: number; // 0 - 100%
  coordinationIndex: number; // 0 - 1000
  reactionStdDev: number;
  finalScore: number;
  maxCombo: number;
  hitRecords: HitRecord[];
  rating: 'S+' | 'S' | 'A' | 'B' | 'C';
  ratingTitle: string;
}

export interface ModeRecord {
  highScore: number;
  bestAvgReactionMs: number;
  bestAccuracy: number;
  gamesPlayed: number;
}
