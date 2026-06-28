// -------------------------------------------------------
// search.service.js – PDF icinde metin arama
// -------------------------------------------------------
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

pdfjsLib.GlobalWorkerOptions.workerSrc = '';

class SearchService {

  /**
   * PDF icindeki tum metni cikar
   */
  async extractText(filePath) {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      pages.push({ page: i, text });
    }
    doc.destroy();
    return pages;
  }

  /**
   * PDF icinde metin ara
   */
  async search(filePath, query) {
    const q = query.toLowerCase();
    const pages = await this.extractText(filePath);
    const results = [];
    for (const p of pages) {
      const idx = p.text.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(p.text.length, idx + q.length + 60);
        let snippet = p.text.slice(start, end);
        if (start > 0) snippet = '...' + snippet;
        if (end < p.text.length) snippet += '...';
        results.push({ page: p.page, snippet });
      }
    }
    return results;
  }
}

module.exports = new SearchService();
