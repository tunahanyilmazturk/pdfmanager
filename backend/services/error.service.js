// -------------------------------------------------------
// error.service.js – Hata kodlari, loglama, dosyaya yazma
// -------------------------------------------------------
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Hata kodlari
const ErrorCodes = {
  // Genel (1xxx)
  UNKNOWN:            { code: 1000, title: 'Bilinmeyen Hata',        severity: 'error' },
  APP_CRASH:          { code: 1001, title: 'Uygulama Hatasi',        severity: 'critical' },

  // PDF (2xxx)
  PDF_OPEN_FAIL:      { code: 2000, title: 'PDF Acilamadi',          severity: 'error' },
  PDF_PARSE_FAIL:     { code: 2001, title: 'PDF Okunamadi',          severity: 'error' },
  PDF_CORRUPT:        { code: 2002, title: 'PDF Bozuk veya Hasarli', severity: 'warning' },
  PDF_NOT_FOUND:      { code: 2003, title: 'PDF Dosyasi Bulunamadi', severity: 'error' },
  PDF_SELECT_FAIL:    { code: 2004, title: 'PDF Secilemedi',         severity: 'error' },

  // Yazdirma (3xxx)
  PRINT_FAIL:         { code: 3000, title: 'Yazdirma Basarisiz',     severity: 'error' },
  PRINTER_NOT_FOUND:  { code: 3001, title: 'Yazici Bulunamadi',      severity: 'warning' },
  PRINT_CANCELLED:    { code: 3002, title: 'Yazdirma Iptal Edildi',  severity: 'info' },

  // Dosya (4xxx)
  FILE_RENAME_FAIL:   { code: 4000, title: 'Dosya Yeniden Adlandirilamadi', severity: 'error' },
  FILE_DELETE_FAIL:   { code: 4001, title: 'Dosya Silinemedi',       severity: 'error' },
  FILE_ACCESS_DENIED: { code: 4002, title: 'Dosyaya Erisilemiyor',   severity: 'error' },

  // Birlestirme (5xxx)
  MERGE_FAIL:         { code: 5000, title: 'Birlestirme Basarisiz',  severity: 'error' },
  MERGE_TOO_FEW:      { code: 5001, title: 'Yetersiz PDF Sayisi',    severity: 'warning' },

  // Oturum (6xxx)
  SESSION_SAVE_FAIL:  { code: 6000, title: 'Oturum Kaydedilemedi',   severity: 'warning' },
  SESSION_LOAD_FAIL:  { code: 6001, title: 'Oturum Yuklenemedi',     severity: 'warning' },
};

class ErrorService {
  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'hantech-logs');
    this.sessionLog = []; // oturum ici log
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Yapilandirilmis hata objesi olusturur
   */
  create(errorCode, details = '', originalError = null) {
    const def = ErrorCodes[errorCode] || ErrorCodes.UNKNOWN;
    const ts = new Date().toISOString();

    return {
      id: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      timestamp: ts,
      timeFormatted: new Date().toLocaleString('tr-TR'),
      code: def.code,
      title: def.title,
      severity: def.severity,
      details: details || '',
      originalMessage: originalError ? (originalError.message || String(originalError)) : '',
      stack: originalError ? (originalError.stack || '') : '',
      context: '',
    };
  }

  /**
   * Su anki pencereye hata gonderir
   */
  sendToWindow(errorObj, mainWindow) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('error-occurred', errorObj);
    }
  }

  /**
   * Hatayi log dosyasina yazar
   */
  logToFile(errorObj) {
    try {
      this._ensureDir();
      const today = new Date().toISOString().slice(0, 10);
      const logFile = path.join(this.logDir, `error-${today}.log`);

      const line = [
        `[${errorObj.timeFormatted}]`,
        `[${errorObj.code}]`,
        `[${errorObj.severity.toUpperCase()}]`,
        errorObj.title,
        errorObj.details ? `| ${errorObj.details}` : '',
        errorObj.originalMessage ? `| ${errorObj.originalMessage}` : '',
      ].join(' ');

      fs.appendFileSync(logFile, line + '\n', 'utf-8');
    } catch (_) { /* log hatasi sessiz */ }
  }

  /**
   * Session log'a ekler
   */
  logToSession(errorObj) {
    this.sessionLog.push(errorObj);
    if (this.sessionLog.length > 200) this.sessionLog.shift();
  }

  /**
   * Session log'u al
   */
  getSessionLog() {
    return [...this.sessionLog];
  }

  /**
   * Bugunun log dosyasini oku
   */
  getTodayLog() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const logFile = path.join(this.logDir, `error-${today}.log`);
      if (!fs.existsSync(logFile)) return '';
      return fs.readFileSync(logFile, 'utf-8');
    } catch (_) { return ''; }
  }

  /**
   * Tam hata metni (kopyalamak icin)
   */
  getFullText(errorObj) {
    return [
      `═══════════════════════════════════════`,
      `  HanTech Hata Raporu`,
      `═══════════════════════════════════════`,
      `  ID:       ${errorObj.id}`,
      `  Tarih:    ${errorObj.timeFormatted}`,
      `  Kod:      ${errorObj.code}`,
      `  Seviye:   ${errorObj.severity.toUpperCase()}`,
      `  Baslik:   ${errorObj.title}`,
      `  Detay:    ${errorObj.details || '-'}`,
      `  Mesaj:    ${errorObj.originalMessage || '-'}`,
      `  Baglam:   ${errorObj.context || '-'}`,
      `───────────────────────────────────────`,
      `  Stack:`,
      errorObj.stack || '  (stack yok)',
      `───────────────────────────────────────`,
      `  HanTech PDF Manager v2.1.0`,
      `═══════════════════════════════════════`,
    ].join('\n');
  }
}

module.exports = { ErrorCodes, errorService: new ErrorService() };
