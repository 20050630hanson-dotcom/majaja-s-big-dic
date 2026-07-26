# 俄羅斯方塊專案說明 (TETR.IO 風格版)

## 專案結構

```text
俄羅斯方塊]/
├─ index.html                # 頁面骨架；依序載入 CSS 與 JavaScript (TETR.IO 三欄式 UI)
├─ styles/
│  └─ main.css               # 暗黑霓虹 (Cyberpunk/Glassmorphism) 視覺與動畫效果
├─ src/
│  ├─ app.js                 # 應用程式進入點與 60FPS requestAnimationFrame 遊戲主迴圈
│  ├─ audio/
│  │  └─ sound.js            # 原生 Web Audio API 音效合成器 (移動、旋轉、落定、消行、COMBO)
│  ├─ core/
│  │  ├─ config.js           # 10×20 標準棋盤大小、DAS/ARR 控制參數、SRS Kick 牆踢表
│  │  └─ state.js            # 遊戲狀態 Model (Hold, 5-Next 佇列, Stats, Combo, B2B, Ghost)
│  ├─ game/
│  │  ├─ pieces.js           # 7-Bag 隨機抽塊算法與 Tetromino 定義
│  │  ├─ engine.js           # SRS 旋轉與踢牆、Ghost 影子落地計算、Hold 暫存與硬/軟降
│  │  └─ scoring.js          # TETR.IO 國際計分法 (Single/Double/Triple/Tetris, B2B, Combo, Perfect Clear)
│  ├─ input/
│  │  └─ keyboard.js         # 鍵盤監聽與 DAS/ARR 流暢連續按鍵處理
│  └─ ui/
│     └─ renderer.js         # Canvas 繪製 (主棋盤、Ghost 影子、Hold 區、Next 5 佇列與數據面板)
└─ AGENTS.md    # 專案脈絡與後續維護說明
```

## 執行方式

直接以瀏覽器開啟 `index.html` 即可遊玩，不需要安裝套件、框架或啟動伺服器。JavaScript 採用依序載入的原生檔案分層，可避免本機 `file://` 開啟時常見的 ES Module 限制。

## 遊戲規格 (TETR.IO 標準)

- 棋盤為標準 10 欄 × 20 列。
- 方塊生成機制：採用標準 **7-Bag 隨機產生器**（每 7 個方塊為一個隨機袋子，確保出塊均勻）。
- 旋轉系統：採用 **SRS (Super Rotation System)** 牆踢校正與 180° 旋轉。
- 預覽佇列：**NEXT 5** 佇列展示接下來落下的 5 個方塊。
- 暫存機制：**HOLD** 暫存區（每回合限換一次）。
- 落地提示：**Ghost Piece** 半透明虛影標示當前方塊預測落點。
- 音效系統：採用原生 **Web Audio API** 即時合成打擊與消行音效。

## 操作說明

- 左右方向鍵 / A, D：移動。
- 下方向鍵 / S：軟降 (Soft Drop)。
- 空白鍵 (Space)：硬降 (Hard Drop)。
- 上方向鍵 / X：順時針旋轉。
- Z：逆時針旋轉。
- A：180 度旋轉。
- C / Left Shift：HOLD 暫存/更換方塊。
- R：快速重新開始 (Restart)。
- P：暫停 (Pause)。

## 分數與獎勵機制 (TETR.IO Scoring)

- 單行消除 (Single)：100 分
- 雙行消除 (Double)：300 分
- 三行消除 (Triple)：500 分
- 四連消 (Tetris)：800 分
- Back-to-Back (B2B)：連續 Tetris 額外獲得 1.5 倍分數獎勵。
- COMBO：連續落定消行，從第 2 次起依階梯遞增加分與音效升調。
- 全消 (Perfect Clear)：消除後棋盤完全空白，額外 3500 分。

---
