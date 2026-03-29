'use strict';

function renderUpload(container, signal) {
  if (!authState.accessToken) {
    container.innerHTML = `
      <div class="view">
        <div class="section-header"><div class="section-title">Загрузить трек</div></div>
        <div class="empty-state"><span class="material-symbols-rounded">lock</span><p>Войдите, чтобы загружать треки</p></div>
        <div style="text-align:center;margin-top:16px;"><button class="btn btn-filled" id="btn-go-auth2">Войти</button></div>
      </div>`;
    const btn = document.getElementById('btn-go-auth2');
    const onClick = () => navigate('auth');
    btn.addEventListener('click', onClick);
    router.cleanupFn = () => btn.removeEventListener('click', onClick);
    return;
  }

  let selectedFile = null;

  container.innerHTML = `
    <div class="view">
      <div class="section-header">
        <div class="section-title">Загрузить трек</div>
        <div class="section-sub">Поддерживаются форматы MP3, WAV, FLAC, OGG</div>
      </div>
      <div class="card form-grid">
        <div class="dropzone" id="dropzone" tabindex="0">
          <div class="dz-icon"><span class="material-symbols-rounded">audio_file</span></div>
          <div class="dz-title">Перетащите файл сюда</div>
          <div class="dz-sub">или нажмите для выбора</div>
          <input type="file" id="file-input" accept="audio/*" style="display:none;" />
        </div>
        <div id="file-info" style="display:none;"></div>
        <div class="field"><label>Название</label><input id="up-title" type="text" placeholder="Название трека" /></div>
        <div class="field"><label>Описание (необязательно)</label><input id="up-desc" type="text" placeholder="О треке..." /></div>
        <div id="up-progress" style="display:none;">
          <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
          <p style="font-size:.8rem;color:var(--on-surface-dim);text-align:center;margin-top:4px;" id="progress-label">Загрузка...</p>
        </div>
        <button class="btn btn-filled btn-full" id="btn-upload" disabled>
          <span class="material-symbols-rounded">cloud_upload</span> Загрузить
        </button>
      </div>
    </div>`;

  const dropzone  = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const fileInfo  = document.getElementById('file-info');
  const uploadBtn = document.getElementById('btn-upload');

  function setFile(file) {
    if (!file || !file.type.startsWith('audio/')) { toast('Только аудио файлы!', 'error'); return; }
    selectedFile = file;
    fileInfo.style.display = 'block';
    fileInfo.innerHTML = `
      <div class="file-badge">
        <span class="material-symbols-rounded">audio_file</span>
        <div class="file-badge-info">
          <div class="file-badge-name">${escHtml(file.name)}</div>
          <div class="file-badge-size">${formatSize(file.size)}</div>
        </div>
        <button class="icon-btn danger" id="btn-clear-file"><span class="material-symbols-rounded">close</span></button>
      </div>`;
    uploadBtn.disabled = false;
    document.getElementById('up-title').value = file.name.replace(/\.[^.]+$/, '');
    document.getElementById('btn-clear-file').addEventListener('click', () => {
      selectedFile = null;
      fileInfo.style.display = 'none';
      fileInfo.innerHTML = '';
      uploadBtn.disabled = true;
    });
  }

  const onDragover  = (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); };
  const onDragleave = () => dropzone.classList.remove('drag-over');
  const onDrop      = (e) => { e.preventDefault(); dropzone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); };
  const onDzClick   = () => fileInput.click();
  const onFileChange = () => { if (fileInput.files[0]) setFile(fileInput.files[0]); };

  dropzone.addEventListener('dragover',   onDragover);
  dropzone.addEventListener('dragleave',  onDragleave);
  dropzone.addEventListener('drop',       onDrop);
  dropzone.addEventListener('click',      onDzClick);
  fileInput.addEventListener('change',    onFileChange);

  const onUpload = async () => {
    if (!selectedFile) return;
    const title = document.getElementById('up-title').value.trim() || selectedFile.name;
    const desc  = document.getElementById('up-desc').value.trim();

    uploadBtn.disabled = true;
    const progressWrap  = document.getElementById('up-progress');
    const progressFill  = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');
    progressWrap.style.display = 'block';

    try {
      const qs = `?title=${encodeURIComponent(title)}${desc ? '&description=' + encodeURIComponent(desc) : ''}`;
      const formData = new FormData();
      formData.append('file', selectedFile);

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/audio${qs}`);
        if (authState.accessToken) xhr.setRequestHeader('Authorization', `Bearer ${authState.accessToken}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = pct + '%';
            progressLabel.textContent = `Загружено ${pct}%`;
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else {
            try { const err = JSON.parse(xhr.responseText); reject(new Error(err.error || 'Ошибка')); }
            catch { reject(new Error(`Ошибка ${xhr.status}`)); }
          }
        };
        xhr.onerror = () => reject(new Error('Сетевая ошибка'));
        xhr.onabort = () => reject(new Error('Отменено'));
        if (signal.aborted) { xhr.abort(); return; }
        signal.addEventListener('abort', () => xhr.abort(), { once: true });
        xhr.send(formData);
      });

      progressFill.style.width = '100%';
      progressLabel.textContent = 'Готово!';
      toast('Трек загружен!', 'success');
      setTimeout(() => navigate('library'), 800);
    } catch (e) {
      if (!signal.aborted) {
        toast('Ошибка загрузки: ' + e.message, 'error');
        uploadBtn.disabled = false;
        progressWrap.style.display = 'none';
      }
    }
  };

  uploadBtn.addEventListener('click', onUpload);

  router.cleanupFn = () => {
    dropzone.removeEventListener('dragover',  onDragover);
    dropzone.removeEventListener('dragleave', onDragleave);
    dropzone.removeEventListener('drop',      onDrop);
    dropzone.removeEventListener('click',     onDzClick);
    fileInput.removeEventListener('change',   onFileChange);
    uploadBtn.removeEventListener('click',    onUpload);
  };
}