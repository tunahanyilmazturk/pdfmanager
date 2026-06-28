// -------------------------------------------------------
// print.ipc.js – Yazıcı listesi ve yazdırma işlemleri
// -------------------------------------------------------
const { ipcMain } = require('electron');
const path = require('path');
const printService = require('../services/print.service');

function register(mainWindow) {

  ipcMain.handle('get-printers', async () => {
    return printService.getPrinters();
  });

  ipcMain.handle('get-default-printer', async () => {
    return printService.getDefaultPrinter();
  });

  ipcMain.handle('print-pdfs', async (_, filePaths, options = {}) => {
    try {
      // Her PDF yazdırıldıkça progress gönder
      const wrappedOptions = {
        ...options,
        onProgress: (i, total, fileName) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('print-progress', {
              current: i, total, fileName,
            });
          }
        },
      };
      return await printService.printBatch(filePaths, wrappedOptions);
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { register };
