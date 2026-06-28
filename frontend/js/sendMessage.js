// -------------------------------------------------------
// sendMessage.js – IPC çağrıları (main process köprüsü)
// -------------------------------------------------------
const api = window.hantech;

const Backend = {
  // Sistem
  getDataPath: () => api.getDataPath(),

  // PDF
  selectPdfs:     () => api.selectPdfs(),
  addPdfFromPath: (fp) => api.addPdfFromPath(fp),
  getPdfInfo:     (fp) => api.getPdfInfo(fp),
  readPdfFile:    (fp) => api.readPdfFile(fp),

  // Print
  printPdfs:       (paths, opts) => api.printPdfs(paths, opts),
  getPrinters:     () => api.getPrinters(),
  getDefaultPrinter: () => api.getDefaultPrinter(),

  // File
  renameFile:  (oldP, newN) => api.renameFile(oldP, newN),
  batchRename: (files, opts) => api.batchRename(files, opts),

  // Merge / Split / Delete pages
  mergePdfs:     (paths) => api.mergePdfs(paths),
  splitPdfPages: (fp, ranges) => api.splitPdfPages(fp, ranges),
  deletePdfPages:(fp, indices, outPath) => api.deletePdfPages(fp, indices, outPath),

  // Search
  searchInPdf:   (fp, q) => api.searchInPdf(fp, q),
  extractPdfText:(fp) => api.extractPdfText(fp),

  // Session
  saveSession:   (d) => api.saveSession(d),
  loadSession:   () => api.loadSession(),

  // Category
  saveCategories: (c) => api.saveCategories(c),
  loadCategories: () => api.loadCategories(),

  // Hata Yonetimi
  reportError:          (d) => api.reportError(d),
  copyErrorToClipboard: (e) => api.copyErrorToClipboard(e),
  getErrorLog:          () => api.getErrorLog(),
  getTodayErrorLog:     () => api.getTodayErrorLog(),
  getErrorCodes:        () => api.getErrorCodes(),

  // Ekran Goruntusu
  captureScreenshot: () => api.captureScreenshot(),
  listScreenshots:   () => api.listScreenshots(),
  readScreenshot:    (fp) => api.readScreenshot(fp),
  deleteScreenshot:  (fp) => api.deleteScreenshot(fp),
};
