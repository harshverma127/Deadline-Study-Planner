// app.js - Shared utilities: API helper, auth, navbar

const API_BASE = '/api';

// ─────────────────────────────────────────
// API HELPER
// Wraps fetch with auth headers and JSON parsing
// ─────────────────────────────────────────
const api = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  async request(method, endpoint, data = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (data) config.body = JSON.stringify(data);

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || 'Request failed');
    }
    return json;
  },

  get:    (endpoint)       => api.request('GET',    endpoint),
  post:   (endpoint, data) => api.request('POST',   endpoint, data),
  put:    (endpoint, data) => api.request('PUT',    endpoint, data),
  delete: (endpoint)       => api.request('DELETE', endpoint),
};

// ─────────────────────────────────────────
// AUTH GUARD
// Redirects to login if not authenticated
// ─────────────────────────────────────────
function requireAuth() {
  if (!api.isLoggedIn()) {
    window.location.href = '/';
  }
}

// ─────────────────────────────────────────
// NAVBAR SETUP
// Injects navbar and highlights current page
// ─────────────────────────────────────────
function setupNavbar() {
  const user = api.getUser();
  const currentPath = window.location.pathname;

  const navHtml = `
    <nav class="navbar">
      <a href="/dashboard" class="brand">Study<span>Planner</span></a>
      <ul class="nav-links">
        <li><a href="/dashboard" class="${currentPath === '/dashboard' ? 'active' : ''}">
          📊 Dashboard
        </a></li>
        <li><a href="/add-task" class="${currentPath === '/add-task' ? 'active' : ''}">
          ➕ Add Task
        </a></li>
        <li><a href="/schedule" class="${currentPath === '/schedule' ? 'active' : ''}">
          📅 Schedule
        </a></li>
      </ul>
      <div class="nav-right">
        <span class="nav-user">👤 ${user ? user.name : ''}</span>
        <button class="btn btn-logout" onclick="api.logout()">Logout</button>
      </div>
    </nav>
  `;

  // Insert navbar at top of body
  document.body.insertAdjacentHTML('afterbegin', navHtml);
}

// ─────────────────────────────────────────
// UTILITY: Show alert message
// ─────────────────────────────────────────
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ─────────────────────────────────────────
// UTILITY: Format date for display
// ─────────────────────────────────────────
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

// ─────────────────────────────────────────
// UTILITY: Get priority badge HTML
// ─────────────────────────────────────────
function priorityBadge(priority) {
  const labels = { 1: ['High', 'high'], 2: ['Medium', 'medium'], 3: ['Low', 'low'] };
  const [label, cls] = labels[priority] || ['Medium', 'medium'];
  return `<span class="badge badge-${cls}">${label}</span>`;
}

// ─────────────────────────────────────────
// UTILITY: Calculate days until deadline
// ─────────────────────────────────────────
function daysUntil(deadlineStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr);
  const diff = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `<span style="color:#dc2626">Overdue</span>`;
  if (diff === 0) return `<span style="color:#d97706">Due today!</span>`;
  if (diff === 1) return `<span style="color:#d97706">1 day left</span>`;
  return `${diff} days left`;
}
