/* ── BRANCH PERFORMANCE DIRECT INPUT & ANALYSIS COMPONENT ────────── */

let branchSel = '';
let branchPeriod = 'monthly';
let branchDate = new Date();

// Week Number Helper
function getWeekNumber(d) {
  const tempDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - (tempDate.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
  return [tempDate.getUTCFullYear(), weekNo];
}

function matchesProductPeriod(p, range, period) {
  if (!p.reporting_month) return false;
  const m = p.reporting_month.match(/^(\d{4})-(\d{2})$/);
  if (!m) return false;
  const pYr = parseInt(m[1], 10);
  const pMon = parseInt(m[2], 10);

  const rDate = new Date(range.start);
  const rYr = rDate.getFullYear();
  const rMon = rDate.getMonth() + 1;

  if (period === 'weekly' || period === 'monthly') {
    return pYr === rYr && pMon === rMon;
  }
  if (period === 'quarterly') {
    const pQ = Math.floor((pMon - 1) / 3);
    const rQ = Math.floor((rMon - 1) / 3);
    return pYr === rYr && pQ === rQ;
  }
  if (period === 'yearly') {
    return pYr === rYr;
  }
  return false;
}

function initBranchPerformance() {
  if (!branchSel && BRANCHES.length > 0) {
    branchSel = BRANCHES[0];
  }
  
  // Populate branch performance dropdown selector
  const sel = document.getElementById('branch-perf-sel');
  if (sel) {
    sel.innerHTML = BRANCHES.map(b => `<option value="${b}" ${branchSel === b ? 'selected' : ''}>${b}</option>`).join('');
  }

  // Set initial date based on latest product date in PRODUCTS_DATA (default to current month/year)
  let resolvedDate = new Date();
  if (PRODUCTS_DATA.length > 0) {
    const validMonths = PRODUCTS_DATA.map(p => p.reporting_month)
      .filter(m => m && typeof m === 'string' && m.match(/^\d{4}-\d{2}$/));
    if (validMonths.length > 0) {
      validMonths.sort();
      const latest = validMonths[validMonths.length - 1]; // e.g. "2026-06"
      const parts = latest.split('-');
      const y = Number(parts[0]), m = Number(parts[1]);
      if (!isNaN(y) && !isNaN(m)) {
        resolvedDate = new Date(y, m - 1, 15);
      }
    }
  }
  branchDate = resolvedDate;

  renderBranchPerformance();
}

function changeBranchPerfBranch(branch) {
  branchSel = branch;
  renderBranchPerformance();
}

function changeBranchPerfPeriod(period) {
  branchPeriod = period;
  
  // Update UI active buttons
  document.querySelectorAll('.bp-period-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'transparent';
    btn.style.color = 'var(--navy)';
  });
  
  const activeBtn = document.getElementById('btn-bp-' + period);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.background = 'var(--navy)';
    activeBtn.style.color = '#fff';
  }

  renderBranchPerformance();
}

function changeBranchPerfMonth(val) {
  if (!val) return;
  const parts = val.split('-');
  const y = Number(parts[0]), m = Number(parts[1]);
  if (!isNaN(y) && !isNaN(m)) {
    branchDate = new Date(y, m - 1, 15);
    renderBranchPerformance();
  }
}

function shiftBranchPeriod(direction) {
  if (branchPeriod === 'weekly') {
    branchDate.setDate(branchDate.getDate() + (direction * 7));
  } else if (branchPeriod === 'monthly') {
    branchDate.setMonth(branchDate.getMonth() + direction);
  } else if (branchPeriod === 'quarterly') {
    branchDate.setMonth(branchDate.getMonth() + (direction * 3));
  } else if (branchPeriod === 'yearly') {
    branchDate.setFullYear(branchDate.getFullYear() + direction);
  }
  renderBranchPerformance();
}

function prevBranchPerfPeriod() { shiftBranchPeriod(-1); }
function nextBranchPerfPeriod() { shiftBranchPeriod(1); }

