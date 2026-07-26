'use strict';

window.Tetris = window.Tetris || {};

Tetris.createBoard = function createBoard() {
  return Array.from({ length: Tetris.CONFIG.rows }, () => Array(Tetris.CONFIG.cols).fill(null));
};

Tetris.createInitialState = function createInitialState() {
  const bagGen = Tetris.createBagGenerator();
  const nextQueue = [];
  for (let i = 0; i < Tetris.CONFIG.nextCount; i++) {
    nextQueue.push(bagGen.next());
  }
  const currentPieceType = bagGen.next();

  return {
    board: Tetris.createBoard(),
    bagGen,
    piece: Tetris.createPiece(currentPieceType),
    holdPieceId: null,
    canHold: true,
    nextQueue,
    score: 0,
    lines: 0,
    level: 1,
    combo: 0,
    b2b: false,
    gameOver: false,
    paused: false,
    lockTimer: null,
    lastDropTime: performance.now(),
    startTime: performance.now(),
    totalPieces: 0,
    pps: '0.00'
  };
};
