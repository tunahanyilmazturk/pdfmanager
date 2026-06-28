// -------------------------------------------------------
// category.service.js – Kategori listesi kaydet / yükle
// -------------------------------------------------------
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class CategoryService {
  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'hantech-sessions', 'categories.json');
  }

  _ensureDir() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  save(categories) {
    this._ensureDir();
    fs.writeFileSync(this.filePath, JSON.stringify(categories, null, 2));
    return { success: true };
  }

  load() {
    if (!fs.existsSync(this.filePath)) return [];
    return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
  }
}

module.exports = new CategoryService();
