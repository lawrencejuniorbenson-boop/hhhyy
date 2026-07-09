/* ── DETAILED VIEW MODAL ─────────────────────────────────────────── */
function openView(id) {
  const scale = getPeriodScale();
  if (CURRENT_MODE === 'products') {
    const p = PRODUCTS_DATA.find(x => x.id === id); if (!p) return;
    viewId = id;
    document.getElementById('view-name').textContent = p.name;
    document.getElementById('view-sub').textContent = (CAT_LBL[p.cat] || p.cat).replace(/^\S+\s/, '') + ' · ' + (p.product_code || 'No Code');
    const cc = CAT_COL[p.cat] || '#888', tot = p.accounts_opened, pct = tot > 0 ? Math.round(p.active_accounts / tot * 100) : 0;
    const acctBar = tot > 0 ? `<div class="acct-bar"><div class="ab-active" style="flex:${p.active_accounts}"></div><div class="ab-inactive" style="flex:${p.inactive_accounts}"></div></div><div style="font-size:10px;color:var(--muted);margin-top:5px">${pct}% active rate</div>` : '<div style="color:var(--muted);font-size:11px;margin-top:4px">No account data</div>';
    const isDigital = p.cat === 'digital', onbPerf = p.target_onboarding > 0 ? ((p.accounts_opened / p.target_onboarding) * 100).toFixed(1) : 0;
    document.getElementById('view-body').innerHTML = `
      <div class="view-hero">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div><h2>${p.name}</h2><div class="view-hero-meta"><span class="badge ${p.status === 'Active' ? 'b-compliant' : 'b-noncompliant'}">${p.status || 'Active'}</span><span class="badge ${CMP_CSS[p.compliance_status] || 'b-pending'}">${p.compliance_status}</span><span class="badge ${RSK_CSS[p.risk_level] || 'b-low-risk'}">${p.risk_level} Risk</span></div></div>
        </div>
      </div>
      <div class="detail-grid">
        <div class="df"><label>Category</label><div class="val" style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:${cc};border-radius:2px;display:inline-block;flex-shrink:0"></span>${(CAT_LBL[p.cat] || p.cat).replace(/^\S+\s/, '')}</div></div>
        <div class="df"><label>Product Code</label><div class="val">${p.product_code || '—'}</div></div>
        <div class="df"><label>Reporting Month</label><div class="val" style="font-weight:700;color:var(--navy)">${p.reporting_month ? (p.reporting_month.match(/^\d{4}-\d{2}$/) ? new Date(p.reporting_month + '-01').toLocaleString('en', {month:'long',year:'numeric'}) : p.reporting_month) : '—'}</div></div>
        <div class="df"><label>Owner / Team</label><div class="val">${p.owner || '—'}</div></div>
        <div class="df"><label>Risk Level</label><div class="val"><span class="badge ${RSK_CSS[p.risk_level] || 'b-low-risk'}">${p.risk_level || 'Low'}</span></div></div>
        <div class="sec-sep"></div>
        <div class="df"><label>Total Accounts Opened</label><div class="val" style="font-size:22px;font-weight:900;color:var(--navy)">${N(Math.round(p.accounts_opened * scale))}</div>${acctBar}</div>
        <div class="df"><label>Sales Onboarding Target</label><div style="display:flex;flex-direction:column;gap:5px;margin-top:4px"><div><span style="font-weight:700">Target:</span> ${N(Math.round(p.target_onboarding * scale))} accounts</div>${p.target_onboarding > 0 ? `<div><span class="badge b-compliant" style="font-size:11px">${onbPerf}% Onboarding Performance</span></div>` : ''}</div></div>
        <div class="df"><label>Active / Inactive Accounts</label><div style="display:flex;gap:20px;margin-top:6px"><div><div style="font-size:20px;font-weight:900;color:var(--green)">${N(Math.round(p.active_accounts * scale))}</div><div style="font-size:10px;color:var(--muted)">Active</div></div><div><div style="font-size:20px;font-weight:900;color:#94A3B8">${N(Math.round(p.inactive_accounts * scale))}</div><div style="font-size:10px;color:var(--muted)">Inactive</div></div></div></div>
        ${isDigital ? `
        <div class="df"><label>Expected Monthly Revenue</label><div class="val">${p.revenue_monthly != null ? C(p.revenue_monthly * scale) : '—'}</div></div>
        <div class="df"><label>Actual Monthly Revenue</label><div class="val">${p.actual_revenue_monthly != null ? C(p.actual_revenue_monthly * scale) : '—'}</div></div>
        ${p.revenue_monthly != null && p.actual_revenue_monthly != null ? (() => { const diff = p.actual_revenue_monthly - p.revenue_monthly, pct2 = p.revenue_monthly > 0 ? ((p.actual_revenue_monthly / p.revenue_monthly) * 100).toFixed(1) : 0, over = diff >= 0; return `<div class="df full"><label>Net Benefit &amp; ROI</label><div class="val"><span class="badge ${over ? 'b-compliant' : 'b-noncompliant'}" style="font-size:12px">Net: ${diff >= 0 ? '+' : ''}${C(diff * scale)} (${pct2}% ROI)</span></div></div>`; })() : ''}
        ` : ''}
        ${p.offerings ? `<div class="sec-sep"></div><div class="df full"><label>Current Offerings</label><div class="txt-box">${p.offerings}</div></div>` : ''}
        ${p.markets.length ? `<div class="df full"><label>Target Market</label><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">${p.markets.map(m => `<span class="badge b-compliant" style="font-size:11px">${m}</span>`).join('')}</div></div>` : ''}
        ${p.enhancements.length ? `<div class="df full"><label>Enhancements Required</label><div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:5px">${p.enhancements.map(e => `<span class="badge b-review" style="font-size:11px">${e}</span>`).join('')}</div></div>` : ''}
        ${p.notes_text ? `<div class="df full"><label>Additional Notes</label><div class="txt-box">${p.notes_text}</div></div>` : ''}
      </div>`;
    document.getElementById('view-edit-btn').textContent = 'Edit Product';
  } else {
    const p = PROJECTS_DATA.find(x => x.id === id); if (!p) return;
    viewId = id;
    document.getElementById('view-name').textContent = p.name;
    document.getElementById('view-sub').textContent = (CAT_LBL[p.cat] || p.cat).replace(/^\S+\s/, '') + ' · ' + (p.project_code || 'No Code');
    const cc = CAT_COL[p.cat] || '#888', net = p.expected_benefit - p.budget_cost, roi = p.budget_cost > 0 ? ((net / p.budget_cost) * 100).toFixed(1) : 0;
    const tasksHtml = p.tasks.length ? p.tasks.map(t => {
      const sc = { Pending: 'b-pending', 'In Progress': 'b-review', Completed: 'b-compliant' }[t.status] || 'b-pending';
      const tid = t.id || '';
      return `<tr><td style="font-weight:700;padding:8px">${t.task_text}</td><td style="padding:8px">${t.target_date || '—'}</td><td style="padding:8px">${t.owner || '—'}</td><td style="padding:8px"><select class="badge ${sc}" data-taskid="${tid}" data-projectid="${p.id}" onchange="changeTaskStatus('${p.id}', '${tid}', this.value, this)"><option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option><option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option><option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option></select></td></tr>`;
    }).join('') : `<tr><td colspan="4" style="text-align:center;color:var(--muted);font-style:italic;padding:12px">No implementation steps defined.</td></tr>`;
    document.getElementById('view-body').innerHTML = `
      <div class="view-hero" style="background:linear-gradient(135deg,#0F2035,#1B3A5C);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div><h2>${p.name}</h2><div class="view-hero-meta"><span class="badge ${STS_CSS[p.status] || 'b-pipeline'}">${p.status}</span><span class="badge ${PRI_CSS[p.priority] || 'b-med'}">${p.priority} Priority</span><span class="badge ${RSK_CSS[p.risk_level] || 'b-low-risk'}">${p.risk_level} Risk</span><span class="badge b-review" style="background:#E0F2FE;color:#0369A1">${p.stage} Stage</span></div></div>
          <div style="text-align:right;flex-shrink:0"><div id="view-progress-pct" style="font-size:30px;font-weight:900;color:var(--gold)">${p.progress}%</div><div style="font-size:10px;color:rgba(255,255,255,.5)">Progress</div></div>
        </div>
      </div>
      <div class="detail-grid">
        <div class="df"><label>Category</label><div class="val" style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;background:${cc};border-radius:2px;display:inline-block"></span>${(CAT_LBL[p.cat] || p.cat).replace(/^\S+\s/, '')}</div></div>
        <div class="df"><label>Project Code</label><div class="val">${p.project_code || '—'}</div></div>
        <div class="df"><label>Project Date</label><div class="val" style="font-weight:700;color:var(--navy)">${p.reporting_month || '—'}</div></div>
        <div class="df"><label>Sponsor / Owner</label><div class="val">${p.owner || '—'}</div></div>
        <div class="df"><label>Timeline</label><div class="val">${p.start_date || '—'} → ${p.end_date || 'Ongoing'}</div></div>
        <div class="sec-sep"></div>
        <div class="df"><label>Budget / Cost</label><div class="val" style="font-size:18px;font-weight:800;color:var(--navy)">${C(p.budget_cost)}</div></div>
        ${p.description ? `<div class="sec-sep"></div><div class="df full"><label>Description &amp; Objectives</label><div class="txt-box">${p.description}</div></div>` : ''}
        <div class="sec-sep"></div>
        <div class="df full"><label>Implementation Plan</label>
          <div class="tbl-wrap" style="margin-top:8px;border:1px solid var(--bdr);border-radius:8px;overflow:hidden">
            <table style="font-size:11px;width:100%;border-collapse:collapse">
              <thead><tr style="background:#F8FAFC"><th style="font-size:8.5px;padding:8px;text-align:left">Task</th><th style="font-size:8.5px;padding:8px;text-align:left">Target Date</th><th style="font-size:8.5px;padding:8px;text-align:left">Owner</th><th style="font-size:8.5px;padding:8px;text-align:left">Status</th></tr></thead>
              <tbody>${tasksHtml}</tbody>
            </table>
          </div>
        </div>
        ${p.notes ? `<div class="sec-sep"></div><div class="df full"><label>Notes / Risks</label><div class="txt-box">${p.notes}</div></div>` : ''}
      </div>`;
    document.getElementById('view-edit-btn').textContent = 'Edit Project';
  }
  document.getElementById('view-edit-btn').onclick = () => openEdit(id);
  document.getElementById('view-overlay').classList.add('open');
}
function closeView() { document.getElementById('view-overlay').classList.remove('open'); }
function closeViewOut(e) { if (e.target === document.getElementById('view-overlay')) closeView(); }

/* ── PERMANENT DELETES ───────────────────────────────────────────── */
function openDelModal(id) {
  const p = [...PRODUCTS_DATA, ...PROJECTS_DATA].find(x => x.id === id); if (!p) return;
  delTargetId = id;
  document.getElementById('del-msg').textContent = '"' + p.name + '" and all its data will be permanently deleted.';
  document.getElementById('del-confirm-btn').onclick = () => doDelete(id);
  document.getElementById('del-overlay').classList.add('open');
}
function closeDelModal() { document.getElementById('del-overlay').classList.remove('open'); }
async function doDelete(id) {
  closeDelModal(); showLoad(true);
  try {
    const p = PRODUCTS_DATA.find(x => x.id === id) || PROJECTS_DATA.find(x => x.id === id);
    const name = p ? p.name : 'Unknown';
    const isProd = PRODUCTS_DATA.some(x => x.id === id);
    if (isProd) { 
      await Promise.all([sbDel('product_gaps', '?product_id=eq.' + id), sbDel('product_markets', '?product_id=eq.' + id), sbDel('product_enhancements', '?product_id=eq.' + id)]); 
      await sbDel('products', '?id=eq.' + id); 
      toast('Delete Product deleted.'); 
    } else { 
      await sbDel('project_tasks', '?project_id=eq.' + id); 
      await sbDel('projects', '?id=eq.' + id); 
      toast('Delete Project deleted.'); 
    }
    await logAuditAction('DELETE', isProd ? 'product' : 'project', id, name);
    await loadData();
  } catch (err) { toast(' Delete failed: ' + err.message); showLoad(false); }
}

/* ── ADMIN PANEL SETTINGS ────────────────────────────────────────── */
const SQL_SETUP = `-- Product/Project Dashboard — Full SQL Setup Script
CREATE TABLE IF NOT EXISTS products (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, product_code TEXT, category_id TEXT NOT NULL, name TEXT NOT NULL, offerings TEXT, start_date DATE, end_date DATE, progress INTEGER DEFAULT 0, status TEXT DEFAULT 'Pipeline', priority TEXT DEFAULT 'Medium', owner TEXT, notes TEXT, accounts_opened INTEGER DEFAULT 0, active_accounts INTEGER DEFAULT 0, inactive_accounts INTEGER DEFAULT 0, target_onboarding INTEGER DEFAULT 0, is_selling BOOLEAN DEFAULT true, compliance_status TEXT DEFAULT 'Compliant', performing TEXT DEFAULT 'Yes', revenue_monthly NUMERIC(15,2), actual_revenue_monthly NUMERIC(15,2), risk_level TEXT DEFAULT 'Low', reporting_month TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS product_gaps (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, product_id UUID REFERENCES products(id) ON DELETE CASCADE, gap_text TEXT, sort_order INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS product_markets (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, product_id UUID REFERENCES products(id) ON DELETE CASCADE, market_text TEXT, sort_order INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS product_enhancements (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, product_id UUID REFERENCES products(id) ON DELETE CASCADE, enhancement_text TEXT, sort_order INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS dashboard_settings (key TEXT PRIMARY KEY, value TEXT);
CREATE OR REPLACE VIEW products_full WITH (security_invoker = true) AS SELECT p.*, COALESCE((SELECT json_agg(g.gap_text ORDER BY g.sort_order) FROM product_gaps g WHERE g.product_id=p.id),'[]') AS gaps, COALESCE((SELECT json_agg(m.market_text ORDER BY m.sort_order) FROM product_markets m WHERE m.product_id=p.id),'[]') AS markets, COALESCE((SELECT json_agg(e.enhancement_text ORDER BY e.sort_order) FROM product_enhancements e WHERE e.product_id=p.id),'[]') AS enhancements FROM products p;
CREATE TABLE IF NOT EXISTS projects (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, project_code TEXT, category_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, stage TEXT DEFAULT 'Initiation', start_date DATE, end_date DATE, progress INTEGER DEFAULT 0, status TEXT DEFAULT 'Pipeline', priority TEXT DEFAULT 'Medium', owner TEXT, notes TEXT, budget_cost NUMERIC(15,2) DEFAULT 0, expected_benefit NUMERIC(15,2) DEFAULT 0, risk_level TEXT DEFAULT 'Low', reporting_month TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS project_tasks (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, project_id UUID REFERENCES projects(id) ON DELETE CASCADE, task_text TEXT NOT NULL, target_date DATE, status TEXT DEFAULT 'Pending', owner TEXT, sort_order INTEGER DEFAULT 0);
CREATE OR REPLACE VIEW projects_full WITH (security_invoker = true) AS SELECT p.*, COALESCE((SELECT json_agg(json_build_object('id',t.id,'task_text',t.task_text,'target_date',t.target_date,'status',t.status,'owner',t.owner,'sort_order',t.sort_order) ORDER BY t.sort_order) FROM project_tasks t WHERE t.project_id=p.id),'[]') AS tasks FROM projects p;

-- Create approvals table
CREATE TABLE IF NOT EXISTS user_approvals (
  email TEXT PRIMARY KEY,
  approved BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Audit Trail table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  target_name TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function to auto-handle user registrations in Supabase auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM public.user_approvals) = 0 THEN
    INSERT INTO public.user_approvals (email, approved, is_admin)
    VALUES (new.email, true, true)
    ON CONFLICT (email) DO UPDATE SET approved = true, is_admin = true;
  ELSE
    INSERT INTO public.user_approvals (email, approved, is_admin)
    VALUES (new.email, false, false)
    ON CONFLICT (email) DO NOTHING;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute function on new signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY; 
ALTER TABLE product_gaps ENABLE ROW LEVEL SECURITY; 
ALTER TABLE product_markets ENABLE ROW LEVEL SECURITY; 
ALTER TABLE product_enhancements ENABLE ROW LEVEL SECURITY; 
ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY; 
ALTER TABLE projects ENABLE ROW LEVEL SECURITY; 
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on approvals
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select approvals" ON user_approvals FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert approvals" ON user_approvals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow update approvals" ON user_approvals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete approvals" ON user_approvals FOR DELETE TO authenticated USING (true);

-- Secure backend policies requiring approved status
CREATE POLICY "Allow approved products" ON products FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true));

CREATE POLICY "Allow approved gaps" ON product_gaps FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true));

CREATE POLICY "Allow approved markets" ON product_markets FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true));

CREATE POLICY "Allow approved enhancements" ON product_enhancements FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true));

