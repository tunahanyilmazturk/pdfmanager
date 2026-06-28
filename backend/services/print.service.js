// -------------------------------------------------------
// print.service.js – Yazıcı listesi ve PDF yazdırma
// -------------------------------------------------------
const pdfToPrinter = require('pdf-to-printer');
const path = require('path');
const { errorService, ErrorCodes } = require('./error.service');

class PrintService {
  /**
   * Tüm yazıcıları getir
   */
  async getPrinters() {
    try {
      const printers = await pdfToPrinter.getPrinters();
      return printers.map(p => ({
        name: p.name,
        isDefault: p.isDefault || false,
        status: p.status || 'ready',
      }));
    } catch (err) {
      const errObj = errorService.create('PRINTER_NOT_FOUND', 'Yazici listesi alinamadi', err);
      errorService.logToFile(errObj);
      errorService.logToSession(errObj);
      return [];
    }
  }

  /**
   * Varsayılan yazıcıyı bul
   */
  async getDefaultPrinter() {
    const printers = await this.getPrinters();
    const dp = printers.find(p => p.isDefault) || printers[0];
    return dp ? dp.name : 'Yazıcı bulunamadı';
  }

  /**
   * PDF'leri sırayla yazdır
   */
  async printBatch(filePaths, options = {}) {
    const { printerName, copies = 1, onProgress } = options;
    const results = [];

    for (let i = 0; i < filePaths.length; i++) {
      const fp = filePaths[i];
      try {
        if (!require('fs').existsSync(fp)) {
          throw new Error('Dosya bulunamadi: ' + fp);
        }
        if (onProgress) onProgress(i + 1, filePaths.length, path.basename(fp));

        const opts = { silent: true };
        if (printerName) opts.printer = printerName;
        if (copies > 1) opts.copies = copies;

        await pdfToPrinter.print(fp, opts);
        results.push({ file: path.basename(fp), success: true });
      } catch (err) {
        const errObj = errorService.create('PRINT_FAIL', `${path.basename(fp)} yazdirilamadi`, err);
        errorService.logToFile(errObj);
        errorService.logToSession(errObj);
        results.push({ file: path.basename(fp), success: false, error: err.message });
      }
    }

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      const msg = failed.map(r => r.file + ': ' + r.error).join('; ');
      return { success: false, total: filePaths.length, printed: results.filter(r => r.success).length, error: msg };
    }

    return { success: true, total: filePaths.length };
  }
}

module.exports = new PrintService();
