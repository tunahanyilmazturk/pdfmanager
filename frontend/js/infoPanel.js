// -------------------------------------------------------
// infoPanel.js – PDF bilgi paneli yönetimi
// -------------------------------------------------------

async function showInfoPanel(id) {
  const file = getFileById(id);
  if (!file) return;

  AppState.currentInfoFileId = file.id;
  $('infoPanel').classList.add('open');
  $('infoPanelContent').innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px;">Bilgiler yükleniyor...</div>`;

  try {
    const info = await Backend.getPdfInfo(file.path);
    if (info && info.error) {
      $('infoPanelContent').innerHTML = `<div class="info-panel-empty"><p>Bilgi alınamadı</p></div>`;
      return;
    }
    const rows = [
      { label: 'Dosya Adı', value: file.name },
      { label: 'Sayfa Sayısı', value: String(info.pageCount || '0') },
      { label: 'Boyut', value: formatSize(info.size || file.size) },
      { label: 'Değiştirilme', value: formatDateFull(info.lastModified || file.lastModified) },
      { label: 'Başlık', value: info.title || '-' },
      { label: 'Yazar', value: info.author || '-' },
      { label: 'Konu', value: info.subject || '-' },
      { label: 'Anahtar Kelimeler', value: info.keywords || '-' },
      { label: 'Oluşturan', value: info.creator || '-' },
      { label: 'Üretici', value: info.producer || '-' },
    ];
    let html = rows.map(r => `<div class="info-detail-row"><span class="label">${r.label}</span><span class="value">${r.value}</span></div>`).join('');

    // Kategori select
    const catOpts = AppState.categories.map(c =>
      `<option value="${c.name}" ${file.category === c.name ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    html += `<div class="info-detail-row">
      <span class="label">Kategori</span>
      <span class="value"><select class="info-cat-select" data-id="${file.id}" style="font-size:11px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;"><option value="">-</option>${catOpts}</select></span>
    </div>`;

    // Yeniden adlandır
    html += `<div class="info-detail-row" style="flex-wrap:wrap">
      <span class="label" style="width:100%;margin-bottom:4px">Yeniden Adlandır</span>
      <span class="value" style="width:100%;display:flex;gap:4px;">
        <input type="text" class="info-rename-input" value="${file.name}" style="flex:1;font-size:11px;padding:2px 4px;border:1px solid var(--border);border-radius:3px;">
        <button class="info-rename-btn" data-id="${file.id}" style="padding:2px 8px;font-size:10px;background:var(--primary);color:#fff;border:none;border-radius:3px;cursor:pointer;">Değiştir</button>
      </span>
    </div>`;

    $('infoPanelContent').innerHTML = html;

    $('infoPanelContent').querySelector('.info-cat-select')?.addEventListener('change', function() {
      changeCategory(this.dataset.id, this.value);
    });
    $('infoPanelContent').querySelector('.info-rename-btn')?.addEventListener('click', function() {
      const input = this.parentElement.querySelector('.info-rename-input');
      if (input) _doRename(this.dataset.id, input.value);
    });
    $('infoPanelContent').querySelector('.info-rename-input')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const btn = this.parentElement.querySelector('.info-rename-btn');
        if (btn) _doRename(btn.dataset.id, this.value);
      }
    });
  } catch (err) {
    $('infoPanelContent').innerHTML = `<div class="info-panel-empty"><p>Bilgi alınamadı</p></div>`;
    sendErrorToBackend('PDF_PARSE_FAIL', 'PDF metadata okunamadi: ' + file.name, 'infoPanel.showInfoPanel', err);
  }
}

function closeInfoPanel() {
  $('infoPanel').classList.remove('open');
  AppState.currentInfoFileId = null;
}

async function _doRename(id, newName) {
  const file = getFileById(id);
  if (!file) return;
  newName = (newName || '').trim();
  if (!newName || newName === file.name) return;
  if (!newName.toLowerCase().endsWith('.pdf')) {
    setStatus('Dosya adı .pdf ile bitmeli', 'busy');
    return;
  }
  const result = await Backend.renameFile(file.path, newName);
  if (result.success) {
    file.name = result.newName;
    file.path = result.newPath;
    renderList();
    showInfoPanel(file.id);
    setStatus('Dosya yeniden adlandırıldı', 'ok');
    saveSession();
  } else {
    setStatus('Hata: ' + result.error, 'busy');
    sendErrorToBackend('FILE_RENAME_FAIL', result.error, 'infoPanel._doRename (' + file.name + ')');
  }
}
