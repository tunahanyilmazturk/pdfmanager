// -------------------------------------------------------
// sessionManager.js – Oturum kaydetme / yükleme
// -------------------------------------------------------

async function saveSession() {
  try {
    const remember = localStorage.getItem('rememberSession') !== 'false';
    if (!remember) return;
    const data = {
      files: AppState.pdfFiles.map(f => ({
        path: f.path, name: f.name, size: f.size,
        lastModified: f.lastModified, pageCount: f.pageCount, category: f.category,
      })),
      selectedPaths: [...AppState.selectedIds]
        .map(id => { const f = getFileById(id); return f ? f.path : null; })
        .filter(Boolean),
      activeCategory: AppState.activeCategory,
      sortValue: $('sortSelect').value,
      timestamp: Date.now(),
    };
    await Backend.saveSession(data);
  } catch (err) {
    sendErrorToBackend('SESSION_SAVE_FAIL', 'Oturum kaydedilemedi', 'sessionManager.saveSession', err);
  }
}

async function loadSession() {
  try {
    const sess = await Backend.loadSession();
    if (!sess || !sess.files || sess.files.length === 0) return;
    const valid = sess.files.map(f => ({
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 8),
      path: f.path, name: f.name, size: f.size,
      lastModified: f.lastModified, pageCount: f.pageCount || 0, category: f.category || '',
    }));
    if (valid.length === 0) return;
    AppState.pdfFiles = valid;
    if (sess.sortValue) {
      $('sortSelect').value = sess.sortValue;
      if (sess.sortValue === 'custom') AppState.customSort = true;
    }
    if (sess.activeCategory) AppState.activeCategory = sess.activeCategory;
    if (sess.selectedPaths) {
      for (const p of sess.selectedPaths) {
        const f = AppState.pdfFiles.find(ff => ff.path === p);
        if (f) AppState.selectedIds.add(f.id);
      }
    }
    renderCategories();
    sortPdfs();
    updateUI();
    if (AppState.pdfFiles.length > 0) setStatus('Önceki oturum yüklendi (' + AppState.pdfFiles.length + ' PDF)', 'ok');
  } catch (err) {
    sendErrorToBackend('SESSION_LOAD_FAIL', 'Oturum yuklenemedi', 'sessionManager.loadSession', err);
  }
}
