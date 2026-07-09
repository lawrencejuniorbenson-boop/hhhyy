/* ── PROJECT DATABASE OPERATIONS ─────────────────────────────────── */
async function insertProjectInDB(d) { const res = await sbPost('projects', { core: projPayload(d), tasks: d.tasks }); return res.id; }
async function updateProjectInDB(id, d) { await sbPatch('projects', '?id=eq.' + id, { core: projPayload(d), tasks: d.tasks }); }
function projPayload(d) { return { category_id: d.cat, name: d.name, project_code: d.code, description: d.description, start_date: d.start || null, end_date: d.end || null, progress: d.progress, status: d.status, priority: d.priority, owner: d.owner, notes: d.notes, budget_cost: d.budget_cost, expected_benefit: d.expected_benefit, risk_level: d.risk_level, stage: d.stage, reporting_month: d.reporting_month || null, updated_at: new Date().toISOString() }; }

/* ── PROJECT FORM HANDLING & INITIALIZATION ──────────────────────── */
function fillFormProject(p) {
  document.getElementById('f-cat').value = p.cat;
  document.getElementById('f-rep-month').value = p.reporting_month || '';
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-code').value = p.project_code;
  document.getElementById('f-owner').value = p.owner;
  document.getElementById('f-offerings').value = p.description;
  document.getElementById('f-budget-cost').value = p.budget_cost || '';
  document.getElementById('f-stage').value = p.stage;
  document.getElementById('f-risk').value = p.risk_level;
  document.getElementById('f-start').value = p.start_date;
  document.getElementById('f-end').value = p.end_date;
  document.getElementById('f-progress').value = p.progress;
  document.getElementById('f-status').value = p.status;
  const fpri = document.getElementById('f-priority'); if (fpri) fpri.value = p.priority;
  document.getElementById('f-notes').value = p.notes;
  renderFormTasks();
}

