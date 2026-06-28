// -------------------------------------------------------
// category.ipc.js – Kategori kaydet / yükle
// -------------------------------------------------------
const { ipcMain } = require('electron');
const categoryService = require('../services/category.service');

function register() {
  ipcMain.handle('save-categories', (_, categories) => {
    return categoryService.save(categories);
  });

  ipcMain.handle('load-categories', () => {
    return categoryService.load();
  });
}

module.exports = { register };
