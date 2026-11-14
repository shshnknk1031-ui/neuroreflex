/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { GameMode, GameSettings, ModeRecord } from '../types/game';
import { Target, Zap, Cpu, Timer, Settings as SettingsIcon, Volume2, VolumeX, Trophy, Keyboard } from 'lucide-react';

interface TitleScreenProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onOpenSettings: () => void;
  settings: GameSettings;
  onToggleMute: () => void;
  records: Record<GameMode, ModeRecord>;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  currentMode,
  onSelectMode,
  onStartGame,
  onOpenSettings,
  settings,
  onToggleMute,
  records,
}) => {
  const modes: Array<{
    id: GameMode;
    keyIndex: string;
    title: string;
    sub: string;
    desc: string;
    icon: React.ReactNode;
    tag: string;
    color: string;
  }> = [
    {
      id: 'PRECISION_STRIKE',
      keyIndex: '1',
      title: '綜合精準鍵位',
      sub: 'Precision Key Reflex',
      desc: '標靶外圍收斂時機環，辨識中央指定鍵位瞬間敲擊，鍛鍊指尖極速反應。',
      icon: <Target className="w-5 h-5 text-sky-400" />,
      tag: '鍵位反應 · 收斂環時機',
      color: 'from-sky-500/20 to-sky-950/20 border-sky-500/30 text-sky-400',
    },
    {
      id: 'KINETIC_TRACKING',
      keyIndex: '2',
      title: '動態軌跡攔截',
      sub: 'Kinetic Intercept',
      desc: '高速滑動物理反彈標靶，看清移動中標靶指定鍵位即刻攔截擊發。',
      icon: <Zap className="w-5 h-5 text-purple-400" />,
      tag: '動態預判 · 軌跡鍵位',
      color: 'from-purple-500/20 to-purple-950/20 border-purple-500/30 text-purple-400',
    },
    {
      id: 'DUAL_COORDINATION',
      keyIndex: '3',
      title: '雙手雙腦協調',
      sub: 'Dual-Hemisphere Reflex',
      desc: '左手 WASD 與右手 JKL / 方向鍵同步分工，鍛鍊左右腦神經傳導與雙手平衡。',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      tag: '左右手分工 · 鍵位連動',
      color: 'from-emerald-500/20 to-emerald-950/20 border-emerald-500/30 text-emerald-400',
    },
    {
      id: 'RAW_REFLEX_BENCH',
      keyIndex: '4',
      title: '生理反射測速',
      sub: 'Raw Reflex Bench',
      desc: '5 次高精度隨機信號刺激，嚴格防搶先判定，測量純粹的神經突觸反應延遲。',
      icon: <Timer className="w-5 h-5 text-amber-400" />,
      tag: '毫秒基準 · 防搶跑機制',
      color: 'from-amber-500/20 to-amber-950/20 border-amber-500/30 text-amber-400',
    },
  ];

  // Keyboard navigation for title screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') onSelectMode('PRECISION_STRIKE');
      else if (e.key === '2') onSelectMode('KINETIC_TRACKING');
      else if (e.key === '3') onSelectMode('DUAL_COORDINATION');
      else if (e.key === '4') onSelectMode('RAW_REFLEX_BENCH');
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const order: GameMode[] = ['PRECISION_STRIKE', 'KINETIC_TRACKING', 'DUAL_COORDINATION', 'RAW_REFLEX_BENCH'];
        const curIdx = order.indexOf(currentMode);
        onSelectMode(order[(curIdx + 1) % order.length]);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const order: GameMode[] = ['PRECISION_STRIKE', 'KINETIC_TRACKING', 'DUAL_COORDINATION', 'RAW_REFLEX_BENCH'];
        const curIdx = order.indexOf(currentMode);
        onSelectMode(order[(curIdx - 1 + order.length) % order.length]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode, onSelectMode]);

  const currentRecord = records[currentMode];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-12 z-10 overflow-y-auto">
      {/* Top Header Row */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full shadow-[0_0_14px_rgba(255,100,0,0.9)] animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-mono text-orange-200/80">
            NeuroReflex · 火山極限反應訓練系統
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Keyboard Scheme Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-orange-900/40 text-xs font-mono text-slate-300">
            <Keyboard className="w-3.5 h-3.5 text-orange-400" />
            <span>
              {settings.keyboardControlMode === 'direct_keys'
                ? settings.keyLayout === 'wasd_only'
                  ? '鍵盤直擊 [WASD + 空白]'
                  : settings.keyLayout === 'arrows_wasd'
                    ? '鍵盤直擊 [WASD + 方向鍵]'
                    : '鍵盤直擊 [WASD + JKL + 空白]'
                : '鍵盤操縱準星 [WASD 移動 + Space/J 射擊]'}
            </span>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-lg border border-orange-900/40 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white transition-colors"
            title={settings.soundMuted ? '取消靜音 (M)' : '靜音 (M)'}
            aria-label="Sound toggle"
          >
            {settings.soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-orange-900/40 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>鍵位與訓練設定</span>
          </button>
        </div>
      </div>

      {/* Main Centerpiece & Title Lockup */}
      <div className="w-full max-w-5xl mx-auto my-auto py-6 flex flex-col items-center text-center">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="relative mb-6">
          <svg className="w-72 h-16 sm:w-96 sm:h-20" viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="titleGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#ff4500" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <path d="M 10 24 L 2 24 L 2 56 L 10 56" stroke="#ff4500" strokeWidth="2.5" fill="none" />
            <path d="M 390 24 L 398 24 L 398 56 L 390 56" stroke="#ff4500" strokeWidth="2.5" fill="none" />
            <line x1="20" y1="40" x2="48" y2="40" stroke="rgba(255,100,0,0.5)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="352" y1="40" x2="380" y2="40" stroke="rgba(255,100,0,0.5)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="200" cy="40" r="32" stroke="rgba(255,69,0,0.3)" strokeWidth="1" strokeDasharray="4 4" />
            <text x="200" y="48" textAnchor="middle" fill="url(#titleGlow)" fontSize="32" fontWeight="800" letterSpacing="5" fontFamily="Outfit, sans-serif">
              NEUROREFLEX
            </text>
          </svg>
          <div className="text-orange-200/90 text-xs sm:text-sm tracking-wider font-medium flex items-center justify-center gap-2">
            <span>🌋 火山熔岩特訓 · 神經反射與手眼協調鍵盤系統</span>
          </div>
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
          {modes.map((m) => {
            const isSelected = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMode(m.id)}
                className={`relative text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-md ${
                  isSelected
                    ? `bg-slate-950/90 border-orange-500 shadow-[0_0_24px_rgba(255,80,0,0.35)] ring-1 ring-orange-500/60 scale-[1.02]`
                    : 'bg-slate-950/50 border-orange-950/40 hover:border-orange-700/60 hover:bg-slate-950/70'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-orange-950/60">
                    {m.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-orange-900/50 text-[10px] font-mono text-orange-400 font-bold">
                      [{m.keyIndex}]
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {m.tag}
                    </span>
                  </div>
                </div>
                <div className="font-display font-bold text-base text-slate-100 mb-0.5">
                  {m.title}
                </div>
                <div className="text-[11px] font-mono text-slate-500 mb-2">
                  {m.sub}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {m.desc}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#ff6600]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Mode Record Summary Banner */}
        <div className="flex items-center gap-6 px-6 py-3 rounded-xl bg-slate-950/75 border border-orange-950/60 backdrop-blur-md mb-8 text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">歷史最佳紀錄</span>
          </div>
          <div className="text-slate-400">
            最高分：
            <span className="text-slate-100 font-bold tabular-nums ml-1">
              {currentRecord?.highScore || 0}
            </span>
          </div>
          <div className="text-slate-400">
            最快平均反應：
            <span className="text-orange-400 font-bold tabular-nums ml-1">
              {currentRecord?.bestAvgReactionMs ? `${currentRecord.bestAvgReactionMs} ms` : '—'}
            </span>
          </div>
          <div className="text-slate-400 hidden sm:block">
            命中率：
            <span className="text-emerald-400 font-bold tabular-nums ml-1">
              {currentRecord?.bestAccuracy ? `${currentRecord.bestAccuracy}%` : '—'}
            </span>
          </div>
        </div>

        {/* Start Game CTA Button */}
        <button
          onClick={onStartGame}
          className="group relative inline-flex items-center justify-center px-10 py-4 font-display text-lg font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 hover:from-amber-300 hover:to-orange-500 rounded-xl shadow-[0_0_35px_rgba(255,80,0,0.5)] hover:shadow-[0_0_45px_rgba(255,80,0,0.75)] transform hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>開始極限訓練 [ Space / Enter ]</span>
        </button>
      </div>

      {/* Bottom Flat Control-Hint Line */}
      <div className="w-full text-center pb-2">
        <p className="text-xs text-slate-500 font-mono tracking-wide">
          鍵盤敲擊對應鍵位 · 數字鍵 1-4 / 方向鍵切換模式 · Space / Enter 開始 · Esc 暫停 · M 靜音
        </p>
      </div>
    </div>
  );
};
