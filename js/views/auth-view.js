'use strict';

function renderAuth(container, signal) {
  if (authState.accessToken) {
    container.innerHTML = `
      <div class="auth-wrap"><div class="auth-card">
        <div class="auth-logo">
          <div class="brand-icon"><span class="material-symbols-rounded">music_note</span></div>
          <h1>Вы вошли</h1>
          <p style="color:var(--on-surface-dim);margin-top:8px;font-size:.9rem;">Привет, <strong>${escHtml(authState.username)}</strong>!</p>
        </div>
        <button class="btn btn-outlined btn-full" id="btn-do-logout">Выйти из аккаунта</button>
      </div></div>`;
    const btn = document.getElementById('btn-do-logout');
    const onLogout = () => logout();
    btn.addEventListener('click', onLogout);
    router.cleanupFn = () => btn.removeEventListener('click', onLogout);
    return;
  }

  let tab = 'login';

  function render() {
    container.innerHTML = `
      <div class="auth-wrap"><div class="auth-card view">
        <div class="auth-logo">
          <div class="brand-icon"><span class="material-symbols-rounded">music_note</span></div>
          <h1>MusicX</h1>
        </div>
        <div class="tabs">
          <button class="tab-btn ${tab === 'login' ? 'active' : ''}" id="tab-login">Войти</button>
          <button class="tab-btn ${tab === 'register' ? 'active' : ''}" id="tab-reg">Регистрация</button>
        </div>
        ${tab === 'login' ? `
          <div class="form-grid" id="auth-form">
            <div class="field"><label>Логин</label><input id="f-username" type="text" placeholder="username" /></div>
            <div class="field"><label>Пароль</label><input id="f-password" type="password" placeholder="••••••••" /></div>
            <button class="btn btn-filled btn-full" id="btn-submit">Войти</button>
          </div>` : `
          <div class="form-grid" id="auth-form">
            <div class="field"><label>Логин</label><input id="f-username" type="text" placeholder="username" /></div>
            <div class="field"><label>Email</label><input id="f-email" type="email" placeholder="you@example.com" /></div>
            <div class="field"><label>Пароль</label><input id="f-password" type="password" placeholder="min 8 символов" /></div>
            <button class="btn btn-filled btn-full" id="btn-submit">Зарегистрироваться</button>
          </div>`}
      </div></div>`;

    const tabLogin = document.getElementById('tab-login');
    const tabReg   = document.getElementById('tab-reg');
    const onTabLogin = () => { tab = 'login';    render(); };
    const onTabReg   = () => { tab = 'register'; render(); };
    tabLogin.addEventListener('click', onTabLogin);
    tabReg.addEventListener('click', onTabReg);

    const submitBtn = document.getElementById('btn-submit');
    const onSubmit = async () => {
      submitBtn.disabled = true;
      const username = document.getElementById('f-username').value.trim();
      const password = document.getElementById('f-password').value;
      try {
        if (tab === 'login') {
          const data = await apiRequest('POST', '/auth/token', { username, password }, signal);
          authState.accessToken  = data.access_token;
          authState.refreshToken = data.refresh_token;
          authState.username     = username;
          persistTokens();
          updateTopBar();
          toast('Добро пожаловать!', 'success');
          navigate('search');
        } else {
          const email = document.getElementById('f-email').value.trim();
          await apiRequest('POST', '/auth/register', { username, email, password }, signal);
          toast('Аккаунт создан! Войдите.', 'success');
          tab = 'login';
          render();
        }
      } catch (e) {
        if (!signal.aborted) { toast(e.message, 'error'); submitBtn.disabled = false; }
      }
    };
    submitBtn.addEventListener('click', onSubmit);

    const onKeydown = (e) => { if (e.key === 'Enter') onSubmit(); };
    document.getElementById('auth-form').addEventListener('keydown', onKeydown);

    router.cleanupFn = () => {
      tabLogin.removeEventListener('click', onTabLogin);
      tabReg.removeEventListener('click', onTabReg);
      submitBtn.removeEventListener('click', onSubmit);
    };
  }

  render();
}