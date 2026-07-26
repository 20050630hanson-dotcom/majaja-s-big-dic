'use strict';

window.Tetris = window.Tetris || {};

Tetris.TETROMINO_DEFINITIONS = {
  I: {
    id: 'I',
    name: '1×4 長條',
    color: '#06b6d4', // Cyan
    glow: 'rgba(6, 182, 212, 0.6)',
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]
  },
  J: {
    id: 'J',
    name: '倒 L',
    color: '#3b82f6', // Blue
    glow: 'rgba(59, 130, 246, 0.6)',
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  L: {
    id: 'L',
    name: 'L',
    color: '#f97316', // Orange
    glow: 'rgba(249, 115, 22, 0.6)',
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  O: {
    id: 'O',
    name: '正方形',
    color: '#eab308', // Yellow
    glow: 'rgba(234, 179, 8, 0.6)',
    shape: [
      [1, 1],
      [1, 1]
    ]
  },
  S: {
    id: 'S',
    name: '倒 Z',
    color: '#22c55e', // Green
    glow: 'rgba(34, 197, 94, 0.6)',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ]
  },
  T: {
    id: 'T',
    name: 'T',
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.6)',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ]
  },
  Z: {
    id: 'Z',
    name: 'Z',
    color: '#ef4444', // Red
    glow: 'rgba(239, 68, 68, 0.6)',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ]
  }
};

Tetris.createBagGenerator = function () {
  let bag = [];

  function refill() {
    const keys = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = keys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    bag = keys;
  }

  return {
    next() {
      if (bag.length === 0) refill();
      return bag.pop();
    },
    peekMany(count) {
      const tempBag = [...bag];
      const result = [];
      while (result.length < count) {
        if (tempBag.length === 0) {
          const keys = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
          for (let i = keys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keys[i], keys[j]] = [keys[j], keys[i]];
          }
          tempBag.push(...keys);
        }
        result.push(tempBag.pop());
      }
      return result;
    }
  };
};

Tetris.createPiece = function (typeId) {
  const def = Tetris.TETROMINO_DEFINITIONS[typeId];
  const shape = def.shape.map(row => [...row]);
  return {
    id: def.id,
    name: def.name,
    color: def.color,
    glow: def.glow,
    shape,
    rotation: 0, // 0: 0 deg, 1: 90 deg, 2: 180 deg, 3: 270 deg
    x: Math.floor((Tetris.CONFIG.cols - shape[0].length) / 2),
    y: 0
  };
};
