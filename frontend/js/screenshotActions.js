// -------------------------------------------------------
// screenshotActions.js – Ekran goruntusu alma, gosterme
// -------------------------------------------------------

async function captureAndShowScreenshot() {
  try {
    const result = await Backend.captureScreenshot();
    if (result.error) {
      setStatus('Screenshot hatasi: ' + result.error, 'busy');
      sendErrorToBackend('UNKNOWN', result.error, 'screenshotActions.capture');
      return;
    }

    // Gorseli modal'da goster
    $('screenshotPreviewImg').src = result.dataUrl;
    $('screenshotPreviewImg').style.display = 'block';
    $('screenshotPath').textContent = result.filename;
    $('screenshotCurrentPath').value = result.path;
    $('screenshotPreviewModal').classList.add('active');
    setStatus('Screenshot alindi: ' + result.filename, 'ok');
  } catch (err) {
    setStatus('Screenshot hatasi', 'busy');
    sendErrorToBackend('UNKNOWN', err.message, 'screenshotActions.capture', err);
  }
}

function closeScreenshotPreview() {
  $('screenshotPreviewModal').classList.remove('active');
}

async function copyScreenshotToClipboard() {
  const img = $('screenshotPreviewImg');
  if (!img.src || img.src === '') return;
  try {
    // Data URL'den blob'a, clipboard'a
    const response = await fetch(img.src);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    setStatus('Screenshot panoya kopyalandi!', 'ok');
  } catch (_) {
    // Fallback
    setStatus('Kopyalanamadi', 'busy');
  }
}

async function saveScreenshotAs() {
  const filePath = $('screenshotCurrentPath').value;
  if (!filePath) return;
  try {
    // Elektron ile farkli kaydet dialog'u acilamaz - dosya zaten kayitli
    setStatus('Screenshot kaydedildi: ' + filePath, 'ok');
  } catch (_) {}
}

async function showScreenshotHistory() {
  try {
    const list = await Backend.listScreenshots();
    let html = '';
    if (list.length === 0) {
      html = '<p style="color:var(--text-muted);padding:20px 0;text-align:center;font-size:13px">Henuz screenshot yok.</p>';
    } else {
      for (const s of list) {
        const sizeKB = (s.size / 1024).toFixed(1);
        const date = new Date(s.createdAt).toLocaleString('tr-TR');
        html += `<div class="ss-item" data-path="${s.path}">
          <div class="ss-item-info">
            <span class="ss-item-name">${s.filename}</span>
            <span class="ss-item-date">${date} &middot; ${sizeKB} KB</span>
          </div>
          <div class="ss-item-actions">
            <button class="btn-icon ss-view" title="Goster">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button class="btn-icon ss-delete" title="Sil" style="color:var(--danger)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>
          </div>
        </div>`;
      }
    }
    $('screenshotHistoryBody').innerHTML = html;

    // View butonlari
    $('screenshotHistoryBody').querySelectorAll('.ss-view').forEach((btn, idx) => {
      btn.addEventListener('click', async function() {
        const item = this.closest('.ss-item');
        const path = item.dataset.path;
        const dataUrl = await Backend.readScreenshot(path);
        if (dataUrl) {
          $('screenshotPreviewImg').src = dataUrl;
          $('screenshotPreviewImg').style.display = 'block';
          $('screenshotPath').textContent = path.split('\\').pop();
          $('screenshotCurrentPath').value = path;
          closeScreenshotHistory();
          $('screenshotPreviewModal').classList.add('active');
        }
      });
    });

    // Delete butonlari
    $('screenshotHistoryBody').querySelectorAll('.ss-delete').forEach(btn => {
      btn.addEventListener('click', async function() {
        const item = this.closest('.ss-item');
        const path = item.dataset.path;
        const result = await Backend.deleteScreenshot(path);
        if (result.success) {
          item.remove();
          setStatus('Screenshot silindi', 'ok');
        }
      });
    });

    $('screenshotHistoryModal').classList.add('active');
  } catch (err) {
    setStatus('Screenshot listesi alinamadi', 'busy');
  }
}

function closeScreenshotHistory() {
  $('screenshotHistoryModal').classList.remove('active');
}
