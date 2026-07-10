let renderPending = false;
function render() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => {
    renderPending = false;
    if (CURRENT_PAGE === 'branches') {
      if (typeof renderBranchPerformance === 'function') renderBranchPerformance();
    } else {
      renderKPIs(); renderCharts(); renderTable();
    }
  });
}
function vis() { const d = getActiveData(); return currentCat === 'all' ? d : d.filter(p => p.cat === currentCat); }
function filt() {
  const q = (document.getElementById('srch-q')?.value || '').toLowerCase();
  return vis().filter(p => {
    let ms = sfilt === 'All' || p.status === sfilt;
    if (CURRENT_MODE === 'products') {
      if (sfilt === 'Active') ms = p.status === 'Active';
      else if (sfilt === 'Inactive') ms = p.status !== 'Active';
    }
    const str = CURRENT_MODE === 'products' ? [p.name, p.owner, p.product_code, ...(p.markets || []), ...(p.enhancements || [])].join(' ') : [p.name, p.owner, p.project_code || '', p.description || '', ...(p.tasks || []).map(t => t.task_text)].join(' ');
    return ms && (!q || str.toLowerCase().includes(q));
  });
}

function renderKPIs() {
  if (CURRENT_MODE === 'products') renderProductsKPIs();
  else if (CURRENT_MODE === 'projects') renderProjectsKPIs();
  else renderPortfolioKPIs();
}

function renderTable() {
  if (CURRENT_MODE === 'products') renderProductsTable();
  else if (CURRENT_MODE === 'projects') renderProjectsTable();
  else renderPortfolioTable();
}

function renderCharts() {
  if (CURRENT_MODE === 'products') {
    renderProductsCharts();
  } else {
    if (CURRENT_MODE === 'projects') renderProjectsCharts();
    else renderPortfolioCharts();
    dc('branch');
  }
  
  const isProj = CURRENT_MODE === 'projects';
  const revLabel = isProj ? 'Expected Benefits' : 'Revenue';
  const accLabel = isProj ? 'Projects Added' : 'Accounts Opened';
  const cardRev = document.getElementById('c3-title-rev') ? document.getElementById('c3-title-rev').closest('.chart-card') : null;
  const t3Rev = document.getElementById('c3-title-rev'), t3Onb = document.getElementById('c3-title-onb');
  const td = getTrendData();
  const periodLabel = td.length ? (td[0].label + ' – ' + td[td.length - 1].label) : '';

  if (isProj) {
    if (cardRev) cardRev.style.display = 'none';
    dc('trendRev');
  } else {
    if (cardRev) cardRev.style.display = 'block';
    if (t3Rev) t3Rev.textContent = revLabel + ' Trend — ' + periodLabel;
    setChart('trendRev', 'revenueTrendChart', 'line',
      { labels: td.map(t => t.label), datasets: [{ label: revLabel, data: td.map(t => t.revenue), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.35, pointRadius: CURRENT_PERIOD === 'yearly' ? 0 : 3 }] },
      { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { type: 'linear', display: true, grid: { color: '#F1F5FB' }, ticks: { font: { size: 8 } } }, x: { ticks: { font: { size: 8 }, maxTicksLimit: CURRENT_PERIOD === 'weekly' ? 13 : 12, autoSkip: true }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 10 } }, tooltip: { backgroundColor: 'rgba(15,32,53,0.9)', titleFont: { size: 11 }, bodyFont: { size: 10 } } } });
  }
  if (t3Onb) t3Onb.textContent = accLabel + ' Trend — ' + periodLabel;
  setChart('trendOnb', 'onboardingTrendChart', 'line',
    { labels: td.map(t => t.label), datasets: [{ label: accLabel, data: td.map(t => t.onboarding), borderColor: '#D4A843', backgroundColor: 'rgba(212,168,67,0.1)', fill: true, tension: 0.35, pointRadius: CURRENT_PERIOD === 'yearly' ? 0 : 3 }] },
    { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { y: { type: 'linear', display: true, grid: { color: '#F1F5FB' }, ticks: { font: { size: 8 }, stepSize: isProj ? 1 : undefined } }, x: { ticks: { font: { size: 8 }, maxTicksLimit: CURRENT_PERIOD === 'weekly' ? 13 : 12, autoSkip: true }, grid: { display: false } } }, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 10 } }, tooltip: { backgroundColor: 'rgba(15,32,53,0.9)', titleFont: { size: 11 }, bodyFont: { size: 10 } } } });
}

