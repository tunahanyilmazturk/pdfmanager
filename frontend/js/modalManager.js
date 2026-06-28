// -------------------------------------------------------
// modalManager.js – Modal ac/kapat, kategori, birlestirme, ayarlar
// -------------------------------------------------------

/* ---------- KATEGORI ---------- */
function renderCategories() {
  let html = `<div class="category-item ${!AppState.activeCategory ? 'active' : ''}" data-cat="">
    <span class="cat-dot all"></span>Tum PDF'ler (${AppState.pdfFiles.length})</div>`;
  for (const c of AppState.categories) {
    const count = AppState.pdfFiles.filter(f => f.category === c.name).length;
    html += `<div class="category-item ${AppState.activeCategory === c.name ? 'active' : ''}" data-cat="${c.name}">
      <span class="cat-dot" style="background:${c.color}"></span>${c.name} (${count})
      <span class="cat-remove" data-cat="${c.name}" title="Kategoriyi sil" style="margin-left:auto;opacity:0.4;cursor:pointer;font-size:11px;">&times;</span>
    </div>`;
  }
  $('categoryList').innerHTML = html;

  $('categoryList').querySelectorAll('.category-item').forEach(el => {
    el.addEventListener('click', function(e) {
      if (e.target.closest('.cat-remove')) return;
      filterByCategory(this.dataset.cat || '');
    });
  });

  // Kategori silme
  $('categoryList').querySelectorAll('.cat-remove').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const catName = this.dataset.cat;
      _showConfirm('Kategoriyi Sil', "'" + catName + "' kategorisini ve tum PDF atamalarini kaldirmak istediginize emin misiniz?", async () => {
        AppState.categories = AppState.categories.filter(c => c.name !== catName);
        AppState.pdfFiles.forEach(f => { if (f.category === catName) f.category = ''; });
        if (AppState.activeCategory === catName) { AppState.activeCategory = ''; }
        renderCategories();
        renderList();
        try { await Backend.saveCategories(AppState.categories); } catch (_) {}
        saveSession();
        setStatus('Kategori silindi: ' + catName, 'ok');
      });
    });
  });
}

function showAddCategoryModal() {
  $('categoryNameInput').value = '';
  document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
  document.querySelector('.color-option')?.classList.add('selected');
  $('categoryModal').classList.add('active');
  setTimeout(() => $('categoryNameInput').focus(), 100);
}

function closeCategoryModal() { $('categoryModal').classList.remove('active'); }

async function saveCategory() {
  const name = $('categoryNameInput').value.trim();
  if (!name) { setStatus('Kategori adi girin', 'busy'); return; }
  if (AppState.categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    setStatus('Bu kategori zaten var', 'busy'); return;
  }
  const selected = document.querySelector('.color-option.selected');
  const color = selected ? selected.dataset.color : '#2563eb';
  AppState.categories.push({ name, color });
  renderCategories();
  try { await Backend.saveCategories(AppState.categories); } catch (_) {}
  closeCategoryModal();
  setStatus('Kategori eklendi: ' + name, 'ok');
}

/* ---------- BIRLESTIRME (pdf-lib ile) ---------- */
function showMergeModal() {
  const files = AppState.selectedIds.size > 0
    ? AppState.pdfFiles.filter(f => AppState.selectedIds.has(f.id))
    : AppState.pdfFiles;
  if (files.length < 2) { setStatus('Birlestirme icin en az 2 PDF secin', 'busy'); return; }
  AppState.mergeItems = files.map(f => ({ ...f }));
  $('mergeFileName').value = 'birlestirilmis.pdf';
  _renderMergeList();
  $('mergeModal').classList.add('active');
}

function closeMergeModal() { $('mergeModal').classList.remove('active'); }

function _renderMergeList() {
  let html = '';
  for (let i = 0; i < AppState.mergeItems.length; i++) {
    const f = AppState.mergeItems[i];
    html += `<div class="merge-item" draggable="true" data-idx="${i}">
      <span class="drag-handle">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
      </span>
      <span class="merge-name">${i+1}. ${f.name}</span>
      <span class="merge-pages">${f.pageCount || '?'} sayfa</span>
      <span class="merge-remove" data-idx="${i}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </span>
    </div>`;
  }
  $('mergeList').innerHTML = html;
  $('mergeList').querySelectorAll('.merge-remove').forEach(el => {
    el.addEventListener('click', function() {
      AppState.mergeItems.splice(parseInt(this.dataset.idx), 1);
      if (AppState.mergeItems.length < 2) { setStatus('En az 2 PDF gerekli', 'busy'); closeMergeModal(); return; }
      _renderMergeList();
    });
  });
  // Drag reorder
  $('mergeList').querySelectorAll('.merge-item').forEach(el => {
    el.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', this.dataset.idx);
      setTimeout(() => this.style.opacity = '0.5', 0);
    });
    el.addEventListener('dragend', function() { this.style.opacity = '1'; });
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', function(e) {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      const to = parseInt(this.dataset.idx);
      if (from === to) return;
      const [item] = AppState.mergeItems.splice(from, 1);
      AppState.mergeItems.splice(to, 0, item);
      _renderMergeList();
    });
  });
}

