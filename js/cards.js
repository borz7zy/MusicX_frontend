'use strict';

function audioCardHTML(a, isOwned) {
  const sizeFmt = formatSize(a.size_bytes);
  const pub = a.is_public;
  return `
    <div class="audio-card" data-id="${a.id}" data-owned="${isOwned}" data-public="${pub}">
      <div class="audio-thumb">
        <span class="material-symbols-rounded">music_note</span>
        <div class="play-overlay"><span class="material-symbols-rounded" style="color:#fff;font-size:22px;">play_arrow</span></div>
      </div>
      <div class="audio-info">
        <div class="audio-title">${escHtml(a.title)}</div>
        <div class="audio-meta flex-row" style="gap:8px;margin-top:4px;">
          <span class="chip ${pub ? 'chip-public' : 'chip-private'}">${pub ? 'Публичный' : 'Приватный'}</span>
          ${sizeFmt ? `<span>${sizeFmt}</span>` : ''}
        </div>
      </div>
      <div class="audio-actions">
        ${isOwned ? `
          <button class="icon-btn" data-action="toggle-privacy" title="${pub ? 'Сделать приватным' : 'Сделать публичным'}">
            <span class="material-symbols-rounded">${pub ? 'lock_open' : 'lock'}</span>
          </button>
          <button class="icon-btn danger" data-action="delete" title="Удалить">
            <span class="material-symbols-rounded">delete</span>
          </button>` : `
          <button class="icon-btn danger" data-action="remove-collect" title="Убрать из сборника">
            <span class="material-symbols-rounded">playlist_remove</span>
          </button>`}
        ${!isOwned && authState.accessToken ? `
          <button class="icon-btn" data-action="add-collect" title="В сборник">
            <span class="material-symbols-rounded">playlist_add</span>
          </button>` : ''}
      </div>
    </div>`;
}

function attachCardListeners(container, items, isOwned, signal, onRefresh) {
  const onClick = async (e) => {
    const card = e.target.closest('.audio-card');
    if (!card) return;
    const id   = card.dataset.id;
    const item = items.find(a => a.id === id);
    const action = e.target.closest('[data-action]')?.dataset?.action;

    if (action === 'toggle-privacy' && item) {
      const newPub = !item.is_public;
      try {
        await api.patch(`/audio/${id}/privacy`, { is_public: newPub }, signal);
        item.is_public = newPub;
        toast(newPub ? 'Сделан публичным' : 'Сделан приватным', 'success');
        if (onRefresh) onRefresh();
      } catch (err) { if (!signal.aborted) toast(err.message, 'error'); }
      return;
    }

    if (action === 'delete') {
      if (!confirm('Удалить трек?')) return;
      try {
        await api.delete(`/audio/${id}`, signal);
        if (playerState.currentId === id) {
          playerState.audio.pause();
          playerState.audio.removeAttribute('src');
          playerState.audio.load();
          playerState.currentId     = null;
          playerState.playlist      = [];
          playerState.playlistIndex = -1;
          setPlayerBar(false);
        }
        toast('Трек удалён', 'success');
        if (onRefresh) onRefresh();
      } catch (err) { if (!signal.aborted) toast(err.message, 'error'); }
      return;
    }

    if (action === 'remove-collect') {
      try {
        await api.delete(`/audio/${id}/collect`, signal);
        toast('Убрано из сборника', 'success');
        if (onRefresh) onRefresh();
      } catch (err) { if (!signal.aborted) toast(err.message, 'error'); }
      return;
    }

    if (action === 'add-collect') {
      try {
        await api.post(`/audio/${id}/collect`, null, signal);
        toast('Добавлено в сборник', 'success');
      } catch (err) { if (!signal.aborted) toast(err.message, 'error'); }
      return;
    }

    // if (!authState.accessToken) {
    //   toast('Войдите для воспроизведения', 'error');
    //   return;
    // }

    const index = items.findIndex(a => a.id === id);
    playAudio(id, item?.title || 'Трек', item ? formatSize(item.size_bytes) : '', items, index);
  };

  container.addEventListener('click', onClick);

  const prevCleanup = router.cleanupFn;
  router.cleanupFn = () => {
    container.removeEventListener('click', onClick);
    if (prevCleanup) prevCleanup();
  };
}