CREATE POLICY "Allow approved settings" ON dashboard_settings FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true));

CREATE POLICY "Allow approved projects" ON projects FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true));

CREATE POLICY "Allow approved tasks" ON project_tasks FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true));

CREATE POLICY "Allow approved audit logs" ON audit_logs FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true))
  WITH CHECK (EXISTS (SELECT 1 FROM user_approvals WHERE email = auth.jwt()->>'email' AND approved = true));`;

function openAdmin() {
  if (!IS_ADMIN) { toast(' Only administrators can access Admin Settings.'); return; }
  document.getElementById('s-name').value = SETTINGS.title;
  document.getElementById('s-sub').value = SETTINGS.sub;
  document.getElementById('s-ll').value = SETTINGS.ll || 'P';
  ['navy', 'gold', 'blue', 'green', 'red', 'amber'].forEach(k => { const el = document.getElementById('c-' + k); if (el) el.value = SETTINGS.colors[k]; });
  const vd = getActiveData();
  document.getElementById('a-total').textContent = vd.length;
  document.getElementById('a-selling').textContent = CURRENT_MODE === 'products' ? PRODUCTS_DATA.filter(p => ['Active', 'In Review'].includes(p.status)).length : PROJECTS_DATA.filter(p => p.status === 'Active').length;
  document.getElementById('a-compliant').textContent = CURRENT_MODE === 'products' ? PRODUCTS_DATA.filter(p => p.compliance_status === 'Compliant').length : PROJECTS_DATA.filter(p => p.stage === 'Closed').length;
  document.getElementById('a-accounts').textContent = CURRENT_MODE === 'products' ? N(PRODUCTS_DATA.reduce((s, p) => s + p.accounts_opened, 0)) : CCompact(PROJECTS_DATA.reduce((s, p) => s + (p.budget_cost || 0), 0));
  document.getElementById('a-performing').textContent = CURRENT_MODE === 'products' ? PRODUCTS_DATA.filter(p => !['Paused', 'Cancelled'].includes(p.status)).length : PROJECTS_DATA.filter(p => !['Paused', 'Cancelled'].includes(p.status)).length;
  document.getElementById('a-highrisk').textContent = vd.filter(p => ['High', 'Critical'].includes(p.risk_level)).length;

  renderQE();
  renderApprovals();
  document.getElementById('adm-overlay').classList.add('open');
}
function closeAdmin() { document.getElementById('adm-overlay').classList.remove('open'); }
function closeAdmOut(e) { if (e.target === document.getElementById('adm-overlay')) closeAdmin(); }
async function applyBrand() { SETTINGS.title = document.getElementById('s-name').value || SETTINGS.title; SETTINGS.sub = document.getElementById('s-sub').value || SETTINGS.sub; SETTINGS.ll = document.getElementById('s-ll').value || 'P'; applyDOM(); if (ok()) { await Promise.all([sbUpsert('dashboard_settings', { key: 'title', value: SETTINGS.title }), sbUpsert('dashboard_settings', { key: 'subtitle', value: SETTINGS.sub }), sbUpsert('dashboard_settings', { key: 'logo_letter', value: SETTINGS.ll })]); } toast(' Branding applied!'); await logAuditAction('UPDATE_BRAND', 'system', null, 'Changed dashboard theme branding text', { title: SETTINGS.title, subtitle: SETTINGS.sub }); }
async function applyClrs() { SETTINGS.colors = { navy: document.getElementById('c-navy').value, gold: document.getElementById('c-gold').value, blue: document.getElementById('c-blue').value, green: document.getElementById('c-green').value, red: document.getElementById('c-red').value, amber: document.getElementById('c-amber').value }; applyDOM(); if (ok()) { await Promise.all(Object.entries({ color_navy: SETTINGS.colors.navy, color_gold: SETTINGS.colors.gold, color_blue: SETTINGS.colors.blue, color_green: SETTINGS.colors.green, color_red: SETTINGS.colors.red, color_amber: SETTINGS.colors.amber }).map(([k, v]) => sbUpsert('dashboard_settings', { key: k, value: v }))); } toast(' Colors applied!'); await logAuditAction('UPDATE_COLORS', 'system', null, 'Changed dashboard theme color profile', SETTINGS.colors); }
async function resetClrs() { SETTINGS.colors = { ...defSettings().colors };['navy', 'gold', 'blue', 'green', 'red', 'amber'].forEach(k => { const el = document.getElementById('c-' + k); if (el) el.value = SETTINGS.colors[k]; }); applyDOM(); toast('Colors reset'); await logAuditAction('RESET_COLORS', 'system', null, 'Reset dashboard theme color profile to defaults'); }
async function refreshData() { toast('↺ Refreshing…'); await loadData(); toast(' Data refreshed!'); }
function renderQE() {
  const vd = CURRENT_PAGE === 'home' ? [...PRODUCTS_DATA, ...PROJECTS_DATA] : getActiveData();
  document.getElementById('qe-list').innerHTML = vd.length ? vd.map(p => {
    const isProd = PRODUCTS_DATA.some(x => x.id === p.id);
    const typeStr = isProd ? 'product' : 'project';
    return `<div class="qe-item"><div><div class="qe-name"><span style="width:8px;height:8px;background:${CAT_COL[p.cat] || '#888'};border-radius:2px;display:inline-block;margin-right:6px"></span>${p.name.length > 28 ? p.name.slice(0, 28) + '…' : p.name}</div><div class="qe-meta" style="font-size:10px;color:var(--muted)">${(p._type === 'project' || PRODUCTS_DATA.findIndex(x => x.id === p.id) < 0) ? p.project_code || '—' : p.product_code || '—'} · <span class="badge ${STS_CSS[p.status] || 'b-pipeline'}" style="font-size:9px;padding:1px 6px">${p.status}</span></div></div><div class="act"><button class="a-btn a-edit" onclick="quickEdit('${p.id}','${typeStr}')">Edit</button><button class="a-btn a-del" onclick="openDelModal('${p.id}');closeAdmin()">Del</button></div></div>`;
  }).join('') : '<div style="text-align:center;padding:24px;color:var(--muted);font-size:12px">No items yet</div>';
}
