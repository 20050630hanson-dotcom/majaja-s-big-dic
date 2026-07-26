'use strict';

window.Tetris = window.Tetris || {};

Tetris.createRenderer = function createRenderer() {
  const mainCanvas = document.querySelector('#main-canvas');
  const mainCtx = mainCanvas ? mainCanvas.getContext('2d') : null;

  const holdCanvas = document.querySelector('#hold-canvas');
  const holdCtx = holdCanvas ? holdCanvas.getContext('2d') : null;

  const nextCanvas = document.querySelector('#next-canvas');
  const nextCtx = nextCanvas ? nextCanvas.getContext('2d') : null;

  const scoreEl = document.querySelector('#score-val');
  const linesEl = document.querySelector('#lines-val');
  const levelEl = document.querySelector('#level-val');
  const ppsEl = document.querySelector('#pps-val');
  const timeEl = document.querySelector('#time-val');
  const comboEl = document.querySelector('#combo-badge');
  const b2bEl = document.querySelector('#b2b-badge');
  const bonusEl = document.querySelector('#bonus-popup');
  const modalEl = document.querySelector('#game-modal');
  const modalTextEl = document.querySelector('#modal-title');
  const modalSubEl = document.querySelector('#modal-subtitle');

  const cellSize = Tetris.CONFIG.cellSize;

  function drawCell(ctx, x, y, color, isGhost = false, glowColor = null) {
    if (!ctx) return;
    const px = x * cellSize;
    const py = y * cellSize;

    if (isGhost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
      return;
    }

    // Glow Effect for Active/Placed Blocks
    ctx.shadowBlur = glowColor ? 8 : 0;
    ctx.shadowColor = glowColor || 'transparent';

    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

    // Inner highlight gradient
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(px + 1, py + 1, cellSize - 2, (cellSize - 2) / 4);

    ctx.shadowBlur = 0; // Reset shadow
  }

  function drawBoardGrid(ctx, cols, rows) {
    if (!ctx) return;
    ctx.clearRect(0, 0, cols * cellSize, rows * cellSize);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, rows * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(cols * cellSize, y * cellSize);
      ctx.stroke();
    }
  }

  function drawMiniPiece(ctx, pieceId, width, height) {
    ctx.clearRect(0, 0, width, height);
    if (!pieceId) return;

    const def = Tetris.TETROMINO_DEFINITIONS[pieceId];
    if (!def) return;

    const shape = def.shape;
    const miniCell = 20;
    const offsetX = (width - shape[0].length * miniCell) / 2;
    const offsetY = (height - shape.length * miniCell) / 2;

    shape.forEach((row, rY) => row.forEach((filled, rX) => {
      if (filled) {
        const px = offsetX + rX * miniCell;
        const py = offsetY + rY * miniCell;
        ctx.fillStyle = def.color;
        ctx.fillRect(px + 1, py + 1, miniCell - 2, miniCell - 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(px + 1, py + 1, miniCell - 2, (miniCell - 2) / 4);
      }
    }));
  }

  function drawHold(state) {
    if (!holdCtx) return;
    holdCtx.globalAlpha = state.canHold ? 1.0 : 0.35;
    drawMiniPiece(holdCtx, state.holdPieceId, holdCanvas.width, holdCanvas.height);
    holdCtx.globalAlpha = 1.0;
  }

  function drawNextQueue(state) {
    if (!nextCtx) return;
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    const miniCell = 18;
    const queue = state.nextQueue || [];

    queue.slice(0, 5).forEach((pieceId, index) => {
      const def = Tetris.TETROMINO_DEFINITIONS[pieceId];
      if (!def) return;
      const shape = def.shape;
      const slotHeight = 65;
      const offsetX = (nextCanvas.width - shape[0].length * miniCell) / 2;
      const offsetY = index * slotHeight + (slotHeight - shape.length * miniCell) / 2;

      shape.forEach((row, rY) => row.forEach((filled, rX) => {
        if (filled) {
          const px = offsetX + rX * miniCell;
          const py = offsetY + rY * miniCell;
          nextCtx.fillStyle = def.color;
          nextCtx.fillRect(px + 1, py + 1, miniCell - 2, miniCell - 2);
          nextCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          nextCtx.fillRect(px + 1, py + 1, miniCell - 2, (miniCell - 2) / 4);
        }
      }));
    });
  }

  function drawMainMatrix(state) {
    if (!mainCtx) return;
    drawBoardGrid(mainCtx, Tetris.CONFIG.cols, Tetris.CONFIG.rows);

    // 1. Draw Fixed Blocks on Board
    state.board.forEach((row, y) => row.forEach((color, x) => {
      if (color) drawCell(mainCtx, x, y, color);
    }));

    if (state.piece && !state.gameOver) {
      // 2. Draw Ghost Piece Projection
      const ghostY = Tetris.getGhostY(state);
      state.piece.shape.forEach((row, rY) => row.forEach((filled, rX) => {
        if (filled) {
          const gy = ghostY + rY;
          if (gy >= 0) drawCell(mainCtx, state.piece.x + rX, gy, state.piece.color, true);
        }
      }));

      // 3. Draw Active Piece
      state.piece.shape.forEach((row, rY) => row.forEach((filled, rX) => {
        if (filled) {
          const py = state.piece.y + rY;
          if (py >= 0) drawCell(mainCtx, state.piece.x + rX, py, state.piece.color, false, state.piece.glow);
        }
      }));
    }
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return function render(state, reward) {
    drawMainMatrix(state);
    drawHold(state);
    drawNextQueue(state);

    if (scoreEl) scoreEl.textContent = state.score.toLocaleString();
    if (linesEl) linesEl.textContent = state.lines;
    if (levelEl) levelEl.textContent = state.level;
    if (ppsEl) ppsEl.textContent = state.pps;

    const elapsed = state.gameOver ? 0 : performance.now() - state.startTime;
    if (timeEl) timeEl.textContent = formatTime(elapsed);

    // Combo & B2B badges
    if (comboEl) {
      if (state.combo > 1) {
        comboEl.textContent = `${state.combo - 1} COMBO`;
        comboEl.classList.remove('hidden');
      } else {
        comboEl.classList.add('hidden');
      }
    }

    if (b2bEl) {
      if (state.b2b) {
        b2bEl.classList.remove('hidden');
      } else {
        b2bEl.classList.add('hidden');
      }
    }

    // Floating Reward Animation Popup
    if (reward && bonusEl) {
      bonusEl.innerHTML = `<span class="badge-msg">${reward.message}</span><span class="badge-score">${reward.scoreText}</span>`;
      bonusEl.classList.remove('animate-pop');
      void bonusEl.offsetWidth; // trigger reflow
      bonusEl.classList.add('animate-pop');
    }

    // Modal Handle (Game Over / Pause)
    if (modalEl) {
      if (state.gameOver) {
        modalEl.classList.remove('hidden');
        if (modalTextEl) modalTextEl.textContent = 'GAME OVER';
        if (modalSubEl) modalSubEl.innerHTML = `最終分數：<strong>${state.score.toLocaleString()}</strong><br>按 [R] 鍵重新開始游玩`;
      } else if (state.paused) {
        modalEl.classList.remove('hidden');
        if (modalTextEl) modalTextEl.textContent = 'PAUSED';
        if (modalSubEl) modalSubEl.textContent = '按 [P] 鍵繼續遊戲';
      } else {
        modalEl.classList.add('hidden');
      }
    }
  };
};
