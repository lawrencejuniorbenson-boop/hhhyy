const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Setup Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files server
app.use('/src', express.static(path.join(__dirname, 'src')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('CRITICAL ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in env!');
  process.exit(1);
}

// Global anonymous client
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

// Helper to get user-scoped client from request headers
function getClient(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined
      }
    }
  });
}

// Auth validation middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Admin-only validation middleware
async function requireAdmin(req, res, next) {
  try {
    const sb = getClient(req);
    const { data, error } = await sb.from('user_approvals').select('is_admin').eq('email', req.user.email).maybeSingle();
    if (error || !data || !data.is_admin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ── AUTH ENDPOINTS ──────────────────────────────────────────────── */

// Sign in
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    // Check approvals
    const { data: appr, error: apprErr } = await supabaseAnon
      .from('user_approvals')
      .select('*')
      .eq('email', data.user.email);

    if (apprErr) return res.status(500).json({ error: apprErr.message });
    if (appr.length === 0 || !appr[0].approved) {
      return res.status(403).json({ error: 'Your account is pending admin approval.' });
    }

    res.json({
      access_token: data.session.access_token,
      user: {
        email: data.user.email,
        is_admin: appr[0].is_admin
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { data, error } = await supabaseAnon.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const emailLower = email.trim().toLowerCase();
    const { data: existing, error: getErr } = await supabaseAnon.from('user_approvals').select('*').eq('email', emailLower);
    if (getErr) return res.status(500).json({ error: getErr.message });

    const isApproved = existing.length > 0 && existing[0].approved;

    res.json({
      access_token: data.session ? data.session.access_token : null,
      user: {
        email: data.user.email,
        approved: isApproved
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── PRODUCTS ENDPOINTS ──────────────────────────────────────────── */

// Get all products
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data, error } = await sb.from('products_full').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data: [p], error: pErr } = await sb.from('products').insert(req.body.core).select();
    if (pErr) return res.status(400).json({ error: pErr.message });

    const { gaps, markets, enhancements } = req.body;
    const promises = [];
    if (gaps && gaps.length) promises.push(sb.from('product_gaps').insert(gaps.map((t, i) => ({ product_id: p.id, gap_text: t, sort_order: i }))));
    if (markets && markets.length) promises.push(sb.from('product_markets').insert(markets.map((t, i) => ({ product_id: p.id, market_text: t, sort_order: i }))));
    if (enhancements && enhancements.length) promises.push(sb.from('product_enhancements').insert(enhancements.map((t, i) => ({ product_id: p.id, enhancement_text: t, sort_order: i }))));

    await Promise.all(promises);
    res.json({ id: p.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
app.patch('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const sb = getClient(req);
    const { error: pErr } = await sb.from('products').update(req.body.core).eq('id', id);
    if (pErr) return res.status(400).json({ error: pErr.message });

    // Clean child collections
    await Promise.all([
      sb.from('product_gaps').delete().eq('product_id', id),
      sb.from('product_markets').delete().eq('product_id', id),
      sb.from('product_enhancements').delete().eq('product_id', id)
    ]);

    const { gaps, markets, enhancements } = req.body;
    const promises = [];
    if (gaps && gaps.length) promises.push(sb.from('product_gaps').insert(gaps.map((t, i) => ({ product_id: id, gap_text: t, sort_order: i }))));
    if (markets && markets.length) promises.push(sb.from('product_markets').insert(markets.map((t, i) => ({ product_id: id, market_text: t, sort_order: i }))));
    if (enhancements && enhancements.length) promises.push(sb.from('product_enhancements').insert(enhancements.map((t, i) => ({ product_id: id, enhancement_text: t, sort_order: i }))));

    await Promise.all(promises);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const sb = getClient(req);
    await Promise.all([
      sb.from('product_gaps').delete().eq('product_id', id),
      sb.from('product_markets').delete().eq('product_id', id),
      sb.from('product_enhancements').delete().eq('product_id', id)
    ]);
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── PROJECTS ENDPOINTS ──────────────────────────────────────────── */

// Get all projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data, error } = await sb.from('projects_full').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create project
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data: [p], error: pErr } = await sb.from('projects').insert(req.body.core).select();
    if (pErr) return res.status(400).json({ error: pErr.message });

    const { tasks } = req.body;
    if (tasks && tasks.length) {
      const { error: tErr } = await sb.from('project_tasks').insert(tasks.map((t, i) => ({ project_id: p.id, task_text: t.task_text, target_date: t.target_date || null, status: t.status || 'Pending', owner: t.owner || '', sort_order: i })));
      if (tErr) return res.status(400).json({ error: tErr.message });
    }
    res.json({ id: p.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project
app.patch('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const sb = getClient(req);
    const { error: pErr } = await sb.from('projects').update(req.body.core).eq('id', id);
    if (pErr) return res.status(400).json({ error: pErr.message });

    await sb.from('project_tasks').delete().eq('project_id', id);

    const { tasks } = req.body;
    if (tasks && tasks.length) {
      const { error: tErr } = await sb.from('project_tasks').insert(tasks.map((t, i) => ({ project_id: id, task_text: t.task_text, target_date: t.target_date || null, status: t.status || 'Pending', owner: t.owner || '', sort_order: i })));
      if (tErr) return res.status(400).json({ error: tErr.message });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const sb = getClient(req);
    await sb.from('project_tasks').delete().eq('project_id', id);
    const { error } = await sb.from('projects').delete().eq('id', id);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update single task status
app.patch('/api/projects/:id/tasks/:taskId', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  try {
    const sb = getClient(req);
    const { error } = await sb.from('project_tasks').update({ status }).eq('id', taskId);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── SETTINGS ENDPOINTS ──────────────────────────────────────────── */

app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data, error } = await sb.from('dashboard_settings').select('key,value');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data, error } = await sb.from('dashboard_settings').upsert(req.body);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── AUDIT LOGS ENDPOINTS ────────────────────────────────────────── */

app.get('/api/audit/logs', authenticateToken, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data, error } = await sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/audit/logs', authenticateToken, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data, error } = await sb.from('audit_logs').insert(req.body);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── APPROVALS ENDPOINTS (ADMIN ONLY) ────────────────────────────── */

app.get('/api/approvals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data, error } = await sb.from('user_approvals').select('*').order('created_at', { ascending: true });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/approvals/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sb = getClient(req);
    const { data, error } = await sb.from('user_approvals').select('*').eq('approved', false);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/approvals/:email', authenticateToken, requireAdmin, async (req, res) => {
  const { email } = req.params;
  try {
    const sb = getClient(req);
    const { error } = await sb.from('user_approvals').update(req.body).eq('email', email);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/approvals/:email', authenticateToken, requireAdmin, async (req, res) => {
  const { email } = req.params;
  try {
    const sb = getClient(req);
    const { error } = await sb.from('user_approvals').delete().eq('email', email);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/approvals/preapprove', authenticateToken, requireAdmin, async (req, res) => {
  const { email } = req.body;
  try {
    const sb = getClient(req);
    const { data: existing, error: getErr } = await sb.from('user_approvals').select('*').eq('email', email);
    if (getErr) return res.status(400).json({ error: getErr.message });

    if (existing.length > 0) {
      if (existing[0].approved) {
        return res.json({ alreadyApproved: true });
      }
      const { error } = await sb.from('user_approvals').update({ approved: true }).eq('email', email);
      if (error) return res.status(400).json({ error: error.message });
    } else {
      const { error } = await sb.from('user_approvals').insert({ email, approved: true, is_admin: false });
      if (error) return res.status(400).json({ error: error.message });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running securely on http://localhost:${PORT}`);
});
