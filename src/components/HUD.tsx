/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode, GameSettings } from '../types/game';
import { Pause, Volume2, VolumeX, Flame } from 'lucide-react';

interface HUDProps {
  mode: GameMode;
  score: number;
  combo: number;
  accuracy: number;
  liveReactionMs: number;
  timeLeftSec: number;
  timeProgressPct: number;
  rawBenchStep?: { state: 'waiting' | 'ready' | 'result' | 'false_start'; ms?: number; trial?: number };
  onPause: () => void;
  onToggleMute: () => void;
  settings: GameSettings;
  onChangeCrosshair: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  mode,
  score,
  combo,
  accuracy,
  liveReactionMs,
  timeLeftSec,
  timeProgressPct,
  rawBenchStep,
  onPause,
  onToggleMute,
  settings,
  onChangeCrosshair,
}) => {
  const modeLabels: Record<GameMode, string> = {
    PRECISION_STRIKE: '🎯 綜合精準打擊',
    KINETIC_TRACKING: '⚡ 動態軌跡攔截',
    DUAL_COORDINATION: '🧠 雙腦鍵鼠協調',
    RAW_REFLEX_BENCH: '⏱️ 生理反應測速',
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Perimeter Status Cluster */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Mode & Timer */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-2.5 shadow-lg">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              {modeLabels[mode]}
            </div>
            {mode === 'RAW_REFLEX_BENCH' ? (
              <div className="text-lg font-bold text-slate-100 font-display">
                第 <span className="text-amber-400 tabular-nums">{rawBenchStep?.trial || 1}</span> / 5 回合
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono tabular-nums text-slate-100">
                  {timeLeftSec}s
                </span>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-300"
                    style={{ width: `${100 - timeProgressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top-Center: Live Real-time Diagnostics */}
        {mode !== 'RAW_REFLEX_BENCH' && (
          <div className="flex items-center gap-6 bg-slate-900/80 border border-slate-800/80 rounded-xl px-5 py-2 shadow-lg">
            <div className="text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">即時平均延遲</div>
              <div className="text-base font-bold font-mono tabular-nums text-sky-400">
                {liveReactionMs > 0 ? `${liveReactionMs} ms` : '—'}
              </div>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">命中精度</div>
              <div className="text-base font-bold font-mono tabular-nums text-emerald-400">
                {Math.round(accuracy)}%
              </div>
            </div>
          </div>
        )}

        {/* Top-Right: Score & Combo Counter */}
        {mode !== 'RAW_REFLEX_BENCH' && (
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 rounded-xl px-4 py-2.5 shadow-lg">
            {combo > 1 && (
              <div className="flex items-center gap-1 text-amber-400 animate-pulse font-mono font-bold text-sm">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>x{combo} 連擊</span>
              </div>
            )}
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">訓練得分</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
                {score}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Perimeter Controls & Hints */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom-Left: Hotkeys */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-lg px-3.5 py-2 text-[11px] font-mono text-slate-300 shadow-md">
          {mode === 'RAW_REFLEX_BENCH'
            ? '綠色信號亮起瞬間敲擊任意鍵 (Space) · Esc 暫停'
            : settings.keyboardControlMode === 'direct_keys'
              ? '看見標靶立即敲擊對應鍵位 (WASD · JKL · 空白鍵) · 勿按紅色陷阱 · Esc 暫停'
              : 'WASD / 方向鍵平移準星 · Space / J 擊發 · Esc 暫停'}
        </div>

        {/* Bottom-Right: Interactive Buttons (pointer-events-auto) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {settings.keyboardControlMode === 'cursor_nav' && (
            <button
              onClick={onChangeCrosshair}
              className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
              title="切換準星樣式"
            >
              準星: {settings.crosshairStyle}
            </button>
          )}

          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="靜音切換 (M)"
          >
            {settings.soundMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-sky-400" />
            )}
          </button>

          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
            title="暫停遊戲 (Esc)"
          >
            <Pause className="w-4 h-4" />
            <span>暫停 [Esc]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
