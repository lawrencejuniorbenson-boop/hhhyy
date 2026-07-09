function ok() { return true; }

async function handleResponse(r) {
  if (!r.ok) {
    const txt = await r.text();
    if (r.status === 401 || r.status === 403) {
      if (txt.includes('token') || txt.includes('expired') || txt.includes('auth') || txt.includes('privileges') || txt.includes('Access token required')) {
        if (typeof logout === 'function') {
          logout();
          toast('Session expired. Please sign in again.');
        }
      }
    }
    throw new Error(r.status + ': ' + txt);
  }
  return r;
}

async function sbGet(t, q = '') {
  let url = '';
  if (t === 'products_full') {
    url = '/api/products';
  } else if (t === 'projects_full') {
    url = '/api/projects';
  } else if (t === 'dashboard_settings') {
    url = '/api/settings';
  } else if (t === 'audit_logs') {
    url = '/api/audit/logs';
  } else if (t === 'user_approvals') {
    if (q.includes('approved=eq.false')) {
      url = '/api/approvals/pending';
    } else {
      url = '/api/approvals';
    }
  } else {
    throw new Error('Unknown table get request: ' + t);
  }

  const r = await fetch(getApiUrl(url), {
    headers: {
      'Authorization': 'Bearer ' + AUTH_TOKEN
    }
  });
  await handleResponse(r);
  return r.json();
}

async function sbPost(t, d) {
  let url = '';
  let body = d;

  if (t === 'products') {
    url = '/api/products';
  } else if (t === 'projects') {
    url = '/api/projects';
  } else if (t === 'audit_logs') {
    url = '/api/audit/logs';
  } else if (t === 'user_approvals') {
    url = '/api/approvals/preapprove';
    body = { email: d.email };
  } else {
    // Return mock success for child inserts since backend handles them as a transaction
    if (['product_gaps', 'product_markets', 'product_enhancements', 'project_tasks'].includes(t)) {
      return { success: true };
    }
    throw new Error('Unknown table post request: ' + t);
  }

  const r = await fetch(getApiUrl(url), {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + AUTH_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  await handleResponse(r);
  return r.json();
}

async function sbPatch(t, q, d) {
  let url = '';
  let body = d;

  if (t === 'products') {
    // Extract ID from query e.g. ?id=eq.123
    const id = q.split('eq.')[1] || q;
    url = '/api/products/' + id;
  } else if (t === 'projects') {
    const id = q.split('eq.')[1] || q;
    url = '/api/projects/' + id;
  } else if (t === 'project_tasks') {
    const taskId = q.split('eq.')[1] || q;
    // We need project ID, but in the call changeTaskStatus, they pass projectId as first arg.
    // Wait, let's see how sbPatch is called in changeTaskStatus:
    // await sbPatch('project_tasks', '?id=eq.' + taskId, { status: newStatus });
    // So url can be `/api/projects/all/tasks/:taskId` because the server route is:
    // `/api/projects/:id/tasks/:taskId` -- wait, let's check the server route in server.js:
    // `app.patch('/api/projects/:id/tasks/:taskId', ...)`
    // So we can pass `all` or projectId if we parse it. Since the server does not actually use the :id parameter in this route
    // (it only uses :taskId to update the project_tasks table directly), passing '/api/projects/all/tasks/' + taskId works perfectly!
    url = '/api/projects/all/tasks/' + taskId;
  } else if (t === 'user_approvals') {
    const email = q.split('eq.')[1] || q;
    url = '/api/approvals/' + email;
  } else {
    throw new Error('Unknown table patch request: ' + t);
  }

  const r = await fetch(getApiUrl(url), {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + AUTH_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  await handleResponse(r);
  return r.json();
}

async function sbDel(t, q) {
  let url = '';
  if (t === 'products') {
    const id = q.split('eq.')[1] || q;
    url = '/api/products/' + id;
  } else if (t === 'projects') {
    const id = q.split('eq.')[1] || q;
    url = '/api/projects/' + id;
  } else if (t === 'user_approvals') {
    const email = q.split('eq.')[1] || q;
    url = '/api/approvals/' + email;
  } else {
    // Ignore children delete calls since backend handles them automatically on cascade
    if (['product_gaps', 'product_markets', 'product_enhancements', 'project_tasks'].includes(t)) {
      return { success: true };
    }
    throw new Error('Unknown table delete request: ' + t);
  }

  const r = await fetch(getApiUrl(url), {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + AUTH_TOKEN
    }
  });
  await handleResponse(r);
}

async function sbUpsert(t, d) {
  if (t === 'dashboard_settings') {
    const r = await fetch(getApiUrl('/api/settings'), {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + AUTH_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(d)
    });
    await handleResponse(r);
    return r.json();
  }
  throw new Error('Unknown table upsert request: ' + t);
}
