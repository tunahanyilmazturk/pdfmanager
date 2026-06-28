// -------------------------------------------------------
// errorHandler.js – Hata yönetimi UI, göster, kopyala, log
// -------------------------------------------------------

/* ---------- HATA GÖSTER ---------- */
function showError(errorObj) {
  // Mevcut hatayi guncelle
  _renderError(errorObj);

  // Modal'i ac
  $('errorModal').classList.add('active');
}

function _renderError(err) {
  const severityColors = {
    critical: '#7c3aed',
    error: '#dc2626',
    warning: '#f59e0b',
    info: '#2563eb',
  };
  const color = severityColors[err.severity] || '#64748b';

  $('errorIcon').innerHTML = _severityIcon(err.severity);
  $('errorIcon').style.color = color;
  $('errorBadge').textContent = err.severity.toUpperCase();
  $('errorBadge').style.background = color;
  $('errorCode').textContent = 'Kod: ' + err.code;
  $('errorTitle').textContent = err.title;
  $('errorDetail').textContent = err.details || '-';
  $('errorTime').textContent = err.timeFormatted;
  $('errorId').textContent = err.id;
  $('errorOriginal').textContent = err.originalMessage || '-';
  $('errorStack').textContent = err.stack || '(stack bilgisi yok)';
  $('errorStack').style.display = err.stack ? 'block' : 'none';
  $('errorContext').textContent = err.context || '-';

  // Kopyala butonuna error objesini ata
  $('errorCopyBtn').dataset.errorId = err.id;
  // Gecici referans
  window.__lastError = err;
}

function _severityIcon(severity) {
  const icons = {
    critical: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    error: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  return icons[severity] || icons.info;
}

/* ---------- KOPYALA ---------- */
async function copyLastErrorToClipboard() {
  const err = window.__lastError;
  if (!err) return;

  try {
    const result = await Backend.copyErrorToClipboard(err);
    if (result.success) {
      _showCopyToast();
    }
  } catch (_) {
    // Fallback: manuel kopyala
    try {
      const text = _buildErrorText(err);
      await navigator.clipboard.writeText(text);
      _showCopyToast();
    } catch (_2) {}
  }
}

function _buildErrorText(err) {
  return [
    `═══════════════════════════════════════`,
    `  HanTech Hata Raporu`,
    `═══════════════════════════════════════`,
    `  ID:       ${err.id}`,
    `  Tarih:    ${err.timeFormatted}`,
    `  Kod:      ${err.code}`,
    `  Seviye:   ${err.severity.toUpperCase()}`,
    `  Baslik:   ${err.title}`,
    `  Detay:    ${err.details || '-'}`,
    `  Mesaj:    ${err.originalMessage || '-'}`,
    `  Baglam:   ${err.context || '-'}`,
    `───────────────────────────────────────`,
    `  Stack:`,
    err.stack || '  (stack yok)',
    `───────────────────────────────────────`,
    `  HanTech PDF Manager v2.1.0`,
    `  ${new Date().toLocaleString('tr-TR')}`,
    `═══════════════════════════════════════`,
  ].join('\n');
}

let _toastTimer = null;
function _showCopyToast() {
  const toast = $('copyToast');
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

/* ---------- HATA GÖNDER (frontend'den) ---------- */
async function sendErrorToBackend(code, details, context = '', originalError = null) {
  try {
    const errObj = await Backend.reportError({
      code,
      details,
      context,
      originalError: originalError ? (originalError.message || String(originalError)) : '',
      originalMessage: originalError ? (originalError.message || String(originalError)) : '',
      stack: originalError ? originalError.stack : '',
    });
    showError(errObj);
    return errObj;
  } catch (_) {
    // Backend'e gonderilemedi - local'de goster
    const fallback = {
      id: 'LOCAL-' + Date.now(),
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleString('tr-TR'),
      code: 9999,
      title: 'Hata',
      severity: 'error',
      details: details || code,
      originalMessage: originalError ? (originalError.message || String(originalError)) : '',
      stack: originalError ? originalError.stack : '',
      context,
    };
    showError(fallback);
  }
}

/* ---------- HATA LOG PANELI ---------- */
async function showErrorLogModal() {
  try {
    const log = await Backend.getErrorLog();
    const today = await Backend.getTodayErrorLog();

    let html = '<div class="form-group"><label>Bu Oturum</label>';
    if (log.length === 0) {
      html += '<p style="color:var(--text-muted);font-size:12px">Bu oturumda hata kaydi yok.</p>';
    } else {
      for (const e of log) {
        const sev = e.severity || 'error';
        const colors = { critical:'#7c3aed', error:'#dc2626', warning:'#f59e0b', info:'#2563eb' };
        html += `<div class="error-log-item" style="border-left:3px solid ${colors[sev]||'#64748b'}">
          <span class="error-log-time">${e.timeFormatted}</span>
          <span class="error-log-title">[${e.code}] ${e.title}</span>
          <span class="error-log-detail">${e.details || ''}</span>
        </div>`;
      }
    }

    html += '</div><div class="form-group" style="margin-top:12px"><label>Bugünkü Log Dosyası</label>';
    if (today) {
      html += `<textarea class="form-input" readonly style="height:120px;font-family:monospace;font-size:11px;resize:vertical">${today.slice(0, 2000)}${today.length > 2000 ? '\n... (devami kesildi)' : ''}</textarea>`;
    } else {
      html += '<p style="color:var(--text-muted);font-size:12px">Bugün log kaydi yok.</p>';
    }
    html += '</div>';

    $('errorLogBody').innerHTML = html;
    $('errorLogModal').classList.add('active');
  } catch (_) {}
}

function closeErrorLogModal() {
  $('errorLogModal').classList.remove('active');
}
