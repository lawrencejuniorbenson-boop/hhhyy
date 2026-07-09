async function loadData() {
  if (!ok()) { document.getElementById('setup-banner').classList.remove('hidden'); showLoad(false); updateHomeStats(); return; }
  document.getElementById('setup-banner').classList.add('hidden');
  showLoad(true); hideErr();
  try {
    const [pr, pj] = await Promise.all([sbGet('products_full', '?order=created_at.desc'), sbGet('projects_full', '?order=created_at.desc')]);
    PRODUCTS_DATA = pr.map(normProduct); PROJECTS_DATA = pj.map(normProject);
    try { applyDBSettings(await sbGet('dashboard_settings', '?select=key,value')); } catch (e) { }
  } catch (err) {
    console.error(err);
    showErr('Could not connect: ' + err.message + ' — Check URL, key, and RLS policies.');
    PRODUCTS_DATA = []; PROJECTS_DATA = [];
  }
  showLoad(false);
  document.getElementById('last-upd').textContent = 'Updated ' + new Date().toLocaleTimeString();
  updateHomeStats();
  if (CURRENT_PAGE === 'dash' || CURRENT_PAGE === 'branches') render();
  await checkPendingApprovals();
  startRefresh();
}

function normProduct(r) {
  const j = v => Array.isArray(v) ? v : (v ? JSON.parse(v) : []);
  let notesText = r.notes || '';
  let branchSales = [];
  if (r.notes && r.notes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(r.notes);
      notesText = parsed.notes || '';
      branchSales = parsed.branch_sales || [];
    } catch (e) {}
  }
  return {
    id: r.id, product_code: r.product_code || '', cat: r.category_id, name: r.name, offerings: r.offerings || '', gaps: j(r.gaps), markets: j(r.markets), enhancements: j(r.enhancements), start_date: r.start_date || '', end_date: r.end_date || '', progress: Number(r.progress) || 0, status: r.status || 'Active', priority: r.priority || 'Medium', owner: r.owner || '', notes: r.notes || '', notes_text: notesText, branch_sales: branchSales, accounts_opened: Number(r.accounts_opened) || 0, active_accounts: Number(r.active_accounts) || 0, inactive_accounts: Number(r.inactive_accounts) || 0, target_onboarding: Number(r.target_onboarding) || 0, is_selling: r.is_selling != null ? Boolean(r.is_selling) : true, compliance_status: r.compliance_status || 'Compliant', performing: r.performing || 'Yes', revenue_monthly: r.revenue_monthly != null ? Number(r.revenue_monthly) : null, actual_revenue_monthly: r.actual_revenue_monthly != null ? Number(r.actual_revenue_monthly) : null, risk_level: r.risk_level || 'Low', reporting_month: r.reporting_month || '', created_at: r.created_at || ''
  };
}

function normProject(r) {
  const j = v => Array.isArray(v) ? v : (v ? JSON.parse(v) : []);
  return { id: r.id, project_code: r.project_code || '', cat: r.category_id, name: r.name, description: r.description || '', start_date: r.start_date || '', end_date: r.end_date || '', progress: Number(r.progress) || 0, status: r.status || 'Pipeline', priority: r.priority || 'Medium', owner: r.owner || '', notes: r.notes || '', budget_cost: r.budget_cost != null ? Number(r.budget_cost) : 0, expected_benefit: r.expected_benefit != null ? Number(r.expected_benefit) : 0, risk_level: r.risk_level || 'Low', stage: r.stage || 'Initiation', tasks: j(r.tasks), reporting_month: r.reporting_month || '', created_at: r.created_at || '' };
}

