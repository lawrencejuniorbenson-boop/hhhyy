/* ── PRODUCT DATABASE OPERATIONS ─────────────────────────────────── */
async function insertProduct(d) { const res = await sbPost('products', { core: corePayload(d), gaps: d.gaps, markets: d.markets, enhancements: d.enhancements }); return res.id; }
async function updateProduct(id, d) { await sbPatch('products', '?id=eq.' + id, { core: corePayload(d), gaps: d.gaps, markets: d.markets, enhancements: d.enhancements }); }
function corePayload(d) { return { category_id: d.cat, name: d.name, product_code: d.code, offerings: d.offerings, start_date: d.start || null, end_date: d.end || null, progress: d.progress || 0, status: d.status || 'Active', priority: 'Medium', owner: d.owner, notes: d.notes, accounts_opened: d.accounts_opened, active_accounts: d.active_accounts, inactive_accounts: d.inactive_accounts, target_onboarding: d.target_onboarding, is_selling: true, compliance_status: d.compliance_status, performing: 'Yes', revenue_monthly: d.revenue_monthly !== '' && d.revenue_monthly != null ? Number(d.revenue_monthly) : null, actual_revenue_monthly: d.actual_revenue_monthly !== '' && d.actual_revenue_monthly != null ? Number(d.actual_revenue_monthly) : null, risk_level: d.risk_level, reporting_month: d.reporting_month || null, updated_at: new Date().toISOString() }; }

/* ── PRODUCT FORM SAVING & INITIALIZATION ────────────────────────── */
function fillFormProduct(p) {
  document.getElementById('f-cat').value = p.cat;
  document.getElementById('f-rep-month').value = p.reporting_month || '';
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-code').value = p.product_code;
  document.getElementById('f-owner').value = p.owner;
  document.getElementById('f-offerings').value = p.offerings;
  document.getElementById('f-accounts').value = p.accounts_opened || '';
  document.getElementById('f-active-acc').value = p.active_accounts || '';
  document.getElementById('f-inactive-acc').value = p.inactive_accounts || '';
  document.getElementById('f-target-onboarding').value = p.target_onboarding || '';
  calcInactiveAcc();
  document.getElementById('f-revenue').value = p.revenue_monthly != null ? p.revenue_monthly : '';
  document.getElementById('f-actual-revenue').value = p.actual_revenue_monthly != null ? p.actual_revenue_monthly : '';
  calcProductROI();
  document.getElementById('f-compliance').value = p.compliance_status;
  document.getElementById('f-risk').value = p.risk_level;
  const fs = document.getElementById('f-status');
  if (fs) fs.value = p.status === 'Active' ? 'Active' : 'Inactive';
  document.getElementById('f-notes').value = p.notes_text || '';
  renderTags(); toggleCatFields();
}

