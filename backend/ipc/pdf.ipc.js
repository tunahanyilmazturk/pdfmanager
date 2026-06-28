// -------------------------------------------------------
// pdf.ipc.js – PDF dosya seçme, bilgi alma, okuma
// -------------------------------------------------------
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const pdfService = require('../services/pdf.service');

function register(mainWindow) {

  // PDF dosyalarını seç
  ipcMain.handle('select-pdfs', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'PDF Dosyalarını Seç',
      filters: [{ name: 'PDF Dosyaları', extensions: ['pdf'] }],
      properties: ['openFile', 'multiSelections'],
    });
    if (result.canceled) return [];

    const files = [];
    for (const fp of result.filePaths) {
      try {
        const obj = await pdfService.createFileObject(fp);
        files.push(obj);
      } catch (_) { /* skip corrupt files */ }
    }
    return files;
  });

  // Sürükle-bırak ile gelen dosyayı ekle
  ipcMain.handle('add-pdf-from-path', async (_, filePath) => {
    try {
      if (!filePath.toLowerCase().endsWith('.pdf')) return null;
      return await pdfService.createFileObject(filePath);
    } catch (_) { return null; }
  });

  // PDF metadata bilgisi
  ipcMain.handle('get-pdf-info', async (_, filePath) => {
    try {
      const info = await pdfService.getFullInfo(filePath);
      const stats = fs.statSync(filePath);
      info.size = stats.size;
      info.lastModified = stats.mtime.toISOString();
      return info;
    } catch (err) {
      return { error: err.message };
    }
  });

  // PDF'i base64 oku
  ipcMain.handle('read-pdf-file', async (_, filePath) => {
    try { return pdfService.readAsBase64(filePath); }
    catch (_) { return null; }
  });
}

module.exports = { register };
