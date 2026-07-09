/* ── PORTFOLIO RENDERING OPERATIONS ──────────────────────────────── */
function renderPortfolioKPIs() {
  const scale = getPeriodScale(), lbl = getPeriodLabel();
  const ap = PRODUCTS_DATA.filter(p => ['Active', 'In Review'].includes(p.status));
  const aj = PROJECTS_DATA.filter(p => ['Active', 'In Review'].includes(p.status));
  const cost = aj.reduce((s, p) => s + (p.budget_cost || 0), 0);
  const rev = ap.reduce((s, p) => s + (p.actual_revenue_monthly || 0), 0);
  const hr = [...ap, ...aj].filter(p => ['High', 'Critical'].includes(p.risk_level)).length;
  document.getElementById('kpi-row').innerHTML = `
    <div class="kpi k1"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers"><path d="m12 3-10 5 10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg></div><div class="kpi-lbl">Ongoing Products</div><div class="kpi-val">${ap.length}</div><div class="kpi-sub">Active bank products</div></div>
    <div class="kpi k2"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rocket"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0z"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5z"/></svg></div><div class="kpi-lbl">Ongoing Projects</div><div class="kpi-val">${aj.length}</div><div class="kpi-sub">Active in-flight</div></div>
    <div class="kpi k3"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-banknote"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg></div><div class="kpi-lbl">Total Project Budget</div><div class="kpi-val">${CCompact(cost)}</div><div class="kpi-sub">Total allocated spend</div></div>
    <div class="kpi k4"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coins"><circle cx="8" cy="8" r="6"/><circle cx="18" cy="18" r="4"/><path d="M12 18a6 6 0 0 0-6-6M12 6a6 6 0 0 1 6 6"/></svg></div><div class="kpi-lbl">${lbl} Product Revenue</div><div class="kpi-val">${CCompact(rev * scale)}</div><div class="kpi-sub">Active product revenue</div></div>
    <div class="kpi k5"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 11 2 2 4-4"/></svg></div><div class="kpi-lbl">Compliant Products</div><div class="kpi-val">${ap.filter(p => p.compliance_status === 'Compliant').length}</div><div class="kpi-sub">Of ${ap.length} active</div></div>
    <div class="kpi k6"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div class="kpi-lbl">High Risk</div><div class="kpi-val">${hr}</div><div class="kpi-sub">Products &amp; Projects</div></div>`;
}

