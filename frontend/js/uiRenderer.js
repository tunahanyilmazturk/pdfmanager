// -------------------------------------------------------
// uiRenderer.js – Liste render, info bar, info panel
// -------------------------------------------------------

function updateInfoBar() {
  $('totalCount').textContent = AppState.pdfFiles.length;
  $('selectedCount').textContent = AppState.selectedIds.size;
  $('totalSize').textContent = formatSize(AppState.pdfFiles.reduce((s, f) => s + f.size, 0));
  $('totalPages').textContent = AppState.pdfFiles.reduce((s, f) => s + (f.pageCount || 0), 0);

  $('printBtn').disabled = AppState.pdfFiles.length === 0;
  $('mergeBtn').disabled = AppState.pdfFiles.length < 2;
  $('pdfActionsBtn').disabled = AppState.selectedIds.size === 0;
  $('removeBtn').disabled = AppState.selectedIds.size === 0;

  $('printBtnText').textContent = AppState.selectedIds.size > 0
    ? 'Seçilileri Yazdır (' + AppState.selectedIds.size + ')'
    : 'Tümünü Yazdır';

  const visible = getVisiblePdfs();
  const sa = $('selectAll');
  if (visible.length > 0) {
    const allSel = visible.every(f => AppState.selectedIds.has(f.id));
    sa.checked = allSel;
    sa.indeterminate = !allSel && visible.some(f => AppState.selectedIds.has(f.id));
  } else {
    sa.checked = false;
    sa.indeterminate = false;
  }

  if (AppState.currentInfoFileId && !getFileById(AppState.currentInfoFileId)) closeInfoPanel();
  renderCategories();
}

function updateUI() {
  renderList();
  updateInfoBar();
}
