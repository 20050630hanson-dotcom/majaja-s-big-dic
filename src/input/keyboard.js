'use strict';

window.Tetris = window.Tetris || {};

Tetris.bindKeyboard = function bindKeyboard(onAction, state) {
  const keysState = {};
  const dasTimers = {};
  const arrIntervals = {};

  function handleAction(action) {
    if (typeof onAction === 'function') {
      onAction(action);
    }
  }

  function startDasArr(key, action) {
    handleAction(action);
    dasTimers[key] = setTimeout(() => {
      arrIntervals[key] = setInterval(() => {
        if (keysState[key]) {
          handleAction(action);
        }
      }, Tetris.CONFIG.arr);
    }, Tetris.CONFIG.das);
  }

  function clearKeyTimer(key) {
    if (dasTimers[key]) {
      clearTimeout(dasTimers[key]);
      delete dasTimers[key];
    }
    if (arrIntervals[key]) {
      clearInterval(arrIntervals[key]);
      delete arrIntervals[key];
    }
  }

  document.addEventListener('keydown', event => {
    if (event.repeat && (event.key === 'c' || event.key === 'Shift' || event.code === 'Space')) {
      return;
    }

    const code = event.code;
    const key = event.key.toLowerCase();

    // Key Mappings
    let action = null;
    if (code === 'ArrowLeft' || key === 'a') action = 'moveLeft';
    else if (code === 'ArrowRight' || key === 'd') action = 'moveRight';
    else if (code === 'ArrowDown' || key === 's') action = 'softDrop';
    else if (code === 'Space') action = 'hardDrop';
    else if (code === 'ArrowUp' || key === 'x') action = 'rotateClockwise';
    else if (key === 'z') action = 'rotateCounterClockwise';
    else if (key === 'q' || key === 'w') action = 'rotate180';
    else if (key === 'c' || code === 'ShiftLeft' || code === 'ShiftRight') action = 'hold';
    else if (key === 'r') action = 'restart';
    else if (key === 'p') action = 'togglePause';
    else if (key === 'm') action = 'toggleMute';

    if (!action) return;

    // Prevent default browser scroll behavior for game controls
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      event.preventDefault();
    }

    if (!keysState[code]) {
      keysState[code] = true;
      if (['moveLeft', 'moveRight', 'softDrop'].includes(action)) {
        startDasArr(code, action);
      } else {
        handleAction(action);
      }
    }
  });

  document.addEventListener('keyup', event => {
    const code = event.code;
    keysState[code] = false;
    clearKeyTimer(code);
  });
};
