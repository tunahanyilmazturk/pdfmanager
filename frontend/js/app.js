// -------------------------------------------------------
// app.js – Uygulama giris noktasi, event baglantilari
// -------------------------------------------------------

function init() {
  /* ---- Header ---- */
  $('settingsBtn').addEventListener('click', showSettingsModal);
  $('errorLogBtn').addEventListener('click', showErrorLogModal);
  $('viewModeBtn').addEventListener('click', toggleViewMode);
  $('shortcutsBtn').addEventListener('click', showShortcutsModal);
  $('screenshotBtn').addEventListener('click', captureAndShowScreenshot);

  /* ---- Sidebar ---- */
  $('pdfYukleBtn').addEventListener('click', selectPdfs);
  $('printBtn').addEventListener('click', doPrint);
  $('mergeBtn').addEventListener('click', showMergeModal);
  $('pdfActionsBtn').addEventListener('click', showPdfActionsMenu);
  $('removeBtn').addEventListener('click', removeSelected);

  /* ---- Drop Zone ---- */
  $('dropZone').addEventListener('click', selectPdfs);
  $('dropZone').addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drag-over'); });
  $('dropZone').addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
  $('dropZone').addEventListener('drop', handleFileDrop);
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', handleFileDrop);

  /* ---- Siralama ---- */
  $('sortSelect').addEventListener('change', sortPdfs);

  /* ---- Arama ---- */
  $('searchInput').addEventListener('input', filterPdfs);

  /* ---- Tumunu Sec ---- */
  $('selectAll').addEventListener('change', toggleSelectAll);

  /* ---- Info Panel ---- */
  $('closeInfoPanel').addEventListener('click', closeInfoPanel);

  /* ---- Print Settings ---- */
  $('printSettingsCancel').addEventListener('click', closePrintSettingsModal);
  $('printSettingsStart').addEventListener('click', startPrintWithSettings);

  /* ---- Kategori ---- */
  $('addCategoryBtn').addEventListener('click', showAddCategoryModal);
  $('categoryCancel').addEventListener('click', closeCategoryModal);
  $('categorySave').addEventListener('click', saveCategory);
  $('categoryNameInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') saveCategory(); });

  /* ---- Renk Secici ---- */
  document.addEventListener('click', function(e) {
    const opt = e.target.closest('.color-option');
    if (opt) {
      document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
      opt.classList.add('selected');
    }
  });

  /* ---- Merge ---- */
  $('mergeCancel').addEventListener('click', closeMergeModal);
  $('mergeSaveBtn').addEventListener('click', saveMergePdf);

  /* ---- PDF Actions Menu ---- */
  $('pdfActionsClose').addEventListener('click', function() { hideModal('pdfActionsMenu'); });
  $('renameActionBtn').addEventListener('click', function() { hideModal('pdfActionsMenu'); showRenameModal(); });
  $('searchActionBtn').addEventListener('click', function() { hideModal('pdfActionsMenu'); showSearchModal(); });
  $('splitActionBtn').addEventListener('click', function() { hideModal('pdfActionsMenu'); showSplitModal(); });
  $('deletePagesActionBtn').addEventListener('click', function() { hideModal('pdfActionsMenu'); showDeletePagesModal(); });

  /* ---- Rename ---- */
  $('renameCancel').addEventListener('click', closeRenameModal);
  $('renameApplyBtn').addEventListener('click', executeRename);
  $('renamePrefix').addEventListener('input', _previewRename);
  $('renameStart').addEventListener('input', _previewRename);
  $('renamePadding').addEventListener('input', _previewRename);
  $('renameMode').addEventListener('change', _previewRename);

  /* ---- Search ---- */
  $('searchCloseBtn').addEventListener('click', closeSearchModal);
  $('searchExecuteBtn').addEventListener('click', executeSearch);
  $('searchQuery').addEventListener('keydown', function(e) { if (e.key === 'Enter') executeSearch(); });

  /* ---- Split ---- */
  $('splitCancel').addEventListener('click', closeSplitModal);
  $('splitSaveBtn').addEventListener('click', saveSplitPdf);

  /* ---- Delete Pages ---- */
  $('delPagesCancel').addEventListener('click', closeDeletePagesModal);
  $('delPagesSaveBtn').addEventListener('click', saveDeletePages);

  /* ---- Settings ---- */
  $('settingsClose').addEventListener('click', closeSettingsModal);
  $('clearDataBtn').addEventListener('click', clearAllData);

  /* ---- Confirm ---- */
  $('confirmCancel').addEventListener('click', function() {
    $('confirmModal').classList.remove('active');
    AppState.confirmCallback = null;
  });
  $('confirmOk').addEventListener('click', function() {
    $('confirmModal').classList.remove('active');
    if (AppState.confirmCallback) {
      const cb = AppState.confirmCallback;
      AppState.confirmCallback = null;
      cb();
    }
  });

  /* ---- Hata Yonetimi ---- */
  window.hantech.onError(function(errObj) {
    showError(errObj);
    $('errorDot').classList.add('show');
  });
  $('errorModalClose').addEventListener('click', function() { $('errorModal').classList.remove('active'); });
  $('errorCloseBtn').addEventListener('click', function() { $('errorModal').classList.remove('active'); });
  $('errorCopyBtn').addEventListener('click', copyLastErrorToClipboard);
  $('errorLogViewBtn').addEventListener('click', function() {
    $('errorModal').classList.remove('active');
    showErrorLogModal();
  });
  $('errorLogModalClose').addEventListener('click', closeErrorLogModal);

  /* ---- Klavye ---- */
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'a') { e.preventDefault(); toggleSelectAll(); }
    if (e.key === 'Delete') removeSelected();
    if (e.ctrlKey && e.key === 'p') { e.preventDefault(); if (AppState.pdfFiles.length > 0) doPrint(); }
    if (e.ctrlKey && e.key === '/') { e.preventDefault(); showShortcutsModal(); }
    if (e.key === 'Escape') {
      closeInfoPanel();
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      $('contextMenu')?.classList.remove('show');
    }
  });

  /* ---- Sag Tik (context menu) ---- */
  document.addEventListener('contextmenu', function(e) {
    const item = e.target.closest('.pdf-item');
    if (item) {
      showContextMenu(e, item.dataset.id);
    }
  });

  /* ---- Shortcuts ---- */
  $('shortcutsClose').addEventListener('click', closeShortcutsModal);

  /* ---- Screenshot Modals ---- */
  $('ssPreviewClose').addEventListener('click', closeScreenshotPreview);
  $('ssPreviewClose2').addEventListener('click', closeScreenshotPreview);
  $('ssCopyBtn').addEventListener('click', copyScreenshotToClipboard);
  $('ssHistoryBtn').addEventListener('click', function() {
    closeScreenshotPreview();
    setTimeout(showScreenshotHistory, 200);
  });
  $('ssHistoryClose').addEventListener('click', closeScreenshotHistory);

  /* ---- Drag Out (PDF'i disari surukle) ---- */
  setupDragOut();

  /* ---- Print Progress ---- */
  window.hantech.onPrintProgress(function(data) {
    updatePrintProgress(data.current, data.total, data.fileName);
  });

  /* ---- Baslangic ---- */
  updateUI();
  setStatus('Hazir - PDF yuklemek icin bekliyor', 'ok');

  /* ---- Yazicilari al ---- */
  (async () => {
    try {
      AppState.printerList = await Backend.getPrinters();
      const dp = AppState.printerList.find(p => p.isDefault) || AppState.printerList[0];
      $('printerName').textContent = dp ? dp.name : 'Yazici bulunamadi';
    } catch (_) { $('printerName').textContent = 'Kontrol edilemedi'; }
  })();

  /* ---- Kategorileri yukle ---- */
  (async () => {
    try {
      const saved = await Backend.loadCategories();
      if (saved && Array.isArray(saved)) AppState.categories = saved;
    } catch (_) {}
    renderCategories();
  })();

  /* ---- Temayi yukle ---- */
  initTheme();

  /* ---- Oturumu yukle ---- */
  loadSession();
}

document.addEventListener('DOMContentLoaded', init);
