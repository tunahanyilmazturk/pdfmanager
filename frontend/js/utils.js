// -------------------------------------------------------
// utils.js – Formatlama, yardımcı fonksiyonlar
// -------------------------------------------------------
const $ = (id) => document.getElementById(id);

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + u[i];
}

function formatDateShort(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatDateFull(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getCategoryColor(name) {
  const c = AppState.categories.find(c => c.name === name);
  return c ? c.color : '#94a3b8';
}

function getFileById(id) {
  return AppState.pdfFiles.find(f => f.id === id);
}

function getVisiblePdfs() {
  let list = AppState.pdfFiles;
  if (AppState.filteredIds) list = list.filter(f => AppState.filteredIds.has(f.id));
  if (AppState.activeCategory) list = list.filter(f => f.category === AppState.activeCategory);
  return list;
}

function setStatus(text, type) {
  $('statusText').textContent = text;
  $('statusText').className = 'info-value status-' + (type || 'ok');
}
