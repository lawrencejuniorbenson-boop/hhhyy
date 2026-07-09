function navigateTo(mode, cat) {
  if (mode === 'branches') {
    CURRENT_PAGE = 'branches';
    document.getElementById('page-home').style.display = 'none';
    document.getElementById('page-dash').style.display = 'none';
    document.getElementById('page-audit').style.display = 'none';
    const pb = document.getElementById('page-branches'); if (pb) pb.style.display = '';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navEl = document.getElementById('nav-branches');
    if (navEl) navEl.classList.add('active');
    document.getElementById('bread-root').textContent = 'Branches';
    document.getElementById('bread-curr').textContent = 'Performance';
    document.getElementById('srch-q').value = '';
    const addBtn = document.getElementById('sb-add-btn'); if (addBtn) addBtn.style.display = 'none';
    if (typeof initBranchPerformance === 'function') initBranchPerformance();
    return;
  }
  const pb = document.getElementById('page-branches'); if (pb) pb.style.display = 'none';
  if (mode === 'audit') {
    if (!IS_ADMIN) {
      toast(' Only administrators can access the Audit Trail.');
      navigateTo('home');
      return;
    }
    CURRENT_PAGE = 'audit';
    document.getElementById('page-home').style.display = 'none';
    document.getElementById('page-dash').style.display = 'none';
    document.getElementById('page-audit').style.display = '';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navEl = document.getElementById('nav-audit');
    if (navEl) navEl.classList.add('active');
    document.getElementById('bread-root').textContent = 'System';
    document.getElementById('bread-curr').textContent = 'Audit Trail';
    document.getElementById('srch-q').value = '';
    const addBtn = document.getElementById('sb-add-btn'); if (addBtn) addBtn.style.display = 'none';
    refreshAuditTrail();
    return;
  }
  document.getElementById('page-audit').style.display = 'none';
  if (mode === 'home') {
    CURRENT_PAGE = 'home';
    document.getElementById('page-home').style.display = '';
    document.getElementById('page-dash').style.display = 'none';
    // Update sidebar active
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('nav-home').classList.add('active');
    // Update topbar
    document.getElementById('bread-root').textContent = 'Home';
    document.getElementById('bread-curr').textContent = 'Overview';
    document.getElementById('srch-q').value = '';
    const addBtn = document.getElementById('sb-add-btn'); if (addBtn) addBtn.style.display = 'none';
    updateHomeStats();
    return;
  }
  CURRENT_PAGE = 'dash';
  CURRENT_MODE = mode;
  currentCat = cat || 'all';
  sfilt = 'All';
  document.getElementById('page-home').style.display = 'none';
  document.getElementById('page-dash').style.display = '';
  // Body class for mode visibility
  document.body.className = 'mode-' + mode;

  // Update period selector options based on mode
  const periodSelect = document.getElementById('period-select');
  if (periodSelect) {
    if (mode === 'projects') {
      periodSelect.innerHTML = `
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      `;
      if (['weekly', 'quarterly'].includes(CURRENT_PERIOD)) {
        CURRENT_PERIOD = 'monthly';
      }
    } else {
      periodSelect.innerHTML = `
        <option value="monthly">Monthly</option>
        <option value="weekly">Weekly</option>
        <option value="quarterly">Quarterly</option>
        <option value="yearly">Yearly</option>
      `;
    }
    periodSelect.value = CURRENT_PERIOD;
  }
  // Sidebar active
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navId = 'nav-' + mode + '-' + (cat || 'all');
  const navEl = document.getElementById(navId);
  if (navEl) navEl.classList.add('active');
  // Add button label
  document.getElementById('btn-add-text').textContent = mode === 'products' ? 'Add Product' : 'Add Project';
  document.getElementById('sb-add-btn').style.display = mode === 'portfolio' ? 'none' : 'flex';
  // Breadcrumb
  const modeLabel = { products: 'Products', projects: 'Projects', portfolio: 'Portfolio' }[mode];
  const catLabel = cat === 'all' ? 'All' : (CAT_LBL[cat] || cat).replace(/^\S+\s/, '');
  document.getElementById('bread-root').textContent = modeLabel;
  document.getElementById('bread-curr').textContent = catLabel + ' ' + (mode === 'portfolio' ? '' : '' + modeLabel.slice(0, -1));
  // Topbar
  document.getElementById('srch-q').placeholder = 'Search ' + (mode === 'portfolio' ? 'portfolio…' : mode + '…');
  // Table header
  const thead = document.getElementById('tbl-thead');
  if (mode === 'products') {
    thead.innerHTML = `<tr><th>#</th><th>Product</th><th>Category</th><th>Accounts Opened</th><th>Onboarding Target</th><th>Monthly Revenue</th><th>Compliance</th><th>Risk</th><th>Actions</th></tr>`;
  } else if (mode === 'projects') {
    thead.innerHTML = `<tr><th>#</th><th>Project</th><th>Category</th><th>Timeline</th><th>Budget Cost</th><th>Stage</th><th>Risk</th><th>Status</th><th>Priority</th><th>Progress</th><th>Actions</th></tr>`;
  } else {
    thead.innerHTML = `<tr><th>#</th><th>Initiative</th><th>Type</th><th>Category</th><th>Owner</th><th>Timeline</th><th>Budget / Target Rev</th><th>Benefit / Actual Rev</th><th>Progress</th><th>Status</th><th>Priority</th><th>Actions</th></tr>`;
  }
  // Page title
  const titles = { products: 'Product Portfolio', projects: 'Project Portfolio', portfolio: 'Portfolio Overview' };
  document.getElementById('dash-title').textContent = (catLabel === 'All' ? '' : (catLabel + ' ')) + titles[mode];
  document.getElementById('dash-sub').textContent = { products: 'Track KPIs, onboarding targets and compliance', projects: 'Monitor cost-benefit, ROI and delivery milestones', portfolio: 'Consolidated view of all active products and projects' }[mode];
  render();
}
