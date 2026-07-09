async function logAuditAction(action, type, id, name, details = {}) {
  try {
    const email = sessionStorage.getItem('pp_user_email') || 'system';
    await sbPost('audit_logs', {
      user_email: email,
      action: action,
      target_type: type,
      target_id: id,
      target_name: name,
      changes: details
    });
  } catch (err) {
    console.error('Failed to record system audit:', err);
  }
}

async function refreshAuditTrail() {
  if (!ok()) return;
  try {
    const logs = await sbGet('audit_logs', '?order=created_at.desc&limit=100');
    const tbody = document.getElementById('audit-tbody');
    if (!tbody) return;
    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted)">No audit logs recorded yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = logs.map(l => {
      const dt = new Date(l.created_at).toLocaleString();
      const actClass = {
        'INSERT': 'b-active', 'UPDATE': 'b-review', 'DELETE': 'b-paused', 'IMPORT': 'b-completed', 'CLEAR_DB': 'b-cancelled'
      }[l.action] || 'b-pipeline';
      const typeLabel = l.target_type === 'product' ? 'Product' : l.target_type === 'project' ? 'Project' : 'System';
      let detailsHtml = '—';
      if (l.changes) {
        if (typeof l.changes === 'object') {
          detailsHtml = Object.entries(l.changes).map(([k, v]) => {
            if (v && typeof v === 'object' && 'from' in v && 'to' in v) {
              return `<div style="margin-bottom:3px"><strong>${k}</strong>: <span style="color:var(--muted)">${v.from}</span>  <span style="color:var(--navy);font-weight:700">${v.to}</span></div>`;
            }
            return `<div style="margin-bottom:3px"><strong>${k}</strong>: ${JSON.stringify(v)}</div>`;
          }).join('');
        } else {
          detailsHtml = `<div>${l.changes}</div>`;
        }
      }
      return `<tr>
        <td data-label="Time" style="font-weight:600;color:var(--navy);font-size:11px">${dt}</td>
        <td data-label="User" style="font-weight:700">${l.user_email}</td>
        <td data-label="Action"><span class="badge ${actClass}">${l.action}</span></td>
        <td data-label="Target"><span style="font-weight:600">${typeLabel}</span></td>
        <td data-label="Item" style="font-weight:700;color:var(--navy)">${l.target_name || '—'}</td>
        <td data-label="Details" style="font-size:10.5px;word-break:break-all;white-space:normal">${detailsHtml}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error('Failed to fetch audit logs:', err);
    const tbody = document.getElementById('audit-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--red)">Failed to load audit logs: ${err.message}</td></tr>`;
  }
}

