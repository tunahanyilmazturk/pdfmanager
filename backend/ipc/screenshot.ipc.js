// -------------------------------------------------------
// screenshot.ipc.js – Ekran goruntusu IPC
// -------------------------------------------------------
const { ipcMain } = require('electron');
const screenshotService = require('../services/screenshot.service');

function register(mainWindow) {

  ipcMain.handle('capture-screenshot', async () => {
    try {
      const result = await screenshotService.captureWindow(mainWindow);
      return result;
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('list-screenshots', async () => {
    return screenshotService.listScreenshots();
  });

  ipcMain.handle('read-screenshot', async (_, filePath) => {
    return screenshotService.readScreenshot(filePath);
  });

  ipcMain.handle('delete-screenshot', async (_, filePath) => {
    return screenshotService.deleteScreenshot(filePath);
  });
}

module.exports = { register };