async function saveProduct() {
  const cat = document.getElementById('f-cat').value, name = document.getElementById('f-name').value.trim();
  const owner = document.getElementById('f-owner').value.trim();
  if (!cat) { toast('Please select a category'); return; }
  if (!name) { toast('Please enter a product name'); return; }
  if (!owner) { toast('Please enter the Product Owner / Team'); return; }
  if (!ok()) { toast('Error: Supabase not configured'); return; }
  const btn = document.getElementById('mod-save-btn'); btn.disabled = true; btn.textContent = editId ? 'Updating…' : 'Saving…';
  const notesObj = {
    notes: document.getElementById('f-notes').value
  };
  const d = {
    cat, name, code: document.getElementById('f-code').value, offerings: document.getElementById('f-offerings').value, gaps: [...formGaps], markets: [...formMkts], enhancements: [...formEnhs], start: null, end: null,
    reporting_month: document.getElementById('f-rep-month').value || null,
    progress: 0, status: document.getElementById('f-status')?.value || 'Active', owner, notes: JSON.stringify(notesObj),
    accounts_opened: Number(document.getElementById('f-accounts').value) || 0, active_accounts: Number(document.getElementById('f-active-acc').value) || 0, inactive_accounts: Number(document.getElementById('f-inactive-acc').value) || 0,
    target_onboarding: Number(document.getElementById('f-target-onboarding').value) || 0, is_selling: true, compliance_status: document.getElementById('f-compliance').value, performing: 'Yes',
    revenue_monthly: document.getElementById('f-revenue').value !== '' ? Number(document.getElementById('f-revenue').value) : null,
    actual_revenue_monthly: document.getElementById('f-actual-revenue').value !== '' ? Number(document.getElementById('f-actual-revenue').value) : null,
    risk_level: document.getElementById('f-risk').value
  };
  try {
    if (editId) { 
      const orig = PRODUCTS_DATA.find(x => x.id === editId);
      const changes = {};
      if (orig) {
        const map = {
          cat: 'cat', name: 'name', code: 'product_code', offerings: 'offerings',
          reporting_month: 'reporting_month', owner: 'owner', notes: 'notes',
          accounts_opened: 'accounts_opened', active_accounts: 'active_accounts',
          inactive_accounts: 'inactive_accounts', target_onboarding: 'target_onboarding',
          compliance_status: 'compliance_status', risk_level: 'risk_level',
          revenue_monthly: 'revenue_monthly', actual_revenue_monthly: 'actual_revenue_monthly'
        };
        Object.entries(map).forEach(([k, origK]) => {
          const newVal = d[k], oldVal = orig[origK];
          if (newVal !== oldVal) {
            changes[origK] = { from: oldVal ?? '—', to: newVal ?? '—' };
          }
        });
      }
      await updateProduct(editId, d); 
      toast('Product updated successfully!'); 
      await logAuditAction('UPDATE', 'product', editId, d.name, changes);
    } else { 
      const newId = await insertProduct(d); 
      toast('Product added successfully!'); 
      await logAuditAction('INSERT', 'product', newId, d.name, { code: d.code, category: d.cat });
    }
    await loadData(); closeAdd();
  } catch (err) { console.error(err); toast('Error: Save failed: ' + err.message); }
  finally { btn.disabled = false; btn.textContent = editId ? 'Update Product' : 'Save Product'; }
}

/* ── PRODUCT RENDERING OPERATIONS ────────────────────────────────── */
function renderProductsKPIs() {
  const vd = vis(), total = vd.length, scale = getPeriodScale(), lbl = getPeriodLabel();
  const totalAcc = vd.reduce((s, p) => s + p.accounts_opened, 0);
  const targetAcc = vd.reduce((s, p) => s + p.target_onboarding, 0);
  const compliant = vd.filter(p => p.compliance_status === 'Compliant').length;
  const compRate = total ? Math.round(compliant / total * 100) : 0;
  const highRisk = vd.filter(p => ['High', 'Critical'].includes(p.risk_level)).length;
  const totalExpRev = vd.reduce((s, p) => s + (p.revenue_monthly || 0), 0);
  const totalActRev = vd.reduce((s, p) => s + (p.actual_revenue_monthly || 0), 0);
  const revDiff = totalActRev - totalExpRev;
  const revPct = totalExpRev > 0 ? Math.round((totalActRev / totalExpRev) * 100) : 0;
  const perfPct = targetAcc > 0 ? Math.round((totalAcc / targetAcc) * 100) : 0;
  document.getElementById('kpi-row').innerHTML = `
    <div class="kpi k1"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers"><path d="m12 3-10 5 10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg></div><div class="kpi-lbl">Total Products</div><div class="kpi-val">${total}</div><div class="kpi-sub">${(CAT_LBL[currentCat] || 'All').replace(/^\S+\s/, '')}</div></div>
    <div class="kpi k2"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><div class="kpi-lbl">${lbl} Onboarding</div><div class="kpi-val">${N(Math.round(totalAcc * scale))}</div><div class="kpi-sub">Target: ${N(Math.round(targetAcc * scale))} · <span style="font-weight:800;color:${perfPct >= 100 ? 'var(--green)' : 'var(--amber)'}">${perfPct}% Achieved</span></div></div>
    <div class="kpi k3"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 11 2 2 4-4"/></svg></div><div class="kpi-lbl">Compliance Rate</div><div class="kpi-val">${compRate}%</div><div class="kpi-sub">${compliant} of ${total} compliant</div></div>
    <div class="kpi k4"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div class="kpi-lbl">High Risk</div><div class="kpi-val">${highRisk}</div><div class="kpi-sub">High or Critical risk</div></div>
    <div class="kpi k5"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg></div><div class="kpi-lbl">Active Accounts</div><div class="kpi-val">${N(Math.round(vd.reduce((s, p) => s + p.active_accounts, 0) * scale))}</div><div class="kpi-sub">${N(Math.round(vd.reduce((s, p) => s + p.inactive_accounts, 0) * scale))} inactive</div></div>
    <div class="kpi k7"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-banknote"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg></div><div class="kpi-lbl">${lbl} Revenue</div><div class="kpi-val">${CCompact(totalActRev * scale)}</div><div class="kpi-sub">Target: ${CCompact(totalExpRev * scale)}${totalExpRev > 0 ? ` · <span style="font-weight:700;color:${revDiff >= 0 ? 'var(--green)' : 'var(--red)'}">Net: ${revDiff >= 0 ? '+' : ''}${CCompact(revDiff * scale)} (${revPct}% ROI)</span>` : ''}</div></div>`;
}

