/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSettings, CrosshairStyle, KeyboardControlMode, KeyLayout } from '../types/game';
import { X, Volume2, VolumeX, Crosshair, Sliders, Check, Keyboard, Compass } from 'lucide-react';
import { sound } from '../game/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const keyboardModes: Array<{ id: KeyboardControlMode; label: string; desc: string; icon: React.ReactNode }> = [
    {
      id: 'direct_keys',
      label: '鍵位瞬間直擊 (推薦)',
      desc: '標靶顯示專屬鍵帽，手指看見瞬間直接敲擊對應按鍵，極限訓練指尖神經傳導',
      icon: <Keyboard className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'cursor_nav',
      label: '鍵盤操縱準星飛行',
      desc: '使用 WASD 或方向鍵高速平移準星，按下 Space / J 擊發開火',
      icon: <Compass className="w-4 h-4 text-emerald-400" />,
    },
  ];

  const keyLayouts: Array<{ id: KeyLayout; label: string; desc: string }> = [
    { id: 'full', label: '雙手全鍵盤', desc: '左手 WASD + 右手 JKL/I + 空白鍵 (雙手協調最佳)' },
    { id: 'wasd_only', label: '左手極速區', desc: '僅使用 W · A · S · D + 空白鍵 (單手極限反應)' },
    { id: 'arrows_wasd', label: '雙手對稱區', desc: '左手 WASD + 右手方向鍵 ↑↓←→ + 空白鍵' },
  ];

  const crosshairStyles: Array<{ id: CrosshairStyle; label: string; desc: string }> = [
    { id: 'cross', label: '戰術十字', desc: '經典 FPS 十字準星，最通用精準' },
    { id: 'dot', label: '競技微點', desc: '極小中心點，提供最高無遮蔽視野' },
    { id: 'circle', label: '同心準心', desc: '圓形環帶，輔助快速邊界鎖定' },
    { id: 'tactical', label: '戰術方框', desc: '角隅包圍框，適合動態追蹤攔截' },
  ];

  const colors = [
    { label: '熔岩熾橙', hex: '#ff5500' },
    { label: '霓虹青', hex: '#38bdf8' },
    { label: '極光綠', hex: '#10b981' },
    { label: '戰術琥珀', hex: '#f59e0b' },
    { label: '電光紫', hex: '#c084fc' },
    { label: '純白', hex: '#ffffff' },
  ];

  const durations = [
    { sec: 30, label: '30 秒 (短程極速)' },
    { sec: 45, label: '45 秒 (標準競技)' },
    { sec: 60, label: '60 秒 (耐力專注)' },
  ];

  const targetScales = [
    { scale: 0.85, label: '0.85x (微距高難度)' },
    { scale: 1.0, label: '1.0x (標準規格)' },
    { scale: 1.2, label: '1.2x (加大新手)' },
  ];

  const handleVolumeChange = (vol: number) => {
    sound.setVolume(vol);
    onUpdateSettings({ ...settings, soundVolume: vol });
  };

  const handleMuteToggle = () => {
    const next = !settings.soundMuted;
    sound.setMuted(next);
    onUpdateSettings({ ...settings, soundMuted: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-950/90 border border-orange-950/80 rounded-2xl shadow-[0_0_50px_rgba(255,80,0,0.25)] backdrop-blur-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-950/60 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-orange-400" />
            <h3 className="font-display font-bold text-slate-100 text-base">
              鍵盤控制與訓練自訂設定
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Section: Keyboard Control Mode */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-sky-400" />
              <span>鍵盤操作模式 (Keyboard Control Paradigm)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {keyboardModes.map((km) => {
                const isSelected = settings.keyboardControlMode === km.id;
                return (
                  <button
                    key={km.id}
                    onClick={() => onUpdateSettings({ ...settings, keyboardControlMode: km.id })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-sky-950/50 border-sky-400 text-sky-300 ring-1 ring-sky-400/40 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {km.icon}
                      <span className="font-bold text-xs text-slate-100">{km.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {km.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Key Layout Scheme (when direct_keys is active) */}
          {settings.keyboardControlMode === 'direct_keys' && (
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2">
                鍵位配置區域 (Keypad Distribution)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {keyLayouts.map((kl) => {
                  const isSelected = settings.keyLayout === kl.id;
                  return (
                    <button
                      key={kl.id}
                      onClick={() => onUpdateSettings({ ...settings, keyLayout: kl.id })}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'bg-sky-950/50 border-sky-400 text-sky-300 font-semibold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-100">{kl.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{kl.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Crosshair Style (when cursor_nav is active) */}
          {settings.keyboardControlMode === 'cursor_nav' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-sky-400" />
                  <span>準星樣式 (Crosshair Style)</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {crosshairStyles.map((item) => {
                  const isSelected = settings.crosshairStyle === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onUpdateSettings({ ...settings, crosshairStyle: item.id })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-950/40 border-sky-400 text-sky-300 ring-1 ring-sky-400/40'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-slate-100 mb-0.5">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Crosshair Color */}
          {settings.keyboardControlMode === 'cursor_nav' && (
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2">
                準星色彩 (Color Reticle)
              </div>
              <div className="flex items-center gap-3">
                {colors.map((c) => {
                  const isSelected = settings.crosshairColor === c.hex;
                  return (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateSettings({ ...settings, crosshairColor: c.hex })}
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                        isSelected ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {isSelected && <Check className="w-4 h-4 text-slate-950" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Round Duration */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">
              回合單次時長 (Round Duration)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((d) => {
                const isSelected = settings.roundDuration === d.sec;
                return (
                  <button
                    key={d.sec}
                    onClick={() => onUpdateSettings({ ...settings, roundDuration: d.sec })}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-sky-950/50 border-sky-400 text-sky-300 font-semibold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Target Size */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">
              標靶尺寸微調 (Target Scale)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {targetScales.map((ts) => {
                const isSelected = settings.targetSizeMultiplier === ts.scale;
                return (
                  <button
                    key={ts.scale}
                    onClick={() => onUpdateSettings({ ...settings, targetSizeMultiplier: ts.scale })}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-sky-950/50 border-sky-400 text-sky-300 font-semibold'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ts.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Decoys Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                干擾紅色陷阱靶標 (Go / No-Go 抑制測試)
              </div>
              <div className="text-[11px] text-slate-400">
                隨機生成紅色警戒標靶，測試大腦瞬間抑制不點擊的決策反應
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, enableDecoys: !settings.enableDecoys })}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                settings.enableDecoys ? 'bg-sky-400' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                  settings.enableDecoys ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Section: Audio Volume */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                {settings.soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
                <span>音效反饋音量</span>
              </span>
              <button
                onClick={handleMuteToggle}
                className="text-xs text-sky-400 hover:underline"
              >
                {settings.soundMuted ? '取消靜音' : '靜音'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-orange-950/60 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 hover:from-amber-300 hover:to-orange-500 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,100,0,0.4)] cursor-pointer"
          >
            完成儲存 [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};