function setChart(key, canvasId, type, data, options) {
  if (charts[key]) {
    charts[key].data = data;
    Object.assign(charts[key].options, options);
    charts[key].update('none');
  } else {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    charts[key] = new Chart(ctx, { type, data, options });
  }
}

function getTrendData() {
  const data = getActiveData(), now = new Date(), currentYr = now.getFullYear();
  let points = [];
  const mNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthMap = {};
  mNames.forEach((n, i) => monthMap[n] = i);
  
  function parseRepMonth(rm) {
    if (!rm) return { mIdx: null, year: null };
    if (/^\d{4}-\d{2}$/.test(rm)) {
      const [y, m] = rm.split('-').map(Number);
      return { mIdx: m - 1, year: y };
    }
    return { mIdx: monthMap[rm] ?? null, year: null };
  }

  let minYear = currentYr, maxYear = currentYr;
  data.forEach(p => {
    const { year } = parseRepMonth(p.reporting_month);
    if (year) {
      if (year < minYear) minYear = year;
      if (year > maxYear) maxYear = year;
    } else if (p.start_date) {
      const y = new Date(p.start_date).getFullYear();
      if (y < minYear) minYear = y;
      if (y > maxYear) maxYear = y;
    }
  });

  if (CURRENT_PERIOD === 'monthly') {
    for (let y = minYear; y <= maxYear; y++) {
      for (let m = 0; m < 12; m++) {
        points.push({
          label: new Date(y, m, 1).toLocaleString('en', { month: 'short' }) + ' ' + y,
          revenue: 0,
          onboarding: 0
        });
      }
    }
    data.forEach(p => {
      const { mIdx: parsedIdx, year: parsedYear } = parseRepMonth(p.reporting_month);
      let mIdx = parsedIdx;
      let year = parsedYear;
      if (mIdx == null && p.start_date) {
        const d = new Date(p.start_date);
        mIdx = d.getMonth();
        year = d.getFullYear();
      }
      if (mIdx == null) return;
      if (year == null) year = currentYr;

      const isProj = CURRENT_MODE === 'projects';
      const rev = isProj ? 0 : (p.actual_revenue_monthly || 0);
      const onb = isProj ? 1 : (p.accounts_opened || 0);

      const pIdx = (year - minYear) * 12 + mIdx;
      if (pIdx < 0 || pIdx >= points.length) return;

      if (p.reporting_month || isProj) {
        points[pIdx].revenue += rev;
        points[pIdx].onboarding += onb;
      } else {
        for (let m = mIdx; m < 12; m++) {
          const futIdx = (year - minYear) * 12 + m;
          if (futIdx >= 0 && futIdx < points.length) {
            points[futIdx].revenue += rev;
            points[futIdx].onboarding += onb;
          }
        }
      }
    });
  } else if (CURRENT_PERIOD === 'weekly') {
    for (let y = minYear; y <= maxYear; y++) {
      const yrShort = "'" + String(y).slice(-2);
      for (let w = 1; w <= 52; w++) {
        points.push({
          label: 'W' + w + ' ' + yrShort,
          revenue: 0,
          onboarding: 0
        });
      }
    }
    data.forEach(p => {
      const { mIdx, year: parsedYear } = parseRepMonth(p.reporting_month);
      let year = parsedYear;
      if (year == null && p.start_date) year = new Date(p.start_date).getFullYear();
      if (year == null) year = currentYr;

      const isProj = CURRENT_MODE === 'projects';
      const rev = isProj ? 0 : (p.actual_revenue_monthly || 0);
      const onb = isProj ? 1 : (p.accounts_opened || 0);

      if (isProj) {
        const wTarget = mIdx != null ? mIdx * 4 : (p.start_date ? Math.max(0, Math.min(51, Math.ceil(((new Date(p.start_date) - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7) - 1)) : 0);
        const wIdx = (year - minYear) * 52 + wTarget;
        if (wIdx >= 0 && wIdx < points.length) {
          points[wIdx].revenue += rev;
          points[wIdx].onboarding += onb;
        }
      } else if (mIdx != null) {
        const startWeek = mIdx * 4;
        for (let w = 0; w < 4; w++) {
          const wIdx = (year - minYear) * 52 + startWeek + w;
          if (wIdx >= 0 && wIdx < points.length) {
            points[wIdx].revenue += rev / 4;
            points[wIdx].onboarding += onb / 4;
          }
        }
      } else {
        if (!p.start_date) return;
        const sd = new Date(p.start_date), jan1 = new Date(year, 0, 1);
        const sw = Math.max(1, Math.min(52, Math.ceil(((sd - jan1) / 86400000 + jan1.getDay() + 1) / 7)));
        for (let w = sw - 1; w < 52; w++) {
          const wIdx = (year - minYear) * 52 + w;
          if (wIdx >= 0 && wIdx < points.length) {
            points[wIdx].revenue += rev / 4.33;
            points[wIdx].onboarding += onb / 52;
          }
        }
      }
    });
  } else if (CURRENT_PERIOD === 'quarterly') {
    for (let y = minYear; y <= maxYear; y++) {
      for (let q = 1; q <= 4; q++) {
        points.push({
          label: 'Q' + q + ' ' + y,
          revenue: 0,
          onboarding: 0
        });
      }
    }
    data.forEach(p => {
      const { mIdx, year: parsedYear } = parseRepMonth(p.reporting_month);
      let year = parsedYear;
      if (year == null && p.start_date) year = new Date(p.start_date).getFullYear();
      if (year == null) year = currentYr;

      const isProj = CURRENT_MODE === 'projects';
      const rev = isProj ? 0 : (p.actual_revenue_monthly || 0);
      const onb = isProj ? 1 : (p.accounts_opened || 0);

      const qIdx = mIdx != null ? Math.floor(mIdx / 3) : (p.start_date ? Math.floor(new Date(p.start_date).getMonth() / 3) : 0);
      if (p.reporting_month || isProj) {
        const pIdx = (year - minYear) * 4 + qIdx;
        if (pIdx >= 0 && pIdx < points.length) {
          points[pIdx].revenue += rev;
          points[pIdx].onboarding += onb;
        }
      } else {
        if (!p.start_date) return;
        for (let q = qIdx; q < 4; q++) {
          const pIdx = (year - minYear) * 4 + q;
          if (pIdx >= 0 && pIdx < points.length) {
            points[pIdx].revenue += rev * 3;
            points[pIdx].onboarding += onb;
          }
        }
      }
    });
  } else {
    const bkts = 12, dpb = Math.floor(365 / bkts);
    for (let y = minYear; y <= maxYear; y++) {
      const yrShort = "'" + String(y).slice(-2);
      for (let b = 0; b < bkts; b++) {
        points.push({
          label: 'D' + (b * dpb + 1) + ' ' + yrShort,
          revenue: 0,
          onboarding: 0
        });
      }
    }
    data.forEach(p => {
      const { mIdx, year: parsedYear } = parseRepMonth(p.reporting_month);
      let year = parsedYear;
      if (year == null && p.start_date) year = new Date(p.start_date).getFullYear();
      if (year == null) year = currentYr;

      const isProj = CURRENT_MODE === 'projects';
      const rev = isProj ? 0 : (p.actual_revenue_monthly || 0);
      const onb = isProj ? 1 : (p.accounts_opened || 0);

      const bIdx = mIdx != null ? mIdx : (p.start_date ? Math.min(bkts - 1, Math.floor(Math.max(0, (new Date(p.start_date) - new Date(year, 0, 1)) / 86400000) / dpb)) : 0);
      if (p.reporting_month || isProj) {
        const pIdx = (year - minYear) * bkts + bIdx;
        if (pIdx >= 0 && pIdx < points.length) {
          points[pIdx].revenue += rev;
          points[pIdx].onboarding += onb;
        }
      } else {
        if (!p.start_date) return;
        for (let b = bIdx; b < bkts; b++) {
          const pIdx = (year - minYear) * bkts + b;
          if (pIdx >= 0 && pIdx < points.length) {
            points[pIdx].revenue += rev * 12;
            points[pIdx].onboarding += onb;
          }
        }
      }
    });
  }
  return points;
}