function renderProductsTable() {
  const vd = filt(), scale = getPeriodScale();
  const catName = (CAT_LBL[currentCat] || 'All').replace(/^\S+\s/, '');
  document.getElementById('tbl-heading').textContent = catName + ' Products — ' + vd.length + ' item' + (vd.length !== 1 ? 's' : '');
  const allSts = ['All', 'Active', 'Inactive'];
  const filtersHtml = allSts.map(s => `<button class="fbtn ${sfilt === s ? 'on' : ''}" onclick="setSF('${s}')">${s}</button>`).join('');
  document.getElementById('status-filters').innerHTML = filtersHtml;
  if (!vd.length) { document.getElementById('main-tbody').innerHTML = `<tr class="empty-row"><td colspan="13"><div class="empty-ico" style="font-size: 14px; font-weight: 800; opacity: 0.3;">EMPTY</div><div>${!ok() ? 'Configure Supabase in Admin Settings to load data.' : 'No items found matching your criteria.'}</div></td></tr>`; return; }
  document.getElementById('main-tbody').innerHTML = vd.map((p, i) => {
    const cc = CAT_COL[p.cat] || '#888', cn = (CAT_LBL[p.cat] || p.cat).replace(/^\S+\s/, '');
    const isDigital = p.cat === 'digital';
    const perfPct = p.target_onboarding > 0 ? ((p.accounts_opened / p.target_onboarding) * 100).toFixed(0) : 0;
    return `<tr>
      <td style="color:var(--muted);font-weight:700;font-size:11px">${i + 1}</td>
      <td>
        <div style="font-weight:800;color:var(--navy);font-size:12.5px">${p.name}</div>
        ${p.product_code ? `<div style="font-size:10px;color:var(--muted)">Code: ${p.product_code}</div>` : ''}
        ${p.owner ? `<div style="font-size:10px;color:var(--navy);font-weight:600;margin-top:2px">Owner: ${p.owner}</div>` : ''}
      </td>
      <td><span style="display:inline-flex;align-items:center;gap:5px;font-weight:700;font-size:11px"><span style="width:8px;height:8px;background:${cc};border-radius:2px;flex-shrink:0"></span>${cn}</span></td>
      <td><div class="acct-stat"><span class="tot">${N(Math.round(p.accounts_opened * scale))}</span><span class="subs"><span class="ac">▲${N(Math.round(p.active_accounts * scale))}</span><span class="ic">▼${N(Math.round(p.inactive_accounts * scale))}</span></span></div></td>
      <td>${p.target_onboarding > 0 ? `<div style="font-size:11.5px;font-weight:700;color:var(--navy)">${N(Math.round(p.target_onboarding * scale))}</div><div style="font-size:9.5px;color:${Number(perfPct) >= 100 ? 'var(--green)' : 'var(--amber)'};font-weight:700">${perfPct}% achieved</div>` : '<span style="color:var(--muted);font-size:11px">—</span>'}</td>
      <td>${isDigital ? `<div class="rev-stat"><div class="act">Act: ${p.actual_revenue_monthly != null ? C(p.actual_revenue_monthly * scale) : '—'}</div><div class="exp">Exp: ${p.revenue_monthly != null ? C(p.revenue_monthly * scale) : '—'}</div>${p.revenue_monthly != null && p.actual_revenue_monthly != null ? (() => { const diff = p.actual_revenue_monthly - p.revenue_monthly, pct = p.revenue_monthly > 0 ? ((p.actual_revenue_monthly / p.revenue_monthly) * 100).toFixed(0) : 0, over = diff >= 0; return `<div class="diff ${over ? 'up' : 'down'}">Net: ${diff >= 0 ? '+' : ''}${CCompact(diff * scale)} (${pct}% ROI)</div>`; })() : ''}</div>` : '<span style="color:var(--muted);font-size:11px">—</span>'}</td>
      <td><span class="badge ${CMP_CSS[p.compliance_status] || 'b-pending'}">${p.compliance_status || '—'}</span></td>
      <td><span class="badge ${RSK_CSS[p.risk_level] || 'b-low-risk'}">${p.risk_level || 'Low'}</span></td>
      <td><div class="act"><button class="a-btn a-view" onclick="openView('${p.id}')">View</button><button class="a-btn a-edit" onclick="openEdit('${p.id}')">Edit</button><button class="a-btn a-del" onclick="openDelModal('${p.id}')">Delete</button></div></td>
    </tr>`;
  }).join('');
}