function calcProjectProgress() {
  const el = document.getElementById('f-progress');
  if (!el) return;
  if (!formTasks.length) { el.value = 0; return; }
  const completed = formTasks.filter(t => t.status === 'Completed').length;
  el.value = Math.round((completed / formTasks.length) * 100);
}
function addFormTask(e) {
  if (e) e.preventDefault();
  const t = document.getElementById('t-text').value.trim(); if (!t) { toast('Please enter a task description'); return; }
  formTasks.push({ task_text: t, target_date: document.getElementById('t-date').value || null, owner: document.getElementById('t-owner').value.trim() || '', status: document.getElementById('t-status').value || 'Pending', sort_order: formTasks.length });
  ['t-text', 't-date', 't-owner'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('t-status').value = 'Pending'; renderFormTasks();
}
function removeFormTask(idx) { formTasks.splice(idx, 1); renderFormTasks(); }
function changeFormTaskStatus(idx, newStatus) { if (formTasks[idx]) { formTasks[idx].status = newStatus; renderFormTasks(); } }
function renderFormTasks() {
  const c = document.getElementById('t-preview'); if (!c) return;
  calcProjectProgress();
  if (!formTasks.length) { c.innerHTML = `<div style="text-align:center;padding:12px;color:var(--muted);font-size:11px;font-style:italic">No steps added yet.</div>`; return; }
  c.innerHTML = formTasks.map((t, i) => {
    const stCss = { Pending: 'b-pending', 'In Progress': 'b-review', Completed: 'b-compliant' }[t.status] || 'b-pending';
    return `<div style="display:flex;align-items:center;justify-content:space-between;background:#fff;padding:8px 12px;border-radius:6px;border:1px solid var(--bdr);gap:10px"><div style="flex:1"><strong style="font-size:12px;color:var(--navy)">${t.task_text}</strong><div style="font-size:10px;color:var(--muted);margin-top:2px">${t.target_date ? ' ' + t.target_date : ''}${t.owner ? ' ·  ' + t.owner : ''}</div></div><select class="badge ${stCss}" style="font-size:9.5px" onchange="changeFormTaskStatus(${i}, this.value)"><option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option><option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option><option value="Completed" ${t.status === 'Completed' ? 'selected' : ''}>Completed</option></select><button class="cls" onclick="removeFormTask(${i})" style="width:24px;height:24px;font-size:12px;padding:0">✕</button></div>`;
  }).join('');
}

async function saveProject() {
  const cat = document.getElementById('f-cat').value, name = document.getElementById('f-name').value.trim(), start = document.getElementById('f-start').value;
  const projectDate = document.getElementById('f-rep-month').value;
  if (!cat) { toast('Please select a category'); return; }
  if (!name) { toast('Please enter a project name'); return; }
  if (!projectDate) { toast('Please set a project date'); return; }
  if (!start) { toast('Please set a start date'); return; }
  if (!ok()) { toast('Error: Supabase not configured'); return; }
  const btn = document.getElementById('mod-save-btn'); btn.disabled = true; btn.textContent = editId ? 'Updating…' : 'Saving…';
  const fpri = document.getElementById('f-priority');
  const d = {
    cat, name, code: document.getElementById('f-code').value, description: document.getElementById('f-offerings').value, start, end: document.getElementById('f-end').value,
    reporting_month: projectDate || null,
    progress: Math.min(100, Math.max(0, Number(document.getElementById('f-progress').value) || 0)),
    status: document.getElementById('f-status').value, priority: fpri ? fpri.value : 'Medium', owner: document.getElementById('f-owner').value, notes: document.getElementById('f-notes').value,
    budget_cost: Number(document.getElementById('f-budget-cost').value) || 0, expected_benefit: 0,
    risk_level: document.getElementById('f-risk').value, stage: document.getElementById('f-stage').value, tasks: [...formTasks]
  };
  try {
    if (editId) { 
      const orig = PROJECTS_DATA.find(x => x.id === editId);
      const changes = {};
      if (orig) {
        const map = {
          cat: 'cat', name: 'name', code: 'project_code', description: 'description',
          start: 'start_date', end: 'end_date', reporting_month: 'reporting_month',
          progress: 'progress', status: 'status', priority: 'priority',
          owner: 'owner', notes: 'notes', budget_cost: 'budget_cost',
          expected_benefit: 'expected_benefit', risk_level: 'risk_level', stage: 'stage'
        };
        Object.entries(map).forEach(([k, origK]) => {
          const newVal = d[k], oldVal = orig[origK];
          if (newVal !== oldVal) {
            changes[origK] = { from: oldVal ?? '—', to: newVal ?? '—' };
          }
        });
      }
      await updateProjectInDB(editId, d); 
      toast('Project updated successfully!'); 
      await logAuditAction('UPDATE', 'project', editId, d.name, changes);
    } else { 
      const newId = await insertProjectInDB(d); 
      toast('Project added successfully!'); 
      await logAuditAction('INSERT', 'project', newId, d.name, { code: d.code, stage: d.stage });
    }
    await loadData(); closeAdd();
  } catch (err) { console.error(err); toast('Error: Save failed: ' + err.message); }
  finally { btn.disabled = false; btn.textContent = editId ? 'Update Project' : 'Save Project'; }
}

/* ── PROJECT RENDERING OPERATIONS ────────────────────────────────── */
function renderProjectsKPIs() {
  const vd = vis(), total = vd.length, scale = getPeriodScale();
  const now = new Date();
  const curYearStr = String(now.getFullYear());
  const curMonthStr = curYearStr + '-' + String(now.getMonth() + 1).padStart(2, '0');
  let projectsAdded = 0;
  if (CURRENT_PERIOD === 'monthly') {
    projectsAdded = vd.filter(p => p.reporting_month && p.reporting_month.startsWith(curMonthStr)).length;
  } else {
    projectsAdded = vd.filter(p => p.reporting_month && p.reporting_month.startsWith(curYearStr)).length;
  }
  const ongoing = vd.filter(p => ['Active', 'Pipeline', 'In Review', 'Paused'].includes(p.status)).length;
  const completed = vd.filter(p => p.status === 'Completed').length;
  const totalBudget = vd.reduce((s, p) => s + (p.budget_cost || 0), 0);
  const periodName = CURRENT_PERIOD === 'monthly' ? now.toLocaleString('en', { month: 'long', year: 'numeric' }) : String(now.getFullYear());

  document.getElementById('kpi-row').innerHTML = `
    <div class="kpi k1"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rocket"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0z"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5z"/></svg></div><div class="kpi-lbl">Total Projects</div><div class="kpi-val">${total}</div><div class="kpi-sub">${(CAT_LBL[currentCat] || 'All').replace(/^\S+\s/, '')}</div></div>
    <div class="kpi k2"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div class="kpi-lbl">Projects Added (${periodName})</div><div class="kpi-val">${projectsAdded}</div><div class="kpi-sub">New on platform</div></div>
    <div class="kpi k3"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><div class="kpi-lbl">Ongoing Projects</div><div class="kpi-val">${ongoing}</div><div class="kpi-sub">${vd.filter(p => p.status === 'Pipeline').length} in pipeline</div></div>
    <div class="kpi k4"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="kpi-lbl">Completed Projects</div><div class="kpi-val">${completed}</div><div class="kpi-sub">Out of ${total} projects</div></div>
    <div class="kpi k5"><div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-banknote"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg></div><div class="kpi-lbl">Total Budget</div><div class="kpi-val">${CCompact(totalBudget)}</div><div class="kpi-sub">Allocated cost</div></div>`;
}

function renderProjectsTable() {
  const vd = filt(), scale = getPeriodScale();
  const catName = (CAT_LBL[currentCat] || 'All').replace(/^\S+\s/, '');
  document.getElementById('tbl-heading').textContent = catName + ' Projects — ' + vd.length + ' item' + (vd.length !== 1 ? 's' : '');
  const allSts = ['All', 'Active', 'Pipeline', 'In Review', 'Paused', 'Completed', 'Cancelled'];
  document.getElementById('status-filters').innerHTML = allSts.map(s => `<button class="fbtn ${sfilt === s ? 'on' : ''}" onclick="setSF('${s}')">${s}</button>`).join('');
  if (!vd.length) { document.getElementById('main-tbody').innerHTML = `<tr class="empty-row"><td colspan="13"><div class="empty-ico" style="font-size: 14px; font-weight: 800; opacity: 0.3;">EMPTY</div><div>${!ok() ? 'Configure Supabase in Admin Settings to load data.' : 'No items found matching your criteria.'}</div></td></tr>`; return; }
  document.getElementById('main-tbody').innerHTML = vd.map((p, i) => {
    const cc = CAT_COL[p.cat] || '#888', cn = (CAT_LBL[p.cat] || p.cat).replace(/^\S+\s/, '');
    const pc = p.progress, pcl = pc >= 70 ? 'hi' : pc < 30 ? 'lo' : 'md';
    const stageCss = { Execution: 'b-review', Testing: 'b-pending', Deployment: 'b-active', Closed: 'b-completed' }[p.stage] || 'b-pipeline';
    return `<tr>
      <td style="color:var(--muted);font-weight:700;font-size:11px">${i + 1}</td>
      <td><div style="font-weight:800;color:var(--navy);font-size:12.5px">${p.name}</div>${p.project_code ? `<div style="font-size:10px;color:var(--muted)">${p.project_code}</div>` : ''}${p.owner ? `<div style="font-size:10px;color:var(--muted)">${p.owner}</div>` : ''}</td>
      <td><span style="display:inline-flex;align-items:center;gap:5px;font-weight:700;font-size:11px"><span style="width:8px;height:8px;background:${cc};border-radius:2px;flex-shrink:0"></span>${cn}</span></td>
      <td><div style="font-size:11.5px;font-weight:600;color:var(--navy)">${p.start_date || '—'}</div><div style="font-size:10px;color:var(--muted)">to ${p.end_date || 'Ongoing'}</div></td>
      <td style="font-weight:700;color:var(--navy)">${C(p.budget_cost)}</td>
      <td><span class="badge ${stageCss}">${p.stage}</span></td>
      <td><span class="badge ${RSK_CSS[p.risk_level] || 'b-low-risk'}">${p.risk_level || 'Low'}</span></td>
      <td><span class="badge ${STS_CSS[p.status] || 'b-pipeline'}">${p.status}</span></td>
      <td><span class="badge ${PRI_CSS[p.priority] || 'b-med'}">${p.priority}</span></td>
      <td><div class="prog-wrap"><div class="prog-track"><div class="prog-fill ${pcl}" style="width:${pc}%"></div></div><span class="prog-pct">${pc}%</span></div></td>
      <td><div class="act"><button class="a-btn a-view" onclick="openView('${p.id}')">View</button><button class="a-btn a-edit" onclick="openEdit('${p.id}')">Edit</button><button class="a-btn a-del" onclick="openDelModal('${p.id}')">Delete</button></div></td>
    </tr>`;
  }).join('');
}

function renderProjectsCharts() {
  const vd = vis(), scale = getPeriodScale();
  const t1 = document.getElementById('c1-title'), t2 = document.getElementById('c2-title'), t4 = document.getElementById('c4-title');
  if (t1) t1.textContent = 'Projects by Stage';
  if (t2) t2.textContent = 'Risk Breakdown';
  if (t4) t4.textContent = 'Budget by Project (Top 6)';
  const stages = ['Initiation', 'Planning', 'Execution', 'Testing', 'Deployment', 'Closed'], scols = ['#2563EB', '#7C3AED', '#D97706', '#0891B2', '#059669', '#64748B'];
  setChart('cat', 'catChart', 'doughnut',
    { labels: stages, datasets: [{ data: stages.map(s => vd.filter(p => p.stage === s).length), backgroundColor: scols, borderWidth: 2, borderColor: '#fff', hoverOffset: 7 }] },
    { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, padding: 10, boxWidth: 10 } } } });
  const rk = ['Low', 'Medium', 'High', 'Critical'], rc = ['#059669', '#D97706', '#F97316', '#DC2626'];
  setChart('comp', 'compChart', 'bar',
    { labels: rk, datasets: [{ data: rk.map(k => vd.filter(p => p.risk_level === k).length), backgroundColor: rc, borderRadius: 6, barPercentage: .65 }] },
    { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { font: { size: 9 }, stepSize: 1 }, grid: { color: '#F1F5FB' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } } });
  const top6j = [...vd].sort((a, b) => b.budget_cost - a.budget_cost).slice(0, 6);
  setChart('acct', 'acctChart', 'bar',
    { labels: top6j.map(p => p.name.length > 16 ? p.name.slice(0, 16) + '…' : p.name), datasets: [{ label: 'Budget', data: top6j.map(p => p.budget_cost * scale), backgroundColor: '#2563EB', borderRadius: 4 }] },
    { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 10 } } }, scales: { x: { ticks: { font: { size: 9 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { font: { size: 9 } }, grid: { color: '#F1F5FB' } } } });
}

