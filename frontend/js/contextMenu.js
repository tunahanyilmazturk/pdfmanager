// -------------------------------------------------------
// contextMenu.js – Sag tik menusu, grid modu, drag-out, kisayollar
// -------------------------------------------------------

/* ==================== SAG TIK MENUSU ==================== */

function showContextMenu(e, fileId) {
  e.preventDefault();
  AppState.contextMenuTarget = fileId;
  const menu = $('contextMenu');
  const file = getFileById(fileId);
  if (!file) return;

  // Menuye tiklanan dosyanin adini yaz
  $('contextMenuFileName').textContent = file.name;
  $('contextMenuFileName').title = file.name;

  // Konumlandir
  const maxX = window.innerWidth - 220;
  const maxY = window.innerHeight - 280;
  let x = Math.min(e.clientX, maxX);
  let y = Math.min(e.clientY, maxY);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  menu.classList.add('show');

  // Herhangi bir yere tiklayinca kapat
  setTimeout(() => {
    document.addEventListener('click', _closeContextMenu, { once: true });
  }, 0);
}

function _closeContextMenu() {
  $('contextMenu').classList.remove('show');
  AppState.contextMenuTarget = null;
}

function _getContextFile() {
  return getFileById(AppState.contextMenuTarget);
}

// Menu aksiyonlari
function contextShowInfo() {
  const f = _getContextFile(); if (f) showInfoPanel(f.id);
  _closeContextMenu();
}
function contextPrint() {
  const f = _getContextFile(); if (f) printSingle(f.id);
  _closeContextMenu();
}
function contextRemove() {
  const f = _getContextFile(); if (f) removeSingle(f.id);
  _closeContextMenu();
}
function contextSelectOnly() {
  const f = _getContextFile(); if (f) { AppState.selectedIds.clear(); AppState.selectedIds.add(f.id); renderList(); }
  _closeContextMenu();
}
function contextOpenFile() {
  const f = _getContextFile(); if (f) { /* electron acma - shell.openPath */ }
  _closeContextMenu();
}
function contextCopyName() {
  const f = _getContextFile(); if (f) {
    navigator.clipboard.writeText(f.name);
    setStatus('Dosya adi kopyalandi: ' + f.name, 'ok');
  }
  _closeContextMenu();
}

/* ==================== GRID / LIST MODU ==================== */

function toggleViewMode() {
  AppState.viewMode = AppState.viewMode === 'list' ? 'grid' : 'list';
  const isList = AppState.viewMode === 'list';
  const svg = isList
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
  const label = isList ? 'Gorunum' : 'Liste';
  $('viewModeBtn').innerHTML = svg + '<span class="btn-header-label">' + label + '</span>';
  $('viewModeBtn').title = isList ? 'Grid Gorunum' : 'Liste Gorunum';
  $('pdfListContainer').className = 'pdf-list-container view-' + AppState.viewMode;
  renderList();
}

/* ==================== KISAYOLLAR PANELI ==================== */

function showShortcutsModal() {
  $('shortcutsModal').classList.add('active');
}
function closeShortcutsModal() {
  $('shortcutsModal').classList.remove('active');
}

/* ==================== DRAG-OUT (PDF'I DISARI AKTAR) ==================== */

function setupDragOut() {
  const list = $('pdfList');
  list.addEventListener('dragstart', function(e) {
    const item = e.target.closest('.pdf-item');
    if (!item) return;
    const id = item.dataset.id;
    const file = getFileById(id);
    if (!file) return;

    // PDF'i disari suruklemek icin dosya yolunu ekle
    e.dataTransfer.setData('text/uri-list', 'file:///' + file.path.replace(/\\/g, '/'));
    e.dataTransfer.setData('text/plain', file.path);
    e.dataTransfer.effectAllowed = 'copy';
  });
}

/* ==================== SAYFA SAYISI GUNCELLE ==================== */

async function refreshPageCounts() {
  const stale = AppState.pdfFiles.filter(f => !f.pageCount || f.pageCount === 0);
  if (stale.length === 0) return;
  setStatus(stale.length + ' PDF sayfa sayisi hesaplaniyor...', 'ok');
  let updated = 0;
  for (const f of stale) {
    try {
      const info = await Backend.getPdfInfo(f.path);
      if (info && info.pageCount) {
        f.pageCount = info.pageCount;
        updated++;
      }
    } catch (_) {}
  }
  if (updated > 0) {
    renderList();
    updateInfoBar();
    saveSession();
    setStatus(updated + ' PDF sayfa sayisi guncellendi', 'ok');
  }
}
