// -------------------------------------------------------
// error.ipc.js – Hata yonetimi IPC
// -------------------------------------------------------
const { ipcMain, clipboard } = require('electron');
const { ErrorCodes, errorService } = require('../services/error.service');

function register(mainWindow) {

  // Frontend'den gelen hata bildirimi
  ipcMain.handle('report-error', (_, errorData) => {
    const errObj = errorService.create(
      errorData.code || 'UNKNOWN',
      errorData.details || '',
      errorData.originalError ? errorData.originalError : null,
    );
    // Stack trace'i frontend'den gelenle guncelle (new Error stack kaybettiriyor)
    if (errorData.stack) {
      errObj.stack = errorData.stack;
      errObj.originalMessage = errorData.originalMessage || errorData.originalError || '';
    }
    errObj.context = errorData.context || '';
    errorService.sendToWindow(errObj, mainWindow);
    errorService.logToFile(errObj);
    errorService.logToSession(errObj);
    return errObj;
  });

  // Hatayi panoya kopyala
  ipcMain.handle('copy-error-to-clipboard', (_, errorObj) => {
    const text = errorService.getFullText(errorObj);
    clipboard.writeText(text);
    return { success: true };
  });

  // Session log'u getir
  ipcMain.handle('get-error-log', () => {
    return errorService.getSessionLog();
  });

  // Bugunun log dosyasini getir
  ipcMain.handle('get-today-error-log', () => {
    return errorService.getTodayLog();
  });

  // Hata kodlari listesi
  ipcMain.handle('get-error-codes', () => {
    return ErrorCodes;
  });
}

module.exports = { register };
