// -------------------------------------------------------
// merge.ipc.js – PDF birlestirme / sayfa islemleri IPC
// -------------------------------------------------------
const { ipcMain, dialog } = require('electron');
const path = require('path');
const mergeService = require('../services/merge.service');

function register(mainWindow) {

  ipcMain.handle('merge-pdfs', async (_, filePaths) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Birlestirilmis PDF\'i Kaydet',
        defaultPath: 'birlestirilmis.pdf',
        filters: [{ name: 'PDF Dosyasi', extensions: ['pdf'] }],
      });
      if (result.canceled) return { success: false, cancelled: true };
      return await mergeService.merge(filePaths, result.filePath);
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('split-pdf-pages', async (_, filePath, pageRanges) => {
    try {
      const ext = path.extname(filePath);
      const base = path.basename(filePath, ext);
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Ayrilmis PDF\'i Kaydet',
        defaultPath: base + '_ayrilmis.pdf',
        filters: [{ name: 'PDF Dosyasi', extensions: ['pdf'] }],
      });
      if (result.canceled) return { success: false, cancelled: true };
      return await mergeService.split(filePath, result.filePath, pageRanges);
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('delete-pdf-pages', async (_, filePath, pageIndices, outputPath) => {
    try {
      if (outputPath) {
        return await mergeService.deletePages(filePath, outputPath, pageIndices);
      }
      const ext = path.extname(filePath);
      const base = path.basename(filePath, ext);
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Duzenlenmis PDF\'i Kaydet',
        defaultPath: base + '_duzenlenmis.pdf',
        filters: [{ name: 'PDF Dosyasi', extensions: ['pdf'] }],
      });
      if (result.canceled) return { success: false, cancelled: true };
      return await mergeService.deletePages(filePath, result.filePath, pageIndices);
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { register };
