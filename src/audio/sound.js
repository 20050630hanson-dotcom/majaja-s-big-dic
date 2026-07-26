'use strict';

window.Tetris = window.Tetris || {};

Tetris.Sound = (function () {
  let ctx = null;
  let muted = false;

  function initCtx() {
    if (!ctx && typeof window.AudioContext !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playTone(freq, type, duration, gainVal = 0.1, freqEnd = null) {
    if (muted) return;
    initCtx();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 10), ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context playback fail silent
    }
  }

  function playNoise(duration, gainVal = 0.1) {
    if (muted) return;
    initCtx();
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      noise.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {}
  }

  return {
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    move() {
      playTone(300, 'sine', 0.04, 0.03, 150);
    },
    rotate() {
      playTone(450, 'triangle', 0.06, 0.04, 600);
    },
    hold() {
      playTone(520, 'sine', 0.08, 0.05, 300);
    },
    softDrop() {
      playTone(180, 'sine', 0.03, 0.02, 100);
    },
    hardDrop() {
      if (!muted) {
        const a = new Audio('majaja.webm');
        a.volume = 0.6;
        a.play().catch(()=>{});
      }
      playTone(120, 'square', 0.12, 0.08, 40);
      playNoise(0.08, 0.05);
    },
    lock() {
      playTone(220, 'triangle', 0.05, 0.04, 150);
    },
    lineClear(lines) {
      if (!muted) {
        const a = new Audio('majaja.webm');
        a.volume = 1.0;
        a.play().catch(()=>{});
      }
      const baseFreq = 523.25; // C5
      const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
      const count = Math.min(lines, 4);
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          playTone(freqs[i], 'triangle', 0.15, 0.06, freqs[i] * 1.1);
        }, i * 60);
      }
    },
    combo(comboCount) {
      const pitchShift = Math.min(comboCount * 40, 600);
      playTone(400 + pitchShift, 'sine', 0.12, 0.07, 600 + pitchShift);
    },
    b2b() {
      playTone(784, 'triangle', 0.2, 0.08, 1046.5);
    },
    gameOver() {
      playTone(300, 'sawtooth', 0.4, 0.1, 60);
      setTimeout(() => playTone(150, 'sawtooth', 0.6, 0.12, 40), 200);
    }
  };
})();
