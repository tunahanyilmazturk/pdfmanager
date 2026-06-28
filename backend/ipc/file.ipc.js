// -------------------------------------------------------
// file.ipc.js – Dosya işlemleri (yeniden adlandırma)
// -------------------------------------------------------
const { ipcMain } = require('electron');
const pdfService = require('../services/pdf.service');

function register() {
  ipcMain.handle('rename-file', async (_, oldPath, newName) => {
    try {
      const result = pdfService.rename(oldPath, newName);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { register };