async function saveMergePdf() {
  const paths = AppState.mergeItems.map(f => f.path);
  _showPrintModal(); // reuse print modal for progress
  $('modalStatus').textContent = 'PDF\'ler birlestiriliyor...';
  $('progressFileName').textContent = AppState.mergeItems.length + ' PDF birlestiriliyor';

  try {
    const result = await Backend.mergePdfs(paths);
    if (result.success) {
      $('modalStatus').textContent = 'Birlestirme basarili! (' + result.pageCount + ' sayfa)';
      setStatus('PDF\'ler birlestirildi: ' + (result.path || ''), 'ok');
      closeMergeModal();
    } else if (result.cancelled) {
      setStatus('Birlestirme iptal edildi', 'ok');
    } else {
      $('modalStatus').textContent = 'Hata: ' + (result.error || '');
      setStatus('Birlestirme hatasi', 'busy');
      sendErrorToBackend('MERGE_FAIL', result.error || '', 'modalManager.saveMergePdf');
    }
  } catch (err) {
    $('modalStatus').textContent = 'Hata: ' + err.message;
    setStatus('Birlestirme hatasi', 'busy');
    sendErrorToBackend('MERGE_FAIL', err.message, 'modalManager.saveMergePdf', err);
  }
  setTimeout(_hidePrintModal, 2000);
}

/* ---------- PDF Sayfa Ayirma ---------- */
function showSplitModal() {
  if (AppState.selectedIds.size !== 1) {
    setStatus('Lutfen 1 PDF secin', 'busy');
    return;
  }
  const file = AppState.pdfFiles.find(f => AppState.selectedIds.has(f.id));
  if (!file) return;
  $('splitFileId').value = file.id;
  $('splitFileName').textContent = file.name + ' (' + (file.pageCount || '?') + ' sayfa)';
  $('splitPageRange').value = '1-' + (file.pageCount || '?');
  hideModal('pdfActionsMenu');
  $('splitModal').classList.add('active');
}

function closeSplitModal() { $('splitModal').classList.remove('active'); }

async function saveSplitPdf() {
  const fileId = $('splitFileId').value;
  const file = AppState.pdfFiles.find(f => f.id === fileId);
  if (!file) return;

  // pageRanges: "1-3,5-7" -> [[0,2],[4,6]]
  const rangeStr = $('splitPageRange').value.trim();
  const parts = rangeStr.split(',').map(s => s.trim());
  const ranges = [];
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      ranges.push([parseInt(m[1]) - 1, parseInt(m[2]) - 1]);
    } else {
      const n = parseInt(p);
      if (!isNaN(n)) ranges.push([n - 1, n - 1]);
    }
  }
  if (ranges.length === 0) {
    setStatus('Gecerli sayfa araligi girin (ornek: 1-3,5-7)', 'busy');
    return;
  }

  _showPrintModal();
  $('modalStatus').textContent = 'Sayfalar ayriliyor...';
  try {
    const result = await Backend.splitPdfPages(file.path, ranges);
    if (result.success) {
      $('modalStatus').textContent = 'Sayfalar ayrildi!';
      setStatus('Sayfalar ayrildi (' + result.pageCount + ' sayfa)', 'ok');
      closeSplitModal();
    } else if (result.cancelled) {
      setStatus('Islem iptal edildi', 'ok');
    } else {
      $('modalStatus').textContent = 'Hata: ' + (result.error || '');
      sendErrorToBackend('MERGE_FAIL', result.error || '', 'modalManager.saveSplitPdf');
    }
  } catch (err) {
    $('modalStatus').textContent = 'Hata: ' + err.message;
    sendErrorToBackend('MERGE_FAIL', err.message, 'modalManager.saveSplitPdf', err);
  }
  setTimeout(_hidePrintModal, 2000);
}

