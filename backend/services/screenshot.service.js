// -------------------------------------------------------
// screenshot.service.js – Ekran goruntusu alma servisi
// -------------------------------------------------------
const { desktopCapturer, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ScreenshotService {
  constructor() {
    this.screenshotsDir = path.join(app.getPath('userData'), 'hantech-screenshots');
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  /**
   * Tum ekrani/base window'u goruntule
   */
  async captureWindow(window) {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 0, height: 0 }, // varsayilan boyut
    });

    // Mevcut pencerenin source'unu bul
    const winSource = sources.find(s =>
      s.name === 'HanTech PDF Manager' || s.name.includes('HanTech')
    );

    // Image icin display'i kullan
    const displays = screen.getAllDisplays();
    const primary = displays.find(d => d.bounds.x === 0 && d.bounds.y === 0) || displays[0];
    const scale = 1;
    const width = Math.round(primary.size.width * scale);
    const height = Math.round(primary.size.height * scale);

    const allSources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height },
    });

    const src = allSources[0];
    if (!src) return { error: 'Kaynak bulunamadi' };

    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.png`;
    const filePath = path.join(this.screenshotsDir, filename);

    const dataUrl = src.thumbnail.toDataURL();
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(filePath, base64Data, 'base64');

    return {
      success: true,
      path: filePath,
      filename: filename,
      timestamp: timestamp,
      dataUrl: dataUrl,
    };
  }

  /**
   * Onceki screenshot'lari listele
   */
  listScreenshots() {
    if (!fs.existsSync(this.screenshotsDir)) return [];
    return fs.readdirSync(this.screenshotsDir)
      .filter(f => f.endsWith('.png'))
      .map(f => {
        const stats = fs.statSync(path.join(this.screenshotsDir, f));
        return {
          filename: f,
          path: path.join(this.screenshotsDir, f),
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Screenshot'i base64 olarak oku
   */
  readScreenshot(filePath) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }

  /**
   * Screenshot'i sil
   */
  deleteScreenshot(filePath) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'Dosya bulunamadi' };
  }
}

module.exports = new ScreenshotService();
