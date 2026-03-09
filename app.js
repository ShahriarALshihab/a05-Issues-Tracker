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

