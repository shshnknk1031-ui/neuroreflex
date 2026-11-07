/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, GameSettings, GameState, ModeRecord, RoundStats, CrosshairStyle } from './types/game';
import { GameEngine } from './game/engine';
import { sound } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { PauseModal } from './components/PauseModal';
import { SummaryModal } from './components/SummaryModal';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_SETTINGS: GameSettings = {
  crosshairStyle: 'tactical',
  crosshairColor: '#38bdf8',
  soundVolume: 0.6,
  soundMuted: false,
  roundDuration: 45,
  targetSizeMultiplier: 1.0,
  enableDecoys: true,
  keyboardControlMode: 'direct_keys',
  keyLayout: 'full',
};

const DEFAULT_RECORDS: Record<GameMode, ModeRecord> = {
  PRECISION_STRIKE: { highScore: 0, bestAvgReactionMs: 0, bestAccuracy: 0, gamesPlayed: 0 },
  KINETIC_TRACKING: { highScore: 0, bestAvgReactionMs: 0, bestAccuracy: 0, gamesPlayed: 0 },
  DUAL_COORDINATION: { highScore: 0, bestAvgReactionMs: 0, bestAccuracy: 0, gamesPlayed: 0 },
  RAW_REFLEX_BENCH: { highScore: 0, bestAvgReactionMs: 0, bestAccuracy: 0, gamesPlayed: 0 },
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [currentMode, setCurrentMode] = useState<GameMode>('PRECISION_STRIKE');
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('neuroreflex_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [records, setRecords] = useState<Record<GameMode, ModeRecord>>(() => {
    try {
      const saved = localStorage.getItem('neuroreflex_records');
      return saved ? { ...DEFAULT_RECORDS, ...JSON.parse(saved) } : DEFAULT_RECORDS;
    } catch {
      return DEFAULT_RECORDS;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number | string>(3);

  // Live HUD States
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [liveReactionMs, setLiveReactionMs] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(45);
  const [timeProgressPct, setTimeProgressPct] = useState(0);
  const [rawBenchStep, setRawBenchStep] = useState<{
    state: 'waiting' | 'ready' | 'result' | 'false_start';
    ms?: number;
    trial?: number;
  }>({ state: 'waiting', trial: 1 });

  // Finished stats
  const [summaryStats, setSummaryStats] = useState<RoundStats | null>(null);

  // Canvas & Engine refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Save settings
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('neuroreflex_settings', JSON.stringify(newSettings));
    } catch {}
    if (engineRef.current) {
      engineRef.current.updateSettings(newSettings);
    }
  };

  const handleToggleMute = useCallback(() => {
    const next = sound.toggleMute();
    handleUpdateSettings({ ...settings, soundMuted: next });
  }, [settings]);

  const handleChangeCrosshair = () => {
    const list: CrosshairStyle[] = ['tactical', 'cross', 'dot', 'circle'];
    const idx = list.indexOf(settings.crosshairStyle);
    const nextStyle = list[(idx + 1) % list.length];
    handleUpdateSettings({ ...settings, crosshairStyle: nextStyle });
  };

  // Start round logic
  const startRound = useCallback(() => {
    setGameState('COUNTDOWN');
    setCountdownValue(3);
    sound.playCountdownTick();

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownValue(count);
        sound.playCountdownTick();
      } else if (count === 0) {
        setCountdownValue('GO!');
        sound.playCountdownGo();
      } else {
        clearInterval(interval);
        setGameState('PLAYING');
        if (engineRef.current) {
          engineRef.current.start();
        }
      }
    }, 700);
  }, []);

  // Finish round callback from engine
  const handleRoundComplete = useCallback((stats: RoundStats) => {
    setSummaryStats(stats);
    setGameState('ROUND_SUMMARY');

    // Update records
    setRecords((prev) => {
      const current = prev[stats.mode] || DEFAULT_RECORDS[stats.mode];
      const newHighScore = Math.max(current.highScore, stats.finalScore);
      const newBestReaction = current.bestAvgReactionMs === 0 
        ? stats.avgReactionTimeMs 
        : stats.avgReactionTimeMs > 0 
          ? Math.min(current.bestAvgReactionMs, stats.avgReactionTimeMs)
          : current.bestAvgReactionMs;
      const newBestAcc = Math.max(current.bestAccuracy, stats.accuracyRate);

      const updated = {
        ...prev,
        [stats.mode]: {
          highScore: newHighScore,
          bestAvgReactionMs: newBestReaction,
          bestAccuracy: newBestAcc,
          gamesPlayed: current.gamesPlayed + 1,
        },
      };

      try {
        localStorage.setItem('neuroreflex_records', JSON.stringify(updated));
      } catch {}

      return updated;
    });
  }, []);

  // Initialize engine once canvas is mounted
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(
      canvasRef.current,
      currentMode,
      settings,
      {
        onScoreUpdate: (s, c, acc, liveMs) => {
          setScore(s);
          setCombo(c);
          setAccuracy(acc);
          setLiveReactionMs(liveMs);
        },
        onTimeUpdate: (tl, p) => {
          setTimeLeftSec(tl);
          setTimeProgressPct(p);
        },
        onRoundComplete: handleRoundComplete,
        onRawReflexStep: (state, ms, trial) => {
          setRawBenchStep({ state, ms, trial });
        },
      }
    );

    engineRef.current = engine;

    const handleResize = () => {
      engine.handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, [currentMode, handleRoundComplete, settings]);

  // Handle mode switch
  const handleSelectMode = (mode: GameMode) => {
    setCurrentMode(mode);
    if (engineRef.current) {
      engineRef.current.setMode(mode);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Mute toggle
      if (key === 'm') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      // Escape Pause / Resume / Back
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (gameState === 'PLAYING') {
          engineRef.current?.pause();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          engineRef.current?.resume();
          setGameState('PLAYING');
        } else if (gameState === 'ROUND_SUMMARY') {
          setGameState('TITLE_MENU');
        }
        return;
      }

      // Space / Enter shortcuts
      if (e.key === ' ' || e.key === 'Enter') {
        if (gameState === 'TITLE_MENU') {
          e.preventDefault();
          startRound();
        } else if (gameState === 'ROUND_SUMMARY') {
          e.preventDefault();
          startRound();
        } else if (gameState === 'PAUSED') {
          e.preventDefault();
          engineRef.current?.resume();
          setGameState('PLAYING');
        }
        return;
      }

      // 'R' Quick restart
      if (key === 'r' && (gameState === 'PLAYING' || gameState === 'PAUSED')) {
        e.preventDefault();
        startRound();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState, handleToggleMute, startRound]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 60fps Canvas (Isolated from React re-renders) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full block cursor-none ${
          gameState === 'TITLE_MENU' ? 'opacity-30' : 'opacity-100'
        } transition-opacity duration-300`}
      />

      {/* Screen: Title Screen */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          currentMode={currentMode}
          onSelectMode={handleSelectMode}
          onStartGame={startRound}
          onOpenSettings={() => setIsSettingsOpen(true)}
          settings={settings}
          onToggleMute={handleToggleMute}
          records={records}
        />
      )}

      {/* Screen: Countdown Overlay */}
      {gameState === 'COUNTDOWN' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm pointer-events-none">
          <div className="text-center animate-pulse">
            <div className="text-8xl sm:text-9xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300 drop-shadow-[0_0_35px_rgba(56,189,248,0.7)]">
              {countdownValue}
            </div>
            <div className="text-sm font-mono tracking-widest text-slate-300 mt-4 uppercase">
              集中視線 · 鎖定靶心
            </div>
          </div>
        </div>
      )}

      {/* Screen: In-Game Active HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <HUD
          mode={currentMode}
          score={score}
          combo={combo}
          accuracy={accuracy}
          liveReactionMs={liveReactionMs}
          timeLeftSec={timeLeftSec}
          timeProgressPct={timeProgressPct}
          rawBenchStep={rawBenchStep}
          onPause={() => {
            engineRef.current?.pause();
            setGameState('PAUSED');
          }}
          onToggleMute={handleToggleMute}
          settings={settings}
          onChangeCrosshair={handleChangeCrosshair}
        />
      )}

      {/* Modal: Pause */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => {
            engineRef.current?.resume();
            setGameState('PLAYING');
          }}
          onRestart={startRound}
          onReturnTitle={() => setGameState('TITLE_MENU')}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Modal: Round Summary */}
      {gameState === 'ROUND_SUMMARY' && summaryStats && (
        <SummaryModal
          stats={summaryStats}
          onPlayAgain={startRound}
          onReturnTitle={() => setGameState('TITLE_MENU')}
        />
      )}

      {/* Modal: Settings */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
