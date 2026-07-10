

function openAdd() {
  editId = null; formGaps = []; formMkts = []; formEnhs = []; formTasks = [];
  const isProd = CURRENT_MODE === 'products';
  document.getElementById('mod-title').textContent = isProd ? 'Add New Product' : 'Add New Project';
  document.getElementById('mod-sub').textContent = 'All fields marked * are required';
  document.getElementById('mod-save-btn').textContent = isProd ? 'Save Product' : 'Save Project';
  document.getElementById('lbl-f-name').textContent = isProd ? 'Product Name *' : 'Project Name *';
  document.getElementById('lbl-f-owner').textContent = isProd ? 'Owner / Team *' : 'Sponsor / Owner / Team *';
  document.getElementById('lbl-f-offerings').textContent = isProd ? 'Current Offerings' : 'Description & Objectives';
  document.getElementById('lbl-f-notes').textContent = isProd ? 'Additional Notes' : 'Notes / Risks';
  document.getElementById('lbl-sec-3').textContent = isProd ? 'Compliance & Risk' : 'Project Stage & Risk';
  
  const fRepMonth = document.getElementById('f-rep-month');
  const lblRepMonth = document.getElementById('lbl-f-rep-month');
  if (lblRepMonth && fRepMonth) {
    if (isProd) {
      lblRepMonth.textContent = 'Reporting Month *';
      fRepMonth.type = 'month';
      fRepMonth.placeholder = 'YYYY-MM';
    } else {
      lblRepMonth.textContent = 'Project Date *';
      fRepMonth.type = 'date';
      fRepMonth.placeholder = 'YYYY-MM-DD';
    }
  }

  const fStatus = document.getElementById('f-status');
  if (fStatus) {
    if (isProd) {
      fStatus.innerHTML = '<option value="Active">Active</option><option value="Inactive">Inactive</option>';
      fStatus.value = 'Active';
    } else {
      fStatus.innerHTML = '<option value="Pipeline">Pipeline</option><option value="Active">Active</option><option value="In Review">In Review</option><option value="Paused">Paused</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>';
      fStatus.value = 'Pipeline';
    }
  }

  clearForm(); toggleCatFields();
  document.getElementById('add-overlay').classList.add('open');
}
function quickEdit(id, type) {
  closeAdmin();
  CURRENT_MODE = type === 'product' ? 'products' : 'projects';
  openEdit(id);
}
function openEdit(id) {
  const isProd = CURRENT_MODE === 'products';
  const fRepMonth = document.getElementById('f-rep-month');
  const lblRepMonth = document.getElementById('lbl-f-rep-month');
  if (lblRepMonth && fRepMonth) {
    if (isProd) {
      lblRepMonth.textContent = 'Reporting Month *';
      fRepMonth.type = 'month';
      fRepMonth.placeholder = 'YYYY-MM';
    } else {
      lblRepMonth.textContent = 'Project Date *';
      fRepMonth.type = 'date';
      fRepMonth.placeholder = 'YYYY-MM-DD';
    }
  }

  const fStatus = document.getElementById('f-status');
  if (fStatus) {
    if (isProd) {
      fStatus.innerHTML = '<option value="Active">Active</option><option value="Inactive">Inactive</option>';
    } else {
      fStatus.innerHTML = '<option value="Pipeline">Pipeline</option><option value="Active">Active</option><option value="In Review">In Review</option><option value="Paused">Paused</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>';
    }
  }

  if (CURRENT_MODE === 'products') {
    const p = PRODUCTS_DATA.find(x => x.id === id); if (!p) return;
    editId = id; formGaps = [...p.gaps]; formMkts = [...p.markets]; formEnhs = [...p.enhancements];
    document.getElementById('mod-title').textContent = 'Edit Product';
    document.getElementById('mod-sub').textContent = 'Editing: ' + p.name;
    document.getElementById('mod-save-btn').textContent = 'Update Product';
    document.getElementById('lbl-f-name').textContent = 'Product Name *';
    document.getElementById('lbl-f-owner').textContent = 'Owner / Team *';
    document.getElementById('lbl-f-offerings').textContent = 'Current Offerings';
    document.getElementById('lbl-f-notes').textContent = 'Additional Notes';
    document.getElementById('lbl-sec-3').textContent = 'Compliance & Risk';
    fillFormProduct(p);
  } else {
    const p = PROJECTS_DATA.find(x => x.id === id); if (!p) return;
    editId = id; formTasks = [...p.tasks];
    document.getElementById('mod-title').textContent = 'Edit Project';
    document.getElementById('mod-sub').textContent = 'Editing: ' + p.name;
    document.getElementById('mod-save-btn').textContent = 'Update Project';
    document.getElementById('lbl-f-name').textContent = 'Project Name *';
    document.getElementById('lbl-f-owner').textContent = 'Sponsor / Owner / Team *';
    document.getElementById('lbl-f-offerings').textContent = 'Description & Objectives';
    document.getElementById('lbl-f-notes').textContent = 'Notes / Risks';
    document.getElementById('lbl-sec-3').textContent = 'Project Stage & Risk';
    fillFormProject(p);
  }
  document.getElementById('add-overlay').classList.add('open');
  document.getElementById('view-overlay').classList.remove('open');
}
function closeAdd() { document.getElementById('add-overlay').classList.remove('open'); }
function closeAddOut(e) { if (e.target === document.getElementById('add-overlay')) closeAdd(); }

