// -------------------------------------------------------
// fileops.service.js – Toplu yeniden adlandirma, dosya islemleri
// -------------------------------------------------------
const fs = require('fs');
const path = require('path');

class FileOpsService {

  /**
   * Toplu yeniden adlandirma
   * ornek: { prefix: 'rapor', startNum: 1, padding: 3, datePrefix: false }
   */
  async batchRename(files, options) {
    const { prefix = '', startNum = 1, padding = 2, datePrefix = false, useOriginalName = false } = options;
    let num = startNum;
    const results = [];

    for (const file of files) {
      const dir = path.dirname(file.path);
      const ext = path.extname(file.name);
      let newName = '';

      if (useOriginalName) {
        const base = path.basename(file.name, ext);
        newName = `${prefix}${base}${String(num).padStart(padding, '0')}${ext}`;
      } else if (datePrefix) {
        const date = new Date(file.lastModified);
        const ds = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
        newName = `${ds}_${prefix}${String(num).padStart(padding, '0')}${ext}`;
      } else {
        newName = `${prefix}${String(num).padStart(padding, '0')}${ext}`;
      }

      const newPath = path.join(dir, newName);
      try {
        // Cakisma kontrol: hedef dosya zaten varsa numarayi artir
        if (fs.existsSync(newPath) && newPath !== file.path) {
          let counter = 1;
          while (true) {
            const altName = `${prefix}${String(num + counter).padStart(padding, '0')}${ext}`;
            const altPath = path.join(dir, altName);
            if (!fs.existsSync(altPath)) {
              fs.renameSync(file.path, altPath);
              results.push({ oldName: file.name, newName: altName, success: true });
              break;
            }
            counter++;
          }
        } else {
          fs.renameSync(file.path, newPath);
          results.push({ oldName: file.name, newName, success: true });
        }
      } catch (err) {
        results.push({ oldName: file.name, newName, success: false, error: err.message });
      }
      num++;
    }
    return { success: true, results };
  }
}

module.exports = new FileOpsService();
