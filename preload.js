// -------------------------------------------------------
// preload.js – Renderer ile Main arasında güvenli köprü
// -------------------------------------------------------
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hantech', {
  // Sistem
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  // PDF
  selectPdfs: () => ipcRenderer.invoke('select-pdfs'),
  addPdfFromPath: (fp) => ipcRenderer.invoke('add-pdf-from-path', fp),
  getPdfInfo: (fp) => ipcRenderer.invoke('get-pdf-info', fp),
  readPdfFile: (fp) => ipcRenderer.invoke('read-pdf-file', fp),

  // Yazdirma
  printPdfs: (paths, opts) => ipcRenderer.invoke('print-pdfs', paths, opts),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getDefaultPrinter: () => ipcRenderer.invoke('get-default-printer'),
  onPrintProgress: (cb) => { ipcRenderer.on('print-progress', (_e, d) => cb(d)); },

  // Dosya islemleri
  renameFile: (oldP, newN) => ipcRenderer.invoke('rename-file', oldP, newN),
  batchRename: (files, opts) => ipcRenderer.invoke('batch-rename', files, opts),

  // PDF birlestirme / duzenleme
  mergePdfs: (paths) => ipcRenderer.invoke('merge-pdfs', paths),
  splitPdfPages: (fp, ranges) => ipcRenderer.invoke('split-pdf-pages', fp, ranges),
  deletePdfPages: (fp, indices, outPath) => ipcRenderer.invoke('delete-pdf-pages', fp, indices, outPath),

  // PDF arama
  searchInPdf: (fp, q) => ipcRenderer.invoke('search-in-pdf', fp, q),
  extractPdfText: (fp) => ipcRenderer.invoke('extract-pdf-text', fp),

  // Oturum
  saveSession: (d) => ipcRenderer.invoke('save-session', d),
  loadSession: () => ipcRenderer.invoke('load-session'),

  // Kategori
  saveCategories: (c) => ipcRenderer.invoke('save-categories', c),
  loadCategories: () => ipcRenderer.invoke('load-categories'),

  // Hata Yonetimi
  reportError: (d) => ipcRenderer.invoke('report-error', d),
  copyErrorToClipboard: (e) => ipcRenderer.invoke('copy-error-to-clipboard', e),
  getErrorLog: () => ipcRenderer.invoke('get-error-log'),
  getTodayErrorLog: () => ipcRenderer.invoke('get-today-error-log'),
  getErrorCodes: () => ipcRenderer.invoke('get-error-codes'),
  onError: (cb) => { ipcRenderer.on('error-occurred', (_e, d) => cb(d)); },

  // Ekran Goruntusu
  captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
  listScreenshots: () => ipcRenderer.invoke('list-screenshots'),
  readScreenshot: (fp) => ipcRenderer.invoke('read-screenshot', fp),
  deleteScreenshot: (fp) => ipcRenderer.invoke('delete-screenshot', fp),
});
