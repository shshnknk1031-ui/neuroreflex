/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameMode, GameSettings, GameTarget, HitRecord, RoundStats, TargetType, DirectionKey, KeyLayout } from '../types/game';
import { sound } from './audio';

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface EngineCallbacks {
  onScoreUpdate: (score: number, combo: number, accuracy: number, liveReactionMs: number) => void;
  onTimeUpdate: (timeLeftSec: number, progressPct: number) => void;
  onRoundComplete: (stats: RoundStats) => void;
  onRawReflexStep?: (state: 'waiting' | 'ready' | 'result' | 'false_start', ms?: number, trial?: number) => void;
  onKeyPressed?: (key: string) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: GameSettings;
  private mode: GameMode;
  private callbacks: EngineCallbacks;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Round metrics
  private roundStartTime: number = 0;
  private roundDurationSec: number = 45;
  private currentScore: number = 0;
  private currentCombo: number = 0;
  private maxCombo: number = 0;
  private targetsSpawned: number = 0;
  private targetsHit: number = 0;
  private targetsMissed: number = 0;
  private decoysAvoided: number = 0;
  private decoysHit: number = 0;
  private hitRecords: HitRecord[] = [];

  // Entities
  private targets: GameTarget[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private targetIdCounter: number = 0;
  private floatingIdCounter: number = 0;

  // Screen shake & hitstop
  private shakeTrauma: number = 0;
  private hitstopUntil: number = 0;

  // Keyboard Crosshair Navigation
  private cursorX: number = 400;
  private cursorY: number = 300;
  private cursorVx: number = 0;
  private cursorVy: number = 0;

  // Mouse & Reticle
  private mouseX: number = -100;
  private mouseY: number = -100;
  private isMouseDown: boolean = false;
  private heldKeys: Set<string> = new Set();

  // Spawning controls
  private nextSpawnTime: number = 0;
  private maxConcurrentTargets: number = 2;

  // Raw Reflex Bench specific state
  private rawBenchState: 'waiting' | 'ready' | 'result' | 'false_start' = 'waiting';
  private rawBenchTriggerTime: number = 0;
  private rawBenchTrialIndex: number = 0;
  private rawBenchTrials: number[] = [];
  private rawBenchNextTrialTime: number = 0;

  constructor(canvas: HTMLCanvasElement, mode: GameMode, settings: GameSettings, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2d context');
    this.ctx = context;
    this.mode = mode;
    this.settings = settings;
    this.callbacks = callbacks;
    this.roundDurationSec = settings.roundDuration;

    this.setupResize();
    this.cursorX = this.canvas.clientWidth / 2;
    this.cursorY = this.canvas.clientHeight / 2;
    this.bindEvents();
  }

  public updateSettings(newSettings: GameSettings) {
    this.settings = newSettings;
    this.roundDurationSec = newSettings.roundDuration;
  }

  public setMode(mode: GameMode) {
    this.mode = mode;
  }

  private setupResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  public handleResize() {
    this.setupResize();
  }

  private bindEvents() {
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  private handleBlur = () => {
    this.heldKeys.clear();
    this.isMouseDown = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0 || !this.isRunning || this.isPaused) return;
    this.isMouseDown = true;
    const now = performance.now();

    if (this.mode === 'RAW_REFLEX_BENCH') {
      this.handleRawReflexInput(now);
      return;
    }

    // Mouse fallback click
    this.processPlayerActionAt(this.mouseX, this.mouseY, now, null);
  };

  private handleMouseUp = () => {
    this.isMouseDown = false;
  };

  private normalizeKey(rawKey: string): string {
    const k = rawKey.toUpperCase();
    if (k === ' ' || k === 'SPACE') return 'SPACE';
    if (k === 'ARROWUP' || k === 'UP') return 'UP';
    if (k === 'ARROWDOWN' || k === 'DOWN') return 'DOWN';
    if (k === 'ARROWLEFT' || k === 'LEFT') return 'LEFT';
    if (k === 'ARROWRIGHT' || k === 'RIGHT') return 'RIGHT';
    return k;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.isRunning || this.isPaused) return;

    // Ignore system shortcut combos
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') return; // Handled by App.tsx

    const normalized = this.normalizeKey(e.key);
    this.heldKeys.add(normalized);
    this.callbacks.onKeyPressed?.(normalized);

    const now = performance.now();

    // Mode: Raw Reflex Bench
    if (this.mode === 'RAW_REFLEX_BENCH') {
      e.preventDefault();
      this.handleRawReflexInput(now);
      return;
    }

    // Keyboard Control Mode: Direct Key Reflex (Default primary mode)
    if (this.settings.keyboardControlMode === 'direct_keys') {
      e.preventDefault();
      this.processDirectKeyStrike(normalized, now);
      return;
    }

    // Keyboard Control Mode: Cursor Navigation (WASD / Arrows to move, Space/J/Enter to fire)
    if (this.settings.keyboardControlMode === 'cursor_nav') {
      if (normalized === 'SPACE' || normalized === 'J' || normalized === 'ENTER') {
        e.preventDefault();
        this.processPlayerActionAt(this.cursorX, this.cursorY, now, null);
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const normalized = this.normalizeKey(e.key);
    this.heldKeys.delete(normalized);
  };

  // Direct Key Strike execution (targets are mapped 1-to-1 to keyboard keys)
  private processDirectKeyStrike(pressedKey: string, now: number) {
    // Find active targets that match the pressed key
    const matchingIndices: number[] = [];
    for (let i = 0; i < this.targets.length; i++) {
      const t = this.targets[i];
      if (t.active && t.assignedKey === pressedKey) {
        matchingIndices.push(i);
      }
    }

    if (matchingIndices.length > 0) {
      // Pick the most urgent target (closest to expiring or highest progress)
      matchingIndices.sort((a, b) => this.targets[b].createdAt - this.targets[a].createdAt);
      const targetIndex = matchingIndices[0];
      const target = this.targets[targetIndex];

      const reactionTime = Math.max(10, Math.round(now - target.createdAt));
      const ageProgress = Math.min(1, (now - target.createdAt) / target.lifespan);

      // Decoy trap check
      if (target.type === 'decoy') {
        target.active = false;
        this.decoysHit++;
        this.currentCombo = 0;
        this.currentScore = Math.max(0, this.currentScore - 300);
        this.shakeTrauma = 0.6;
        sound.playDecoyHit();
        this.createExplosion(target.x, target.y, '#ef4444', 30);
        this.addFloatingText(`警戒陷阱 [${target.displayKey}]! -300`, target.x, target.y, '#ef4444', 1.2);
        this.notifyHUD();
        return;
      }

      // Successful keypress hit!
      target.active = false;
      this.targetsHit++;
      this.currentCombo++;
      if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo;
      }

      // Evaluate timing convergence accuracy
      // Optimal sweet spot is between 0.40 and 0.85 of lifespan
      const timingAccuracy = 1 - Math.abs(ageProgress - 0.7) / 0.7;
      const isFast = reactionTime < 250;
      const isPerfect = timingAccuracy > 0.75 || isFast;

      let baseScore = 120;
      if (isFast) baseScore += 60;
      if (isPerfect) baseScore += 50;

      const comboMultiplier = 1 + Math.min(2.5, (this.currentCombo - 1) * 0.12);
      const earnedScore = Math.round(baseScore * comboMultiplier);
      this.currentScore += earnedScore;

      // Hitstop & Shake
      if (isPerfect) {
        this.hitstopUntil = now + 40;
        this.shakeTrauma = Math.min(0.7, this.shakeTrauma + 0.35);
      } else {
        this.shakeTrauma = Math.min(0.4, this.shakeTrauma + 0.15);
      }

      sound.playHit(this.currentCombo, isPerfect);

      // Record hit
      const record: HitRecord = {
        timestamp: now,
        reactionTimeMs: reactionTime,
        distanceFromCenter: Math.round((1 - Math.max(0, timingAccuracy)) * target.radius * 0.6),
        normalizedAccuracy: Math.max(0.2, timingAccuracy),
        scoreEarned: earnedScore,
        isPerfect,
        targetType: target.type,
        directionCorrect: true,
      };
      this.hitRecords.push(record);

      const label = isPerfect 
        ? `PERFECT! [${target.displayKey}] ${reactionTime}ms` 
        : `HIT! [${target.displayKey}] +${earnedScore} (${reactionTime}ms)`;
      const color = isPerfect ? '#38bdf8' : '#34d399';

      this.addFloatingText(label, target.x, target.y - 12, color, isPerfect ? 1.3 : 1.0);
      this.createExplosion(target.x, target.y, isPerfect ? '#38bdf8' : target.color, isPerfect ? 35 : 22);

      this.notifyHUD();
    } else {
      // Pressed a key that has no active target on screen
      if (this.currentCombo > 0) {
        this.currentCombo = 0;
        sound.playMiss();
        this.addFloatingText(`未命中 [${pressedKey}]`, this.cursorX, this.cursorY, '#94a3b8', 0.85);
        this.notifyHUD();
      }
    }
  }

  // Positional click/fire action (for cursor navigation or mouse click)
  private processPlayerActionAt(x: number, y: number, now: number, keyTriggered: DirectionKey | null) {
    let targetHitIndex = -1;
    let closestDist = Infinity;
    let isHit = false;

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (!t.active) continue;

      const dx = x - t.x;
      const dy = y - t.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= t.radius) {
        if (dist < closestDist) {
          closestDist = dist;
          targetHitIndex = i;
          isHit = true;
        }
      }
    }

    if (isHit && targetHitIndex >= 0) {
      const target = this.targets[targetHitIndex];
      const reactionTime = Math.max(10, Math.round(now - target.createdAt));
      const dist = closestDist;
      const normalizedAcc = Math.max(0, 1 - dist / target.radius);

      if (target.type === 'decoy') {
        target.active = false;
        this.decoysHit++;
        this.currentCombo = 0;
        this.currentScore = Math.max(0, this.currentScore - 300);
        this.shakeTrauma = 0.6;
        sound.playDecoyHit();
        this.createExplosion(target.x, target.y, '#ef4444', 30);
        this.addFloatingText('警戒陷阱! -300', target.x, target.y, '#ef4444', 1.2);
        this.notifyHUD();
        return;
      }

      target.active = false;
      this.targetsHit++;
      this.currentCombo++;
      if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo;
      }

      const isBullseye = dist <= target.radius * 0.35;
      const isFast = reactionTime < 240;
      const isPerfect = isBullseye || (normalizedAcc > 0.85 && isFast);

      let baseScore = 100;
      if (isBullseye) baseScore += 50;
      if (isFast) baseScore += 50;
      const comboMultiplier = 1 + Math.min(2.0, (this.currentCombo - 1) * 0.1);
      const earnedScore = Math.round(baseScore * comboMultiplier);
      this.currentScore += earnedScore;

      if (isPerfect) {
        this.hitstopUntil = now + 40;
        this.shakeTrauma = Math.min(0.7, this.shakeTrauma + 0.35);
      } else {
        this.shakeTrauma = Math.min(0.4, this.shakeTrauma + 0.15);
      }

      sound.playHit(this.currentCombo, isPerfect);

      const record: HitRecord = {
        timestamp: now,
        reactionTimeMs: reactionTime,
        distanceFromCenter: dist,
        normalizedAccuracy: normalizedAcc,
        scoreEarned: earnedScore,
        isPerfect,
        targetType: target.type,
        directionCorrect: true,
      };
      this.hitRecords.push(record);

      const text = isPerfect 
        ? `PERFECT! ${reactionTime}ms` 
        : isBullseye 
          ? `BULLSEYE! +${earnedScore}` 
          : `HIT +${earnedScore} (${reactionTime}ms)`;
      const textColor = isPerfect ? '#38bdf8' : isBullseye ? '#34d399' : '#facc15';

      this.addFloatingText(text, target.x, target.y - 10, textColor, isPerfect ? 1.3 : 1.0);
      this.createExplosion(target.x, target.y, isPerfect ? '#38bdf8' : target.color, isPerfect ? 35 : 22);

      this.notifyHUD();
    } else {
      if (this.currentCombo > 0) {
        this.currentCombo = 0;
        sound.playMiss();
        this.addFloatingText('MISS', x, y, '#94a3b8', 0.9);
        this.notifyHUD();
      }
    }
  }

  private addFloatingText(text: string, x: number, y: number, color: string, scale: number) {
    this.floatingTexts.push({
      id: ++this.floatingIdCounter,
      text,
      x,
      y,
      color,
      alpha: 1.0,
      scale,
      vy: -1.6,
    });
  }

  private createExplosion(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1.5 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3.5,
        color,
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.025,
      });
    }
  }

  // Raw Reflex Bench Flow
  private handleRawReflexInput(now: number) {
    if (this.rawBenchState === 'waiting') {
      this.rawBenchState = 'false_start';
      sound.playDecoyHit();
      this.shakeTrauma = 0.5;
      this.callbacks.onRawReflexStep?.('false_start', undefined, this.rawBenchTrialIndex + 1);
      this.rawBenchNextTrialTime = now + 1200;
    } else if (this.rawBenchState === 'ready') {
      const reactionMs = Math.round(now - this.rawBenchTriggerTime);
      this.rawBenchTrials.push(reactionMs);
      this.rawBenchState = 'result';
      sound.playHit(this.rawBenchTrials.length, reactionMs < 200);
      this.callbacks.onRawReflexStep?.('result', reactionMs, this.rawBenchTrialIndex + 1);

      this.rawBenchTrialIndex++;
      if (this.rawBenchTrialIndex >= 5) {
        setTimeout(() => this.finishRound(), 1000);
      } else {
        this.rawBenchNextTrialTime = now + 1600;
      }
    }
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.currentScore = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.targetsSpawned = 0;
    this.targetsHit = 0;
    this.targetsMissed = 0;
    this.decoysAvoided = 0;
    this.decoysHit = 0;
    this.hitRecords = [];
    this.targets = [];
    this.particles = [];
    this.floatingTexts = [];
    this.shakeTrauma = 0;
    this.hitstopUntil = 0;

    this.cursorX = this.canvas.clientWidth / 2;
    this.cursorY = this.canvas.clientHeight / 2;
    this.cursorVx = 0;
    this.cursorVy = 0;

    const now = performance.now();
    this.lastTime = now;
    this.roundStartTime = now;
    this.nextSpawnTime = now + 200;

    if (this.mode === 'RAW_REFLEX_BENCH') {
      this.rawBenchTrialIndex = 0;
      this.rawBenchTrials = [];
      this.prepareNextRawBenchTrial(now);
    }

    this.loop(now);
  }

  private prepareNextRawBenchTrial(now: number) {
    this.rawBenchState = 'waiting';
    this.callbacks.onRawReflexStep?.('waiting', undefined, this.rawBenchTrialIndex + 1);
    const randomDelay = 1500 + Math.random() * 2300;
    this.rawBenchNextTrialTime = now + randomDelay;
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  private notifyHUD() {
    const totalAttempts = this.targetsHit + this.targetsMissed;
    const accuracy = totalAttempts > 0 ? (this.targetsHit / totalAttempts) * 100 : 100;
    const recentHits = this.hitRecords.slice(-5);
    const avgRecent = recentHits.length > 0 
      ? Math.round(recentHits.reduce((acc, h) => acc + h.reactionTimeMs, 0) / recentHits.length)
      : 0;

    this.callbacks.onScoreUpdate(this.currentScore, this.currentCombo, accuracy, avgRecent);
  }

  // Key Pool definition based on user's layout selection
  private getAvailableKeyPool(): Array<{ key: string; display: string }> {
    const layout = this.settings.keyLayout || 'full';
    if (layout === 'wasd_only') {
      return [
        { key: 'W', display: 'W' },
        { key: 'A', display: 'A' },
        { key: 'S', display: 'S' },
        { key: 'D', display: 'D' },
        { key: 'SPACE', display: 'SPC' },
      ];
    } else if (layout === 'arrows_wasd') {
      return [
        { key: 'W', display: 'W' },
        { key: 'A', display: 'A' },
        { key: 'S', display: 'S' },
        { key: 'D', display: 'D' },
        { key: 'UP', display: '↑' },
        { key: 'DOWN', display: '↓' },
        { key: 'LEFT', display: '←' },
        { key: 'RIGHT', display: '→' },
        { key: 'SPACE', display: 'SPC' },
      ];
    }
    // Full keyboard layout (Left WASD + Right JKL + Space)
    return [
      { key: 'W', display: 'W' },
      { key: 'A', display: 'A' },
      { key: 'S', display: 'S' },
      { key: 'D', display: 'D' },
      { key: 'J', display: 'J' },
      { key: 'K', display: 'K' },
      { key: 'L', display: 'L' },
      { key: 'I', display: 'I' },
      { key: 'SPACE', display: 'SPC' },
    ];
  }

  private spawnTarget(now: number) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const marginX = 90;
    const marginTop = 130;
    const marginBottom = 90;

    const safeW = Math.max(200, width - marginX * 2);
    const safeH = Math.max(200, height - marginTop - marginBottom);

    const x = marginX + Math.random() * safeW;
    const y = marginTop + Math.random() * safeH;

    const baseRadius = 40 * this.settings.targetSizeMultiplier;
    let type: TargetType = 'standard';
    let lifespan = 1600; // ms
    let color = '#38bdf8'; // Cyan
    let vx = 0;
    let vy = 0;

    // Pick an assigned key that is NOT currently active on screen
    const keyPool = this.getAvailableKeyPool();
    const activeAssignedKeys = new Set(this.targets.filter((t) => t.active).map((t) => t.assignedKey));
    const availableKeys = keyPool.filter((k) => !activeAssignedKeys.has(k.key));

    const chosen = availableKeys.length > 0 
      ? availableKeys[Math.floor(Math.random() * availableKeys.length)]
      : keyPool[Math.floor(Math.random() * keyPool.length)];

    const assignedKey = chosen.key;
    const displayKey = chosen.display;

    // Mode-specific target generation
    if (this.mode === 'KINETIC_TRACKING') {
      type = 'kinetic';
      lifespan = 2500;
      color = '#a855f7'; // Purple
      const speed = 2.4 + Math.random() * 2.8;
      const angle = Math.random() * Math.PI * 2;
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed;
    } else if (this.mode === 'DUAL_COORDINATION') {
      type = 'directional';
      lifespan = 1900;
      color = '#10b981'; // Emerald
    } else if (this.settings.enableDecoys && Math.random() < 0.18) {
      type = 'decoy';
      lifespan = 1700;
      color = '#ef4444'; // Red hazard
    }

    this.targets.push({
      id: ++this.targetIdCounter,
      x,
      y,
      radius: baseRadius,
      baseRadius,
      createdAt: now,
      lifespan,
      type,
      color,
      assignedKey,
      displayKey,
      vx,
      vy,
      active: true,
    });

    this.targetsSpawned++;
  }

  private update(dt: number, now: number) {
    if (this.mode === 'RAW_REFLEX_BENCH') {
      if (this.rawBenchState === 'waiting' && now >= this.rawBenchNextTrialTime) {
        this.rawBenchState = 'ready';
        this.rawBenchTriggerTime = now;
        sound.playStimulusFlash();
        this.callbacks.onRawReflexStep?.('ready', undefined, this.rawBenchTrialIndex + 1);
      } else if (this.rawBenchState === 'false_start' && now >= this.rawBenchNextTrialTime) {
        this.prepareNextRawBenchTrial(now);
      } else if (this.rawBenchState === 'result' && now >= this.rawBenchNextTrialTime && this.rawBenchTrialIndex < 5) {
        this.prepareNextRawBenchTrial(now);
      }
      return;
    }

    // Timer progression
    const elapsedSec = (now - this.roundStartTime) / 1000;
    const timeLeft = Math.max(0, this.roundDurationSec - elapsedSec);
    const progress = Math.min(100, (elapsedSec / this.roundDurationSec) * 100);
    this.callbacks.onTimeUpdate(Math.ceil(timeLeft), progress);

    if (timeLeft <= 0) {
      this.finishRound();
      return;
    }

    // Keyboard crosshair movement in cursor_nav mode
    if (this.settings.keyboardControlMode === 'cursor_nav') {
      const speed = 720; // px/sec
      let moveX = 0;
      let moveY = 0;
      if (this.heldKeys.has('W') || this.heldKeys.has('UP')) moveY -= 1;
      if (this.heldKeys.has('S') || this.heldKeys.has('DOWN')) moveY += 1;
      if (this.heldKeys.has('A') || this.heldKeys.has('LEFT')) moveX -= 1;
      if (this.heldKeys.has('D') || this.heldKeys.has('RIGHT')) moveX += 1;

      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      this.cursorX += moveX * speed * dt;
      this.cursorY += moveY * speed * dt;

      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      this.cursorX = Math.max(30, Math.min(w - 30, this.cursorX));
      this.cursorY = Math.max(80, Math.min(h - 50, this.cursorY));
    }

    // Dynamic target spawning
    this.maxConcurrentTargets = this.mode === 'KINETIC_TRACKING' ? 3 : this.currentCombo > 8 ? 3 : 2;
    const activeTargets = this.targets.filter((t) => t.active);

    if (activeTargets.length < this.maxConcurrentTargets && now >= this.nextSpawnTime) {
      this.spawnTarget(now);
      const spawnInterval = Math.max(450, 1000 - Math.min(450, this.currentCombo * 35));
      this.nextSpawnTime = now + spawnInterval;
    }

    // Update targets
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (!t.active) continue;

      if (t.type === 'kinetic' && t.vx !== undefined && t.vy !== undefined) {
        t.x += t.vx;
        t.y += t.vy;

        const r = t.radius;
        if (t.x - r < 40) { t.x = 40 + r; t.vx = Math.abs(t.vx); }
        if (t.x + r > width - 40) { t.x = width - 40 - r; t.vx = -Math.abs(t.vx); }
        if (t.y - r < 100) { t.y = 100 + r; t.vy = Math.abs(t.vy); }
        if (t.y + r > height - 60) { t.y = height - 60 - r; t.vy = -Math.abs(t.vy); }
      }

      const age = now - t.createdAt;
      if (age >= t.lifespan) {
        t.active = false;
        if (t.type === 'decoy') {
          this.decoysAvoided++;
          this.currentScore += 60;
          this.addFloatingText('+60 避開陷阱', t.x, t.y, '#38bdf8', 0.9);
        } else {
          this.targetsMissed++;
          if (this.currentCombo > 0) {
            this.currentCombo = 0;
            sound.playMiss();
            this.addFloatingText(`逾時 [${t.displayKey}]`, t.x, t.y, '#94a3b8', 0.85);
          }
        }
        this.notifyHUD();
      }
    }

    if (this.targets.length > 30) {
      this.targets = this.targets.filter((t) => t.active);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.024;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 1.8);
  }

  private finishRound() {
    this.isRunning = false;
    sound.playRoundComplete();

    let avgReaction = 0;
    let bestReaction = 999;
    let stdDev = 0;

    if (this.mode === 'RAW_REFLEX_BENCH') {
      if (this.rawBenchTrials.length > 0) {
        avgReaction = Math.round(this.rawBenchTrials.reduce((a, b) => a + b, 0) / this.rawBenchTrials.length);
        bestReaction = Math.min(...this.rawBenchTrials);
        const variance = this.rawBenchTrials.reduce((acc, ms) => acc + Math.pow(ms - avgReaction, 2), 0) / this.rawBenchTrials.length;
        stdDev = Math.round(Math.sqrt(variance));
      }
    } else if (this.hitRecords.length > 0) {
      const sum = this.hitRecords.reduce((acc, h) => acc + h.reactionTimeMs, 0);
      avgReaction = Math.round(sum / this.hitRecords.length);
      bestReaction = Math.min(...this.hitRecords.map((h) => h.reactionTimeMs));

      const variance = this.hitRecords.reduce((acc, h) => acc + Math.pow(h.reactionTimeMs - avgReaction, 2), 0) / this.hitRecords.length;
      stdDev = Math.round(Math.sqrt(variance));
    }

    const totalValidTargets = this.targetsHit + this.targetsMissed;
    const accuracy = totalValidTargets > 0 ? (this.targetsHit / totalValidTargets) * 100 : 0;

    let coordinationIndex = 0;
    if (this.mode === 'RAW_REFLEX_BENCH') {
      coordinationIndex = Math.max(0, Math.min(1000, Math.round(1000 - (avgReaction - 160) * 3)));
    } else if (this.targetsHit > 0) {
      const speedScore = Math.max(0, 480 - avgReaction);
      const accuracyScore = accuracy * 4.5;
      const consistencyBonus = Math.max(0, 100 - stdDev * 0.8);
      coordinationIndex = Math.max(50, Math.min(1000, Math.round(speedScore + accuracyScore + consistencyBonus)));
    }

    let rating: 'S+' | 'S' | 'A' | 'B' | 'C' = 'C';
    let ratingTitle = '基礎訓練中 (Developing)';

    if (coordinationIndex >= 880 || (avgReaction < 200 && avgReaction > 0)) {
      rating = 'S+';
      ratingTitle = '⚡ 神經超載 (Godlike Reflex)';
    } else if (coordinationIndex >= 780 || (avgReaction < 235 && avgReaction > 0)) {
      rating = 'S';
      ratingTitle = '🎯 職業選手級 (Pro Gamer / Esports)';
    } else if (coordinationIndex >= 660 || (avgReaction < 275 && avgReaction > 0)) {
      rating = 'A';
      ratingTitle = '🏎️ 頂尖運動員級 (Elite Athlete)';
    } else if (coordinationIndex >= 520 || (avgReaction < 330 && avgReaction > 0)) {
      rating = 'B';
      ratingTitle = '🏃 優良反射 (Fast Reflex)';
    }

    const stats: RoundStats = {
      mode: this.mode,
      totalTargetsSpawned: this.targetsSpawned,
      targetsHit: this.targetsHit,
      targetsMissed: this.targetsMissed,
      decoysAvoided: this.decoysAvoided,
      decoysHit: this.decoysHit,
      avgReactionTimeMs: avgReaction,
      bestReactionTimeMs: bestReaction === 999 ? 0 : bestReaction,
      accuracyRate: Math.round(accuracy * 10) / 10,
      coordinationIndex,
      reactionStdDev: stdDev,
      finalScore: this.currentScore,
      maxCombo: this.maxCombo,
      hitRecords: this.hitRecords,
      rating,
      ratingTitle,
    };

    this.callbacks.onRoundComplete(stats);
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(rawDt, 0.05);

    if (!this.isPaused) {
      if (timestamp >= this.hitstopUntil) {
        this.update(dt, timestamp);
      }
    }

    this.render(timestamp);
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private render(now: number) {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    ctx.save();
    if (this.shakeTrauma > 0) {
      const shakeAmount = Math.pow(this.shakeTrauma, 2) * 16;
      const ox = (Math.random() - 0.5) * shakeAmount;
      const oy = (Math.random() - 0.5) * shakeAmount;
      ctx.translate(ox, oy);
    }

    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Subtle arena tactical grid
    ctx.save();
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    if (this.mode === 'RAW_REFLEX_BENCH') {
      this.renderRawReflexBench(ctx, width, height);
    } else {
      for (const target of this.targets) {
        if (!target.active) continue;
        this.renderTarget(ctx, target, now);
      }

      for (const p of this.particles) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      for (const ft of this.floatingTexts) {
        ctx.save();
        ctx.font = `700 ${Math.round(15 * ft.scale)}px 'Outfit', sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }

    // In cursor_nav mode, always render crosshair at cursorX/Y
    if (this.settings.keyboardControlMode === 'cursor_nav') {
      this.renderCrosshair(ctx, this.cursorX, this.cursorY);
    } else if (this.mouseX > 0 && this.mouseY > 0) {
      this.renderCrosshair(ctx, this.mouseX, this.mouseY);
    }

    ctx.restore();
  }

  private renderRawReflexBench(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.rawBenchState === 'ready') {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 48px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('立即按鍵！ / PRESS ANY KEY!', width / 2, height / 2 - 10);

      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f0fdf4';
      ctx.fillText('[ 空白鍵 / Space 或任意鍵立即擊發 ]', width / 2, height / 2 + 45);
    } else if (this.rawBenchState === 'waiting') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      const pulse = (Math.sin(performance.now() * 0.005) + 1) * 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 70 + pulse * 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 28px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('保持專注... 隨機信號準備中', width / 2, height / 2 - 20);

      ctx.font = '400 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`第 ${this.rawBenchTrialIndex + 1} / 5 次測試 · 綠屏亮起瞬間按下鍵盤任意鍵`, width / 2, height / 2 + 25);
      ctx.restore();
    } else if (this.rawBenchState === 'false_start') {
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#fecaca';
      ctx.font = '800 36px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('搶先違規！(FALSE START)', width / 2, height / 2 - 15);

      ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fee2e2';
      ctx.fillText('請等待綠色信號亮起再按鍵，即將重新準備...', width / 2, height / 2 + 30);
    } else if (this.rawBenchState === 'result') {
      const last = this.rawBenchTrials[this.rawBenchTrials.length - 1];
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 54px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${last} ms`, width / 2, height / 2 - 10);

      ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(last < 200 ? '⚡ 神人反應！' : last < 250 ? '🎯 頂尖水準' : '反應記錄完成', width / 2, height / 2 + 40);
    }
  }

  private renderTarget(ctx: CanvasRenderingContext2D, target: GameTarget, now: number) {
    const age = now - target.createdAt;
    const progress = Math.min(1, age / target.lifespan);

    ctx.save();
    ctx.translate(target.x, target.y);

    const isDirectKeyMode = this.settings.keyboardControlMode === 'direct_keys';
    const keyLabel = target.displayKey || 'SPC';

    if (target.type === 'decoy') {
      // Hazardous Decoy Target
      const pulse = Math.sin(now * 0.015) * 4;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, target.radius + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
      ctx.fill();

      // Stylized Hazard Keycap Badge
      const capW = 38;
      const capH = 34;
      ctx.fillStyle = '#450a0a';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-capW / 2, -capH / 2, capW, capH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.font = '800 16px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`✖ ${keyLabel}`, 0, 0);

      ctx.fillStyle = '#ef4444';
      ctx.font = '700 10px "Outfit", sans-serif';
      ctx.fillText('勿按 / NO PRESS', 0, target.radius + 18);
    } else {
      // Standard / Kinetic / Directional Keyboard Target
      const isKinetic = target.type === 'kinetic';
      const baseColor = isKinetic ? '#a855f7' : target.color || '#38bdf8';

      // Outer Glow & Base Disk
      ctx.fillStyle = isKinetic ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)';
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Middle concentric ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, target.radius * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // Stylized Mechanical Keycap Plate in Center
      const capW = keyLabel.length > 2 ? 46 : 36;
      const capH = 34;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-capW / 2, -capH / 2, capW, capH, 7);
      ctx.fill();
      ctx.stroke();

      // Inner Keycap Bevel
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-capW / 2 + 2, -capH / 2 + 2, capW - 4, capH - 4, 5);
      ctx.stroke();

      // Bold Keyboard Key Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${keyLabel.length > 2 ? 14 : 18}px "Outfit", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(keyLabel, 0, 0);

      // Timing convergence ring (converging toward keycap border)
      const shrinkRadius = target.radius + (1 - progress) * target.radius * 1.4;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + (1 - progress) * 0.45})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, shrinkRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Kinetic velocity trace vector
      if (isKinetic && target.vx !== undefined && target.vy !== undefined) {
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-target.vx * 14, -target.vy * 14);
        ctx.stroke();
      }

      // Small key prompt label beneath target
      if (isDirectKeyMode) {
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`[ 按鍵 ${keyLabel} ]`, 0, target.radius + 17);
      }
    }

    ctx.restore();
  }

  private renderCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = this.settings.crosshairColor || '#38bdf8';
    ctx.fillStyle = this.settings.crosshairColor || '#38bdf8';
    ctx.lineWidth = 1.8;

    const style = this.settings.crosshairStyle;

    if (style === 'dot') {
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'tactical') {
      const gap = 6;
      const len = 9;
      ctx.strokeRect(-gap - len, -gap - len, len, len);
      ctx.strokeRect(gap, -gap - len, len, len);
      ctx.strokeRect(-gap - len, gap, len, len);
      ctx.strokeRect(gap, gap, len, len);
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const sz = 13;
      const gap = 4;
      ctx.beginPath();
      ctx.moveTo(-sz, 0);
      ctx.lineTo(-gap, 0);
      ctx.moveTo(gap, 0);
      ctx.lineTo(sz, 0);
      ctx.moveTo(0, -sz);
      ctx.lineTo(0, -gap);
      ctx.moveTo(0, gap);
      ctx.lineTo(0, sz);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