async function renderApprovals() {
  const sec = document.getElementById('approval-sec');
  if (!sec) return;
  if (!IS_ADMIN) { sec.style.display = 'none'; return; }
  sec.style.display = '';
  if (!ok()) return;
  try {
    const list = await sbGet('user_approvals', '?order=created_at.asc');
    const container = document.getElementById('approvals-list');
    if (!container) return;
    if (!list.length) {
      container.innerHTML = `<div style="text-align:center;padding:12px;color:var(--muted);font-size:11px;font-style:italic">No users registered yet.</div>`;
      return;
    }
    const currentAdminEmail = sessionStorage.getItem('pp_user_email') || '';
    container.innerHTML = list.map(u => {
      let actionBtns = [];
      let badge = '';
      const isSelf = u.email.toLowerCase() === currentAdminEmail.toLowerCase();
      
      if (!u.approved) {
        badge = '<span class="badge b-pipeline" style="font-size:9px;padding:1px 5px">Pending</span>';
        actionBtns.push(`<button class="a-btn a-view" onclick="approveUser('${u.email}')">Approve</button>`);
        actionBtns.push(`<button class="a-btn a-del" onclick="rejectUser('${u.email}')" style="background:var(--red);border-color:var(--red);color:#fff">Reject</button>`);
      } else if (u.is_admin) {
        badge = '<span class="badge b-review" style="font-size:9px;padding:1px 5px;background:#F59E0B;color:#fff">Admin</span>';
        if (!isSelf) {
          actionBtns.push(`<button class="a-btn a-del" onclick="removeUser('${u.email}')" style="background:var(--red);border-color:var(--red);color:#fff">Remove</button>`);
        }
      } else {
        badge = '<span class="badge b-completed" style="font-size:9px;padding:1px 5px">Member</span>';
        actionBtns.push(`<button class="a-btn a-edit" onclick="makeAdmin('${u.email}')" style="background:var(--blue);border-color:var(--blue);font-size:10px">Make Admin</button>`);
        actionBtns.push(`<button class="a-btn a-del" onclick="removeUser('${u.email}')" style="background:var(--red);border-color:var(--red);color:#fff">Remove</button>`);
      }
      return `
        <div class="qe-item" style="display:flex;align-items:center;justify-content:space-between;padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;border:1px solid rgba(255,255,255,0.05)">
          <div style="flex:1;min-width:0;margin-right:8px">
            <div class="qe-name" style="word-break:break-all;font-size:11.5px;font-weight:600">${u.email}</div>
            <div class="qe-meta" style="font-size:9.5px;color:var(--muted);margin-top:2px">${badge} · Registered ${new Date(u.created_at).toLocaleDateString()}</div>
          </div>
          <div style="display:flex;gap:4px">${actionBtns.join('')}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load user approvals:', err);
  }
}

async function approveUser(email) {
  showLoad(true);
  try {
    await sbPatch('user_approvals', '?email=eq.' + email, { approved: true });
    toast(' User approved successfully!');
    await logAuditAction('APPROVE_USER', 'system', null, `Approved user: ${email}`);
    await renderApprovals();
    await checkPendingApprovals();
  } catch (err) {
    toast(' Approval failed: ' + err.message);
  } finally {
    showLoad(false);
  }
}

async function makeAdmin(email) {
  if (!confirm(`Are you sure you want to promote ${email} to Admin?`)) return;
  showLoad(true);
  try {
    await sbPatch('user_approvals', '?email=eq.' + email, { is_admin: true });
    toast('Promoted to Admin successfully!');
    await logAuditAction('PROMOTE_ADMIN', 'system', null, `Promoted user to Admin: ${email}`);
    await renderApprovals();
  } catch (err) {
    toast('Error: Promotion failed: ' + err.message);
  } finally {
    showLoad(false);
  }
}

async function rejectUser(email) {
  if (!confirm(`Are you sure you want to REJECT the request from ${email}?`)) return;
  showLoad(true);
  try {
    await sbDel('user_approvals', '?email=eq.' + email);
    toast('User request rejected.');
    await logAuditAction('REJECT_USER', 'system', null, `Rejected user: ${email}`);
    await renderApprovals();
    await checkPendingApprovals();
  } catch (err) {
    toast('Error: Reject failed: ' + err.message);
  } finally {
    showLoad(false);
  }
}

async function removeUser(email) {
  const currentAdminEmail = sessionStorage.getItem('pp_user_email') || '';
  if (email.toLowerCase() === currentAdminEmail.toLowerCase()) {
    toast(' You cannot remove yourself.');
    return;
  }
  if (!confirm(`Are you sure you want to REMOVE user ${email} from the platform?`)) return;
  showLoad(true);
  try {
    await sbDel('user_approvals', '?email=eq.' + email);
    toast('Delete User removed successfully.');
    await logAuditAction('REMOVE_USER', 'system', null, `Removed user: ${email}`);
    await renderApprovals();
    await checkPendingApprovals();
  } catch (err) {
    toast('Error: Remove failed: ' + err.message);
  } finally {
    showLoad(false);
  }
}

async function preApproveEmail() {
  const emailInput = document.getElementById('new-approval-email');
  if (!emailInput) return;
  const email = emailInput.value.trim().toLowerCase();
  if (!email) { toast(' Please enter a valid email address.'); return; }
  if (!email.includes('@')) { toast(' Email must contain @.'); return; }
  
  showLoad(true);
  try {
    const existing = await sbGet('user_approvals', '?email=eq.' + email);
    if (existing.length > 0) {
      if (existing[0].approved) {
        toast('ℹ️ Email is already approved.');
      } else {
        await sbPatch('user_approvals', '?email=eq.' + email, { approved: true });
        toast('Email approved successfully!');
        await logAuditAction('APPROVE_USER', 'system', null, `Pre-approved user email: ${email}`);
      }
    } else {
      await sbPost('user_approvals', { email, approved: true, is_admin: false });
      toast('Email pre-approved successfully!');
      await logAuditAction('PRE_APPROVE_USER', 'system', null, `Pre-approved user email: ${email}`);
    }
    emailInput.value = '';
    await renderApprovals();
  } catch (err) {
    toast('Error: Pre-approval failed: ' + err.message);
  } finally {
    showLoad(false);
  }
}

async function checkPendingApprovals() {
  const banner = document.getElementById('approvals-banner');
  if (!banner) return;
  if (!IS_ADMIN) {
    banner.classList.add('hidden');
    return;
  }
  try {
    const pending = await sbGet('user_approvals', '?approved=eq.false');
    if (pending.length > 0) {
      const count = pending.length;
      document.getElementById('approvals-banner-desc').textContent = `There ${count === 1 ? 'is' : 'are'} ${count} user registration request${count === 1 ? '' : 's'} waiting for your approval.`;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  } catch (err) {
    console.error('Failed to check pending approvals:', err);
    banner.classList.add('hidden');
  }
}
