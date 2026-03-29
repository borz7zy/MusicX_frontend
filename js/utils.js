'use strict';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  el.innerHTML = `<span class="material-symbols-rounded" style="font-size:18px;">${icon}</span>${msg}`;
  const container = document.getElementById('toast-container');
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(24px)';
    el.style.transition = 'all .3s';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}