function renderPortfolioTable() {
  const vd = filt(), scale = getPeriodScale();
  const catName = (CAT_LBL[currentCat] || 'All').replace(/^\S+\s/, '');
  document.getElementById('tbl-heading').textContent = catName + ' Portfolio — ' + vd.length + ' item' + (vd.length !== 1 ? 's' : '');
  const allSts = ['All', 'Active', 'Pipeline', 'In Review', 'Paused', 'Completed', 'Cancelled'];
  document.getElementById('status-filters').innerHTML = allSts.map(s => `<button class="fbtn ${sfilt === s ? 'on' : ''}" onclick="setSF('${s}')">${s}</button>`).join('');
  if (!vd.length) { document.getElementById('main-tbody').innerHTML = `<tr class="empty-row"><td colspan="13"><div class="empty-ico" style="font-size: 14px; font-weight: 800; opacity: 0.3;">EMPTY</div><div>${!ok() ? 'Configure Supabase in Admin Settings to load data.' : 'No items found matching your criteria.'}</div></td></tr>`; return; }
  document.getElementById('main-tbody').innerHTML = vd.map((p, i) => {
    const cc = CAT_COL[p.cat] || '#888', cn = (CAT_LBL[p.cat] || p.cat).replace(/^\S+\s/, '');
    const pc = p.progress, pcl = pc >= 70 ? 'hi' : pc < 30 ? 'lo' : 'md';
    const isProd = p._type === 'product', typeColor = isProd ? 'var(--blue)' : 'var(--gold)';
    const cost = isProd ? (p.revenue_monthly || 0) : (p.budget_cost || 0), benefit = isProd ? (p.actual_revenue_monthly || 0) : (p.expected_benefit || 0);
    return `<tr>
      <td style="color:var(--muted);font-weight:700;font-size:11px">${i + 1}</td>
      <td><div style="font-weight:800;color:var(--navy);font-size:12.5px">${p.name}</div>${(isProd ? p.product_code : p.project_code) ? `<div style="font-size:10px;color:var(--muted)">${isProd ? p.product_code : p.project_code}</div>` : ''}</td>
      <td><span style="font-weight:700;color:${typeColor};font-size:11.5px">${isProd ? 'Product' : 'Project'}</span></td>
      <td><span style="display:inline-flex;align-items:center;gap:5px;font-weight:700;font-size:11px"><span style="width:8px;height:8px;background:${cc};border-radius:2px;flex-shrink:0"></span>${cn}</span></td>
      <td><div style="font-size:11px;color:var(--navy)">${p.owner || '—'}</div></td>
      <td><div style="font-size:11px;font-weight:600;color:var(--navy)">${p.start_date || '—'}</div><div style="font-size:10px;color:var(--muted)">to ${p.end_date || 'Ongoing'}</div></td>
      <td><div style="font-size:11.5px;font-weight:700;color:var(--navy)">${C(isProd ? cost * scale : cost)}</div><div style="font-size:9.5px;color:var(--muted)">${isProd ? 'Target Rev' : 'Budget'}</div></td>
      <td><div style="font-size:11.5px;font-weight:700;color:var(--green)">${isProd ? C(benefit * scale) : '—'}</div><div style="font-size:9.5px;color:var(--muted)">${isProd ? 'Actual Rev' : '—'}</div></td>
      <td><div class="prog-wrap"><div class="prog-track"><div class="prog-fill ${pcl}" style="width:${pc}%"></div></div><span class="prog-pct">${pc}%</span></div></td>
      <td><span class="badge ${STS_CSS[p.status] || 'b-pipeline'}">${p.status}</span></td>
      <td><span class="badge ${PRI_CSS[p.priority] || 'b-med'}">${p.priority}</span></td>
      <td><div class="act"><button class="a-btn a-view" onclick="openViewGlobal('${p.id}','${p._type}')">View</button></div></td>
    </tr>`;
  }).join('');
}

function renderPortfolioCharts() {
  const vd = vis();
  const t1 = document.getElementById('c1-title'), t2 = document.getElementById('c2-title'), t4 = document.getElementById('c4-title');
  if (t1) t1.textContent = 'By Category';
  if (t2) t2.textContent = 'Risk Profile';
  if (t4) t4.textContent = 'Top by Progress';
  const cats = ['digital', 'payment', 'liability', 'asset', 'other'];
  setChart('cat', 'catChart', 'doughnut',
    { labels: cats.map(c => CAT_LBL[c].replace(/^\S+\s/, '')), datasets: [{ data: cats.map(c => vd.filter(p => p.cat === c).length), backgroundColor: cats.map(c => CAT_COL[c]), borderWidth: 2, borderColor: '#fff', hoverOffset: 7 }] },
    { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, padding: 10, boxWidth: 10 } } } });
  const rk = ['Low', 'Medium', 'High', 'Critical'], rc = ['#059669', '#D97706', '#F97316', '#DC2626'];
  setChart('comp', 'compChart', 'bar',
    { labels: rk, datasets: [{ data: rk.map(k => vd.filter(p => p.risk_level === k).length), backgroundColor: rc, borderRadius: 6, barPercentage: .65 }] },
    { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { font: { size: 9 }, stepSize: 1 }, grid: { color: '#F1F5FB' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } } });
  const top6m = [...vd].sort((a, b) => b.progress - a.progress).slice(0, 6);
  setChart('acct', 'acctChart', 'bar',
    { labels: top6m.map(p => p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name), datasets: [{ label: 'Progress %', data: top6m.map(p => p.progress), backgroundColor: '#2563EB', borderRadius: 4 }] },
    { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, max: 100, ticks: { font: { size: 9 } }, grid: { color: '#F1F5FB' } }, y: { ticks: { font: { size: 9 } }, grid: { display: false } } } });
}

function openViewGlobal(id, type) { const prev = CURRENT_MODE; CURRENT_MODE = type === 'product' ? 'products' : 'projects'; openView(id); CURRENT_MODE = prev; }
