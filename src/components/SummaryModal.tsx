/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { RoundStats, GameMode } from '../types/game';
import { RotateCcw, Home, Share2, Award, Zap, Crosshair } from 'lucide-react';

interface SummaryModalProps {
  stats: RoundStats;
  onPlayAgain: () => void;
  onReturnTitle: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  stats,
  onPlayAgain,
  onReturnTitle,
}) => {
  const dispersionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Bullseye Dispersion Canvas
  useEffect(() => {
    const canvas = dispersionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = w * 0.44;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Draw concentric target rings
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1.0].forEach((ratio) => {
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * ratio, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshair axes
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.beginPath();
    ctx.moveTo(cx, 10);
    ctx.lineTo(cx, h - 10);
    ctx.moveTo(10, cy);
    ctx.lineTo(w - 10, cy);
    ctx.stroke();

    // Bullseye center
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Plot hit records
    stats.hitRecords.forEach((hit) => {
      // Normalize distance: 0 at center, maxR at edge
      const r = Math.min(maxR, hit.distanceFromCenter * 1.4);
      // Give random realistic angle if not stored, or pseudo-consistent angle
      const angle = (hit.timestamp % 1000) * 0.00628;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;

      ctx.fillStyle = hit.isPerfect ? '#38bdf8' : '#facc15';
      ctx.beginPath();
      ctx.arc(px, py, hit.isPerfect ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [stats]);

  // Render Reaction Time Timeline Canvas
  useEffect(() => {
    const canvas = timelineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const data = stats.hitRecords.map((r) => r.reactionTimeMs);
    if (data.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('資料累積中...', w / 2, h / 2);
      return;
    }

    const paddingX = 20;
    const paddingY = 16;
    const minMs = Math.max(100, Math.min(...data) - 40);
    const maxMs = Math.min(600, Math.max(...data) + 40);

    // Guide lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingX, h / 2);
    ctx.lineTo(w - paddingX, h / 2);
    ctx.stroke();

    // Line graph
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((ms, i) => {
      const x = paddingX + (i / (data.length - 1)) * (w - paddingX * 2);
      const y = h - paddingY - ((ms - minMs) / (maxMs - minMs)) * (h - paddingY * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Data points
    data.forEach((ms, i) => {
      const x = paddingX + (i / (data.length - 1)) * (w - paddingX * 2);
      const y = h - paddingY - ((ms - minMs) / (maxMs - minMs)) * (h - paddingY * 2);
      ctx.fillStyle = ms < 220 ? '#34d399' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [stats]);

  // Generate personalized coaching advice
  const getCoachingTip = () => {
    if (stats.avgReactionTimeMs < 210 && stats.accuracyRate >= 90) {
      return '頂尖神級協調！你的瞬間神經反射與微距定位已達職業電競選手標準，可嘗試「動態軌跡攔截」挑戰超高速預判。';
    } else if (stats.accuracyRate < 80) {
      return '速度偏快但精度離散較大，建議將專注點放在視線緊跟靶心收斂環，寧可放慢 30ms 確保每一次都是完美微距命中。';
    } else if (stats.avgReactionTimeMs > 320) {
      return '定位穩定度優異，但手指觸發與神經傳導稍有延遲。建議放鬆手腕關節與肩頸肌群，採取微抓握姿態以提升觸發速度。';
    } else if (stats.reactionStdDev > 60) {
      return '你的最快反應很驚人，但離散度較高。這通常代表後半段出現注意力波動或疲勞，建議調整呼吸節奏保持穩定心流。';
    }
    return '表現非常優異！手眼協調指數穩定提升，持續每日進行 5-10 分鐘規律訓練可活化神經突觸反應！';
  };

  const modeNames: Record<GameMode, string> = {
    PRECISION_STRIKE: '綜合精準打擊',
    KINETIC_TRACKING: '動態軌跡攔截',
    DUAL_COORDINATION: '雙腦鍵鼠協調',
    RAW_REFLEX_BENCH: '生理反應測速',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950/90 border border-orange-950/80 rounded-2xl shadow-[0_0_50px_rgba(255,80,0,0.25)] backdrop-blur-md overflow-hidden my-auto">
        {/* Top Header Strip */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-950/60 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-400" />
            <span className="font-display font-bold text-slate-100 text-base">
              火山訓練成效分析報告 · {modeNames[stats.mode]}
            </span>
          </div>
          <div className="text-xs font-mono text-orange-300/70">
            VOLCANIC SESSION EVALUATION
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Main Hero KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rating Rank Card */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 border border-slate-800/80 rounded-xl text-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-1">
                綜合反應評級
              </span>
              <div className="text-5xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 mb-1">
                {stats.rating}
              </div>
              <div className="text-xs font-semibold text-slate-300">
                {stats.ratingTitle}
              </div>
              <div className="mt-3 text-xs font-mono text-slate-400">
                協調指數：
                <span className="text-sky-400 font-bold tabular-nums ml-1">
                  {stats.coordinationIndex} / 1000
                </span>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">平均反應時間</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-1">
                  {stats.avgReactionTimeMs > 0 ? `${stats.avgReactionTimeMs} ms` : '—'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  最佳：{stats.bestReactionTimeMs} ms
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">命中精準度</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
                  {stats.accuracyRate}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  命中 {stats.targetsHit} / 總計 {stats.totalTargetsSpawned}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">反應離散度 (StdDev)</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-purple-400 mt-1">
                  ±{stats.reactionStdDev} ms
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  數值越低越穩定
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">最大連擊 (Streak)</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
                  {stats.maxCombo}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  連擊倍率加成
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">陷阱辨識率</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-teal-400 mt-1">
                  {stats.decoysAvoided} 次
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  誤觸 {stats.decoysHit} 次
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <div className="text-[10px] font-mono uppercase text-slate-400">最終訓練得分</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 mt-1">
                  {stats.finalScore}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  包含精度與速度加分
                </div>
              </div>
            </div>
          </div>

          {/* Graphical Analytics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bullseye Dispersion Plot */}
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                  <span>靶心微距離散分佈圖 (Hand-Eye Dispersion)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">中心越集中代表定位越準確</span>
              </div>
              <div className="w-full flex items-center justify-center bg-slate-900/50 rounded-lg p-2">
                <canvas
                  ref={dispersionCanvasRef}
                  width={240}
                  height={160}
                  className="rounded"
                />
              </div>
            </div>

            {/* Reaction Speed Timeline Plot */}
            <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>各回合反應時間延遲趨勢 (Latency Timeline)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">綠點代表 &lt;220ms</span>
              </div>
              <div className="w-full flex items-center justify-center bg-slate-900/50 rounded-lg p-2">
                <canvas
                  ref={timelineCanvasRef}
                  width={280}
                  height={160}
                  className="rounded"
                />
              </div>
            </div>
          </div>

          {/* Personalized Coaching Tip Card */}
          <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-900/50 text-sky-400 shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-display text-sky-300 mb-0.5">
                訓練診斷建議與手眼優化方針
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {getCoachingTip()}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onReturnTitle}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>主選單 [Esc]</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  const text = `我在 NeuroReflex 神經反射訓練館達成【${stats.rating} 評級】！平均延遲 ${stats.avgReactionTimeMs}ms，命中率 ${stats.accuracyRate}%！`;
                  navigator.clipboard.writeText(text);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
              title="複製成績到剪貼簿"
            >
              <Share2 className="w-4 h-4" />
              <span>複製成績</span>
            </button>

            <button
              onClick={onPlayAgain}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 hover:from-amber-300 hover:to-orange-500 text-slate-950 text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,100,0,0.4)] hover:shadow-[0_0_28px_rgba(255,100,0,0.6)] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>再次挑戰 [Space / Enter]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
