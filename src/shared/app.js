/* ── BOOTSTRAP INITIALIZATION SEQUENCE ───────────────────────────── */
applyDOM();
if (AUTH_TOKEN) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';
  startInactivityTimer();
  loadData();
  setTimeout(async () => {
    try {
      const email = sessionStorage.getItem('pp_user_email') || 'system';
      await logAuditAction('ACCESS', 'system', null, `User entered the platform: ${email}`);
    } catch (e) { console.error('Access log failed:', e); }
  }, 1200);
} else {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-container').style.display = 'none';
}
