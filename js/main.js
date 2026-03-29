'use strict';

function init() {
  loadPersistedTokens();
  updateTopBar();

  setupPlayerListeners();

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });

  document.getElementById('btn-logout').addEventListener('click', () => logout());

  navigate('search');
}

init();