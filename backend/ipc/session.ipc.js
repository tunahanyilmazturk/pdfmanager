// -------------------------------------------------------
// session.ipc.js – Oturum kaydet / yükle
// -------------------------------------------------------
const { ipcMain } = require('electron');
const sessionService = require('../services/session.service');

function register() {
  ipcMain.handle('save-session', (_, data) => {
    return sessionService.save(data);
  });

  ipcMain.handle('load-session', () => {
    return sessionService.load();
  });
}

module.exports = { register };