/* ---------- PDF Sayfa Silme ---------- */
function showDeletePagesModal() {
  if (AppState.selectedIds.size !== 1) {
    setStatus('Lutfen 1 PDF secin', 'busy');
    return;
  }
  const file = AppState.pdfFiles.find(f => AppState.selectedIds.has(f.id));
  if (!file) return;
  $('delPagesFileId').value = file.id;
  $('delPagesFileName').textContent = file.name + ' (' + (file.pageCount || '?') + ' sayfa)';
  $('delPagesInput').value = '';
  hideModal('pdfActionsMenu');
  $('deletePagesModal').classList.add('active');
}

function closeDeletePagesModal() { $('deletePagesModal').classList.remove('active'); }

async function saveDeletePages() {
  const fileId = $('delPagesFileId').value;
  const file = AppState.pdfFiles.find(f => f.id === fileId);
  if (!file) return;

  const input = $('delPagesInput').value.trim();
  // "1,3,5" -> [0,2,4]
  const indices = input.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n) && n >= 0);
  if (indices.length === 0) {
    setStatus('Gecerli sayfa numaralari girin (ornek: 1,3,5)', 'busy');
    return;
  }

  _showPrintModal();
  $('modalStatus').textContent = 'Sayfalar siliniyor...';
  try {
    const result = await Backend.deletePdfPages(file.path, indices, null);
    if (result.success) {
      $('modalStatus').textContent = 'Sayfalar silindi!';
      setStatus('Sayfalar silindi (' + result.pageCount + ' sayfa kaldi)', 'ok');
      closeDeletePagesModal();
    } else if (result.cancelled) {
      setStatus('Islem iptal edildi', 'ok');
    } else {
      $('modalStatus').textContent = 'Hata: ' + (result.error || '');
      sendErrorToBackend('MERGE_FAIL', result.error || '', 'modalManager.saveDeletePages');
    }
  } catch (err) {
    $('modalStatus').textContent = 'Hata: ' + err.message;
    sendErrorToBackend('MERGE_FAIL', err.message, 'modalManager.saveDeletePages', err);
  }
  setTimeout(_hidePrintModal, 2000);
}

/* ---------- PDF ICINDE ARAMA ---------- */
let _searchResults = [];
async function showSearchModal() {
  if (AppState.selectedIds.size === 0) {
    setStatus('Lutfen arama yapmak icin bir PDF secin', 'busy');
    return;
  }
  const ids = [...AppState.selectedIds];
  if (ids.length > 1) {
    // Coklu secim - tumunde ara
  }
  $('searchQuery').value = '';
  $('searchResultsBody').innerHTML = '<p style="color:var(--text-muted);padding:12px 0;font-size:12px">Arama yapmak icin bir kelime girin.</p>';
  $('searchModal').classList.add('active');
  setTimeout(() => $('searchQuery').focus(), 100);
}

function closeSearchModal() { $('searchModal').classList.remove('active'); _searchResults = []; }

async function executeSearch() {
  const q = $('searchQuery').value.trim();
  if (!q) return;

  const ids = [...AppState.selectedIds];
  let allResults = [];

  $('searchResultsBody').innerHTML = '<p style="color:var(--text-muted);padding:12px 0;font-size:12px">Araniyor...</p>';

  for (const id of ids) {
    const file = AppState.pdfFiles.find(f => f.id === id);
    if (!file) continue;
    try {
      const res = await Backend.searchInPdf(file.path, q);
      if (Array.isArray(res)) {
        allResults.push({ file: file.name, results: res, id: file.id });
      }
    } catch (err) {
      allResults.push({ file: file.name, results: [], error: err.message });
    }
  }

  _searchResults = allResults;
  _renderSearchResults(allResults, q);
}

function _renderSearchResults(data, query) {
  if (data.length === 0) {
    $('searchResultsBody').innerHTML = '<p style="color:var(--text-muted);padding:12px 0;font-size:12px">Sonuc bulunamadi.</p>';
    return;
  }

  let html = '';
  let total = 0;
  for (const item of data) {
    total += item.results.length;
    html += `<div class="search-file-group">
      <div class="search-file-name">${item.file}</div>`;
    if (item.error) {
      html += `<div class="search-error">Hata: ${item.error}</div>`;
    } else if (item.results.length === 0) {
      html += `<div class="search-no-result">Eslesme bulunamadi</div>`;
    } else {
      for (const r of item.results) {
        html += `<div class="search-result-item">
          <span class="search-page">Sayfa ${r.page}:</span>
          <span class="search-snippet">${r.snippet.replace(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '<mark>$&</mark>')}</span>
        </div>`;
      }
    }
    html += '</div>';
  }
  $('searchResultsCount').textContent = total + ' sonuc';
  $('searchResultsBody').innerHTML = html;
}

