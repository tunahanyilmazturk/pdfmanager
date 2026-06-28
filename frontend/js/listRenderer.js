// -------------------------------------------------------
// listRenderer.js – PDF listesini render etme (list + grid)
// -------------------------------------------------------

function renderList() {
  const visible = getVisiblePdfs();
  const isGrid = AppState.viewMode === 'grid';
  $('pdfListContainer').className = 'pdf-list-container view-' + AppState.viewMode;

  if (AppState.pdfFiles.length === 0) {
    $('pdfList').innerHTML = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <h3>Henuz PDF yuklenmedi</h3>
        <p>PDF eklemek icin "PDF Yukle" butonuna tiklayin veya dosyalari surukleyin.</p>
      </div>`;
    updateInfoBar();
    return;
  }

  if (isGrid) {
    _renderGrid(visible);
  } else {
    _renderList(visible);
  }

  // Checkbox events
  $('pdfList').querySelectorAll('.chk-item').forEach(cb => {
    cb.addEventListener('change', function() { toggleSelect(this.dataset.id); });
  });

  // Row name click
  $('pdfList').querySelectorAll('.col-name[data-id]').forEach(el => {
    el.addEventListener('click', function() { toggleSelect(this.dataset.id); });
  });

  // Action buttons (list)
  $('pdfList').querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const a = this.dataset.action;
      const id = this.dataset.id;
      if (a === 'info') showInfoPanel(id);
      else if (a === 'print') printSingle(id);
      else if (a === 'remove') removeSingle(id);
    });
  });

  // Grid action buttons
  $('pdfList').querySelectorAll('.grid-info').forEach(el => {
    el.addEventListener('click', function(e) { e.stopPropagation(); showInfoPanel(this.dataset.id); });
  });
  $('pdfList').querySelectorAll('.grid-print').forEach(el => {
    el.addEventListener('click', function(e) { e.stopPropagation(); printSingle(this.dataset.id); });
  });
  $('pdfList').querySelectorAll('.grid-remove').forEach(el => {
    el.addEventListener('click', function(e) { e.stopPropagation(); removeSingle(this.dataset.id); });
  });

  // Surukle-birak (sadece list modunda)
  if (!isGrid) setupDragReorder();

  updateInfoBar();
}

function _renderList(visible) {
  let html = '';
  for (let idx = 0; idx < visible.length; idx++) {
    const f = visible[idx];
    const sel = AppState.selectedIds.has(f.id);
    const pages = f.pageCount || 0;
    const catColor = getCategoryColor(f.category);

    html += `
      <div class="pdf-item ${sel ? 'selected' : ''}" data-id="${f.id}">
        <label class="checkbox-wrapper">
          <input type="checkbox" class="chk-item" data-id="${f.id}" ${sel ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
        <span class="col-order">${idx + 1}</span>
        <span class="col-name" data-id="${f.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="name-text">${f.name}</span>
        </span>
        <span class="col-pages">${pages}</span>
        <span class="col-size">${formatSize(f.size)}</span>
        <span class="col-date" title="${formatDateFull(f.lastModified)}">${formatDateShort(f.lastModified)}</span>
        <span class="col-category"><span class="cat-badge ${!f.category ? 'none' : ''}" style="${f.category ? 'background:' + catColor : ''}">${f.category || '-'}</span></span>
        <span class="col-actions">
          <button class="btn-icon info-icon" data-action="info" data-id="${f.id}" title="Bilgi">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </button>
          <button class="btn-icon print-icon" data-action="print" data-id="${f.id}" title="Yazdir">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </button>
          <button class="btn-icon" data-action="remove" data-id="${f.id}" title="Kaldir">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </span>
      </div>`;
  }
  $('pdfList').innerHTML = html;
}

function _renderGrid(visible) {
  let html = '';
  for (let idx = 0; idx < visible.length; idx++) {
    const f = visible[idx];
    const sel = AppState.selectedIds.has(f.id);
    const pages = f.pageCount || 0;
    const catColor = getCategoryColor(f.category);

    html += `
      <div class="pdf-item ${sel ? 'selected' : ''}" data-id="${f.id}">
        <label class="checkbox-wrapper">
          <input type="checkbox" class="chk-item" data-id="${f.id}" ${sel ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
        <span class="col-name" data-id="${f.id}">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="name-text">${f.name}</span>
        </span>
        <div class="grid-meta">
          <span>${pages} sayfa</span>
          <span>${formatSize(f.size)}</span>
        </div>
        <div class="grid-actions">
          <button class="btn-icon info-icon grid-info" data-id="${f.id}" title="Bilgi">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </button>
          <button class="btn-icon print-icon grid-print" data-id="${f.id}" title="Yazdir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </button>
          <button class="btn-icon grid-remove" data-id="${f.id}" title="Kaldir" style="color:var(--danger)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>`;
  }
  $('pdfList').innerHTML = html;
}
