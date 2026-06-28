// -------------------------------------------------------
// fileops.ipc.js – Toplu yeniden adlandirma IPC
// -------------------------------------------------------
const { ipcMain } = require('electron');
const fileOpsService = require('../services/fileops.service');

function register() {
  ipcMain.handle('batch-rename', async (_, files, options) => {
    try {
      return await fileOpsService.batchRename(files, options);
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { register };
