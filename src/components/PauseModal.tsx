/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Settings as SettingsIcon } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnTitle,
  onOpenSettings,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-950/90 border border-orange-950/80 rounded-2xl shadow-[0_0_40px_rgba(255,80,0,0.25)] backdrop-blur-md p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-orange-950/40 border border-orange-800/60 flex items-center justify-center mx-auto mb-4 text-orange-400 shadow-[0_0_15px_rgba(255,100,0,0.3)]">
          <Play className="w-6 h-6 ml-0.5 fill-orange-400" />
        </div>

        <h3 className="font-display font-bold text-xl text-slate-100 mb-1">
          火山熔岩特訓暫停中
        </h3>
        <p className="text-xs text-orange-200/70 mb-6 font-mono">
          PAUSED · 請調整呼吸並做好準備
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 hover:from-amber-300 hover:to-orange-500 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,100,0,0.4)] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>繼續訓練 [Esc / Space]</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-orange-950/60 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新開始本局</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-orange-950/60 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>準星與訓練設定</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-orange-950/40 bg-transparent hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>返回主選單</span>
          </button>
        </div>
      </div>
    </div>
  );
};