function applyDBSettings(sets) {
  const m = {};
  (sets || []).forEach(r => m[r.key] = r.value);
  if (m.title) SETTINGS.title = m.title;
  if (m.subtitle) SETTINGS.sub = m.subtitle;
  if (m.logo_letter) SETTINGS.ll = m.logo_letter;
  ['navy', 'gold', 'blue', 'green', 'red', 'amber'].forEach(k => { if (m['color_' + k]) SETTINGS.colors[k] = m['color_' + k]; });
  
  if (m.branch_perf_data) {
    try {
      BRANCH_PERF_DATA = JSON.parse(m.branch_perf_data);
    } catch (e) {
      BRANCH_PERF_DATA = {};
    }
  } else {
    BRANCH_PERF_DATA = {};
  }
  applyDOM();
}
function startRefresh() { clearInterval(refreshTimer); refreshTimer = setInterval(loadData, 20000); }

function exportData() { const b = new Blob([JSON.stringify({ exported: new Date().toISOString(), products: PRODUCTS_DATA, projects: PROJECTS_DATA }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'productpulse_backup_' + new Date().toISOString().split('T')[0] + '.json'; a.click(); toast(' Data exported!'); }

function exportExcel() {
  if (typeof XLSX === 'undefined') { toast(' Excel library not loaded yet. Please try again.'); return; }
  try {
    const productsSheetData = PRODUCTS_DATA.map(p => ({
      'Product Code': p.product_code || '',
      'Category': CAT_LBL[p.cat] || p.cat || '',
      'Product Name': p.name || '',
      'Offerings': p.offerings || '',
      'Status': p.status || '',
      'Compliance Status': p.compliance_status || '',
      'Risk Level': p.risk_level || '',
      'Owner': p.owner || '',
      'Start Date': p.start_date || '',
      'End Date': p.end_date || '',
      'Accounts Opened': p.accounts_opened || 0,
      'Active Accounts': p.active_accounts || 0,
      'Inactive Accounts': p.inactive_accounts || 0,
      'Target Onboarding': p.target_onboarding || 0,
      'Monthly Target Revenue': p.revenue_monthly || 0,
      'Monthly Actual Revenue': p.actual_revenue_monthly || 0,
      'Performing': p.performing || '',
      'Gaps': Array.isArray(p.gaps) ? p.gaps.join(', ') : '',
      'Markets': Array.isArray(p.markets) ? p.markets.join(', ') : '',
      'Enhancements': Array.isArray(p.enhancements) ? p.enhancements.join(', ') : '',
      'Reporting Month': p.reporting_month || '',
      'Notes': p.notes || ''
    }));
    const projectsSheetData = PROJECTS_DATA.map(p => ({
      'Project Code': p.project_code || '',
      'Category': CAT_LBL[p.cat] || p.cat || '',
      'Project Name': p.name || '',
      'Description': p.description || '',
      'Status': p.status || '',
      'Priority': p.priority || '',
      'Stage': p.stage || '',
      'Progress (%)': p.progress || 0,
      'Budget Cost': p.budget_cost || 0,
      'Expected Benefit': p.expected_benefit || 0,
      'Risk Level': p.risk_level || '',
      'Owner': p.owner || '',
      'Start Date': p.start_date || '',
      'End Date': p.end_date || '',
      'Tasks': Array.isArray(p.tasks) ? p.tasks.map(t => `${t.task_text || ''} [${t.status || 'Pending'}]${t.owner ? ' - ' + t.owner : ''}`).join(', ') : '',
      'Reporting Month': p.reporting_month || '',
      'Notes': p.notes || ''
    }));
    const wb = XLSX.utils.book_new();
    const wsProducts = XLSX.utils.json_to_sheet(productsSheetData);
    const wsProjects = XLSX.utils.json_to_sheet(projectsSheetData);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');
    XLSX.utils.book_append_sheet(wb, wsProjects, 'Projects');
    XLSX.writeFile(wb, 'productpulse_export_' + new Date().toISOString().split('T')[0] + '.xlsx');
    toast(' Excel file downloaded!');
  } catch (err) {
    toast(' Excel export failed: ' + err.message);
    console.error(err);
  }
}

async function importExcel(event) {
  const f = event.target.files[0];
  if (!f) return;
  if (!ok()) { toast('Error: Configure Supabase first'); return; }
  
  const r = new FileReader();
  r.onload = async e => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      let pc = 0, pjc = 0;
      showLoad(true);
      
      // Parse Products sheet
      if (workbook.SheetNames.includes('Products')) {
        const wsProducts = workbook.Sheets['Products'];
        const productsRaw = XLSX.utils.sheet_to_json(wsProducts);
        
        for (const row of productsRaw) {
          const categoryText = (row['Category'] || '').trim().toLowerCase();
          let cat = 'digital';
          if (categoryText.includes('digital')) cat = 'digital';
          else if (categoryText.includes('liability')) cat = 'liability';
          else if (categoryText.includes('payment')) cat = 'payment';
          else if (categoryText.includes('asset')) cat = 'asset';
          else if (categoryText.includes('other')) cat = 'other';
          
          await insertProduct({
            cat: cat,
            name: row['Product Name'] || 'Unnamed Product',
            code: row['Product Code'] || '',
            offerings: row['Offerings'] || '',
            gaps: row['Gaps'] ? row['Gaps'].split(',').map(s => s.trim()).filter(Boolean) : [],
            markets: row['Markets'] ? row['Markets'].split(',').map(s => s.trim()).filter(Boolean) : [],
            enhancements: row['Enhancements'] ? row['Enhancements'].split(',').map(s => s.trim()).filter(Boolean) : [],
            start: row['Start Date'] || null,
            end: row['End Date'] || null,
            status: row['Status'] || 'Active',
            compliance_status: row['Compliance Status'] || 'Compliant',
            risk_level: row['Risk Level'] || 'Low',
            owner: row['Owner'] || '',
            accounts_opened: Number(row['Accounts Opened']) || 0,
            active_accounts: Number(row['Active Accounts']) || 0,
            inactive_accounts: Number(row['Inactive Accounts']) || 0,
            target_onboarding: Number(row['Target Onboarding']) || 0,
            revenue_monthly: Number(row['Monthly Target Revenue']) || null,
            actual_revenue_monthly: Number(row['Monthly Actual Revenue']) || null,
            performing: row['Performing'] || 'Yes',
            reporting_month: row['Reporting Month'] || null,
            notes: row['Notes'] || ''
          });
          pc++;
        }
      }
      
      // Parse Projects sheet
      if (workbook.SheetNames.includes('Projects')) {
        const wsProjects = workbook.Sheets['Projects'];
        const projectsRaw = XLSX.utils.sheet_to_json(wsProjects);
        
        for (const row of projectsRaw) {
          const categoryText = (row['Category'] || '').trim().toLowerCase();
          let cat = 'digital';
          if (categoryText.includes('digital')) cat = 'digital';
          else if (categoryText.includes('liability')) cat = 'liability';
          else if (categoryText.includes('payment')) cat = 'payment';
          else if (categoryText.includes('asset')) cat = 'asset';
          else if (categoryText.includes('other')) cat = 'other';
          
          let tasks = [];
          if (row['Tasks']) {
            const taskStrings = row['Tasks'].split(',').map(s => s.trim()).filter(Boolean);
            tasks = taskStrings.map(ts => {
              const taskRegex = /^(.*?)\s*\[(Pending|In Progress|Completed)\](?:\s*-\s*(.*))?$/i;
              const match = ts.match(taskRegex);
              if (match) {
                return {
                  task_text: match[1].trim(),
                  status: match[2].trim(),
                  owner: match[3] ? match[3].trim() : ''
                };
              }
              return {
                task_text: ts,
                status: 'Pending',
                owner: ''
              };
            });
          }
          
          await insertProjectInDB({
            cat: cat,
            name: row['Project Name'] || 'Unnamed Project',
            code: row['Project Code'] || '',
            description: row['Description'] || '',
            status: row['Status'] || 'Pipeline',
            priority: row['Priority'] || 'Medium',
            stage: row['Stage'] || 'Initiation',
            progress: Number(row['Progress (%)']) || 0,
            budget_cost: Number(row['Budget Cost']) || 0,
            expected_benefit: Number(row['Expected Benefit']) || 0,
            risk_level: row['Risk Level'] || 'Low',
            owner: row['Owner'] || '',
            start: row['Start Date'] || null,
            end: row['End Date'] || null,
            tasks: tasks,
            reporting_month: row['Reporting Month'] || null,
            notes: row['Notes'] || ''
          });
          pjc++;
        }
      }
      
      await loadData();
      toast(`Imported ${pc} products & ${pjc} projects from Excel!`);
      await logAuditAction('IMPORT_EXCEL', 'system', null, 'Bulk Excel Import', { products: pc, projects: pjc });
      
    } catch (err) {
      toast(' Excel import failed: ' + err.message);
      console.error(err);
      showLoad(false);
    }
  };
  r.readAsArrayBuffer(f);
  event.target.value = '';
}

async function importData(event) { const f = event.target.files[0]; if (!f) return; if (!ok()) { toast('Error: Configure Supabase first'); return; } const r = new FileReader(); r.onload = async e => { try { const d = JSON.parse(e.target.result); const products = d.products || (Array.isArray(d) ? d : []); const projects = d.projects || []; showLoad(true); let pc = 0, pjc = 0; for (const p of products) { await insertProduct({ cat: p.cat || p.category_id, name: p.name, code: p.product_code || '', offerings: p.offerings || '', gaps: p.gaps || [], markets: p.markets || [], enhancements: p.enhancements || [], start: p.start_date || null, end: p.end_date || null, progress: 0, status: p.status || 'Active', owner: p.owner || '', notes: p.notes || '', accounts_opened: p.accounts_opened || 0, active_accounts: p.active_accounts || 0, inactive_accounts: p.inactive_accounts || 0, target_onboarding: p.target_onboarding || 0, is_selling: true, compliance_status: p.compliance_status || 'Compliant', performing: 'Yes', revenue_monthly: p.revenue_monthly || null, actual_revenue_monthly: p.actual_revenue_monthly || null, risk_level: p.risk_level || 'Low' }); pc++; } for (const p of projects) { await insertProjectInDB({ cat: p.cat || p.category_id, name: p.name, code: p.project_code || '', description: p.description || '', start: p.start_date || null, end: p.end_date || null, progress: p.progress || 0, status: p.status || 'Pipeline', priority: p.priority || 'Medium', owner: p.owner || '', notes: p.notes || '', budget_cost: p.budget_cost || 0, expected_benefit: p.expected_benefit || 0, risk_level: p.risk_level || 'Low', stage: p.stage || 'Initiation', tasks: p.tasks || [] }); pjc++; } await loadData(); toast(` Imported ${pc} products & ${pjc} projects!`); await logAuditAction('IMPORT', 'system', null, 'Bulk Backup JSON Import', { products: pc, projects: pjc }); } catch (err) { toast(' Import failed: ' + err.message); showLoad(false); } }; r.readAsText(f); event.target.value = ''; }
async function clearAll() { if (!confirm('Delete ALL products and projects?')) return; if (!ok()) { toast('Error: Configure Supabase first'); return; } showLoad(true); try { for (const p of PRODUCTS_DATA) { await Promise.all([sbDel('product_gaps', '?product_id=eq.' + p.id), sbDel('product_markets', '?product_id=eq.' + p.id), sbDel('product_enhancements', '?product_id=eq.' + p.id)]); await sbDel('products', '?id=eq.' + p.id); } for (const p of PROJECTS_DATA) { await sbDel('project_tasks', '?project_id=eq.' + p.id); await sbDel('projects', '?id=eq.' + p.id); } await loadData(); toast('Delete Database cleared.'); await logAuditAction('CLEAR_DB', 'system', null, 'Purged entire database'); } catch (err) { toast('Error: ' + err.message); showLoad(false); } }
function saveFile() { const b = new Blob([document.documentElement.outerHTML], { type: 'text/html' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ProductProject_Dashboard_' + new Date().toISOString().split('T')[0] + '.html'; a.click(); toast('Dashboard downloaded successfully!'); }
