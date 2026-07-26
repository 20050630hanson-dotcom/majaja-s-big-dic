'use strict';

window.Tetris = window.Tetris || {};

Tetris.initSoundPreview = function initSoundPreview() {
  const previewBtn = document.querySelector('#btn-sound-preview');
  const modal = document.querySelector('#sound-preview-modal');
  const closeBtn = document.querySelector('#btn-close-preview');
  const clipList = document.querySelector('#clip-list');

  if (!previewBtn || !modal || !clipList) return;

  function renderClips() {
    clipList.innerHTML = '';
    const clips = Tetris.Sound.clips;

    Object.keys(clips).forEach(key => {
      const clip = clips[key];
      const card = document.createElement('div');
      card.className = 'clip-card';
      card.innerHTML = `
        <div class="clip-info">
          <div class="clip-title">${clip.name}</div>
          <div class="clip-time">⏱ 區間: ${clip.start.toFixed(1)}s ~ ${(clip.start + clip.duration).toFixed(1)}s (長度: ${clip.duration}s)</div>
          <div class="clip-action">🎮 綁定事件: <span class="action-tag">${clip.defaultAction}</span></div>
        </div>
        <button class="btn-play-clip" data-key="${key}">▶ 試聽片段</button>
      `;
      clipList.appendChild(card);
    });

    clipList.querySelectorAll('.btn-play-clip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = btn.getAttribute('data-key');
        const clip = clips[key];
        if (clip) {
          btn.style.transform = 'scale(0.95)';
          setTimeout(() => btn.style.transform = 'none', 150);
          Tetris.Sound.playClipSegment(clip.start, clip.duration, 1.0);
        }
      });
    });
  }

  previewBtn.addEventListener('click', () => {
    renderClips();
    modal.classList.remove('hidden');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
};
