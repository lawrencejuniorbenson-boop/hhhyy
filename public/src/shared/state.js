let PRODUCTS_DATA = [], PROJECTS_DATA = [], SETTINGS = defSettings(), BRANCH_PERF_DATA = {};
let CURRENT_MODE = 'products', CURRENT_PERIOD = 'monthly', currentCat = 'all';
let sfilt = 'All', editId = null, viewId = null, delTargetId = null;
let formGaps = [], formMkts = [], formEnhs = [], formTasks = [], formBranchSales = [];
let charts = {}, refreshTimer = null;
let CURRENT_PAGE = 'home'; // 'home' or 'dash'

function defSettings() { return { title: 'Product/Project Dashboard', sub: 'Dashboard', ll: 'P', colors: { navy: '#1B3A5C', gold: '#D4A843', blue: '#2563EB', green: '#059669', red: '#DC2626', amber: '#D97706' } }; }

function getActiveData() {
  if (CURRENT_MODE === 'products') return PRODUCTS_DATA;
  if (CURRENT_MODE === 'projects') return PROJECTS_DATA;
  const ap = PRODUCTS_DATA.filter(p => ['Active', 'In Review'].includes(p.status));
  const aj = PROJECTS_DATA.filter(p => ['Active', 'In Review'].includes(p.status));
  return [...ap.map(x => ({ ...x, _type: 'product' })), ...aj.map(x => ({ ...x, _type: 'project' }))];
}
function getPeriodScale() {
  if (CURRENT_PERIOD === 'weekly') return 1 / 4.33;
  if (CURRENT_PERIOD === 'quarterly') return 3;
  if (CURRENT_PERIOD === 'yearly') return 12;
  return 1;
}
function getPeriodLabel() {
  if (CURRENT_PERIOD === 'monthly') {
    return new Date().toLocaleString('en', { month: 'long' });
  }
  return { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Annual' }[CURRENT_PERIOD];
}
function setPeriod(p) { CURRENT_PERIOD = p; if (CURRENT_PAGE === 'dash') render(); }

function setSF(s) { sfilt = s; render(); }
