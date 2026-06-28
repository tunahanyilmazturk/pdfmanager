// -------------------------------------------------------
// search.ipc.js – PDF icinde arama IPC
// -------------------------------------------------------
const { ipcMain } = require('electron');
const searchService = require('../services/search.service');

function register() {

  ipcMain.handle('search-in-pdf', async (_, filePath, query) => {
    try {
      if (!query || query.trim().length === 0) return [];
      const results = await searchService.search(filePath, query.trim());
      return results;
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('extract-pdf-text', async (_, filePath) => {
    try {
      return await searchService.extractText(filePath);
    } catch (err) {
      return { error: err.message };
    }
  });
}

module.exports = { register };
