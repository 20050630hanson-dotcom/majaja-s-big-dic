'use strict';

window.Tetris = window.Tetris || {};

Tetris.clearFullRows = function clearFullRows(state) {
  const rowsToKeep = state.board.filter(row => row.some(cell => !cell));
  const clearedCount = Tetris.CONFIG.rows - rowsToKeep.length;

  while (rowsToKeep.length < Tetris.CONFIG.rows) {
    rowsToKeep.unshift(Array(Tetris.CONFIG.cols).fill(null));
  }
  state.board.splice(0, Tetris.CONFIG.rows, ...rowsToKeep);

  if (clearedCount === 0) {
    state.combo = 0;
    return null;
  }

  state.lines += clearedCount;
  state.level = Math.floor(state.lines / 10) + 1;
  state.combo++;

  let basePoints = 0;
  let actionName = '';
  let isDifficult = false;

  switch (clearedCount) {
    case 1:
      basePoints = 100 * state.level;
      actionName = 'SINGLE';
      break;
    case 2:
      basePoints = 300 * state.level;
      actionName = 'DOUBLE';
      break;
    case 3:
      basePoints = 500 * state.level;
      actionName = 'TRIPLE';
      break;
    case 4:
      basePoints = 800 * state.level;
      actionName = 'TETRIS';
      isDifficult = true;
      break;
  }

  // Back to Back check
  let b2bBonus = 0;
  if (isDifficult) {
    if (state.b2b) {
      b2bBonus = Math.floor(basePoints * 0.5);
      if (Tetris.Sound) Tetris.Sound.b2b();
    }
    state.b2b = true;
  } else {
    state.b2b = false;
  }

  // Combo calculation
  let comboBonus = 0;
  if (state.combo > 1) {
    comboBonus = (state.combo - 1) * 50 * state.level;
    if (Tetris.Sound) Tetris.Sound.combo(state.combo);
  }

  // Perfect Clear check
  let pcBonus = 0;
  const isPerfectClear = state.board.every(row => row.every(cell => !cell));
  if (isPerfectClear) {
    pcBonus = 3500 * state.level;
  }

  const gainedScore = basePoints + b2bBonus + comboBonus + pcBonus;
  state.score += gainedScore;

  if (Tetris.Sound) Tetris.Sound.lineClear(clearedCount);

  // Return floating text reward badge object
  const messages = [];
  if (actionName) messages.push(actionName);
  if (state.b2b && isDifficult) messages.push('B2B 1.5×');
  if (state.combo > 1) messages.push(`COMBO ×${state.combo}`);
  if (isPerfectClear) messages.push('PERFECT CLEAR!');

  return {
    gainedScore,
    clearedCount,
    actionName,
    message: messages.join(' • '),
    scoreText: `+${gainedScore}`
  };
};