/* ---------- PDF AKSIYON MENUSU ---------- */
function showPdfActionsMenu() {
  if (AppState.selectedIds.size === 0) {
    setStatus('Lutfen en az 1 PDF secin', 'busy');
    return;
  }
  $('pdfActionsMenu').classList.add('active');
}
function hideModal(id) {
  $(id).classList.remove('active');
}

/* ---------- YARDIMCI ---------- */
function _updateViewBtn() {
  const isList = AppState.viewMode === 'list';
  const svg = isList
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
  const label = isList ? 'Gorunum' : 'Liste';
  $('viewModeBtn').innerHTML = svg + '<span class="btn-header-label">' + label + '</span>';
  $('viewModeBtn').title = isList ? 'Grid Gorunum' : 'Liste Gorunum';
}

/* ---------- AYARLAR ---------- */
function showSettingsModal() {
  // Yukle
  $('rememberSession').checked = localStorage.getItem('rememberSession') !== 'false';
  $('silentPrint').checked = localStorage.getItem('silentPrint') !== 'false';
  $('gridDefault').checked = localStorage.getItem('gridDefault') === 'true';
  $('defaultCopies').value = localStorage.getItem('defaultCopies') || '1';
  $('defaultPaperSize').value = localStorage.getItem('defaultPaperSize') || 'A4';
  const currentTheme = localStorage.getItem('theme') || 'light';
  $('themeSelect').value = currentTheme;
  $('langSelect').value = localStorage.getItem('lang') || 'tr';

  // Veri yolunu goster
  Backend.getDataPath().then(p => {
    $('settingsDataPath').textContent = p;
  }).catch(() => {
    $('settingsDataPath').textContent = 'alinamadi';
  });

  $('settingsModal').classList.add('active');
}

function saveSettings() {
  localStorage.setItem('rememberSession', $('rememberSession').checked ? 'true' : 'false');
  localStorage.setItem('silentPrint', $('silentPrint').checked ? 'true' : 'false');
  localStorage.setItem('gridDefault', $('gridDefault').checked ? 'true' : 'false');
  localStorage.setItem('defaultCopies', $('defaultCopies').value);
  localStorage.setItem('defaultPaperSize', $('defaultPaperSize').value);
  localStorage.setItem('theme', $('themeSelect').value);
  localStorage.setItem('lang', $('langSelect').value);
  applyTheme($('themeSelect').value);

  // Grid varsayilanini uygula
  if ($('gridDefault').checked && AppState.viewMode === 'list') {
    AppState.viewMode = 'grid';
  } else if (!$('gridDefault').checked && AppState.viewMode === 'grid') {
    AppState.viewMode = 'list';
  }
  _updateViewBtn();
  renderList();

  $('settingsModal').classList.remove('active');
  setStatus('Ayarlar kaydedildi', 'ok');
}

function closeSettingsModal() {
  $('settingsModal').classList.remove('active');
}

function resetDefaults() {
  _showConfirm('Ayarlari Sifirla', 'Tum ayarlar varsayilan degerlerine doner. PDF listeniz ve kategorileriniz etkilenmez.', () => {
    localStorage.removeItem('rememberSession');
    localStorage.removeItem('silentPrint');
    localStorage.removeItem('gridDefault');
    localStorage.removeItem('defaultCopies');
    localStorage.removeItem('defaultPaperSize');
    localStorage.removeItem('theme');
    localStorage.removeItem('lang');
    applyTheme('light');
    setStatus('Ayarlar varsayilana dondu', 'ok');
    showSettingsModal();
  });
}

function clearAllData() {
  _showConfirm('Tum Verileri Temizle', 'Tum PDF listesi, kategoriler ve ayarlar silinecek. Devam etmek istediginize emin misiniz?', async () => {
    AppState.pdfFiles = [];
    AppState.selectedIds.clear();
    AppState.categories = [];
    AppState.filteredIds = null;
    AppState.activeCategory = '';
    closeInfoPanel();
    try { await Backend.saveSession(null); } catch (_) {}
    try { await Backend.saveCategories([]); } catch (_) {}
    localStorage.clear();
    applyTheme('light');
    renderCategories();
    updateUI();
    setStatus('Tum veriler temizlendi', 'ok');
  });
}

/* ---------- ONAY MODAL ---------- */
function _showConfirm(title, msg, cb) {
  $('confirmTitle').textContent = title;
  $('confirmMessage').textContent = msg;
  AppState.confirmCallback = cb;
  $('confirmModal').classList.add('active');
}

/* ---------- TEMA ---------- */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    $('themeSelect').value = 'dark';
  } else {
    document.documentElement.removeAttribute('data-theme');
    $('themeSelect').value = 'light';
  }
}

function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
}
