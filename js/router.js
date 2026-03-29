'use strict';

function navigate(view) {
  if (router.cleanupFn)        { router.cleanupFn(); router.cleanupFn = null; }
  if (router.abortController)  { router.abortController.abort(); }
  router.abortController = new AbortController();
  router.currentView = view;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  const app = document.getElementById('app');
  app.innerHTML = '';

  const sig = router.abortController.signal;

  switch (view) {
    case 'auth':    renderAuth(app, sig);    break;
    case 'search':  renderSearch(app, sig);  break;
    case 'library': renderLibrary(app, sig); break;
    case 'upload':  renderUpload(app, sig);  break;
  }
}