function getPeriodDateRange(period, date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  if (period === 'yearly') {
    return {
      label: String(year),
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31, 23, 59, 59)
    };
  }
  
  if (period === 'quarterly') {
    const q = Math.floor(month / 3); // 0, 1, 2, 3
    const qNum = q + 1;
    return {
      label: `Q${qNum} ${year}`,
      start: new Date(year, q * 3, 1),
      end: new Date(year, (q * 3) + 3, 0, 23, 59, 59)
    };
  }
  
  if (period === 'monthly') {
    const mLabel = date.toLocaleString('en', { month: 'long', year: 'numeric' });
    return {
      label: mLabel,
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0, 23, 59, 59)
    };
  }
  
  // Weekly
  const [yr, wk] = getWeekNumber(date);
  // Find start of week (Monday)
  const dCopy = new Date(date);
  const day = dCopy.getDay();
  const diff = dCopy.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(dCopy.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return {
    label: `Week ${wk}, ${yr}`,
    start,
    end
  };
}

function saveBPDraft() {
  const range = getPeriodDateRange(branchPeriod, branchDate);
  const productsObj = {};
  const categoriesObj = {
    digital: { actual: 0, target: 0 },
    payment: { actual: 0, target: 0 },
    liability: { actual: 0, target: 0 },
    asset: { actual: 0, target: 0 },
    other: { actual: 0, target: 0 }
  };
  
  document.querySelectorAll('.bp-prod-actual').forEach(input => {
    const val = Number(input.value) || 0;
    const pName = input.getAttribute('data-product');
    const cat = input.getAttribute('data-category');
    if (!productsObj[pName]) productsObj[pName] = { actual: 0, target: 0, valActual: 0, valTarget: 0 };
    productsObj[pName].actual = val;
    if (categoriesObj[cat]) {
      categoriesObj[cat].actual += val;
    }
  });

  document.querySelectorAll('.bp-prod-target').forEach(input => {
    const val = Number(input.value) || 0;
    const pName = input.getAttribute('data-product');
    const cat = input.getAttribute('data-category');
    if (!productsObj[pName]) productsObj[pName] = { actual: 0, target: 0, valActual: 0, valTarget: 0 };
    productsObj[pName].target = val;
    if (categoriesObj[cat]) {
      categoriesObj[cat].target += val;
    }
  });

  document.querySelectorAll('.bp-prod-val-actual').forEach(input => {
    const val = Number(input.value) || 0;
    const pName = input.getAttribute('data-product');
    if (!productsObj[pName]) productsObj[pName] = { actual: 0, target: 0, valActual: 0, valTarget: 0 };
    productsObj[pName].valActual = val;
  });

  document.querySelectorAll('.bp-prod-val-target').forEach(input => {
    const val = Number(input.value) || 0;
    const pName = input.getAttribute('data-product');
    if (!productsObj[pName]) productsObj[pName] = { actual: 0, target: 0, valActual: 0, valTarget: 0 };
    productsObj[pName].valTarget = val;
  });

  const draft = {
    units: Number(document.getElementById('inp-bp-units').value) || 0,
    targetUnits: Number(document.getElementById('inp-bp-units-target').value) || 0,
    value: Number(document.getElementById('inp-bp-value').value) || 0,
    targetValue: Number(document.getElementById('inp-bp-value-target').value) || 0,
    products: productsObj,
    categories: categoriesObj
  };

  const draftKey = `bp_draft_${branchSel}_${branchPeriod}_${range.label}`;
  localStorage.setItem(draftKey, JSON.stringify(draft));
}

