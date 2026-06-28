// -------------------------------------------------------
// printActions.js – Yazdırma işlemleri
// -------------------------------------------------------

async function printSingle(id) {
  const file = getFileById(id);
  if (!file) return;
  const silent = localStorage.getItem('silentPrint') !== 'false';
  if (silent) {
    _execPrint([file.path]);
  } else {
    showPrintSettingsModal();
  }
}

function doPrint() {
  const silent = localStorage.getItem('silentPrint') !== 'false';
  if (silent) _execPrint();
  else showPrintSettingsModal();
}

async function _execPrint(paths) {
  let filesToPrint;
  if (paths) {
    filesToPrint = paths;
  } else if (AppState.selectedIds.size > 0) {
    filesToPrint = AppState.pdfFiles.filter(f => AppState.selectedIds.has(f.id)).map(f => f.path);
  } else {
    filesToPrint = AppState.pdfFiles.map(f => f.path);
  }
  if (filesToPrint.length === 0) return;

  _showPrintModal();
  try {
    const r = await Backend.printPdfs(filesToPrint, {});
    if (r.success) {
      $('modalStatus').textContent = 'Tümü başarıyla yazdırıldı!';
      setStatus(r.total + ' PDF yazdırıldı', 'ok');
    } else {
      $('modalStatus').textContent = 'Hata: ' + (r.error || '');
      setStatus('Yazdırma hatası', 'busy');
      sendErrorToBackend('PRINT_FAIL', r.error || 'Bilinmeyen yazdirma hatasi', 'printActions._execPrint');
    }
  } catch (err) {
    $('modalStatus').textContent = 'Hata: ' + err.message;
    setStatus('Yazdırma hatası', 'busy');
    sendErrorToBackend('PRINT_FAIL', err.message, 'printActions._execPrint', err);
  }
  setTimeout(_hidePrintModal, 1500);
}

/* Print Settings Modal */
function showPrintSettingsModal() {
  $('printSettingsModal').classList.add('active');
  const sel = $('printPrinter');
  sel.innerHTML = '<option value="">Varsayılan Yazıcı</option>';
  AppState.printerList.forEach(p => {
    sel.innerHTML += `<option value="${p.name}" ${p.isDefault ? 'selected' : ''}>${p.name}</option>`;
  });
  let filesToPrint;
  if (AppState.selectedIds.size > 0) filesToPrint = AppState.pdfFiles.filter(f => AppState.selectedIds.has(f.id));
  else filesToPrint = AppState.pdfFiles;
  const totalP = filesToPrint.reduce((s, f) => s + (f.pageCount || 0), 0);
  $('printModalInfo').textContent = filesToPrint.length + ' PDF yazdırılacak (' + totalP + ' sayfa)';
}

function closePrintSettingsModal() {
  $('printSettingsModal').classList.remove('active');
}

async function startPrintWithSettings() {
  closePrintSettingsModal();
  let filesToPrint;
  if (AppState.selectedIds.size > 0) filesToPrint = AppState.pdfFiles.filter(f => AppState.selectedIds.has(f.id));
  else filesToPrint = AppState.pdfFiles;
  if (filesToPrint.length === 0) return;

  const options = {
    printerName: $('printPrinter').value || null,
    copies: parseInt($('printCopies').value) || 1,
    colorMode: $('printColorMode').value,
    paperSize: $('printPaperSize').value,
    orientation: $('printOrientation').value,
    duplex: $('printDuplex').value === 'true',
  };
  _showPrintModal();
  try {
    const r = await Backend.printPdfs(filesToPrint.map(f => f.path), options);
    if (r.success) {
      $('modalStatus').textContent = 'Tümü başarıyla yazdırıldı!';
      setStatus(r.total + ' PDF yazdırıldı', 'ok');
    } else {
      $('modalStatus').textContent = 'Hata: ' + (r.error || '');
      setStatus('Yazdırma hatası', 'busy');
      sendErrorToBackend('PRINT_FAIL', r.error || 'Yazdirma ayarlariyla basarisiz', 'printActions.startPrintWithSettings');
    }
  } catch (err) {
    $('modalStatus').textContent = 'Hata: ' + err.message;
    setStatus('Yazdırma hatası', 'busy');
    sendErrorToBackend('PRINT_FAIL', err.message, 'printActions.startPrintWithSettings', err);
  }
  setTimeout(_hidePrintModal, 1500);
}

/* Print progress modal */
function _showPrintModal() {
  $('printModal').classList.add('active');
  $('progressFill').style.width = '0%';
  $('progressCount').textContent = '0 / 0';
  $('progressFileName').textContent = 'Hazırlanıyor...';
  $('modalStatus').textContent = 'Lütfen bekleyin, yazdırma işlemi devam ediyor...';
}
function _hidePrintModal() {
  $('printModal').classList.remove('active');
}
function updatePrintProgress(cur, total, fname) {
  $('progressFill').style.width = (cur / total * 100) + '%';
  $('progressCount').textContent = cur + ' / ' + total;
  $('progressFileName').textContent = fname || 'Hazırlanıyor...';
}
