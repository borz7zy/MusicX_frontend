'use strict';

function renderSearch(container, signal) {
  container.innerHTML = `
    <div class="view">
      <div class="section-header">
        <div class="section-title">Поиск музыки</div>
        <div class="section-sub">Поиск по публичным трекам</div>
      </div>
      <div class="search-wrap" style="margin-bottom:24px;">
        <span class="material-symbols-rounded">search</span>
        <input type="text" id="search-input" placeholder="Найти трек...">
      </div>
      <div id="search-results"></div>
    </div>`;

  const input     = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');
  let debounceTimer = null;

  function renderResults(items) {
    if (!items.length) {
      resultsEl.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">search_off</span><p>Ничего не найдено</p></div>`;
      return;
    }
    resultsEl.innerHTML = `<div class="audio-list">${items.map(a => audioCardHTML(a, false)).join('')}</div>`;
    attachCardListeners(resultsEl, items, false, signal);
  }

  const onInput = () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) { resultsEl.innerHTML = ''; return; }
    debounceTimer = setTimeout(async () => {
      resultsEl.innerHTML = '<div class="spinner"></div>';
      try {
        const data = await api.get(`/audio/search?q=${encodeURIComponent(q)}&limit=20`, signal);
        if (!signal.aborted) renderResults(data.items || []);
      } catch (e) {
        if (!signal.aborted) {
          resultsEl.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">error</span><p>${escHtml(e.message)}</p></div>`;
        }
      }
    }, 450);
  };

  input.addEventListener('input', onInput);

  router.cleanupFn = () => {
    input.removeEventListener('input', onInput);
    clearTimeout(debounceTimer);
  };
}