async function changeTaskStatus(projectId, taskId, newStatus, selectEl) {
  if (!ok()) { toast('Error: Configure Supabase first'); return; }
  if (!taskId) {
    toast('Error: Task ID missing — please close and reopen this project to refresh.');
    return;
  }
  const prevStatus = selectEl ? selectEl.dataset.prevStatus || '' : '';
  if (selectEl) selectEl.dataset.prevStatus = newStatus;
  const SC = { Pending: 'b-pending', 'In Progress': 'b-review', Completed: 'b-compliant' };
  try {
    const proj = PROJECTS_DATA.find(p => p.id === projectId);
    if (!proj) throw new Error('Project not found in local state');
    const task = proj.tasks.find(t => String(t.id) === String(taskId));
    if (!task) throw new Error('Task not found — please close and reopen this project.');
    const oldStatus = task.status;
    if (selectEl) { selectEl.className = 'badge ' + (SC[newStatus] || 'b-pending'); }
    await sbPatch('project_tasks', '?id=eq.' + taskId, { status: newStatus });
    task.status = newStatus;
    const completed = proj.tasks.filter(t => t.status === 'Completed').length;
    const newProgress = proj.tasks.length ? Math.round((completed / proj.tasks.length) * 100) : 0;
    await sbPatch('projects', '?id=eq.' + projectId, { progress: newProgress });
    proj.progress = newProgress;
    const pctEl = document.getElementById('view-progress-pct');
    if (pctEl) pctEl.textContent = newProgress + '%';
    if (CURRENT_PAGE === 'dash') render();
    try {
      await logAuditAction('UPDATE_TASK_STATUS', 'system', null,
        `Changed task "${task.task_text}" status from "${oldStatus}" to "${newStatus}" under project: ${proj.name}`,
        { projectId, taskId, oldStatus, newStatus, newProgress });
    } catch (e) { console.error('Audit log failed:', e); }
    toast('Task status updated successfully!');
  } catch (err) {
    toast('Error: Failed to update: ' + err.message);
    console.error('[changeTaskStatus]', err);
    if (selectEl && prevStatus) {
      selectEl.value = prevStatus;
      selectEl.className = 'badge ' + (SC[prevStatus] || 'b-pending');
    }
  }
}
