// -------------------------------------------------------
// pdfActions.js – PDF yükleme, sıralama, filtreleme, seçim
// -------------------------------------------------------

/* ---------- YÜKLEME ---------- */
async function selectPdfs() {
  try {
    const files = await Backend.selectPdfs();
    if (files && files.length > 0) _addPdfs(files);
  } catch (err) {
    setStatus('PDF yüklenirken hata: ' + err.message, 'busy');
    sendErrorToBackend('PDF_SELECT_FAIL', 'PDF dosyalari secilemedi', 'pdfActions.selectPdfs', err);
  }
}

function _addPdfs(newFiles) {
  const existing = new Set(AppState.pdfFiles.map(f => f.path));
  let added = 0;
  for (const f of newFiles) {
    if (!existing.has(f.path)) {
      AppState.pdfFiles.push(f);
      existing.add(f.path);
      added++;
    }
  }
  if (added === 0) return;
  AppState.customSort = false;
  $('sortSelect').value = 'date-desc';
  sortPdfs();
  updateUI();
  setStatus(added + ' PDF başarıyla yüklendi', 'ok');
  saveSession();
}

/* ---------- SIRALAMA ---------- */
function sortPdfs() {
  const val = $('sortSelect').value;
  if (val === 'custom') {
    AppState.customSort = true;
    renderList();
    return;
  }
  AppState.customSort = false;
  const [field, order] = val.split('-');
  AppState.pdfFiles.sort((a, b) => {
    let cmp = 0;
    if (field === 'name') cmp = a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' });
    else if (field === 'date') cmp = new Date(a.lastModified) - new Date(b.lastModified);
    else if (field === 'size') cmp = a.size - b.size;
    else if (field === 'page') cmp = (a.pageCount || 0) - (b.pageCount || 0);
    return order === 'asc' ? cmp : -cmp;
  });
  renderList();
}

/* ---------- FİLTRELEME ---------- */
function filterPdfs() {
  const q = $('searchInput').value.trim().toLowerCase();
  if (!q) {
    AppState.filteredIds = null;
    $('searchCount').textContent = '';
  } else {
    const m = AppState.pdfFiles.filter(f => f.name.toLowerCase().includes(q));
    AppState.filteredIds = new Set(m.map(f => f.id));
    $('searchCount').textContent = m.length + ' sonuç';
  }
  renderList();
}

function filterByCategory(cat) {
  AppState.activeCategory = cat;
  document.querySelectorAll('.category-item').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === (cat || ''));
  });
  renderList();
}

/* ---------- SEÇİM ---------- */
function toggleSelectAll() {
  const visible = getVisiblePdfs();
  const allSel = visible.every(f => AppState.selectedIds.has(f.id));
  const sa = $('selectAll');
  if (allSel) {
    visible.forEach(f => AppState.selectedIds.delete(f.id));
    sa.checked = false;
  } else {
    visible.forEach(f => AppState.selectedIds.add(f.id));
    sa.checked = true;
  }
  renderList();
}

function toggleSelect(id) {
  if (AppState.selectedIds.has(id)) AppState.selectedIds.delete(id);
  else AppState.selectedIds.add(id);
  renderList();
}

/* ---------- KALDIRMA ---------- */
function removeSelected() {
  if (AppState.selectedIds.size === 0) return;
  const count = AppState.selectedIds.size;
  AppState.pdfFiles = AppState.pdfFiles.filter(f => !AppState.selectedIds.has(f.id));
  AppState.selectedIds.clear();
  if (AppState.currentInfoFileId && !getFileById(AppState.currentInfoFileId)) closeInfoPanel();
  sortPdfs();
  updateUI();
  setStatus(count + ' PDF listeden kaldırıldı', 'ok');
  saveSession();
}

function removeSingle(id) {
  AppState.pdfFiles = AppState.pdfFiles.filter(f => f.id !== id);
  AppState.selectedIds.delete(id);
  if (AppState.currentInfoFileId === id) closeInfoPanel();
  sortPdfs();
  updateUI();
  saveSession();
}

/* ---------- KATEGORİ DEĞİŞTİR ---------- */
function changeCategory(id, cat) {
  const file = getFileById(id);
  if (file) {
    file.category = cat;
    renderList();
    saveSession();
  }
}