function clearForm() {
  ['f-cat', 'f-rep-month', 'f-name', 'f-code', 'f-owner', 'f-offerings', 'f-accounts', 'f-active-acc',
    'f-inactive-acc', 'f-target-onboarding', 'f-onboarding-perf', 'f-revenue', 'f-actual-revenue',
    'f-product-roi', 'f-notes', 'f-budget-cost', 't-text', 't-date', 't-owner']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = '' });
  document.getElementById('f-compliance').value = 'Compliant';
  document.getElementById('f-risk').value = 'Low';
  document.getElementById('f-stage').value = 'Initiation';
  document.getElementById('t-status').value = 'Pending';
  const fs = document.getElementById('f-status'); if (fs) fs.value = 'Pipeline';
  const fp = document.getElementById('f-progress'); if (fp) fp.value = '';
  const fpri = document.getElementById('f-priority'); if (fpri) fpri.value = 'Medium';
  formGaps = []; formMkts = []; formEnhs = []; formTasks = [];
  renderTags(); renderFormTasks();
}
function toggleCatFields() {
  const cat = document.getElementById('f-cat').value;
  const rg = document.getElementById('roi-fields-group');
  if (rg) rg.style.setProperty('display', cat === 'digital' ? 'contents' : 'none', 'important');
}
function calcInactiveAcc() {
  const total = Number(document.getElementById('f-accounts').value) || 0;
  const active = Number(document.getElementById('f-active-acc').value) || 0;
  const inactive = Math.max(0, total - active);
  document.getElementById('f-inactive-acc').value = inactive > 0 ? inactive : '';
  const target = Number(document.getElementById('f-target-onboarding').value) || 0;
  const perf = target > 0 ? ((total / target) * 100).toFixed(1) : 0;
  const el = document.getElementById('f-onboarding-perf');
  if (el) el.value = target > 0 || total > 0 ? `${total.toLocaleString('en')} / ${target.toLocaleString('en')} (${perf}% Target Achievement)` : '';
}
function calcProductROI() {
  const expected = Number(document.getElementById('f-revenue').value) || 0;
  const actual = Number(document.getElementById('f-actual-revenue').value) || 0;
  const net = actual - expected, roi = expected > 0 ? ((actual / expected) * 100).toFixed(1) : 0;
  const el = document.getElementById('f-product-roi');
  if (el) el.value = expected > 0 || actual > 0 ? `Net: GH₵ ${net.toLocaleString('en')} (${roi}% Target Achievement / ROI)` : '';
}
function calcProjectROI() {
  const cost = Number(document.getElementById('f-budget-cost').value) || 0;
  const benefit = Number(document.getElementById('f-expected-benefit').value) || 0;
  const net = benefit - cost, roi = cost > 0 ? ((net / cost) * 100).toFixed(1) : 0;
  const el = document.getElementById('f-roi');
  if (el) el.value = cost > 0 ? `Net: GH₵ ${net.toLocaleString('en')} (${roi}% ROI)` : benefit > 0 ? `Net: GH₵ ${net.toLocaleString('en')}` : '';
}

/* Tags */
function addTag(type) {
  const ids = { gap: 'f-gap-in', mkt: 'f-mkt-in', enh: 'f-enh-in' };
  const arrs = { gap: formGaps, mkt: formMkts, enh: formEnhs };
  const inp = document.getElementById(ids[type]); if (!inp) return;
  const val = inp.value.trim(); if (!val) return;
  if (!arrs[type].includes(val)) arrs[type].push(val);
  inp.value = ''; renderTags();
}
function removeTag(type, idx) { ({ gap: formGaps, mkt: formMkts, enh: formEnhs })[type].splice(idx, 1); renderTags(); }
function renderTags() {
  const r = (arr, elId, cls, type) => {
    const el = document.getElementById(elId); if (!el) return;
    el.innerHTML = arr.map((t, i) => `<span class="tp ${cls}">${t}<button onclick="removeTag('${type}',${i})">×</button></span>`).join('');
  };
  r(formGaps, 'f-gaps-p', 'tp-gap', 'gap');
  r(formMkts, 'f-mkts-p', 'tp-mkt', 'mkt');
  r(formEnhs, 'f-enhs-p', 'tp-enh', 'enh');
}

function saveData() {
  if (CURRENT_MODE === 'products') {
    saveProduct();
  } else {
    saveProject();
  }
}