function renderProductsCharts() {
  const vd = vis(), scale = getPeriodScale();
  const t1 = document.getElementById('c1-title'), t2 = document.getElementById('c2-title'), t4 = document.getElementById('c4-title');
  if (t1) t1.textContent = 'Products by Category';
  if (t2) t2.textContent = 'Compliance Breakdown';
  if (t4) t4.textContent = 'Top 6 Products';
  const cats = ['digital', 'payment', 'liability', 'asset', 'other'];
  setChart('cat', 'catChart', 'doughnut',
    { labels: cats.map(c => CAT_LBL[c].replace(/^\S+\s/, '')), datasets: [{ data: cats.map(c => vd.filter(p => p.cat === c).length), backgroundColor: cats.map(c => CAT_COL[c]), borderWidth: 2, borderColor: '#fff', hoverOffset: 7 }] },
    { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, padding: 10, boxWidth: 10 } } } });
  const ck = ['Compliant', 'Pending Review', 'Non-Compliance', 'Exempt'], cc = ['#059669', '#D97706', '#DC2626', '#0891B2'];
  setChart('comp', 'compChart', 'bar',
    { labels: ck, datasets: [{ data: ck.map(k => vd.filter(p => p.compliance_status === k).length), backgroundColor: cc, borderRadius: 6, barPercentage: .65 }] },
    { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { font: { size: 9 }, stepSize: 1 }, grid: { color: '#F1F5FB' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } } });
  const top6p = [...vd].sort((a, b) => b.accounts_opened - a.accounts_opened).slice(0, 6);
  setChart('acct', 'acctChart', 'bar',
    { labels: top6p.map(p => p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name), datasets: [{ label: 'Active', data: top6p.map(p => p.active_accounts * scale), backgroundColor: '#059669', borderRadius: 4, stack: 's' }, { label: 'Inactive', data: top6p.map(p => p.inactive_accounts * scale), backgroundColor: '#CBD5E1', borderRadius: 4, stack: 's' }] },
    { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 10 } } }, scales: { x: { beginAtZero: true, ticks: { font: { size: 9 } }, grid: { color: '#F1F5FB' } }, y: { ticks: { font: { size: 9 } }, grid: { display: false } } } });

  // Clean up branch chart if it exists
  dc('branch');
}
