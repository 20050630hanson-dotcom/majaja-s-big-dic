'use strict';

window.Tetris = window.Tetris || {};

let state = Tetris.createInitialState();
const render = Tetris.createRenderer();
let lastTime = performance.now();
let dropAccumulator = 0;
let lockAccumulator = 0;
let latestReward = null;

function resetGame() {
  state = Tetris.createInitialState();
  lastTime = performance.now();
  dropAccumulator = 0;
  lockAccumulator = 0;
  latestReward = null;
  render(state, null);
}

function handleAction(action) {
  if (action === 'restart') {
    resetGame();
    return;
  }

  if (action === 'togglePause') {
    if (!state.gameOver) {
      state.paused = !state.paused;
      render(state, null);
    }
    return;
  }

  if (action === 'toggleMute') {
    if (Tetris.Sound) {
      const isMuted = Tetris.Sound.toggleMute();
      const muteBtn = document.querySelector('#btn-mute');
      if (muteBtn) {
        muteBtn.textContent = isMuted ? '🔇 Muted' : '🔊 Mute';
      }
    }
    return;
  }

  if (state.gameOver || state.paused) return;

  let reward = null;
  let actionMoved = false;

  if (action === 'moveLeft') actionMoved = Tetris.tryMove(state, -1, 0);
  else if (action === 'moveRight') actionMoved = Tetris.tryMove(state, 1, 0);
  else if (action === 'softDrop') reward = Tetris.softDrop(state);
  else if (action === 'rotateClockwise') actionMoved = Tetris.tryRotate(state, 1);
  else if (action === 'rotateCounterClockwise') actionMoved = Tetris.tryRotate(state, -1);
  else if (action === 'rotate180') actionMoved = Tetris.tryRotate(state, 2);
  else if (action === 'hardDrop') {
    reward = Tetris.hardDrop(state);
    lockAccumulator = 0;
    dropAccumulator = 0;
  }
  else if (action === 'hold') {
    if (Tetris.holdPiece(state)) {
      lockAccumulator = 0;
      dropAccumulator = 0;
    }
  }

  if (actionMoved) {
    lockAccumulator = 0;
  }

  if (reward) latestReward = reward;
  render(state, reward);
}

// 60FPS Game Loop
function gameLoop(now) {
  const deltaTime = Math.min(now - lastTime, 100);
  lastTime = now;

  if (!state.gameOver && !state.paused) {
    // Gravity Step Calculation
    const currentInterval = Math.max(50, Tetris.CONFIG.dropInterval - (state.level - 1) * 60);
    dropAccumulator += deltaTime;

    const isOnGround = !Tetris.canPlace(state, state.piece.shape, state.piece.x, state.piece.y + 1);

    if (dropAccumulator >= currentInterval) {
      dropAccumulator = 0;
      if (!isOnGround) {
        Tetris.step(state);
      }
    }

    // Lock Delay Logic
    if (isOnGround) {
      lockAccumulator += deltaTime;
      if (lockAccumulator >= Tetris.CONFIG.lockDelay) {
        lockAccumulator = 0;
        dropAccumulator = 0;
        const lockReward = Tetris.settlePiece(state);
        if (lockReward) latestReward = lockReward;
      }
    } else {
      lockAccumulator = 0;
    }
  }

  render(state, null);
  requestAnimationFrame(gameLoop);
}

// Bind UI Buttons
const restartBtn = document.querySelector('#btn-restart');
if (restartBtn) restartBtn.addEventListener('click', resetGame);

const muteBtn = document.querySelector('#btn-mute');
if (muteBtn) {
  muteBtn.addEventListener('click', () => handleAction('toggleMute'));
}

Tetris.bindKeyboard(handleAction, state);
render(state, null);
requestAnimationFrame(gameLoop);
