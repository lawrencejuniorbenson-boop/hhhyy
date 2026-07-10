function updateHomeStats() {
  const tp = PRODUCTS_DATA.length, tj = PROJECTS_DATA.length;
  const ta = PRODUCTS_DATA.reduce((s, p) => s + p.accounts_opened, 0);
  const ap = PRODUCTS_DATA.filter(p => ['Active', 'In Review'].includes(p.status)).length;
  const aj = PROJECTS_DATA.filter(p => ['Active', 'In Review'].includes(p.status)).length;
  const bc = PROJECTS_DATA.reduce((s, p) => s + (p.budget_cost || 0), 0);
  const cp = PRODUCTS_DATA.filter(p => p.compliance_status === 'Compliant').length;
  const hr = [...PRODUCTS_DATA, ...PROJECTS_DATA].filter(p => ['High', 'Critical'].includes(p.risk_level)).length;
  document.getElementById('h-total-products').textContent = tp;
  document.getElementById('h-total-projects').textContent = tj;
  document.getElementById('h-total-accounts').textContent = ta >= 1000 ? (ta / 1000).toFixed(1) + 'K' : ta;
  document.getElementById('hm-prod-total').textContent = tp;
  document.getElementById('hm-prod-active').textContent = ap;
  document.getElementById('hm-prod-compliant').textContent = cp;
  document.getElementById('hm-proj-total').textContent = tj;
  document.getElementById('hm-proj-active').textContent = aj;
  document.getElementById('hm-proj-budget').textContent = bc >= 1e6 ? 'GH₵ ' + (bc / 1e6).toFixed(1) + 'M' : (bc >= 1000 ? 'GH₵ ' + (bc / 1000).toFixed(0) + 'K' : 'GH₵ 0');
  document.getElementById('hm-port-total').textContent = ap + aj;
  document.getElementById('hm-port-risk').textContent = hr;
  const cats = ['digital', 'payment', 'liability', 'asset', 'other'];
  cats.forEach(c => {
    document.getElementById('hc-prod-' + c).textContent = PRODUCTS_DATA.filter(p => p.cat === c).length;
    document.getElementById('hc-proj-' + c).textContent = PROJECTS_DATA.filter(p => p.cat === c).length;
    document.getElementById('cnt-prod-' + c).textContent = PRODUCTS_DATA.filter(p => p.cat === c).length;
    document.getElementById('cnt-proj-' + c).textContent = PROJECTS_DATA.filter(p => p.cat === c).length;
  });
  document.getElementById('cnt-prod-all').textContent = tp;
  document.getElementById('cnt-proj-all').textContent = tj;
  document.getElementById('home-title').textContent = SETTINGS.title;
}
