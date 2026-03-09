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

