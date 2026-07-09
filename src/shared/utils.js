function showLoad(v) { document.getElementById('loading').classList.toggle('hidden', !v); }
function showErr(m) { const b = document.getElementById('err-banner'); document.getElementById('err-text').textContent = m; b.classList.add('show'); }
function hideErr() { document.getElementById('err-banner').classList.remove('show'); }
function toast(m, d = 3300) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), d); }
function dc(k) { if (charts[k]) { charts[k].destroy(); delete charts[k]; } }
function N(n) { return n != null ? Number(n).toLocaleString() : '-'; }
function C(n) { return n != null ? 'GH₵ ' + Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'; }
function CCompact(n) { if (n == null) return '-'; const num = Number(n); if (Math.abs(num) >= 1e6) return 'GH₵ ' + (num / 1e6).toFixed(1) + 'M'; if (Math.abs(num) >= 1e3) return 'GH₵ ' + (num / 1e3).toFixed(1) + 'K'; return 'GH₵ ' + num.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function applyDOM() {
  document.getElementById('hdr-title').textContent = SETTINGS.title;
  document.getElementById('hdr-sub').textContent = SETTINGS.sub;
  document.getElementById('hdr-icon').textContent = SETTINGS.ll || 'P';
  document.title = SETTINGS.title;
  const r = document.documentElement.style;
  Object.entries(SETTINGS.colors).forEach(([k, v]) => r.setProperty('--' + k, v));
  
  const navAudit = document.getElementById('nav-audit');
  if (navAudit) {
    navAudit.style.display = IS_ADMIN ? '' : 'none';
  }
  const adminBtn = document.getElementById('sb-admin-settings-btn');
  if (adminBtn) {
    adminBtn.style.display = IS_ADMIN ? '' : 'none';
  }
}
