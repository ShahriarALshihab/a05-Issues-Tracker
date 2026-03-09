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

function h(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function lClass(l) {
  const map = {
    'bug': 'bug',
    'enhancement': 'enhancement',
    'documentation': 'documentation',
    'help wanted': 'help-wanted',
    'good first issue': 'good-first-issue'
  };
  return map[l.toLowerCase()] || 'bug';
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}


const FALLBACK = [
  {"id":1,"title":"Fix navigation menu on mobile devices","description":"The navigation menu doesn't collapse properly on mobile devices. Need to fix the responsive behavior.","status":"open","labels":["bug","help wanted"],"priority":"high","author":"john_doe","assignee":"jane_smith","createdAt":"2024-01-15T10:30:00Z","updatedAt":"2024-01-15T10:30:00Z"},
  {"id":2,"title":"Add dark mode support","description":"Users are requesting a dark mode option. This would improve accessibility and user experience.","status":"open","labels":["enhancement","good first issue"],"priority":"medium","author":"sarah_dev","assignee":"","createdAt":"2024-01-14T14:20:00Z","updatedAt":"2024-01-16T09:15:00Z"},
  {"id":3,"title":"Update README with installation instructions","description":"The README file needs better installation instructions for new contributors.","status":"closed","labels":["documentation"],"priority":"low","author":"mike_docs","assignee":"sarah_dev","createdAt":"2024-01-10T08:00:00Z","updatedAt":"2024-01-12T16:45:00Z"},
  {"id":4,"title":"Performance issues with large datasets","description":"Application becomes slow when loading more than 1000 items. Need to implement pagination or virtual scrolling.","status":"open","labels":["bug","enhancement"],"priority":"high","author":"alex_perf","assignee":"john_doe","createdAt":"2024-01-18T11:00:00Z","updatedAt":"2024-01-18T11:00:00Z"},
  {"id":5,"title":"Add user authentication system","description":"Implement JWT-based authentication with login, registration, and password reset functionality.","status":"open","labels":["enhancement"],"priority":"high","author":"security_sam","assignee":"john_doe","createdAt":"2024-01-20T09:00:00Z","updatedAt":"2024-01-20T09:00:00Z"},
  {"id":6,"title":"Fix broken image uploads","description":"Users are unable to upload images larger than 5MB. Need to increase the file size limit or add compression.","status":"open","labels":["bug"],"priority":"medium","author":"emma_ui","assignee":"","createdAt":"2024-01-19T15:30:00Z","updatedAt":"2024-01-19T15:30:00Z"},
  {"id":7,"title":"Improve search functionality","description":"Add filters for advanced search including date ranges, status, and tags.","status":"open","labels":["enhancement","good first issue"],"priority":"low","author":"search_guru","assignee":"emma_ui","createdAt":"2024-01-17T12:00:00Z","updatedAt":"2024-01-17T12:00:00Z"},
  {"id":8,"title":"Database migration fails on production","description":"The latest migration script fails when running on production database. Works fine locally.","status":"open","labels":["bug"],"priority":"high","author":"db_admin","assignee":"alex_perf","createdAt":"2024-01-21T08:45:00Z","updatedAt":"2024-01-21T08:45:00Z"},
  {"id":9,"title":"Add export to PDF feature","description":"Users want to export reports and dashboards to PDF format for sharing and printing.","status":"open","labels":["enhancement"],"priority":"medium","author":"feature_fred","assignee":"","createdAt":"2024-01-16T10:15:00Z","updatedAt":"2024-01-16T10:15:00Z"},
  {"id":10,"title":"Update dependencies to latest versions","description":"Several npm packages are outdated and have security vulnerabilities. Need to update and test.","status":"closed","labels":["documentation"],"priority":"medium","author":"security_sam","assignee":"john_doe","createdAt":"2024-01-05T14:00:00Z","updatedAt":"2024-01-15T11:30:00Z"},
  {"id":11,"title":"Create API documentation","description":"Generate comprehensive API documentation using Swagger or similar tool.","status":"open","labels":["documentation","help wanted"],"priority":"medium","author":"mike_docs","assignee":"","createdAt":"2024-01-22T09:30:00Z","updatedAt":"2024-01-22T09:30:00Z"},
  {"id":12,"title":"Footer not displaying correctly on Safari","description":"The footer overlaps with content on Safari browser. CSS issue with flexbox layout.","status":"open","labels":["bug"],"priority":"low","author":"browser_bob","assignee":"emma_ui","createdAt":"2024-01-18T16:20:00Z","updatedAt":"2024-01-18T16:20:00Z"},
  {"id":13,"title":"Implement real-time notifications","description":"Add WebSocket support for real-time notifications when issues are updated or commented on.","status":"open","labels":["enhancement"],"priority":"high","author":"realtime_ron","assignee":"alex_perf","createdAt":"2024-01-23T10:00:00Z","updatedAt":"2024-01-23T10:00:00Z"},
  {"id":14,"title":"Add unit tests for authentication module","description":"Authentication module lacks proper test coverage. Need to add Jest unit tests.","status":"open","labels":["documentation","good first issue"],"priority":"medium","author":"test_tina","assignee":"","createdAt":"2024-01-12T11:45:00Z","updatedAt":"2024-01-12T11:45:00Z"},
  {"id":15,"title":"Memory leak in dashboard component","description":"Dashboard component causes memory leak after prolonged use. Need to investigate event listeners and cleanup.","status":"open","labels":["bug"],"priority":"high","author":"performance_pete","assignee":"john_doe","createdAt":"2024-01-24T13:15:00Z","updatedAt":"2024-01-24T13:15:00Z"},
  {"id":16,"title":"Add multi-language support","description":"Internationalize the application to support multiple languages including Spanish, French, and German.","status":"open","labels":["enhancement"],"priority":"low","author":"i18n_ivan","assignee":"","createdAt":"2024-01-11T09:00:00Z","updatedAt":"2024-01-11T09:00:00Z"},
  {"id":17,"title":"Email notifications not being sent","description":"Users report not receiving email notifications. SMTP configuration might be incorrect.","status":"open","labels":["bug"],"priority":"high","author":"mail_mary","assignee":"security_sam","createdAt":"2024-01-25T08:30:00Z","updatedAt":"2024-01-25T08:30:00Z"},
  {"id":18,"title":"Refactor user settings page","description":"User settings page code is messy and hard to maintain. Needs refactoring with better component structure.","status":"closed","labels":["enhancement"],"priority":"medium","author":"clean_code_carl","assignee":"emma_ui","createdAt":"2024-01-08T14:30:00Z","updatedAt":"2024-01-20T10:15:00Z"},
  {"id":19,"title":"Add CSV export functionality","description":"Allow users to export data tables to CSV format for analysis in spreadsheet applications.","status":"open","labels":["enhancement","good first issue"],"priority":"low","author":"data_dan","assignee":"","createdAt":"2024-01-26T11:00:00Z","updatedAt":"2024-01-26T11:00:00Z"},
  {"id":20,"title":"Login page shows error on slow connections","description":"Login page displays timeout error when internet connection is slow. Need better error handling.","status":"open","labels":["bug"],"priority":"medium","author":"network_nancy","assignee":"security_sam","createdAt":"2024-01-13T15:45:00Z","updatedAt":"2024-01-13T15:45:00Z"},
  {"id":21,"title":"Implement two-factor authentication","description":"Add 2FA support using TOTP for enhanced security on user accounts.","status":"open","labels":["enhancement"],"priority":"high","author":"security_sam","assignee":"","createdAt":"2024-01-27T09:15:00Z","updatedAt":"2024-01-27T09:15:00Z"},
  {"id":22,"title":"Fix chart rendering issues","description":"Charts don't render correctly when window is resized. Need to add responsive chart logic.","status":"open","labels":["bug"],"priority":"medium","author":"chart_charlie","assignee":"emma_ui","createdAt":"2024-01-14T10:30:00Z","updatedAt":"2024-01-14T10:30:00Z"},
  {"id":23,"title":"Add drag and drop file upload","description":"Implement drag and drop functionality for file uploads to improve user experience.","status":"open","labels":["enhancement","good first issue"],"priority":"low","author":"ux_uma","assignee":"","createdAt":"2024-01-28T12:00:00Z","updatedAt":"2024-01-28T12:00:00Z"},
  {"id":24,"title":"API rate limiting not working","description":"Rate limiting middleware is not properly throttling API requests. Need to debug and fix.","status":"open","labels":["bug"],"priority":"high","author":"api_adam","assignee":"alex_perf","createdAt":"2024-01-29T08:00:00Z","updatedAt":"2024-01-29T08:00:00Z"},
  {"id":25,"title":"Create onboarding tutorial","description":"New users need a guided tutorial to understand key features. Create interactive onboarding flow.","status":"open","labels":["documentation","enhancement"],"priority":"medium","author":"tutorial_tom","assignee":"mike_docs","createdAt":"2024-01-15T13:30:00Z","updatedAt":"2024-01-15T13:30:00Z"},
  {"id":26,"title":"Session timeout too aggressive","description":"Users are being logged out too frequently. Need to adjust session timeout settings.","status":"closed","labels":["bug"],"priority":"medium","author":"session_steve","assignee":"security_sam","createdAt":"2024-01-09T11:00:00Z","updatedAt":"2024-01-22T14:30:00Z"},
  {"id":27,"title":"Add keyboard shortcuts","description":"Implement keyboard shortcuts for common actions to improve productivity for power users.","status":"open","labels":["enhancement"],"priority":"low","author":"shortcuts_shawn","assignee":"","createdAt":"2024-01-30T10:15:00Z","updatedAt":"2024-01-30T10:15:00Z"},
  {"id":28,"title":"Profile picture upload fails","description":"Users cannot upload profile pictures. Getting 413 error (payload too large).","status":"open","labels":["bug"],"priority":"medium","author":"avatar_alice","assignee":"john_doe","createdAt":"2024-01-16T14:45:00Z","updatedAt":"2024-01-16T14:45:00Z"},
  {"id":29,"title":"Implement caching strategy","description":"Add Redis caching for frequently accessed data to improve performance.","status":"open","labels":["enhancement"],"priority":"high","author":"cache_chris","assignee":"alex_perf","createdAt":"2024-01-31T09:30:00Z","updatedAt":"2024-01-31T09:30:00Z"},
  {"id":30,"title":"Fix timezone display issues","description":"Timestamps are showing in UTC instead of user's local timezone. Need to add timezone conversion.","status":"open","labels":["bug","good first issue"],"priority":"low","author":"time_tony","assignee":"","createdAt":"2024-01-17T16:00:00Z","updatedAt":"2024-01-17T16:00:00Z"},
  {"id":31,"title":"Add webhook support","description":"Implement webhooks to allow external services to receive notifications on events.","status":"open","labels":["enhancement"],"priority":"medium","author":"webhook_wendy","assignee":"","createdAt":"2024-02-01T11:20:00Z","updatedAt":"2024-02-01T11:20:00Z"},
  {"id":32,"title":"Accessibility issues with form labels","description":"Screen readers cannot properly identify form fields. Need to add proper ARIA labels.","status":"open","labels":["bug","help wanted"],"priority":"medium","author":"a11y_andy","assignee":"emma_ui","createdAt":"2024-01-19T09:45:00Z","updatedAt":"2024-01-19T09:45:00Z"},
  {"id":33,"title":"Add bulk operations support","description":"Allow users to perform bulk actions like delete, update status on multiple items at once.","status":"open","labels":["enhancement"],"priority":"low","author":"bulk_barry","assignee":"","createdAt":"2024-02-02T10:00:00Z","updatedAt":"2024-02-02T10:00:00Z"},
  {"id":34,"title":"Broken links in documentation","description":"Several links in the documentation are broken or pointing to outdated pages.","status":"closed","labels":["documentation"],"priority":"low","author":"link_larry","assignee":"mike_docs","createdAt":"2024-01-07T13:15:00Z","updatedAt":"2024-01-18T15:00:00Z"},
  {"id":35,"title":"Add comment system for issues","description":"Implement a commenting system so users can discuss and collaborate on issues.","status":"open","labels":["enhancement"],"priority":"high","author":"comment_cathy","assignee":"john_doe","createdAt":"2024-02-03T08:30:00Z","updatedAt":"2024-02-03T08:30:00Z"},
  {"id":36,"title":"Password reset email not received","description":"Users are not receiving password reset emails. Email service might be down or misconfigured.","status":"open","labels":["bug"],"priority":"high","author":"reset_rita","assignee":"security_sam","createdAt":"2024-01-20T15:30:00Z","updatedAt":"2024-01-20T15:30:00Z"},
  {"id":37,"title":"Improve mobile responsiveness","description":"Several pages are not mobile-friendly. Need to improve responsive design across the application.","status":"open","labels":["bug","help wanted"],"priority":"medium","author":"mobile_mike","assignee":"emma_ui","createdAt":"2024-02-04T12:45:00Z","updatedAt":"2024-02-04T12:45:00Z"},
  {"id":38,"title":"Add version control for documents","description":"Implement version history so users can track changes and revert to previous versions.","status":"open","labels":["enhancement"],"priority":"medium","author":"version_vince","assignee":"","createdAt":"2024-01-21T10:15:00Z","updatedAt":"2024-01-21T10:15:00Z"},
  {"id":39,"title":"Fix sorting on data tables","description":"Column sorting doesn't work correctly for numeric and date columns.","status":"open","labels":["bug","good first issue"],"priority":"low","author":"sort_sally","assignee":"","createdAt":"2024-02-05T09:00:00Z","updatedAt":"2024-02-05T09:00:00Z"},
  {"id":40,"title":"Implement activity logging","description":"Add comprehensive activity logs for audit trail and debugging purposes.","status":"open","labels":["enhancement"],"priority":"medium","author":"logger_leo","assignee":"alex_perf","createdAt":"2024-01-22T14:00:00Z","updatedAt":"2024-01-22T14:00:00Z"},
  {"id":41,"title":"Dashboard widgets not loading","description":"Some dashboard widgets fail to load intermittently. Getting CORS errors in console.","status":"open","labels":["bug"],"priority":"high","author":"widget_will","assignee":"john_doe","createdAt":"2024-02-06T11:30:00Z","updatedAt":"2024-02-06T11:30:00Z"},
  {"id":42,"title":"Add role-based access control","description":"Implement RBAC system with different permission levels for users, moderators, and admins.","status":"open","labels":["enhancement"],"priority":"high","author":"rbac_rachel","assignee":"security_sam","createdAt":"2024-01-23T08:45:00Z","updatedAt":"2024-01-23T08:45:00Z"},
  {"id":43,"title":"Create docker deployment guide","description":"Write comprehensive guide for deploying the application using Docker and docker-compose.","status":"closed","labels":["documentation"],"priority":"medium","author":"docker_dave","assignee":"mike_docs","createdAt":"2024-01-06T12:00:00Z","updatedAt":"2024-01-24T16:30:00Z"},
  {"id":44,"title":"Add favorites/bookmarks feature","description":"Allow users to bookmark frequently accessed pages or items for quick access.","status":"open","labels":["enhancement","good first issue"],"priority":"low","author":"fav_frank","assignee":"","createdAt":"2024-02-07T10:30:00Z","updatedAt":"2024-02-07T10:30:00Z"},
  {"id":45,"title":"Search results pagination broken","description":"Pagination controls don't work on search results page. Only first page is accessible.","status":"open","labels":["bug"],"priority":"medium","author":"page_paul","assignee":"emma_ui","createdAt":"2024-01-24T13:45:00Z","updatedAt":"2024-01-24T13:45:00Z"},
  {"id":46,"title":"Implement data backup system","description":"Set up automated daily backups of database with retention policy and restore procedures.","status":"open","labels":["enhancement"],"priority":"high","author":"backup_bruce","assignee":"db_admin","createdAt":"2024-02-08T09:15:00Z","updatedAt":"2024-02-08T09:15:00Z"},
  {"id":47,"title":"Add code syntax highlighting","description":"Implement syntax highlighting for code blocks in comments and descriptions.","status":"open","labels":["enhancement","good first issue"],"priority":"low","author":"syntax_simon","assignee":"","createdAt":"2024-01-25T11:00:00Z","updatedAt":"2024-01-25T11:00:00Z"},
  {"id":48,"title":"Browser console shows warnings","description":"Multiple deprecation warnings appearing in browser console. Need to update deprecated code.","status":"open","labels":["bug"],"priority":"low","author":"console_carol","assignee":"","createdAt":"2024-02-09T14:20:00Z","updatedAt":"2024-02-09T14:20:00Z"},
  {"id":49,"title":"Add Google Analytics integration","description":"Integrate Google Analytics to track user behavior and improve product decisions.","status":"open","labels":["enhancement"],"priority":"medium","author":"analytics_anna","assignee":"john_doe","createdAt":"2024-01-26T10:45:00Z","updatedAt":"2024-01-26T10:45:00Z"},
  {"id":50,"title":"Create automated testing pipeline","description":"Set up CI/CD pipeline with automated tests running on every commit and pull request.","status":"open","labels":["enhancement","help wanted"],"priority":"high","author":"ci_cd_cindy","assignee":"test_tina","createdAt":"2024-02-10T08:00:00Z","updatedAt":"2024-02-10T08:00:00Z"}
];