function recalculateBPFormTotals() {
  let totalUnits = 0;
  let totalTarget = 0;
  let totalValue = 0;
  let totalTargetValue = 0;
  
  const catSums = {
    digital: { actual: 0, target: 0 },
    payment: { actual: 0, target: 0 },
    liability: { actual: 0, target: 0 },
    asset: { actual: 0, target: 0 },
    other: { actual: 0, target: 0 }
  };
  
  document.querySelectorAll('.bp-prod-actual').forEach(input => {
    const val = Number(input.value) || 0;
    const cat = input.getAttribute('data-category');
    if (catSums[cat]) {
      catSums[cat].actual += val;
    }
    totalUnits += val;
  });

  document.querySelectorAll('.bp-prod-target').forEach(input => {
    const val = Number(input.value) || 0;
    const cat = input.getAttribute('data-category');
    if (catSums[cat]) {
      catSums[cat].target += val;
    }
    totalTarget += val;
  });

  document.querySelectorAll('.bp-prod-val-actual').forEach(input => {
    totalValue += Number(input.value) || 0;
  });

  document.querySelectorAll('.bp-prod-val-target').forEach(input => {
    totalTargetValue += Number(input.value) || 0;
  });
  
  const cats = ['digital', 'payment', 'liability', 'asset', 'other'];
  cats.forEach(c => {
    const badge = document.getElementById(`bp-cat-sum-${c}`);
    if (badge) {
      badge.textContent = `${catSums[c].actual} / ${catSums[c].target}`;
    }
  });
  
  const inpUnits = document.getElementById('inp-bp-units');
  if (inpUnits) inpUnits.value = totalUnits;

  const inpTarget = document.getElementById('inp-bp-units-target');
  if (inpTarget) inpTarget.value = totalTarget;

  const inpValue = document.getElementById('inp-bp-value');
  if (inpValue) inpValue.value = totalValue;

  const inpTargetValue = document.getElementById('inp-bp-value-target');
  if (inpTargetValue) inpTargetValue.value = totalTargetValue;

  saveBPDraft();
}

async function saveBranchPerfData(e) {
  e.preventDefault();
  const range = getPeriodDateRange(branchPeriod, branchDate);

  if (!BRANCH_PERF_DATA[branchSel]) {
    BRANCH_PERF_DATA[branchSel] = {};
  }

  const productsObj = {};
  const categoriesObj = {
    digital: { actual: 0, target: 0 },
    payment: { actual: 0, target: 0 },
    liability: { actual: 0, target: 0 },
    asset: { actual: 0, target: 0 },
    other: { actual: 0, target: 0 }
  };
  
  document.querySelectorAll('.bp-prod-actual').forEach(input => {
    const val = Number(input.value) || 0;
    const pName = input.getAttribute('data-product');
    const cat = input.getAttribute('data-category');
    if (!productsObj[pName]) productsObj[pName] = { actual: 0, target: 0, valActual: 0, valTarget: 0 };
    productsObj[pName].actual = val;
    if (categoriesObj[cat]) {
      categoriesObj[cat].actual += val;
    }
  });

  document.querySelectorAll('.bp-prod-target').forEach(input => {
    const val = Number(input.value) || 0;
    const pName = input.getAttribute('data-product');
    const cat = input.getAttribute('data-category');
    if (!productsObj[pName]) productsObj[pName] = { actual: 0, target: 0, valActual: 0, valTarget: 0 };
    productsObj[pName].target = val;
    if (categoriesObj[cat]) {
      categoriesObj[cat].target += val;
    }
  });

  document.querySelectorAll('.bp-prod-val-actual').forEach(input => {
    const val = Number(input.value) || 0;
    const pName = input.getAttribute('data-product');
    if (!productsObj[pName]) productsObj[pName] = { actual: 0, target: 0, valActual: 0, valTarget: 0 };
    productsObj[pName].valActual = val;
  });

  document.querySelectorAll('.bp-prod-val-target').forEach(input => {
    const val = Number(input.value) || 0;
    const pName = input.getAttribute('data-product');
    if (!productsObj[pName]) productsObj[pName] = { actual: 0, target: 0, valActual: 0, valTarget: 0 };
    productsObj[pName].valTarget = val;
  });

  BRANCH_PERF_DATA[branchSel][range.label] = {
    units: Number(document.getElementById('inp-bp-units').value) || 0,
    targetUnits: Number(document.getElementById('inp-bp-units-target').value) || 0,
    value: Number(document.getElementById('inp-bp-value').value) || 0,
    targetValue: Number(document.getElementById('inp-bp-value-target').value) || 0,
    products: productsObj,
    categories: categoriesObj
  };

  showLoad(true);
  try {
    await sbUpsert('dashboard_settings', {
      key: 'branch_perf_data',
      value: JSON.stringify(BRANCH_PERF_DATA)
    });
    localStorage.removeItem(`bp_draft_${branchSel}_${branchPeriod}_${range.label}`);
    toast('Branch performance data saved successfully!');
    try {
      await logAuditAction('UPDATE_SETTINGS', 'system', null, `Updated branch performance data for ${branchSel} (${range.label})`);
    } catch (err) {}
    renderBranchPerformance();
  } catch (err) {
    console.error(err);
    toast('Error saving performance data: ' + err.message);
  } finally {
    showLoad(false);
  }
}

