'use strict';

window.Tetris = window.Tetris || {};

Tetris.Sound = (function () {
  let ctx = null;
  let muted = false;
  let bgmStarted = false;

  // MAJAJA Background Music (BGM)
  const bgm = new Audio('majaja.webm');
  bgm.loop = true;
  bgm.volume = 0.4;

  function initCtx() {
    if (!ctx && typeof window.AudioContext !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    if (!muted && !bgmStarted) {
      bgm.play().then(() => {
        bgmStarted = true;
      }).catch(() => {
        // Will start on next user gesture
      });
    }
  }

  // Global unlock listeners for browser autoplay policies
  if (typeof window !== 'undefined') {
    const unlock = () => {
      initCtx();
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
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
    } catch (e) {}
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

  function playMajajaSfx(startTime = 0, duration = null, volume = 0.8) {
    if (muted) return;
    initCtx();
    try {
      const sfx = new Audio('majaja.webm');
      sfx.volume = volume;
      sfx.currentTime = startTime;
      sfx.play().catch(() => {});
      if (duration) {
        setTimeout(() => {
          sfx.pause();
        }, duration * 1000);
      }
    } catch (e) {}
  }

  return {
    initCtx,
    toggleMute() {
      muted = !muted;
      if (muted) {
        bgm.pause();
      } else {
        bgm.play().then(() => { bgmStarted = true; }).catch(() => {});
      }
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
      playMajajaSfx(0, 0.5, 0.6);
    },
    softDrop() {
      playTone(180, 'sine', 0.03, 0.02, 100);
    },
    hardDrop() {
      playMajajaSfx(0, 1.0, 0.9);
      playTone(120, 'square', 0.12, 0.08, 40);
      playNoise(0.08, 0.05);
    },
    lock() {
      playTone(220, 'triangle', 0.05, 0.04, 150);
    },
    lineClear(lines) {
      playMajajaSfx(0, 2.0, 1.0);
      const baseFreq = 523.25;
      const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];
      const count = Math.min(lines, 4);
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          playTone(freqs[i], 'triangle', 0.15, 0.06, freqs[i] * 1.1);
        }, i * 60);
      }
    },
    combo(comboCount) {
      playMajajaSfx(0.5, 0.8, 0.7);
      const pitchShift = Math.min(comboCount * 40, 600);
      playTone(400 + pitchShift, 'sine', 0.12, 0.07, 600 + pitchShift);
    },
    b2b() {
      playMajajaSfx(1.0, 1.2, 0.9);
      playTone(784, 'triangle', 0.2, 0.08, 1046.5);
    },
    gameOver() {
      playMajajaSfx(0, 3.0, 1.0);
      playTone(300, 'sawtooth', 0.4, 0.1, 60);
      setTimeout(() => playTone(150, 'sawtooth', 0.6, 0.12, 40), 200);
    }
  };
})();
