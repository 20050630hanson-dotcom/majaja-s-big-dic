'use strict';

window.Tetris = window.Tetris || {};

Tetris.Sound = (function () {
  let ctx = null;
  let muted = false;

  // Preset audio slices from majaja.webm (start time in sec, duration in sec)
  const clips = {
    hardDrop: { name: 'MAJAJA! 喊聲', start: 0.0, duration: 2.0, defaultAction: 'hardDrop' },
    lineClear: { name: '瑪雅加 語錄 1', start: 2.0, duration: 4.0, defaultAction: 'lineClear' },
    tetris: { name: '瑪雅加 語錄 2', start: 6.0, duration: 5.0, defaultAction: 'tetris' },
    combo: { name: '靈魂發聲 / 連擊', start: 11.0, duration: 4.0, defaultAction: 'combo' },
    b2b: { name: '魔性笑聲 / 特殊獎勵', start: 15.0, duration: 6.0, defaultAction: 'b2b' },
    gameOver: { name: '哀嚎 / 結束音效', start: 22.0, duration: 6.0, defaultAction: 'gameOver' }
  };

  // Sync dynamically from localStorage if modified on preview page
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('majaja_clips');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          arr.forEach(c => {
            if (clips[c.id]) {
              clips[c.id].start = c.start;
              clips[c.id].duration = c.duration;
            }
          });
        }
      } catch (e) {}
    }
  }

  function initCtx() {
    if (!ctx && typeof window.AudioContext !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
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

  // Shared audio instance for sound effects to avoid unbuffered seek issues
  const sfxAudio = new Audio('majaja.webm');
  let sfxTimeout = null;

  function playClipSegment(startTime, duration, volume = 0.9) {
    if (muted) return;
    initCtx();
    try {
      if (sfxTimeout) clearTimeout(sfxTimeout);
      sfxAudio.pause();
      sfxAudio.volume = volume;
      sfxAudio.currentTime = startTime;

      const p = sfxAudio.play();
      if (p !== undefined) {
        p.then(() => {
          sfxAudio.currentTime = startTime;
        }).catch(() => {});
      }

      if (duration && duration > 0) {
        sfxTimeout = setTimeout(() => {
          sfxAudio.pause();
        }, duration * 1000);
      }
    } catch (e) {}
  }

  return {
    initCtx,
    clips,
    playClipSegment,
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
      playClipSegment(0.0, 0.8, 0.6);
    },
    softDrop() {
      playTone(180, 'sine', 0.03, 0.02, 100);
    },
    hardDrop() {
      playClipSegment(clips.hardDrop.start, clips.hardDrop.duration, 0.9);
      playTone(120, 'square', 0.12, 0.08, 40);
      playNoise(0.08, 0.05);
    },
    lock() {
      playTone(220, 'triangle', 0.05, 0.04, 150);
    },
    lineClear(lines) {
      if (lines >= 4) {
        playClipSegment(clips.tetris.start, clips.tetris.duration, 1.0);
      } else {
        playClipSegment(clips.lineClear.start, clips.lineClear.duration, 0.9);
      }
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
      playClipSegment(clips.combo.start, clips.combo.duration, 0.8);
      const pitchShift = Math.min(comboCount * 40, 600);
      playTone(400 + pitchShift, 'sine', 0.12, 0.07, 600 + pitchShift);
    },
    b2b() {
      playClipSegment(clips.b2b.start, clips.b2b.duration, 0.9);
      playTone(784, 'triangle', 0.2, 0.08, 1046.5);
    },
    gameOver() {
      playClipSegment(clips.gameOver.start, clips.gameOver.duration, 1.0);
      playTone(300, 'sawtooth', 0.4, 0.1, 60);
      setTimeout(() => playTone(150, 'sawtooth', 0.6, 0.12, 40), 200);
    }
  };
})();
