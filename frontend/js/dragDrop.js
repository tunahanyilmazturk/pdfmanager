// -------------------------------------------------------
// dragDrop.js – Sürükle-bırak sıralama & dosya ekleme
// -------------------------------------------------------

/* Liste içinde sıralama drag-drop */
function setupDragReorder() {
  document.querySelectorAll('.pdf-item').forEach(el => {
    el.draggable = true;
    el.addEventListener('dragstart', function(e) {
      AppState.dragSourceId = this.dataset.id;
      this.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragend', function() {
      this.classList.remove('dragging');
      document.querySelectorAll('.pdf-item').forEach(i => i.classList.remove('drag-over'));
      AppState.dragSourceId = null;
    });
    el.addEventListener('dragover', function(e) {
      e.preventDefault();
      if (this.dataset.id !== AppState.dragSourceId) {
        document.querySelectorAll('.pdf-item').forEach(i => i.classList.remove('drag-over'));
        this.classList.add('drag-over');
      }
    });
    el.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
    el.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      if (!AppState.dragSourceId || this.dataset.id === AppState.dragSourceId) return;
      const fromIdx = AppState.pdfFiles.findIndex(f => f.id === AppState.dragSourceId);
      const toIdx = AppState.pdfFiles.findIndex(f => f.id === this.dataset.id);
      if (fromIdx === -1 || toIdx === -1) return;
      const [moved] = AppState.pdfFiles.splice(fromIdx, 1);
      AppState.pdfFiles.splice(toIdx, 0, moved);
      $('sortSelect').value = 'custom';
      AppState.customSort = true;
      renderList();
      setStatus('Sıralama güncellendi', 'ok');
    });
  });
}

/* Dosya sürükle-bırak (drop zone & tüm sayfa) */
async function handleFileDrop(e) {
  e.preventDefault();
  $('dropZone')?.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (!files || files.length === 0) return;
  const newFiles = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.name.toLowerCase().endsWith('.pdf') && f.path) {
      const result = await Backend.addPdfFromPath(f.path);
      if (result) newFiles.push(result);
    }
  }
  if (newFiles.length > 0) _addPdfs(newFiles);
}
