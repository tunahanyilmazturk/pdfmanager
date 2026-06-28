// -------------------------------------------------------
// main.js – Electron ana süreç (entry point)
// -------------------------------------------------------
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1000,
    minHeight: 650,
    title: 'HanTech PDF Manager',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  // Tüm IPC handler'ları register et
  require('./ipc/error.ipc').register(mainWindow);
  require('./ipc/pdf.ipc').register(mainWindow);
  require('./ipc/print.ipc').register(mainWindow);
  require('./ipc/file.ipc').register();
  require('./ipc/merge.ipc').register(mainWindow);
  require('./ipc/search.ipc').register();
  require('./ipc/fileops.ipc').register();
  require('./ipc/screenshot.ipc').register(mainWindow);
  require('./ipc/session.ipc').register();
  require('./ipc/category.ipc').register();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
