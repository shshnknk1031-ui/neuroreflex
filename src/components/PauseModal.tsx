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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto mb-4 text-sky-400">
          <Play className="w-6 h-6 ml-0.5" />
        </div>

        <h3 className="font-display font-bold text-xl text-slate-100 mb-1">
          訓練暫停中
        </h3>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          PAUSED · 請調整呼吸並做好準備
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-sm transition-all shadow-[0_0_16px_rgba(56,189,248,0.3)]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>繼續訓練 [Esc / Space]</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重新開始本局</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>準星與訓練設定</span>
          </button>

          <button
            onClick={onReturnTitle}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800/60 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>返回主選單</span>
          </button>
        </div>
      </div>
    </div>
  );
};
