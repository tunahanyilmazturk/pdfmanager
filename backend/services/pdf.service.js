// -------------------------------------------------------
// pdf.service.js – PDF okuma, metadata, sayfa sayısı
// -------------------------------------------------------
const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { errorService, ErrorCodes } = require('./error.service');

pdfjsLib.GlobalWorkerOptions.workerSrc = '';

class PdfService {
  /**
   * PDF dosyasındaki sayfa sayısını döndürür
   */
  async getPageCount(filePath) {
    this._checkFileExists(filePath);
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const count = doc.numPages;
    doc.destroy();
    return count;
  }

  /**
   * PDF'den tüm metadata'yı çıkarır
   */
  async getFullInfo(filePath) {
    this._checkFileExists(filePath);
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const meta = await doc.getMetadata();
    const info = meta.info || {};
    const count = doc.numPages;
    doc.destroy();

    return {
      pageCount: count,
      title: info.Title || '',
      author: info.Author || '',
      subject: info.Subject || '',
      keywords: info.Keywords || '',
      creator: info.Creator || '',
      producer: info.Producer || '',
      creationDate: info.CreationDate || '',
      modDate: info.ModDate || '',
    };
  }

  /**
   * Dosyayı base64 olarak okur
   */
  readAsBase64(filePath) {
    this._checkFileExists(filePath);
    return fs.readFileSync(filePath).toString('base64');
  }

  /**
   * Dosya objesi oluşturur (path + metadata)
   */
  async createFileObject(filePath, extra = {}) {
    this._checkFileExists(filePath);
    const stats = fs.statSync(filePath);
    const pageCount = await this.getPageCount(filePath);
    return {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 8),
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      pageCount,
      category: extra.category || '',
    };
  }

  /**
   * Dosya yeniden adlandırma
   */
  rename(oldPath, newName) {
    this._checkFileExists(oldPath);
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    fs.renameSync(oldPath, newPath);
    return { newPath, newName };
  }

  /**
   * Dosya var mı kontrol et - yoksa error service'e logla
   */
  _checkFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
      const err = new Error(`Dosya bulunamadi: ${filePath}`);
      const errObj = errorService.create('PDF_NOT_FOUND', filePath, err);
      errorService.logToFile(errObj);
      errorService.logToSession(errObj);
      throw err;
    }
  }
}

module.exports = new PdfService();
