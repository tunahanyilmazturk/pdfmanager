// -------------------------------------------------------
// bulkActions.js – Toplu yeniden adlandirma
// -------------------------------------------------------

function showRenameModal() {
  if (AppState.selectedIds.size === 0) {
    setStatus('Lutfen yeniden adlandirmak icin PDF secin', 'busy');
    return;
  }
  $('renamePrefix').value = '';
  $('renameStart').value = '1';
  $('renamePadding').value = '2';
  $('renameMode').value = 'simple';
  $('renamePreview').innerHTML = '';

  // Onizleme goster
  _previewRename();
  $('renameModal').classList.add('active');
  setTimeout(() => $('renamePrefix').focus(), 100);
}

function closeRenameModal() { $('renameModal').classList.remove('active'); }

function _previewRename() {
  const files = AppState.pdfFiles.filter(f => AppState.selectedIds.has(f.id));
  const prefix = $('renamePrefix').value || '';
  const startNum = parseInt($('renameStart').value) || 1;
  const padding = parseInt($('renamePadding').value) || 2;
  const mode = $('renameMode').value;
  const useDate = mode === 'date';

  let html = '';
  let num = startNum;
  for (const f of files) {
    const ext = '.pdf';
    let newName;
    if (useDate) {
      const d = new Date(f.lastModified);
      const ds = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
      newName = ds + '_' + prefix + String(num).padStart(padding,'0') + ext;
    } else {
      newName = prefix + String(num).padStart(padding,'0') + ext;
    }
    html += `<div class="rename-preview-item ${f.name === newName ? 'same' : ''}">
      <span class="rename-old">${f.name}</span>
      <span class="rename-arrow">&rarr;</span>
      <span class="rename-new">${newName}</span>
    </div>`;
    num++;
  }
  $('renamePreview').innerHTML = html;
}

async function executeRename() {
  const files = AppState.pdfFiles.filter(f => AppState.selectedIds.has(f.id));
  const prefix = $('renamePrefix').value || '';
  const startNum = parseInt($('renameStart').value) || 1;
  const padding = parseInt($('renamePadding').value) || 2;
  const mode = $('renameMode').value;

  _showPrintModal();
  $('modalStatus').textContent = 'Dosyalar yeniden adlandiriliyor...';

  try {
    const result = await Backend.batchRename(files, {
      prefix,
      startNum,
      padding,
      datePrefix: mode === 'date',
    });

    if (result.success) {
      // PDF listesini guncelle
      for (const r of result.results) {
        if (r.success) {
          const f = AppState.pdfFiles.find(ff => ff.name === r.oldName);
          if (f) {
            f.name = r.newName;
            f.path = f.path.replace(r.oldName, r.newName);
          }
        }
      }
      renderList();
      updateUI();
      saveSession();

      const successCount = result.results.filter(r => r.success).length;
      $('modalStatus').textContent = successCount + ' dosya yeniden adlandirildi!';
      setStatus(successCount + ' dosya yeniden adlandirildi', 'ok');
      closeRenameModal();
    } else {
      $('modalStatus').textContent = 'Hata: ' + (result.error || '');
      sendErrorToBackend('FILE_RENAME_FAIL', result.error || '', 'bulkActions.executeRename');
    }
  } catch (err) {
    $('modalStatus').textContent = 'Hata: ' + err.message;
    sendErrorToBackend('FILE_RENAME_FAIL', err.message, 'bulkActions.executeRename', err);
  }
  setTimeout(_hidePrintModal, 2000);
}
