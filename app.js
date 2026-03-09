const API = 'https://phi-lab-server.vercel.app/api/v1/lab';
let allIssues = [];
let currentTab = 'all';
let searchTimeout = null;

function handleLogin() {
  const u = document.getElementById('username-input').value.trim();
  const p = document.getElementById('password-input').value.trim();
  const err = document.getElementById('login-error');
  if (u === 'admin' && p === 'admin123') {
    err.style.display = 'none';
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    loadIssues();
  } else {
    err.style.display = 'block';
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('login-page').style.display !== 'none') handleLogin();
  if (e.key === 'Escape') closeModalDirect();
});

async function loadIssues() {
  showSpinner();
  try {
    const res = await fetch(`${API}/issues`);
    const data = await res.json();
    allIssues = data.data || data;
  } catch {
    allIssues = FALLBACK;
  }
  renderIssues();
}

function showSpinner() {
  document.getElementById('issues-grid').innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  document.getElementById('issues-count').textContent = 'Loading...';
}

function getFiltered(tab, q) {
  let list = allIssues;
  if (tab === 'open') list = list.filter(i => i.status === 'open');
  else if (tab === 'closed') list = list.filter(i => i.status === 'closed');
  if (q) {
    const lq = q.toLowerCase();
    list = list.filter(i =>
      i.title.toLowerCase().includes(lq) ||
      i.description.toLowerCase().includes(lq) ||
      (i.labels || []).some(l => l.toLowerCase().includes(lq)) ||
      (i.author || '').toLowerCase().includes(lq) ||
      (i.assignee || '').toLowerCase().includes(lq) ||
      (i.priority || '').toLowerCase().includes(lq) ||
      (i.status || '').toLowerCase().includes(lq) ||
      String(i.id) === lq.replace('#', '')
    );
  }
  return list;
}

function buildCard(issue, idx) {
  const openSVG = `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#3fb950" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" fill="#3fb950"/></svg>`;
  const closedSVG = `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#bc8cff" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="#bc8cff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const labels = (issue.labels || []).map(l => `<span class="label-tag label-${lClass(l)}">${h(l)}</span>`).join('');
  return `<div class="issue-card ${issue.status}" onclick="openIssue(${issue.id})" style="animation-delay:${Math.min(idx * 0.04, 0.6)}s">
    <div class="card-top">
      <div class="status-icon">${issue.status === 'open' ? openSVG : closedSVG}</div>
      <span class="priority-badge ${issue.priority}">${issue.priority}</span>
    </div>
    <div class="card-title">${h(issue.title)}</div>
    <div class="card-desc">${h(issue.description)}</div>
    <div class="card-labels">${labels}</div>
    <div class="card-meta">
      <div class="card-meta-left">
        <span class="card-number">#${issue.id} by ${h(issue.author)}</span>
        <span class="card-date">${fmtDate(issue.createdAt)}</span>
      </div>
    </div>
  </div>`;
}

function renderIssues(q = '') {
  const issues = getFiltered(currentTab, q);
  const grid = document.getElementById('issues-grid');
  document.getElementById('issues-count').textContent = `${issues.length} Issue${issues.length !== 1 ? 's' : ''}`;
  if (!issues.length) {
    grid.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <h3>No issues found</h3>
      <p>${q ? 'Try a different search term' : 'No issues in this category'}</p>
    </div>`;
  } else {
    grid.innerHTML = issues.map(buildCard).join('');
  }
}

function switchTab(tab, btn) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderIssues(document.getElementById('search-input').value);
}

function handleSearch(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const trimmed = val.trim();
    if (!trimmed) {
      renderIssues('');
      return;
    }

    
    if (trimmed.length >= 2) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API}/issues/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        clearTimeout(timeout);
        const data = await res.json();
        const results = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
        if (results.length > 0) {
          const filtered = currentTab === 'all' ? results : results.filter(i => i.status === currentTab);
          renderCards(filtered, trimmed);
          return;
        }
      } catch {  }
    }

   
    renderIssues(trimmed);
  }, 300);
}

function renderCards(issues, q = '') {
  const grid = document.getElementById('issues-grid');
  document.getElementById('issues-count').textContent = `${issues.length} Issue${issues.length !== 1 ? 's' : ''}`;
  if (!issues.length) {
    grid.innerHTML = `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <h3>No results for "${h(q)}"</h3>
      <p>Try searching by title, label, author, priority or issue #</p>
    </div>`;
  } else {
    grid.innerHTML = issues.map(buildCard).join('');
  }
}

async function openIssue(id) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  overlay.style.display = 'flex';
  body.innerHTML = `<div class="spinner-wrap" style="padding:2rem"><div class="spinner"></div></div>`;

  let issue = allIssues.find(i => i.id === id);
  if (!issue) {
    try {
      const r = await fetch(`${API}/issue/${id}`);
      const d = await r.json();
      issue = d.data || d;
    } catch {}
  }

  if (!issue) {
    body.innerHTML = `<p style="color:var(--red)">Failed to load issue.</p>`;
    return;
  }

  const openSVG = `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>`;
  const closedSVG = `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  body.innerHTML = `
    <div class="modal-title">${h(issue.title)}</div>
    <div class="modal-status-row">
      <span class="status-badge ${issue.status}">
        ${issue.status === 'open' ? openSVG : closedSVG}
        ${issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
      </span>
      <span class="modal-meta-text">Opened by ${h(issue.author)} • ${fmtDate(issue.createdAt)}</span>
    </div>
    <div class="modal-labels">${(issue.labels || []).map(l => `<span class="label-tag label-${lClass(l)}">${h(l)}</span>`).join('')}</div>
    <div class="modal-desc">${h(issue.description)}</div>
    <div class="modal-details">
      <div class="detail-item">
        <span class="detail-label">Assignee</span>
        <span class="detail-value ${!issue.assignee ? 'empty' : ''}">${issue.assignee || 'Unassigned'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Priority</span>
        <span class="priority-badge ${issue.priority}" style="display:inline-block">${issue.priority}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Author</span>
        <span class="detail-value">${h(issue.author)}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Updated</span>
        <span class="detail-value">${fmtDate(issue.updatedAt)}</span>
      </div>
    </div>
    <div class="modal-footer">
      <button class="close-btn" onclick="closeModalDirect()">Close</button>
    </div>`;
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModalDirect();
}

function closeModalDirect() {
  document.getElementById('modal-overlay').style.display = 'none';
}