function clearBranchPerfData() {
  if (!confirm(`Are you sure you want to clear all input fields in this form?`)) {
    return;
  }

  // Clear all form input elements in the dynamic product breakdown grid
  document.querySelectorAll('.bp-prod-actual').forEach(input => {
    input.value = '';
  });
  document.querySelectorAll('.bp-prod-target').forEach(input => {
    input.value = '';
  });
  document.querySelectorAll('.bp-prod-val-actual').forEach(input => {
    input.value = '';
  });
  document.querySelectorAll('.bp-prod-val-target').forEach(input => {
    input.value = '';
  });

  // Recalculate totals (resets unit totals, value totals, category badges to 0)
  recalculateBPFormTotals();

  toast('Form inputs cleared!');
}



function renderBranchPerformance() {
  const range = getPeriodDateRange(branchPeriod, branchDate);
  
  // Set date labels
  const dateTxt = document.getElementById('txt-branch-perf-period');
  if (dateTxt) dateTxt.textContent = range.label;

  const lblInputBranch = document.getElementById('lbl-input-branch');
  if (lblInputBranch) lblInputBranch.textContent = branchSel;

  const lblInputPeriod = document.getElementById('lbl-input-period');
  if (lblInputPeriod) lblInputPeriod.textContent = range.label;

  const yVal = branchDate.getFullYear(), mVal = String(branchDate.getMonth() + 1).padStart(2, '0');
  const monthInput = document.getElementById('inp-bp-month');
  if (monthInput) monthInput.value = `${yVal}-${mVal}`;

  // Retrieve current metrics (checking draft fallback first)
  const draftKey = `bp_draft_${branchSel}_${branchPeriod}_${range.label}`;
  const draftStr = localStorage.getItem(draftKey);
  let curr;
  if (draftStr) {
    try {
      curr = JSON.parse(draftStr);
    } catch (e) {
      console.error('Failed to parse draft performance data:', e);
    }
  }
  
  if (!curr) {
    curr = (BRANCH_PERF_DATA[branchSel] && BRANCH_PERF_DATA[branchSel][range.label]) || {
      units: '',
      targetUnits: '',
      value: '',
      targetValue: '',
      products: {},
      categories: {
        digital: { actual: 0, target: 0 },
        payment: { actual: 0, target: 0 },
        liability: { actual: 0, target: 0 },
        asset: { actual: 0, target: 0 },
        other: { actual: 0, target: 0 }
      }
    };
  }

  // Populate Input Fields with stored or default values
  document.getElementById('inp-bp-units').value = curr.units || '';
  document.getElementById('inp-bp-units-target').value = curr.targetUnits || '';
  document.getElementById('inp-bp-value').value = curr.value || '';
  document.getElementById('inp-bp-value-target').value = curr.targetValue || '';

  const cats = ['digital', 'payment', 'liability', 'asset', 'other'];

  // Dynamically Group Active Products by Category
  const grouped = { digital: [], payment: [], liability: [], asset: [], other: [] };
  PRODUCTS_DATA.forEach(p => {
    if (p.cat && grouped[p.cat]) {
      grouped[p.cat].push(p);
    }
  });

  const grid = document.getElementById('branch-perf-product-grid');
  if (grid) {
    grid.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
        ${cats.map(c => {
          const prods = grouped[c] || [];
          // Calculate category subtotal
          let catSum = 0;
          let catTarget = 0;
          prods.forEach(p => {
            const pData = curr.products?.[p.name] || {};
            const actVal = pData.actual || 0;
            const tgtVal = pData.target || 0;
            catSum += actVal;
            catTarget += tgtVal;
          });
          
          return `
            <div style="background: #f8fafc; border: 1px solid var(--bdr); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--bdr); padding-bottom: 6px; margin-bottom: 4px;">
                <span style="font-size: 11px; font-weight: 800; color: var(--navy); text-transform: uppercase;">${CAT_LBL[c] || c}</span>
                <span id="bp-cat-sum-${c}" style="background: var(--blue); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 12px;">${catSum} / ${catTarget}</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${prods.length === 0 ? `<div style="font-size: 10px; color: var(--muted); text-align: center; padding: 10px 0;">No active products</div>` : prods.map(p => {
                  const pData = curr.products?.[p.name] || {};
                  const actVal = pData.actual || '';
                  const tgtVal = pData.target || '';
                  const actValVal = pData.valActual || '';
                  const tgtValVal = pData.valTarget || '';
                  return `
                    <div style="margin-bottom: 12px; background: #fff; padding: 8px 10px; border: 1px solid var(--bdr); border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                      <span style="display: block; font-size: 10.5px; font-weight: 700; color: var(--navy); margin-bottom: 6px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${p.name}">${p.name}</span>
                      <div style="display: flex; gap: 8px; margin-bottom: ${c === 'digital' ? '6px' : '0'};">
                        <div style="flex: 1;">
                          <label style="display: block; font-size: 8px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 2px;">Actual</label>
                          <input type="number" class="bp-prod-actual" data-category="${c}" data-product="${p.name}" min="0" value="${actVal}" placeholder="0" onchange="recalculateBPFormTotals()" oninput="recalculateBPFormTotals()" style="width: 100%; height: 26px; padding: 0 6px; border: 1px solid var(--bdr); border-radius: 4px; font-size: 11px; font-weight: 600; color: var(--navy); background: #fff;">
                        </div>
                        <div style="flex: 1;">
                          <label style="display: block; font-size: 8px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 2px;">Target</label>
                          <input type="number" class="bp-prod-target" data-category="${c}" data-product="${p.name}" min="0" value="${tgtVal}" placeholder="0" onchange="recalculateBPFormTotals()" oninput="recalculateBPFormTotals()" style="width: 100%; height: 26px; padding: 0 6px; border: 1px solid var(--bdr); border-radius: 4px; font-size: 11px; font-weight: 600; color: var(--navy); background: #fff;">
                        </div>
                      </div>
                      ${c === 'digital' ? `
                      <div style="display: flex; gap: 8px;">
                        <div style="flex: 1;">
                          <label style="display: block; font-size: 8px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 2px;">Actual Value</label>
                          <input type="number" class="bp-prod-val-actual" data-category="${c}" data-product="${p.name}" min="0" value="${actValVal}" placeholder="0" onchange="recalculateBPFormTotals()" oninput="recalculateBPFormTotals()" style="width: 100%; height: 26px; padding: 0 6px; border: 1px solid var(--bdr); border-radius: 4px; font-size: 11px; font-weight: 600; color: var(--navy); background: #fff;">
                        </div>
                        <div style="flex: 1;">
                          <label style="display: block; font-size: 8px; font-weight: 800; color: var(--muted); text-transform: uppercase; margin-bottom: 2px;">Target Value</label>
                          <input type="number" class="bp-prod-val-target" data-category="${c}" data-product="${p.name}" min="0" value="${tgtValVal}" placeholder="0" onchange="recalculateBPFormTotals()" oninput="recalculateBPFormTotals()" style="width: 100%; height: 26px; padding: 0 6px; border: 1px solid var(--bdr); border-radius: 4px; font-size: 11px; font-weight: 600; color: var(--navy); background: #fff;">
                        </div>
                      </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Compute previous period shift
  const prevDate = new Date(branchDate);
  if (branchPeriod === 'weekly') {
    prevDate.setDate(prevDate.getDate() - 7);
  } else if (branchPeriod === 'monthly') {
    prevDate.setMonth(prevDate.getMonth() - 1);
  } else if (branchPeriod === 'quarterly') {
    prevDate.setMonth(prevDate.getMonth() - 3);
  } else if (branchPeriod === 'yearly') {
    prevDate.setFullYear(prevDate.getFullYear() - 1);
  }
  const prevRange = getPeriodDateRange(branchPeriod, prevDate);
  const prev = (BRANCH_PERF_DATA[branchSel] && BRANCH_PERF_DATA[branchSel][prevRange.label]) || { units: 0, value: 0 };

  // Compute Growth Percentages
  const unitsGrowth = prev.units > 0 ? ((curr.units - prev.units) / prev.units) * 100 : 0;
  const valueGrowth = prev.value > 0 ? ((curr.value - prev.value) / prev.value) * 100 : 0;

  // Render KPI cards
  const unitAch = curr.targetUnits > 0 ? Math.round((curr.units / curr.targetUnits) * 100) : 0;
  const valAch = curr.targetValue > 0 ? Math.round((curr.value / curr.targetValue) * 100) : 0;

  const renderGrowthBadge = (g) => {
    if (g > 0) return `<span style="color:var(--green);font-weight:700">▲ ${g.toFixed(1)}%</span>`;
    if (g < 0) return `<span style="color:var(--red);font-weight:700">▼ ${Math.abs(g).toFixed(1)}%</span>`;
    return `<span style="color:var(--muted);font-weight:700">—</span>`;
  };

  const kpiRow = document.getElementById('branch-kpi-row');
  if (kpiRow) {
    kpiRow.innerHTML = `
      <div class="kpi k1">
        <div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg></div>
        <div class="kpi-lbl">Accounts Sold</div>
        <div class="kpi-val">${N(Math.round(curr.units))}</div>
        <div class="kpi-sub">Target: ${N(Math.round(curr.targetUnits))} · <span style="font-weight:800;color:${unitAch >= 100 ? 'var(--green)' : 'var(--amber)'}">${unitAch}% Achieved</span></div>
      </div>
      <div class="kpi k2">
        <div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-coins"><circle cx="8" cy="8" r="6"/><circle cx="18" cy="18" r="4"/><path d="M12 18a6 6 0 0 0-6-6M12 6a6 6 0 0 1 6 6"/></svg></div>
        <div class="kpi-lbl">Estimated Sales Value</div>
        <div class="kpi-val">GH₵ ${N(Math.round(curr.value))}</div>
        <div class="kpi-sub">Target: GH₵ ${N(Math.round(curr.targetValue))} · <span style="font-weight:800;color:${valAch >= 100 ? 'var(--green)' : 'var(--amber)'}">${valAch}% Achieved</span></div>
      </div>
      <div class="kpi k3">
        <div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trending-up"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
        <div class="kpi-lbl">Accounts Growth (PoP)</div>
        <div class="kpi-val">${unitsGrowth > 0 ? '+' : ''}${unitsGrowth.toFixed(1)}%</div>
        <div class="kpi-sub">Vs. Previous Period (${renderGrowthBadge(unitsGrowth)})</div>
      </div>
      <div class="kpi k4">
        <div class="kpi-ico"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
        <div class="kpi-lbl">Value Growth (PoP)</div>
        <div class="kpi-val">${valueGrowth > 0 ? '+' : ''}${valueGrowth.toFixed(1)}%</div>
        <div class="kpi-sub">Vs. Previous Period (${renderGrowthBadge(valueGrowth)})</div>
      </div>
    `;
  }

  // ── PRODUCT-LEVEL SALES breakdown aggregation ──
  const productSales = [];
  const scale = branchPeriod === 'weekly' ? (1 / 4.33) : (branchPeriod === 'quarterly' ? 3 : (branchPeriod === 'yearly' ? 12 : 1));

  // Determine if there is manual product performance data for this branch and period
  const hasManualProducts = curr.products && Object.values(curr.products).some(v => v && (Number(v.actual) > 0 || Number(v.target) > 0));

  const matchedProducts = hasManualProducts
    ? PRODUCTS_DATA.filter(p => p.status === 'Active')
    : PRODUCTS_DATA.filter(p => matchesProductPeriod(p, range, branchPeriod));

  matchedProducts.forEach(p => {
    let qty = 0;
    let pTarget = 0;
    let pVal = 0;
    
    if (hasManualProducts) {
      qty = Number(curr.products[p.name]?.actual) || 0;
      pTarget = Number(curr.products[p.name]?.target) || 0;
      if (p.cat === 'digital') {
        pVal = (Number(curr.products[p.name]?.valActual) || 0) * scale;
      } else {
        const avgRevPerUnit = p.accounts_opened > 0 ? (p.actual_revenue_monthly / p.accounts_opened) : 0;
        pVal = (qty * avgRevPerUnit) * scale;
      }
    } else {
      const bSale = (p.branch_sales || []).find(x => x.branch === branchSel);
      qty = bSale ? bSale.qty : 0;
      // Proportional target across active selling branches
      const numBranches = (p.branch_sales && p.branch_sales.length) || 1;
      pTarget = p.target_onboarding / numBranches;
      
      const avgRevPerUnit = p.accounts_opened > 0 ? (p.actual_revenue_monthly / p.accounts_opened) : 0;
      pVal = (qty * avgRevPerUnit) * scale;
    }
    
    if (qty > 0 || pTarget > 0) {
      productSales.push({
        name: p.name,
        qty: qty * scale,
        target: pTarget * scale,
        value: pVal,
        ach: pTarget > 0 ? Math.round((qty / pTarget) * 100) : (qty > 0 ? 100 : 0)
      });
    }
  });

  // Render Product Sales Distribution Chart
  const prodLabels = productSales.map(p => p.name);
  const prodData = productSales.map(p => p.qty);

  setChart('branchCat', 'branchCatChart', 'bar',
    {
      labels: prodLabels.length ? prodLabels : ['No Product Sales'],
      datasets: [{
        data: prodData.length ? prodData : [0],
        backgroundColor: '#2563EB',
        borderRadius: 6,
        barPercentage: 0.65,
        maxBarThickness: 45
      }]
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 9 }, stepSize: 1 }, grid: { color: '#F1F5FB' } },
        x: { ticks: { font: { size: 9 } }, grid: { display: false } }
      }
    }
  );

  // Historical trend line chart
  let nPeriods = 12;
  if (branchPeriod === 'weekly') nPeriods = 8;
  if (branchPeriod === 'quarterly') nPeriods = 6;
  if (branchPeriod === 'yearly') nPeriods = 5;

  const trendLabels = [];
  const trendData = [];

  for (let i = nPeriods - 1; i >= 0; i--) {
    const tDate = new Date(branchDate);
    if (branchPeriod === 'weekly') {
      tDate.setDate(tDate.getDate() - (i * 7));
    } else if (branchPeriod === 'monthly') {
      tDate.setMonth(tDate.getMonth() - i);
    } else if (branchPeriod === 'quarterly') {
      tDate.setMonth(tDate.getMonth() - (i * 3));
    } else if (branchPeriod === 'yearly') {
      tDate.setFullYear(tDate.getFullYear() - i);
    }

    const tRange = getPeriodDateRange(branchPeriod, tDate);
    const tMetrics = (BRANCH_PERF_DATA[branchSel] && BRANCH_PERF_DATA[branchSel][tRange.label]);
    
    let tUnits = 0;
    if (tMetrics && tMetrics.units !== undefined && tMetrics.units !== null && tMetrics.units !== '') {
      tUnits = Number(tMetrics.units);
    } else {
      // Fallback: sum of product sales for this branch in this period
      const tScale = branchPeriod === 'weekly' ? (1 / 4.33) : (branchPeriod === 'quarterly' ? 3 : (branchPeriod === 'yearly' ? 12 : 1));
      const tMatched = PRODUCTS_DATA.filter(p => matchesProductPeriod(p, tRange, branchPeriod));
      tMatched.forEach(p => {
        const bSale = (p.branch_sales || []).find(x => x.branch === branchSel);
        if (bSale) {
          tUnits += bSale.qty * tScale;
        }
      });
    }

    let shortLabel = tRange.label;
    if (branchPeriod === 'monthly') {
      shortLabel = tDate.toLocaleString('en', { month: 'short' }) + ' ' + String(tDate.getFullYear()).slice(-2);
    }
    trendLabels.push(shortLabel);
    trendData.push(Math.round(tUnits));
  }

  setChart('branchTrend', 'branchTrendChart', 'line',
    {
      labels: trendLabels,
      datasets: [{
        label: 'Accounts Sold',
        data: trendData,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37,99,235,0.06)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2563EB'
      }]
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 9 } }, grid: { color: '#F1F5FB' } },
        x: { ticks: { font: { size: 9 } }, grid: { display: false } }
      }
    }
  );

  // Top Performing list (qty > target, sort descending by achievement percentage, slice to 3)
  const topProds = [...productSales]
    .filter(p => p.qty > p.target)
    .sort((a, b) => b.ach - a.ach)
    .slice(0, 3);
  const topTbody = document.getElementById('branch-top-products-tbody');
  if (topTbody) {
    if (topProds.length === 0) {
      topTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px;">No top performing products meeting this criteria</td></tr>`;
    } else {
      topTbody.innerHTML = topProds.map(p => `
        <tr style="height:36px; border-bottom:1px solid #f1f5f9;">
          <td style="font-weight:700;color:var(--navy);padding:8px 0;">${p.name}</td>
          <td style="text-align:right;font-weight:600;padding:8px 0;">${N(Math.round(p.qty))}</td>
          <td style="text-align:right;color:var(--muted);padding:8px 0;">${N(Math.round(p.target))}</td>
          <td style="text-align:right;font-weight:700;color:${p.ach >= 100 ? 'var(--green)' : 'var(--amber)'};padding:8px 0;">${p.ach}%</td>
        </tr>
      `).join('');
    }
  }

  // Underperforming list (target > qty, sort ascending by achievement rate, slice to 3)
  const bottomProds = [...productSales]
    .filter(p => p.target > p.qty)
    .sort((a, b) => a.ach - b.ach)
    .slice(0, 3);
  const bottomTbody = document.getElementById('branch-bottom-products-tbody');
  if (bottomTbody) {
    if (bottomProds.length === 0) {
      bottomTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:20px;">No underperforming products for this period</td></tr>`;
    } else {
      bottomTbody.innerHTML = bottomProds.map(p => `
        <tr style="height:36px; border-bottom:1px solid #f1f5f9;">
          <td style="font-weight:700;color:var(--navy);padding:8px 0;">${p.name}</td>
          <td style="text-align:right;font-weight:600;padding:8px 0;">${N(Math.round(p.qty))}</td>
          <td style="text-align:right;color:var(--muted);padding:8px 0;">${N(Math.round(p.target))}</td>
          <td style="text-align:right;font-weight:700;color:${p.ach >= 100 ? 'var(--green)' : 'var(--amber)'};padding:8px 0;">${p.ach}%</td>
        </tr>
      `).join('');
    }
  }

  // Cross-Branch Comparison Chart
  const branchList = BRANCHES;
  const branchLabels = branchList.map(b => b.replace(' Branch', ''));
  const branchActualUnits = branchList.map(b => {
    const data = (BRANCH_PERF_DATA[b] && BRANCH_PERF_DATA[b][range.label]) || { units: 0 };
    return data.units;
  });
  const branchTargetUnits = branchList.map(b => {
    const data = (BRANCH_PERF_DATA[b] && BRANCH_PERF_DATA[b][range.label]) || { targetUnits: 0 };
    return data.targetUnits;
  });

  setChart('branchComp', 'branchComparisonChart', 'bar',
    {
      labels: branchLabels,
      datasets: [
        {
          label: 'Actual Accounts Sold',
          data: branchActualUnits,
          backgroundColor: '#2563EB',
          borderRadius: 4,
          maxBarThickness: 15
        },
        {
          label: 'Target Accounts',
          data: branchTargetUnits,
          backgroundColor: '#CBD5E1',
          borderRadius: 4,
          maxBarThickness: 15
        }
      ]
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 10 } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 9 } }, grid: { color: '#F1F5FB' } },
        x: { ticks: { font: { size: 8 } }, grid: { display: false } }
      }
    }
  );
}
