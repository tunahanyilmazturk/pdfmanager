// -------------------------------------------------------
// merge.service.js – PDF birlestirme, sayfa ayriklastirma
// -------------------------------------------------------
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const { errorService } = require('./error.service');

class MergeService {

  /**
   * PDF'leri birlestir
   */
  async merge(filePaths, outputPath) {
    const mergedPdf = await PDFDocument.create();

    for (const fp of filePaths) {
      if (!fs.existsSync(fp)) {
        throw new Error('Dosya bulunamadi: ' + fp);
      }
      const data = fs.readFileSync(fp);
      const pdf = await PDFDocument.load(data, { ignoreEncryption: true });
      const indices = pdf.getPageIndices();
      const copied = await mergedPdf.copyPages(pdf, indices);
      copied.forEach(page => mergedPdf.addPage(page));
    }

    const bytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, bytes);
    return { success: true, path: outputPath, pageCount: mergedPdf.getPageCount() };
  }

  /**
   * PDF'ten belirli sayfalari ayri bir PDF olarak cikar
   */
  async split(inputPath, outputPath, pageRanges) {
    if (!fs.existsSync(inputPath)) throw new Error('Dosya bulunamadi: ' + inputPath);

    const data = fs.readFileSync(inputPath);
    const srcPdf = await PDFDocument.load(data, { ignoreEncryption: true });
    const newPdf = await PDFDocument.create();

    // pageRanges: [[0,2], [4,6]] gibi
    for (const [start, end] of pageRanges) {
      const indices = [];
      for (let i = start; i <= end && i < srcPdf.getPageCount(); i++) {
        indices.push(i);
      }
      const pages = await newPdf.copyPages(srcPdf, indices);
      pages.forEach(p => newPdf.addPage(p));
    }

    const bytes = await newPdf.save();
    fs.writeFileSync(outputPath, bytes);
    return { success: true, path: outputPath, pageCount: newPdf.getPageCount() };
  }

  /**
   * PDF'ten sayfa sil (yeni dosyaya yaz)
   */
  async deletePages(inputPath, outputPath, pageIndices) {
    if (!fs.existsSync(inputPath)) throw new Error('Dosya bulunamadi: ' + inputPath);

    const data = fs.readFileSync(inputPath);
    const pdf = await PDFDocument.load(data, { ignoreEncryption: true });
    const totalPages = pdf.getPageCount();
    const keep = [];
    for (let i = 0; i < totalPages; i++) {
      if (!pageIndices.includes(i)) keep.push(i);
    }
    if (keep.length === 0) throw new Error('En az 1 sayfa kalmali');

    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdf, keep);
    pages.forEach(p => newPdf.addPage(p));

    const bytes = await newPdf.save();
    fs.writeFileSync(outputPath, bytes);
    return { success: true, path: outputPath, pageCount: newPdf.getPageCount() };
  }
}

module.exports = new MergeService();
