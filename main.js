const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const pdfToPrinter = require('pdf-to-printer');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Disable worker - node.js mode
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1300,
        height: 850,
        minWidth: 1000,
        minHeight: 650,
        title: 'HanTech PDF Manager',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ========================================
// PDF metadata helper
// ========================================
async function getPdfPageCount(filePath) {
    try {
        const data = new Uint8Array(fs.readFileSync(filePath));
        const doc = await pdfjsLib.getDocument({ data }).promise;
        const count = doc.numPages;
        doc.destroy();
        return count;
    } catch (_) {
        return 0;
    }
}

async function getPdfFullInfo(filePath) {
    try {
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
    } catch (err) {
        return { error: err.message };
    }
}

// ========================================
// PDF Dosyalarını Seç
// ========================================
ipcMain.handle('select-pdfs', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'PDF Dosyalarını Seç',
        filters: [{ name: 'PDF Dosyaları', extensions: ['pdf'] }],
        properties: ['openFile', 'multiSelections'],
    });
    if (result.canceled) return [];

    const files = [];
    for (let i = 0; i < result.filePaths.length; i++) {
        const fp = result.filePaths[i];
        try {
            const stats = fs.statSync(fp);
            const pageCount = await getPdfPageCount(fp);
            files.push({
                id: Date.now() + '_' + i + '_' + Math.random().toString(36).substr(2, 4),
                path: fp,
                name: path.basename(fp),
                size: stats.size,
                lastModified: stats.mtime.toISOString(),
                pageCount: pageCount,
                category: '',
            });
        } catch (_) {}
    }
    return files;
});

// ========================================
// PDF Bilgisi Al (metadata paneli için)
// ========================================
ipcMain.handle('get-pdf-info', async (event, filePath) => {
    const info = await getPdfFullInfo(filePath);
    try {
        const stats = fs.statSync(filePath);
        info.size = stats.size;
        info.lastModified = stats.mtime.toISOString();
    } catch (_) {}
    return info;
});

// ========================================
// PDF Dosyasını Oku (base64)
// ========================================
ipcMain.handle('read-pdf-file', async (event, filePath) => {
    try {
        const data = fs.readFileSync(filePath);
        return data.toString('base64');
    } catch (_) { return null; }
});

// ========================================
// Toplu PDF Yazdırma
// ========================================
ipcMain.handle('print-pdfs', async (event, filePaths, options = {}) => {
    try {
        const { printerName = null, copies = 1 } = options;
        for (let i = 0; i < filePaths.length; i++) {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('print-progress', {
                    current: i + 1,
                    total: filePaths.length,
                    fileName: path.basename(filePaths[i]),
                });
            }
            const opts = { silent: true };
            if (printerName) opts.printer = printerName;
            if (copies > 1) opts.copies = copies;
            await pdfToPrinter.print(filePaths[i], opts);
        }
        return { success: true, total: filePaths.length };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// ========================================
// Yazıcı Listesi
// ========================================
ipcMain.handle('get-printers', async () => {
    try {
        const printers = await pdfToPrinter.getPrinters();
        return printers.map(p => ({
            name: p.name,
            isDefault: p.isDefault || false,
            status: p.status || 'ready',
        }));
    } catch (_) { return []; }
});

ipcMain.handle('get-default-printer', async () => {
    try {
        const printers = await pdfToPrinter.getPrinters();
        const dp = printers.find(p => p.isDefault) || printers[0];
        return dp ? dp.name : 'Yazıcı bulunamadı';
    } catch (_) { return 'Yazıcı bilgisi alınamadı'; }
});

// ========================================
// Sürükle-Bırak ile PDF Ekleme
// ========================================
ipcMain.handle('add-pdf-from-path', async (event, filePath) => {
    try {
        if (!filePath.toLowerCase().endsWith('.pdf')) return null;
        const stats = fs.statSync(filePath);
        const pageCount = await getPdfPageCount(filePath);
        return {
            id: Date.now() + '_d_' + Math.random().toString(36).substr(2, 6),
            path: filePath,
            name: path.basename(filePath),
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            pageCount: pageCount,
            category: '',
        };
    } catch (_) { return null; }
});

// ========================================
// Dosya İşlemleri
// ========================================
ipcMain.handle('rename-file', async (event, oldPath, newName) => {
    try {
        const dir = path.dirname(oldPath);
        const newPath = path.join(dir, newName);
        fs.renameSync(oldPath, newPath);
        return { success: true, newPath, newName };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// ========================================
// Oturum
// ========================================
ipcMain.handle('save-session', async (event, data) => {
    try {
        const dir = path.join(app.getPath('userData'), 'hantech-sessions');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'session.json'), JSON.stringify(data, null, 2));
        return { success: true };
    } catch (_) { return { success: false }; }
});

ipcMain.handle('load-session', async () => {
    try {
        const p = path.join(app.getPath('userData'), 'hantech-sessions', 'session.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
        return null;
    } catch (_) { return null; }
});

// ========================================
// Kategoriler
// ========================================
ipcMain.handle('save-categories', async (event, categories) => {
    try {
        const dir = path.join(app.getPath('userData'), 'hantech-sessions');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'categories.json'), JSON.stringify(categories, null, 2));
        return { success: true };
    } catch (_) { return { success: false }; }
});

ipcMain.handle('load-categories', async () => {
    try {
        const p = path.join(app.getPath('userData'), 'hantech-sessions', 'categories.json');
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
        return [];
    } catch (_) { return []; }
});
