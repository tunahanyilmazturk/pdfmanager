// -------------------------------------------------------
// session.service.js – Oturum (PDF listesi) kaydet / yükle
// -------------------------------------------------------
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { errorService } = require('./error.service');

class SessionService {
  constructor() {
    this.baseDir = path.join(app.getPath('userData'), 'hantech-sessions');
  }

  _ensureDir() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  save(data) {
    try {
      this._ensureDir();
      fs.writeFileSync(
        path.join(this.baseDir, 'session.json'),
        JSON.stringify(data, null, 2),
      );
      return { success: true };
    } catch (err) {
      const errObj = errorService.create('SESSION_SAVE_FAIL', 'Oturum dosyasi yazilamadi', err);
      errorService.logToFile(errObj);
      errorService.logToSession(errObj);
      return { success: false, error: err.message };
    }
  }

  load() {
    try {
      const filePath = path.join(this.baseDir, 'session.json');
      if (!fs.existsSync(filePath)) return null;
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      const errObj = errorService.create('SESSION_LOAD_FAIL', 'Oturum dosyasi okunamadi', err);
      errorService.logToFile(errObj);
      errorService.logToSession(errObj);
      return null;
    }
  }

  clear() {
    try {
      const filePath = path.join(this.baseDir, 'session.json');
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
  }
}

module.exports = new SessionService();
