'use strict';

const STORAGE_KEYS = {
  ACCESS:   'mx_access_token',
  REFRESH:  'mx_refresh_token',
  USERNAME: 'mx_username',
};

function persistTokens() {
  try {
    if (authState.accessToken)  localStorage.setItem(STORAGE_KEYS.ACCESS,   authState.accessToken);
    if (authState.refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH,  authState.refreshToken);
    if (authState.username)     localStorage.setItem(STORAGE_KEYS.USERNAME,  authState.username);
  } catch {}
}

function loadPersistedTokens() {
  try {
    authState.accessToken  = localStorage.getItem(STORAGE_KEYS.ACCESS)   || null;
    authState.refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH)  || null;
    authState.username     = localStorage.getItem(STORAGE_KEYS.USERNAME)  || null;
  } catch {}
}

function clearPersistedTokens() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS);
    localStorage.removeItem(STORAGE_KEYS.REFRESH);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
  } catch {}
}

function logout() {
  authState.accessToken  = null;
  authState.refreshToken = null;
  authState.username     = null;
  clearPersistedTokens();
  updateTopBar();
  navigate('auth');
}

function updateTopBar() {
  const userEl   = document.getElementById('top-bar-user');
  const avatarEl = document.getElementById('user-avatar');
  if (authState.accessToken && authState.username) {
    userEl.style.display = 'flex';
    avatarEl.textContent = authState.username.charAt(0).toUpperCase();
  } else {
    userEl.style.display = 'none';
  }
}