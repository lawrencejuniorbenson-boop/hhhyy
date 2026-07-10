/* ── AUTH HELPERS ────────────────────────────────────────────────── */
let authMode = 'login';
// INACTIVITY AUTO LOGOUT LOGIC
let inactivityTimer = null;
let countdownTimer = null;
let countdownSeconds = 20;
let isWarningActive = false;

function startInactivityTimer() {
  clearInactivityTimers();
  if (!AUTH_TOKEN) return;
  
  // Trigger warning after 3 minutes 40 seconds (220,000 ms) of inactivity
  inactivityTimer = setTimeout(showInactivityWarning, 220000);
}

function clearInactivityTimers() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (countdownTimer) clearInterval(countdownTimer);
  isWarningActive = false;
}

function showInactivityWarning() {
  isWarningActive = true;
  countdownSeconds = 20;
  document.getElementById('inactivity-countdown').textContent = countdownSeconds;
  document.getElementById('inactivity-overlay').style.display = 'flex';
  
  countdownTimer = setInterval(() => {
    countdownSeconds--;
    document.getElementById('inactivity-countdown').textContent = countdownSeconds;
    if (countdownSeconds <= 0) {
      clearInterval(countdownTimer);
      performAutoLogout();
    }
  }, 1000);
}

async function performAutoLogout() {
  clearInactivityTimers();
  document.getElementById('inactivity-overlay').style.display = 'none';
  
  try {
    const email = sessionStorage.getItem('pp_user_email') || 'system';
    await logAuditAction('TIMEOUT_LOGOUT', 'system', null, `User session timed out due to inactivity: ${email}`);
  } catch (e) {
    console.error(e);
  }
  
  logout();
  toast('You have been logged out due to inactivity.');
}

function resetInactivityTimer(fromButton = false) {
  if (isWarningActive && !fromButton) {
    return; // Must click button if warning is active
  }
  document.getElementById('inactivity-overlay').style.display = 'none';
  startInactivityTimer();
}

['mousemove', 'keydown', 'mousedown', 'touchstart', 'click', 'scroll'].forEach(evt => {
  window.addEventListener(evt, () => resetInactivityTimer(false), { passive: true });
});

function togglePasswordVisibility() {
  const input = document.getElementById('auth-password');
  const btn = document.getElementById('btn-toggle-pass');
  if (!input || !btn) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'View';
  }
}

function toggleAuthMode(mode) {
  authMode = mode;
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('tab-register').classList.toggle('active', mode === 'register');
  document.getElementById('login-title').textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('login-subtitle').textContent = mode === 'login' ? 'Enter credentials to access secure portfolio dashboard' : 'Register a new authenticated user on the platform';
  document.getElementById('btn-auth-submit').textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  
  // Clear alert banners on tab switch
  const errAlert = document.getElementById('login-error-alert');
  const infoAlert = document.getElementById('login-info-alert');
  if (errAlert) errAlert.style.display = 'none';
  if (infoAlert) infoAlert.style.display = 'none';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) return;
  if (authMode === 'login') {
    await loginUser(email, password);
  } else {
    await registerUser(email, password);
  }
}

async function parseResponse(res) {
  let text = '';
  try {
    text = await res.text();
  } catch (e) {
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return {};
  }
  
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (e) {
    if (!res.ok) {
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        throw new Error(`Server Error (${res.status})`);
      }
      throw new Error(text || `Request failed with status ${res.status}`);
    }
    throw new Error('Failed to parse response JSON');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

async function loginUser(email, password) {
  showLoad(true);
  try {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await parseResponse(res);
    AUTH_TOKEN = data.access_token;
    IS_ADMIN = data.user.is_admin;
    
    sessionStorage.setItem('pp_auth_token', AUTH_TOKEN);
    sessionStorage.setItem('pp_user_email', data.user.email);
    sessionStorage.setItem('pp_is_admin', IS_ADMIN ? 'true' : 'false');
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    toast('Welcome back!');
    startInactivityTimer();
    try {
      await logAuditAction('LOGIN', 'system', null, `User logged in: ${data.user.email}`);
    } catch (e) { console.error(e); }
    await loadData();
  } catch (err) {
    const errAlert = document.getElementById('login-error-alert');
    const infoAlert = document.getElementById('login-info-alert');
    if (err.message.includes('pending admin approval')) {
      if (infoAlert) {
        document.getElementById('login-info-text').textContent = 'Your account is pending admin approval. Please wait for an administrator to approve it.';
        infoAlert.style.display = 'flex';
      }
      if (errAlert) errAlert.style.display = 'none';
    } else {
      if (errAlert) {
        document.getElementById('login-error-text').textContent = err.message;
        errAlert.style.display = 'flex';
      }
      if (infoAlert) infoAlert.style.display = 'none';
    }
    toast('Error: Sign in failed: ' + err.message);
  } finally {
    showLoad(false);
  }
}

async function registerUser(email, password) {
  showLoad(true);
  try {
    const res = await fetch(getApiUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await parseResponse(res);
    
    if (data.user.approved) {
      if (data.access_token) {
        AUTH_TOKEN = data.access_token;
        sessionStorage.setItem('pp_auth_token', AUTH_TOKEN);
        sessionStorage.setItem('pp_user_email', data.user.email);
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        toast('Account created and signed in successfully!');
        await loadData();
      } else {
        const infoAlert = document.getElementById('login-info-alert');
        const errAlert = document.getElementById('login-error-alert');
        if (infoAlert) {
          document.getElementById('login-info-text').textContent = 'Account created! Please check your email inbox to verify and sign in.';
          infoAlert.style.display = 'flex';
        }
        if (errAlert) errAlert.style.display = 'none';
        toast(' Account created! Please check your email inbox to verify.');
        toggleAuthMode('login');
      }
    } else {
      const infoAlert = document.getElementById('login-info-alert');
      const errAlert = document.getElementById('login-error-alert');
      if (infoAlert) {
        document.getElementById('login-info-text').textContent = 'Your registration request has been submitted and is pending admin approval. You will be able to sign in once approved.';
        infoAlert.style.display = 'flex';
      }
      if (errAlert) errAlert.style.display = 'none';
      toast('Account created. Registration is pending admin approval.');
      toggleAuthMode('login');
    }
  } catch (err) {
    const errAlert = document.getElementById('login-error-alert');
    const infoAlert = document.getElementById('login-info-alert');
    if (errAlert) {
      document.getElementById('login-error-text').textContent = err.message;
      errAlert.style.display = 'flex';
    }
    if (infoAlert) infoAlert.style.display = 'none';
    toast(' Account registration failed: ' + err.message);
  } finally {
    showLoad(false);
  }
}

function logout() {
  clearInactivityTimers();
  document.getElementById('inactivity-overlay').style.display = 'none';
  sessionStorage.removeItem('pp_auth_token');
  sessionStorage.removeItem('pp_user_email');
  sessionStorage.removeItem('pp_is_admin');
  AUTH_TOKEN = null;
  IS_ADMIN = false;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-container').style.display = 'none';
  toast('Signed out safely.');
}
