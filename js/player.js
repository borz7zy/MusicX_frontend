'use strict';

function setPlayerBar(visible) {
  const bar = document.getElementById('player-bar');
  const app = document.getElementById('app');
  if (visible) { bar.classList.add('visible'); app.classList.remove('no-player'); }
  else         { bar.classList.remove('visible'); app.classList.add('no-player'); }
}

function updateNavButtons() {
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  if (!prevBtn || !nextBtn) return;
  prevBtn.disabled = playerState.playlistIndex <= 0;
  nextBtn.disabled = playerState.playlistIndex >= playerState.playlist.length - 1;
}

function refreshPlayingCard() {
  document.querySelectorAll('.audio-card').forEach(card => {
    const isPlaying = card.dataset.id === playerState.currentId && !playerState.audio.paused;
    card.classList.toggle('playing', isPlaying);
    const overlay = card.querySelector('.play-overlay');
    if (overlay) {
      overlay.innerHTML = isPlaying
        ? '<span class="material-symbols-rounded" style="color:#fff;font-size:22px;">pause</span>'
        : '<span class="material-symbols-rounded" style="color:#fff;font-size:22px;">play_arrow</span>';
    }
  });
}

function revokeBlobUrl() {
  if (playerState._blobUrl) {
    URL.revokeObjectURL(playerState._blobUrl);
    playerState._blobUrl = null;
  }
  if (playerState._fetchAbort) {
    playerState._fetchAbort.abort();
    playerState._fetchAbort = null;
  }
}

async function playAudio(id, title, sub, playlist, index) {
  const audio = playerState.audio;

  if (playerState.currentId === id) {
    audio.paused ? audio.play() : audio.pause();
    return;
  }

  audio.pause();
  revokeBlobUrl();

  playerState.currentId     = id;
  playerState.currentTitle  = title;

  if (playlist !== undefined) {
    playerState.playlist      = playlist;
    playerState.playlistIndex = index !== undefined ? index : -1;
  }

  const titleEl = document.getElementById('player-title');
  const subEl   = document.getElementById('player-sub');
  titleEl.textContent = title;
  subEl.textContent   = sub || '';

  setPlayerBar(true);
  updateNavButtons();
  refreshPlayingCard();

  const thumb = document.querySelector('#player-bar .player-thumb');
  if (thumb) thumb.classList.add('loading');

  const abortCtrl = new AbortController();
  playerState._fetchAbort = abortCtrl;

  try {
    const headers = {};
    if (authState.accessToken) headers['Authorization'] = `Bearer ${authState.accessToken}`;

    const res = await fetch(`${API_BASE}/audio/${id}/stream`, {
      headers,
      signal: abortCtrl.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    if (abortCtrl.signal.aborted) return;

    const thumb = document.querySelector('#player-bar .player-thumb');
    if (thumb) thumb.classList.remove('loading');

    const blobUrl = URL.createObjectURL(blob);
    playerState._blobUrl   = blobUrl;
    playerState._fetchAbort = null;

    audio.src = blobUrl;
    audio.load();

    await new Promise((resolve, reject) => {
      audio.addEventListener('loadedmetadata', resolve, { once: true });
      audio.addEventListener('error', () => reject(new Error('Ошибка декодирования аудио')), { once: true });
    });

    await audio.play();
  } catch (e) {
    if (abortCtrl.signal.aborted) return;
    const thumb = document.querySelector('#player-bar .player-thumb');
    if (thumb) thumb.classList.remove('loading');
    toast('Ошибка воспроизведения: ' + e.message, 'error');
    playerState.currentId = null;
    revokeBlobUrl();
    setPlayerBar(false);
    refreshPlayingCard();
  }
}

function playByIndex(index) {
  if (index < 0 || index >= playerState.playlist.length) return;
  const item = playerState.playlist[index];
  playAudio(item.id, item.title, formatSize(item.size_bytes), playerState.playlist, index);
}

function setupPlayerListeners() {
  const audio      = playerState.audio;
  const playPauseBtn = document.getElementById('btn-play-pause');
  const stopBtn    = document.getElementById('btn-stop');
  const prevBtn    = document.getElementById('btn-prev');
  const nextBtn    = document.getElementById('btn-next');
  const seekEl     = document.getElementById('player-seek');
  const timeEl     = document.getElementById('player-time');

  function updateSeekUI() {
    const dur = audio.duration;
    const known = isFinite(dur) && dur > 0;
    seekEl.disabled = !known;
    if (known) {
      seekEl.value = (audio.currentTime / dur) * 100;
      timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(dur)}`;
    } else {
      seekEl.value = 0;
      timeEl.textContent = `${formatTime(audio.currentTime)} / --:--`;
    }
  }

  audio.addEventListener('timeupdate',     updateSeekUI);
  audio.addEventListener('durationchange', updateSeekUI);
  audio.addEventListener('ended', () => {
    playPauseBtn.innerHTML = '<span class="material-symbols-rounded">play_arrow</span>';
    const next = playerState.playlistIndex + 1;
    if (next < playerState.playlist.length) {
      playByIndex(next);
    } else {
      refreshPlayingCard();
    }
  });
  audio.addEventListener('play',  () => { playPauseBtn.innerHTML = '<span class="material-symbols-rounded">pause</span>'; refreshPlayingCard(); });
  audio.addEventListener('pause', () => { playPauseBtn.innerHTML = '<span class="material-symbols-rounded">play_arrow</span>'; refreshPlayingCard(); });

  playPauseBtn.addEventListener('click', () => { audio.paused ? audio.play() : audio.pause(); });

  stopBtn.addEventListener('click', () => {
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute('src');
    audio.load();
    revokeBlobUrl();
    playerState.currentId     = null;
    playerState.playlist      = [];
    playerState.playlistIndex = -1;
    setPlayerBar(false);
    refreshPlayingCard();
  });

  prevBtn.addEventListener('click', () => {
    if (playerState.playlistIndex > 0) playByIndex(playerState.playlistIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (playerState.playlistIndex < playerState.playlist.length - 1) {
      playByIndex(playerState.playlistIndex + 1);
    }
  });

  seekEl.addEventListener('change', () => {
    const dur = audio.duration;
    if (!isFinite(dur) || dur <= 0) return;
    audio.currentTime = (seekEl.value / 100) * dur;
  });
}