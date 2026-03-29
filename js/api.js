'use strict';

async function apiRequest(method, path, body = null, signal = null, isFormData = false) {
  const headers = {};
  if (authState.accessToken) headers['Authorization'] = `Bearer ${authState.accessToken}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const opts = { method, headers, signal };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  let res = await fetch(API_BASE + path, opts);

  if (res.status === 401 && authState.refreshToken) {
    try {
      const ref = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: authState.refreshToken }),
      });
      if (ref.ok) {
        const data = await ref.json();
        authState.accessToken = data.access_token;
        authState.refreshToken = data.refresh_token;
        persistTokens();
        headers['Authorization'] = `Bearer ${authState.accessToken}`;
        opts.headers = headers;
        if (body && !isFormData) opts.body = JSON.stringify(body);
        res = await fetch(API_BASE + path, opts);
      } else {
        logout();
        throw new Error('Сессия истекла, войдите снова');
      }
    } catch (e) {
      logout();
      throw e;
    }
  }

  if (!res.ok) {
    let errMsg = `Ошибка ${res.status}`;
    try { const j = await res.json(); errMsg = j.error || errMsg; } catch {}
    throw new Error(errMsg);
  }

  if (res.status === 204) return null;
  return res.json();
}

const api = {
  get:    (path, signal) => apiRequest('GET', path, null, signal),
  post:   (path, body, signal) => apiRequest('POST', path, body, signal),
  patch:  (path, body, signal) => apiRequest('PATCH', path, body, signal),
  delete: (path, signal) => apiRequest('DELETE', path, null, signal),
  upload: (path, formData, signal) => apiRequest('POST', path, formData, signal, true),
};