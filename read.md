# ⚡ 神經反射訓練館 (NeuroReflex)
### High-Performance Reflex & Kinetic Training System

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06b6d4?logo=tailwindcss)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural%20Web%20Audio-orange)](#)

> **專為電競選手、節奏遊戲玩家與反應力訓練者打造的高精度純鍵盤神經反射訓練系統。**  
> 全程免用滑鼠，以毫秒（ms）為單位精確捕捉每一次神經傳導與擊鍵反饋！  
> 
> 🎮 **線上直接暢玩 (Live Demo)**：[https://shshnknk1031-ui.github.io/neuroreflex/](https://shshnknk1031-ui.github.io/neuroreflex/)

---

## 📖 目錄 (Table of Contents)

- [🌟 核心特色 (Core Highlights)](#-核心特色-core-highlights)
- [🎯 四大訓練模組 (Training Modes)](#-四大訓練模組-training-modes)
- [🕹️ 操作指南與快捷鍵 (Controls & Shortcuts)](#️-操作指南與快捷鍵-controls--shortcuts)
- [📊 專業評級與診斷指標 (Rating & Scientific Metrics)](#-專業評級與診斷指標-rating--scientific-metrics)
- [⚙️ 自訂與個人化設定 (Customization)](#️-自訂與個人化設定-customization)
- [🛠️ 系統架構與技術棧 (Tech Stack & Architecture)](#️-系統架構與技術棧-tech-stack--architecture)
- [📁 專案目錄結構 (Project Structure)](#-專案目錄結構-project-structure)
- [🚀 快速開始 (Quick Start)](#-快速開始-quick-start)
- [📄 開源協議 (License)](#-開源協議-license)

---

## 🌟 核心特色 (Core Highlights)

- ⚡ **純鍵盤極限驅動（Zero Mouse Needed）**：擺脫滑鼠桌面摩擦力與感應器限制，直接訓練「視神經 ➔ 大腦決策 ➔ 手指肌肉」的最短神經路徑。
- 🎯 **自研 60FPS+ 高流暢 Canvas 物理引擎**：
  - 動態邊界收縮判定環（Approach Circles），支援 `PERFECT`、`GREAT`、`GOOD` 精確時機捕捉。
  - 螢幕震動打擊感（Screen Shake Trauma）、擊中停頓微頓挫（Hitstop）與爆裂粒子特效。
- 🔊 **Web Audio API 零延遲程序化音效合成器**：
  - 不依賴外部音訊檔案，無載入延遲，即發即響。
  - 連擊音高階梯調諧（Combo Pitch Ladder），打擊反饋清脆強烈。
- 📈 **電競級訓練成效診斷報告**：
  - 靶心微距離散分佈圖（Hand-Eye Dispersion Plot）。
  - 各回合反應時間延遲趨勢圖（Latency Timeline）。
  - 自動計算標準差（StdDev）穩定性指標與協調指數（Coordination Index）。
  - 整合智慧教練方針診斷（Coaching Tips）。
- 🚫 **Go/No-Go 認知干擾抑制訓練**：
  - 隨機出現紅色 `[✖ 勿按]` 陷阱標靶，強制大腦在高速反應中進行抑制控制（Inhibitory Control）。

---

## 🎯 四大訓練模組 (Training Modes)

| 模式名稱 | 類型代號 | 核心玩法 | 訓練效益 |
| :--- | :--- | :--- | :--- |
| **1. 綜合精準打擊** | `PRECISION_STRIKE` | 標靶於定點隨機出現，外部縮小環逐漸貼齊邊緣，在極限收縮瞬間敲擊對應鍵。 | 專注力、擊鍵精確度與黃金時機掌控。 |
| **2. 動態軌跡攔截** | `KINETIC_TRACKING` | 標靶帶有物理初速度並在邊界反彈，玩家需預判彈道並在飛行中瞬間敲擊攔截。 | 動態視力、空間軌跡預判與移動目標鎖定。 |
| **3. 雙腦協調挑戰** | `DUAL_COORDINATION` | 左手負責 WASD 方向鍵位，右手負責 JKL/方向鍵位或特定動作，兩側非對稱指令交替。 | 左右大腦半球協同運作，防止激烈對抗時的大腦認知當機。 |
| **4. 生理反應測速** | `RAW_REFLEX_BENCH` | 畫面隨機等待 1.5~4.5 秒後突然閃爍綠光，看到瞬間以最快速度敲擊按鍵（共 5 回合）。 | 測量未經複雜思考的最原始視網膜與周邊神經傳導速度（含防偷跑判定）。 |

---

## 🕹️ 操作指南與快捷鍵 (Controls & Shortcuts)

### 1. 全域系統快捷鍵

| 按鍵 | 功能說明 |
| :--- | :--- |
| **`1` ~ `4`** | 在主畫面快速切換 4 種訓練模式 |
| **`Space` 或 `Enter`** | 開始訓練 / 暫停繼續 / 結算頁再玩一次 |
| **`Esc`** | 暫停遊戲 / 返回主選單 / 關閉設定視窗 |
| **`M`** | 即時開關全域音效 (Mute/Unmute) |
| **`R`** | 訓練進行中立即重開當局 (Quick Restart) |

### 2. 兩種操控模式（可在設定中切換）

1. **鍵位瞬間直擊 (Direct Keys) [推薦]**：
   - 標靶內部直接標記專屬鍵帽（如 `[W]`、`[D]`、`[J]`、`[SPC]`、`[↑]` 等）。
   - 眼睛看見標靶的瞬間，手指直接敲擊對應按鍵完成擊殺。
2. **鍵盤操縱準星飛行 (Cursor Nav)**：
   - 使用 `W/A/S/D` 或方向鍵平移高靈敏戰術十字準星。
   - 移動準星至標靶內部後，按下 `Space` 或 `J` 擊發開火。

### 3. 三種鍵位佈局分區

- **雙手全鍵盤 (Full)**：左手 `W·A·S·D` + 右手 `J·K·L·I` + `空白鍵`（雙手大腦協調最佳）。
- **左手極速區 (WASD Only)**：僅使用 `W·A·S·D` + `空白鍵`（單手極限小範圍反射）。
- **雙手對稱區 (Arrows + WASD)**：左手 `W·A·S·D` + 右手方向鍵 `↑·↓·←·→` + `空白鍵`。

---

## 📊 專業評級與診斷指標 (Rating & Scientific Metrics)

訓練完成後，系統將綜合「平均反應速度」、「命中準確率」與「節奏離散標準差」計算**協調指數（Coordination Index: 0 ~ 1000）**，並給出專業評級：

| 評級 | 稱號 | 判定標準（平均反應時間 / 協調指數） | 說明 |
| :---: | :--- | :--- | :--- |
| **S+** | ⚡ 神經超載 (Godlike Reflex) | `< 195 ms` 或 協調指數 `≥ 880` | 超越常人的頂級神經反射速度！ |
| **S** | 🎯 職業選手級 (Pro Esports) | `195 ~ 234 ms` 或 協調指數 `≥ 780` | 電競職業選手與高階射擊/音遊玩家水平。 |
| **A** | 🏎️ 頂尖運動員級 (Elite Athlete) | `235 ~ 274 ms` 或 協調指數 `≥ 660` | 反應敏捷，手眼協調極其優秀。 |
| **B** | 🏃 優良反射 (Fast Reflex) | `275 ~ 329 ms` 或 協調指數 `≥ 520` | 一般健康成年人的良好反應水準。 |
| **C** | 🔰 基礎訓練中 (Developing) | `≥ 330 ms` 或 協調指數 `< 520` | 神經突觸尚在適應，持續鍛鍊可顯著提升。 |

### 關鍵分析指標解析

- **平均反應時間 (Avg Reaction Time)**：從標靶出現到成功敲擊的平均毫秒數。
- **反應離散度 (Reaction StdDev)**：反應時間的標準差（`±ms`），數值越小代表每一下敲擊的發力越穩定、越少失誤。
- **靶心微距離散分佈圖**：以二維雷達靶心呈現敲擊時點與完美時機（縮小環貼齊瞬間）的微小偏差。
- **延遲趨勢圖**：即時呈現整局訓練中的反應變化曲線，綠點標示 `< 220ms` 的極速擊發，協助分析耐力與專注度衰退點。

---

## ⚙️ 自訂與個人化設定 (Customization)

在主畫面或遊戲中按下右上角齒輪（或點擊設定）可調整：

- **戰術準星樣式**：戰術十字 (`cross`)、競技微點 (`dot`)、同心準心 (`circle`)、戰術方框 (`tactical`)。
- **霓虹主題色彩**：霓虹青 (`#38bdf8`)、極光綠 (`#10b981`)、戰術琥珀 (`#f59e0b`)、電光紫 (`#c084fc`)、純白 (`#ffffff`)。
- **回合時長**：`30 秒` (短程極速爆發)、`45 秒` (標準競技測速)、`60 秒` (耐力與專注力)。
- **標靶尺寸微調**：`0.85x` (微距高難度)、`1.0x` (標準規格)、`1.2x` (加大新手模式)。
- **認知陷阱開關**：可自由開啟或關閉 Go/No-Go 紅色誤觸陷阱。
- **本機紀錄儲存**：設定與最高紀錄（各模式高分、最佳 ms、命中率）均自動保存於瀏覽器 `localStorage` 中。

---

## 🛠️ 系統架構與技術棧 (Tech Stack & Architecture)

- **前端核心框架**：[React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/)
- **構建與開發工具**：[Vite 6](https://vitejs.dev/)
- **樣式與主題**：[Tailwind CSS v4](https://tailwindcss.com/) + `@tailwindcss/vite`
- **圖示庫**：[Lucide React](https://lucide.dev/)
- **動效庫**：[Motion](https://motion.dev/)
- **遊戲引擎核心**：純自研 HTML5 2D Canvas 高性能渲染循環 (`requestAnimationFrame`)
- **音訊合成**：Web Audio API 程序化雙通道振盪器 (`SoundSynthesizer`)

---

## 📁 專案目錄結構 (Project Structure)

```text
神經反射訓練館---neuroreflex/
├── index.html              # HTML 單頁應用入口
├── package.json            # 專案依賴與腳本定義
├── tsconfig.json           # TypeScript 嚴格型別設定
├── vite.config.ts          # Vite 6 構建與外掛配置
├── metadata.json           # 專案應用元數據
├── src/
│   ├── main.tsx            # React 根渲染掛載點
│   ├── App.tsx             # 遊戲主狀態機 (State Machine) 與快捷鍵監聽
│   ├── index.css           # 全域樣式與字型設定
│   ├── types/
│   │   └── game.ts         # 遊戲狀態、標靶、設定與結算統計型別定義
│   ├── game/
│   │   ├── engine.ts       # Canvas 物理渲染循環、標靶生成、碰撞與計分引擎
│   │   └── audio.ts        # Web Audio API 程序化音效合成器 (零延遲)
│   └── components/
│       ├── TitleScreen.tsx # 主選單介面、模式選擇卡片與歷史最高分展示
│       ├── HUD.tsx         # 遊戲中即時 HUD (分數、連擊、時間進度條、即時 ms)
│       ├── PauseModal.tsx  # 暫停選單視窗
│       ├── SummaryModal.tsx# 結算分析報告 (評級、散佈圖、趨勢圖、教練建議)
│       └── SettingsModal.tsx # 控制模式、鍵位配置、準星風格與色彩自訂面板
```

---

## 🚀 快速開始 (Quick Start)

### 1. 環境需求
請確認電腦已安裝 [Node.js](https://nodejs.org/)（建議使用 LTS 18 或 20 以上版本）。

### 2. 下載與安裝
```bash
# 進入專案資料夾
cd 神經反射訓練館---neuroreflex

# 安裝專案所需依賴套件
npm install
```

### 3. 啟動開發伺服器
```bash
npm run dev
```

啟動後終端機會輸出本地訪問網址，請在瀏覽器中開啟：
👉 **`http://localhost:3000`**

### 4. 構建生產版本 (Production Build)
```bash
# 執行 TypeScript 檢查與 Vite 打包編譯
npm run build

# 本地預覽生產打包成果
npm run preview
```

---

## 📄 開源協議 (License)

本專案基於 **[Apache License 2.0](LICENSE)** 授權開源發布。你可以自由用於個人學習、二次修改與非商業/商業研究用途。
