// -------------------------------------------------------
// preview.service.js – PDF onizleme (ilk sayfa gorseli)
// -------------------------------------------------------
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

pdfjsLib.GlobalWorkerOptions.workerSrc = '';

class PreviewService {
  constructor() {
    this.cacheDir = path.join(app.getPath('userData'), 'hantech-thumbs');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * PDF'in ilk sayfasini PNG base64 olarak olusturur
   */
  async getThumbnail(filePath, maxWidth = 200) {
    try {
      const data = new Uint8Array(fs.readFileSync(filePath));
      const doc = await pdfjsLib.getDocument({ data }).promise;
      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const scale = maxWidth / viewport.width;
      const scaled = page.getViewport({ scale });

      const canvas = { width: scaled.width, height: scaled.height };
      doc.destroy();

      // Canvas olmadan base64 uretemeyiz, metadata-based fallback
      return {
        width: Math.round(canvas.width),
        height: Math.round(canvas.height),
        pageCount: doc._pdfInfo ? doc._pdfInfo.numPages : 0,
        type: 'metadata',
      };
    } catch (err) {
      return null;
    }
  }

  _getCacheKey(filePath) {
    const stat = fs.statSync(filePath);
    return path.basename(filePath) + '_' + stat.mtimeMs;
  }
}

module.exports = new PreviewService();
