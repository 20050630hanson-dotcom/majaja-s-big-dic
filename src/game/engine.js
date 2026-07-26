'use strict';

window.Tetris = window.Tetris || {};

Tetris.canPlace = function canPlace(state, shape, x, y) {
  return shape.every((row, localY) => row.every((filled, localX) => {
    if (!filled) return true;
    const boardX = x + localX;
    const boardY = y + localY;
    if (boardX < 0 || boardX >= Tetris.CONFIG.cols || boardY >= Tetris.CONFIG.rows) return false;
    if (boardY < 0) return true; // Allow piece to spawn partially above top boundary
    return !state.board[boardY][boardX];
  }));
};

Tetris.getGhostY = function getGhostY(state) {
  const piece = state.piece;
  if (!piece) return 0;
  let ghostY = piece.y;
  while (Tetris.canPlace(state, piece.shape, piece.x, ghostY + 1)) {
    ghostY++;
  }
  return ghostY;
};

Tetris.tryMove = function tryMove(state, dx, dy) {
  if (state.gameOver || state.paused) return false;
  const piece = state.piece;
  if (!Tetris.canPlace(state, piece.shape, piece.x + dx, piece.y + dy)) return false;
  piece.x += dx;
  piece.y += dy;
  if (dx !== 0 && Tetris.Sound) Tetris.Sound.move();
  return true;
};

Tetris.tryRotate = function tryRotate(state, direction) {
  // direction: 1 for CW, -1 for CCW, 2 for 180 deg
  if (state.gameOver || state.paused) return false;
  const piece = state.piece;
  const shape = piece.shape;
  const size = shape.length;

  let rotated;
  if (direction === 1) {
    // Clockwise
    rotated = shape[0].map((_, col) => shape.map(row => row[col]).reverse());
  } else if (direction === -1) {
    // Counter-clockwise
    rotated = shape[0].map((_, col) => shape.map(row => row[size - 1 - col]));
  } else if (direction === 2) {
    // 180 degrees
    rotated = shape.map(row => [...row].reverse()).reverse();
  }

  const oldRotation = piece.rotation;
  let newRotation;
  if (direction === 2) {
    newRotation = (oldRotation + 2) % 4;
  } else if (direction === 1) {
    newRotation = (oldRotation + 1) % 4;
  } else {
    newRotation = (oldRotation + 3) % 4;
  }

  // Get Kick Table
  const kickKey = direction === 2 ? '180' : `${oldRotation}->${newRotation}`;
  const kickTable = piece.id === 'I'
    ? (Tetris.CONFIG.srsKicksI[kickKey] || [[0, 0]])
    : (Tetris.CONFIG.srsKicksJLSZT[kickKey] || [[0, 0]]);

  for (const [offsetX, offsetY] of kickTable) {
    // SRS Y coordinate in standard Tetris is inverted compared to Canvas Y
    const targetX = piece.x + offsetX;
    const targetY = piece.y - offsetY;
    if (Tetris.canPlace(state, rotated, targetX, targetY)) {
      piece.shape = rotated;
      piece.x = targetX;
      piece.y = targetY;
      piece.rotation = newRotation;
      if (Tetris.Sound) Tetris.Sound.rotate();
      return true;
    }
  }
  return false;
};

Tetris.holdPiece = function holdPiece(state) {
  if (!state.canHold || state.gameOver || state.paused) return false;

  const currentId = state.piece.id;
  if (state.holdPieceId === null) {
    state.holdPieceId = currentId;
    Tetris.spawnPiece(state);
  } else {
    const temp = state.holdPieceId;
    state.holdPieceId = currentId;
    state.piece = Tetris.createPiece(temp);
  }

  state.canHold = false;
  if (Tetris.Sound) Tetris.Sound.hold();
  return true;
};

Tetris.lockPiece = function lockPiece(state) {
  const piece = state.piece;
  piece.shape.forEach((row, localY) => row.forEach((filled, localX) => {
    if (filled) {
      const boardY = piece.y + localY;
      const boardX = piece.x + localX;
      if (boardY >= 0 && boardY < Tetris.CONFIG.rows && boardX >= 0 && boardX < Tetris.CONFIG.cols) {
        state.board[boardY][boardX] = piece.color;
      }
    }
  }));
  state.totalPieces++;
  const elapsedSec = (performance.now() - state.startTime) / 1000;
  if (elapsedSec > 0) {
    state.pps = (state.totalPieces / elapsedSec).toFixed(2);
  }
  if (Tetris.Sound) Tetris.Sound.lock();
};

Tetris.spawnPiece = function spawnPiece(state) {
  const nextType = state.nextQueue.shift();
  state.nextQueue.push(state.bagGen.next());
  state.piece = Tetris.createPiece(nextType);
  state.canHold = true;

  if (!Tetris.canPlace(state, state.piece.shape, state.piece.x, state.piece.y)) {
    state.gameOver = true;
    if (Tetris.Sound) Tetris.Sound.gameOver();
  }
};

Tetris.settlePiece = function settlePiece(state) {
  Tetris.lockPiece(state);
  const reward = Tetris.clearFullRows(state);
  if (!state.gameOver) {
    Tetris.spawnPiece(state);
  }
  return reward;
};

Tetris.step = function step(state) {
  if (state.gameOver || state.paused) return undefined;
  Tetris.tryMove(state, 0, 1);
  return undefined;
};

Tetris.hardDrop = function hardDrop(state) {
  if (state.gameOver || state.paused) return undefined;
  let dropDistance = 0;
  while (Tetris.canPlace(state, state.piece.shape, state.piece.x, state.piece.y + 1)) {
    state.piece.y++;
    dropDistance++;
  }
  state.score += dropDistance * 2;
  if (Tetris.Sound) Tetris.Sound.hardDrop();
  return Tetris.settlePiece(state);
};

Tetris.softDrop = function softDrop(state) {
  if (state.gameOver || state.paused) return undefined;
  if (Tetris.tryMove(state, 0, 1)) {
    state.score += 1;
    if (Tetris.Sound) Tetris.Sound.softDrop();
  }
  return undefined;
};
