'use strict';

async function renderLibrary(container, signal) {
  if (!authState.accessToken) {
    container.innerHTML = `
      <div class="view">
        <div class="section-header"><div class="section-title">Библиотека</div></div>
        <div class="empty-state"><span class="material-symbols-rounded">lock</span><p>Войдите, чтобы видеть свои треки</p></div>
        <div style="text-align:center;margin-top:16px;"><button class="btn btn-filled" id="btn-go-auth">Войти</button></div>
      </div>`;
    const btn = document.getElementById('btn-go-auth');
    const onClick = () => navigate('auth');
    btn.addEventListener('click', onClick);
    router.cleanupFn = () => btn.removeEventListener('click', onClick);
    return;
  }

  let activeTab = 'owned';

  async function load() {
    container.innerHTML = `
      <div class="view">
        <div class="section-header"><div class="section-title">Библиотека</div></div>
        <div class="tabs">
          <button class="tab-btn ${activeTab === 'owned' ? 'active' : ''}" id="tab-owned">Мои треки</button>
          <button class="tab-btn ${activeTab === 'collected' ? 'active' : ''}" id="tab-collected">Сборник</button>
        </div>
        <div id="lib-content"><div class="spinner"></div></div>
      </div>`;

    const tabOwned = document.getElementById('tab-owned');
    const tabCol   = document.getElementById('tab-collected');
    const onTabOwned = () => { activeTab = 'owned';     load(); };
    const onTabCol   = () => { activeTab = 'collected'; load(); };
    tabOwned.addEventListener('click', onTabOwned);
    tabCol.addEventListener('click', onTabCol);

    router.cleanupFn = () => {
      tabOwned.removeEventListener('click', onTabOwned);
      tabCol.removeEventListener('click', onTabCol);
    };

    try {
      const data = await api.get('/audio', signal);
      if (signal.aborted) return;
      const owned     = (data.items || []).filter(a => a.is_owned);
      const collected = (data.items || []).filter(a => !a.is_owned);
      const items     = activeTab === 'owned' ? owned : collected;
      const libContent = document.getElementById('lib-content');
      if (!libContent) return;

      if (!items.length) {
        libContent.innerHTML = `<div class="empty-state">
          <span class="material-symbols-rounded">${activeTab === 'owned' ? 'music_off' : 'playlist_remove'}</span>
          <p>${activeTab === 'owned' ? 'Загрузите первый трек!' : 'Ваш сборник пуст'}</p>
        </div>`;
      } else {
        libContent.innerHTML = `<div class="audio-list">${items.map(a => audioCardHTML(a, activeTab === 'owned')).join('')}</div>`;
        attachCardListeners(libContent, items, activeTab === 'owned', signal, () => load());
      }
    } catch (e) {
      if (!signal.aborted) {
        const libContent = document.getElementById('lib-content');
        if (libContent) libContent.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">error</span><p>${escHtml(e.message)}</p></div>`;
      }
    }
  }

  await load();
}