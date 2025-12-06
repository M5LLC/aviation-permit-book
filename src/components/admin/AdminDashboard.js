/**
 * Admin Dashboard Component
 * User management and organization settings
 */

import { getCurrentUser } from '../../services/auth.js';
import {
  subscribeToOrganizationUsers,
  subscribeToPendingUsers,
  updateUserRole,
  updateUserStatus,
  approvePendingUser,
  denyPendingUser,
  createInvitation,
  getOrganization,
} from '../../services/firestore.js';

// Component state
let currentUser = null;
let organizationUsers = [];
let pendingUsers = [];
let organization = null;
let unsubscribeUsers = null;
let unsubscribePending = null;
let activeSection = 'users';

/**
 * Render the Admin Dashboard
 */
export function renderAdminDashboard() {
  currentUser = getCurrentUser();

  if (!currentUser || currentUser.role !== 'admin') {
    return `
      <div class="card">
        <div class="card-body text-center">
          <h2>Access Denied</h2>
          <p class="text-muted mt-2">You must be an admin to access this page.</p>
        </div>
      </div>
    `;
  }

  setTimeout(initAdminDashboard, 100);

  return `
    <div class="admin-dashboard">
      <div class="admin-header">
        <h2>Admin Dashboard</h2>
        <p class="text-muted">Manage users and organization settings</p>
      </div>

      <div class="admin-layout">
        <nav class="admin-nav">
          <button class="admin-nav-btn active" data-section="users">
            <span class="nav-icon">👥</span>
            <span class="nav-label">Users</span>
            <span id="pending-badge" class="badge badge-danger" style="display: none;">0</span>
          </button>
          <button class="admin-nav-btn" data-section="invitations">
            <span class="nav-icon">✉️</span>
            <span class="nav-label">Invitations</span>
          </button>
          <button class="admin-nav-btn" data-section="organization">
            <span class="nav-icon">🏢</span>
            <span class="nav-label">Organization</span>
          </button>
        </nav>

        <div class="admin-content">
          <div id="admin-section-content">
            <div class="loading">Loading...</div>
          </div>
        </div>
      </div>
    </div>
    ${renderAdminStyles()}
  `;
}

/**
 * Initialize the admin dashboard
 */
async function initAdminDashboard() {
  const orgId = currentUser.organizationId || 'default-org';

  // Load organization
  try {
    organization = await getOrganization(orgId);
  } catch (error) {
    console.error('Error loading organization:', error);
  }

  // Subscribe to users
  unsubscribeUsers = subscribeToOrganizationUsers(orgId, (users) => {
    organizationUsers = users;
    if (activeSection === 'users') {
      renderUsersSection();
    }
  });

  // Subscribe to pending users
  unsubscribePending = subscribeToPendingUsers(orgId, (pending) => {
    pendingUsers = pending;
    updatePendingBadge();
    if (activeSection === 'users') {
      renderUsersSection();
    }
  });

  // Initial render
  renderUsersSection();

  // Attach nav handlers
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      switchSection(section);
    });
  });
}

/**
 * Switch admin section
 */
function switchSection(section) {
  activeSection = section;

  // Update nav buttons
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });

  // Render section content
  switch (section) {
    case 'users':
      renderUsersSection();
      break;
    case 'invitations':
      renderInvitationsSection();
      break;
    case 'organization':
      renderOrganizationSection();
      break;
  }
}

/**
 * Update pending badge count
 */
function updatePendingBadge() {
  const badge = document.getElementById('pending-badge');
  if (badge) {
    if (pendingUsers.length > 0) {
      badge.textContent = pendingUsers.length;
      badge.style.display = 'inline';
    } else {
      badge.style.display = 'none';
    }
  }
}

/**
 * Render users section
 */
function renderUsersSection() {
  const contentEl = document.getElementById('admin-section-content');
  if (!contentEl) return;

  contentEl.innerHTML = `
    ${pendingUsers.length > 0 ? `
      <div class="pending-section">
        <h3 class="section-title">
          <span class="section-icon">⏳</span>
          Pending Approvals
          <span class="badge badge-warning">${pendingUsers.length}</span>
        </h3>
        <div class="pending-list">
          ${pendingUsers.map(user => renderPendingUserCard(user)).join('')}
        </div>
      </div>
    ` : ''}

    <div class="users-section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="section-icon">👥</span>
          Organization Members
        </h3>
        <span class="user-count">${organizationUsers.length} users</span>
      </div>
      <div class="users-table-container">
        <table class="table users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${organizationUsers.map(user => renderUserRow(user)).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  attachUserActionHandlers();
}

/**
 * Render pending user card
 */
function renderPendingUserCard(user) {
  const requestedAt = user.requestedAt?.toDate?.() || new Date();

  return `
    <div class="pending-card" data-id="${user.id}">
      <div class="pending-info">
        <div class="pending-email">${user.email}</div>
        <div class="pending-name">${user.displayName || 'No name provided'}</div>
        <div class="pending-date">Requested ${formatTimeAgo(requestedAt)}</div>
      </div>
      <div class="pending-actions">
        <button class="btn btn-success btn-sm approve-btn" data-id="${user.id}">
          Approve
        </button>
        <button class="btn btn-outline btn-sm deny-btn" data-id="${user.id}">
          Deny
        </button>
      </div>
    </div>
  `;
}

/**
 * Render user table row
 */
function renderUserRow(user) {
  const isCurrentUser = user.id === currentUser?.uid;
  const lastLogin = user.lastLogin?.toDate?.();

  return `
    <tr class="${isCurrentUser ? 'current-user' : ''} ${user.status === 'disabled' ? 'disabled-user' : ''}">
      <td>
        <div class="user-cell">
          <div class="user-avatar">${getInitials(user.displayName || user.email)}</div>
          <div class="user-details">
            <div class="user-name">${user.displayName || 'Unknown'}</div>
            <div class="user-email">${user.email}</div>
          </div>
        </div>
      </td>
      <td>
        <select class="select select-sm role-select" data-user-id="${user.id}"
                ${isCurrentUser ? 'disabled' : ''}>
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>
        <span class="status-badge status-${user.status}">
          ${user.status || 'unknown'}
        </span>
      </td>
      <td>
        ${lastLogin ? formatTimeAgo(lastLogin) : 'Never'}
      </td>
      <td>
        ${isCurrentUser ? `
          <span class="text-muted text-sm">Current user</span>
        ` : `
          ${user.status === 'approved' ? `
            <button class="btn btn-outline btn-sm disable-btn" data-user-id="${user.id}">
              Disable
            </button>
          ` : `
            <button class="btn btn-outline btn-sm enable-btn" data-user-id="${user.id}">
              Enable
            </button>
          `}
        `}
      </td>
    </tr>
  `;
}

/**
 * Render invitations section
 */
function renderInvitationsSection() {
  const contentEl = document.getElementById('admin-section-content');
  if (!contentEl) return;

  contentEl.innerHTML = `
    <div class="invite-section">
      <h3 class="section-title">
        <span class="section-icon">✉️</span>
        Invite New User
      </h3>
      <div class="invite-form card">
        <div class="card-body">
          <div class="form-group">
            <label for="invite-email">Email Address</label>
            <input type="email" id="invite-email" class="input"
                   placeholder="user@example.com">
          </div>
          <div class="form-group">
            <label for="invite-name">Display Name (optional)</label>
            <input type="text" id="invite-name" class="input"
                   placeholder="John Doe">
          </div>
          <button id="send-invite-btn" class="btn btn-primary">
            Send Invitation
          </button>
        </div>
      </div>

      <div id="invite-result" class="invite-result" style="display: none;">
      </div>
    </div>

    <div class="info-box mt-3">
      <h4>How Invitations Work</h4>
      <ul>
        <li>Invitations expire after 7 days</li>
        <li>Invited users are automatically approved upon signup</li>
        <li>Share the invitation link with the user</li>
      </ul>
    </div>
  `;

  // Attach invite handler
  const sendBtn = document.getElementById('send-invite-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', handleSendInvite);
  }
}

/**
 * Handle send invitation
 */
async function handleSendInvite() {
  const emailInput = document.getElementById('invite-email');
  const nameInput = document.getElementById('invite-name');
  const resultEl = document.getElementById('invite-result');

  const email = emailInput.value.trim();
  const displayName = nameInput.value.trim();

  if (!email) {
    alert('Please enter an email address.');
    return;
  }

  try {
    const { id, token } = await createInvitation({
      email,
      displayName,
      organizationId: currentUser.organizationId || 'default-org',
      invitedBy: currentUser.uid,
    });

    const inviteUrl = `${window.location.origin}/signup?invite=${token}`;

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="alert alert-success">
        <strong>Invitation Created!</strong>
        <p>Share this link with ${email}:</p>
        <div class="invite-link-container">
          <input type="text" class="input invite-link" value="${inviteUrl}" readonly>
          <button class="btn btn-outline copy-link-btn">Copy</button>
        </div>
      </div>
    `;

    // Copy button handler
    resultEl.querySelector('.copy-link-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(inviteUrl);
      resultEl.querySelector('.copy-link-btn').textContent = 'Copied!';
      setTimeout(() => {
        resultEl.querySelector('.copy-link-btn').textContent = 'Copy';
      }, 2000);
    });

    // Clear form
    emailInput.value = '';
    nameInput.value = '';

  } catch (error) {
    console.error('Error creating invitation:', error);
    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="alert alert-danger">
        Error creating invitation. Please try again.
      </div>
    `;
  }
}

/**
 * Render organization section
 */
function renderOrganizationSection() {
  const contentEl = document.getElementById('admin-section-content');
  if (!contentEl) return;

  contentEl.innerHTML = `
    <div class="org-section">
      <h3 class="section-title">
        <span class="section-icon">🏢</span>
        Organization Settings
      </h3>

      <div class="card">
        <div class="card-body">
          <div class="form-group">
            <label>Organization Name</label>
            <input type="text" class="input" value="${organization?.name || 'Default Organization'}" disabled>
          </div>
          <div class="form-group">
            <label>Organization ID</label>
            <input type="text" class="input" value="${currentUser.organizationId || 'default-org'}" disabled>
          </div>
        </div>
      </div>

      <div class="info-box mt-3">
        <h4>Organization Management</h4>
        <p class="text-muted">
          Organization settings are managed at the system level.
          Contact support to update organization details or branding.
        </p>
      </div>
    </div>
  `;
}

/**
 * Attach user action handlers
 */
function attachUserActionHandlers() {
  // Approve pending user
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const requestId = btn.dataset.id;
      const pendingUser = pendingUsers.find(u => u.id === requestId);
      if (!pendingUser) return;

      try {
        await approvePendingUser(requestId, {
          uid: pendingUser.uid || requestId,
          email: pendingUser.email,
          displayName: pendingUser.displayName,
          organizationId: pendingUser.organizationId,
        });
      } catch (error) {
        console.error('Error approving user:', error);
        alert('Error approving user. Please try again.');
      }
    });
  });

  // Deny pending user
  document.querySelectorAll('.deny-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const requestId = btn.dataset.id;
      if (!confirm('Are you sure you want to deny this request?')) return;

      try {
        await denyPendingUser(requestId);
      } catch (error) {
        console.error('Error denying user:', error);
        alert('Error denying user. Please try again.');
      }
    });
  });

  // Role change
  document.querySelectorAll('.role-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const userId = select.dataset.userId;
      const newRole = e.target.value;

      if (!confirm(`Change user role to ${newRole}?`)) {
        // Revert selection
        const user = organizationUsers.find(u => u.id === userId);
        e.target.value = user?.role || 'user';
        return;
      }

      try {
        await updateUserRole(userId, newRole);
      } catch (error) {
        console.error('Error updating role:', error);
        alert('Error updating role. Please try again.');
      }
    });
  });

  // Disable user
  document.querySelectorAll('.disable-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.userId;
      if (!confirm('Are you sure you want to disable this user?')) return;

      try {
        await updateUserStatus(userId, 'disabled');
      } catch (error) {
        console.error('Error disabling user:', error);
        alert('Error disabling user. Please try again.');
      }
    });
  });

  // Enable user
  document.querySelectorAll('.enable-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.userId;

      try {
        await updateUserStatus(userId, 'approved');
      } catch (error) {
        console.error('Error enabling user:', error);
        alert('Error enabling user. Please try again.');
      }
    });
  });
}

/**
 * Get initials from name
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return date.toLocaleDateString();
  }
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

/**
 * Cleanup subscriptions
 */
export function cleanupAdminDashboard() {
  if (unsubscribeUsers) unsubscribeUsers();
  if (unsubscribePending) unsubscribePending();
}

/**
 * Render admin dashboard styles
 */
function renderAdminStyles() {
  return `
    <style>
      .admin-dashboard {
        max-width: 1100px;
        margin: 0 auto;
      }

      .admin-header {
        margin-bottom: var(--spacing-lg);
      }

      .admin-header h2 {
        margin: 0 0 var(--spacing-xs);
      }

      .admin-header p {
        margin: 0;
      }

      .admin-layout {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: var(--spacing-lg);
      }

      .admin-nav {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .admin-nav-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--white);
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-md);
        cursor: pointer;
        text-align: left;
        transition: all 0.2s;
      }

      .admin-nav-btn:hover {
        background: var(--gray-50);
      }

      .admin-nav-btn.active {
        background: var(--primary);
        color: var(--white);
        border-color: var(--primary);
      }

      .nav-icon {
        font-size: 1.2rem;
      }

      .nav-label {
        flex: 1;
      }

      .admin-content {
        background: var(--white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        padding: var(--spacing-lg);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin: 0 0 var(--spacing-md);
        font-size: 1.1rem;
      }

      .section-icon {
        font-size: 1.3rem;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
      }

      .user-count {
        color: var(--gray-500);
        font-size: 0.9rem;
      }

      /* Pending users */
      .pending-section {
        margin-bottom: var(--spacing-xl);
        padding-bottom: var(--spacing-lg);
        border-bottom: 1px solid var(--gray-200);
      }

      .pending-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .pending-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md);
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        border-radius: var(--radius-md);
      }

      .pending-email {
        font-weight: 500;
      }

      .pending-name {
        font-size: 0.85rem;
        color: var(--gray-600);
      }

      .pending-date {
        font-size: 0.75rem;
        color: var(--gray-500);
      }

      .pending-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      /* Users table */
      .users-table-container {
        overflow-x: auto;
      }

      .users-table {
        width: 100%;
        min-width: 600px;
      }

      .users-table th {
        text-align: left;
        font-weight: 500;
        color: var(--gray-500);
        font-size: 0.8rem;
        text-transform: uppercase;
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--primary);
        color: var(--white);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .user-name {
        font-weight: 500;
      }

      .user-email {
        font-size: 0.8rem;
        color: var(--gray-500);
      }

      .select-sm {
        padding: 0.25rem 0.5rem;
        font-size: 0.85rem;
      }

      .status-badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
      }

      .status-approved {
        background: rgba(40, 167, 69, 0.15);
        color: #155724;
      }

      .status-pending {
        background: rgba(255, 193, 7, 0.15);
        color: #856404;
      }

      .status-disabled {
        background: rgba(220, 53, 69, 0.15);
        color: #721c24;
      }

      .current-user {
        background: rgba(30, 58, 95, 0.05);
      }

      .disabled-user {
        opacity: 0.6;
      }

      .btn-sm {
        padding: 0.25rem 0.75rem;
        font-size: 0.85rem;
      }

      /* Invitations */
      .invite-form {
        max-width: 500px;
      }

      .invite-result {
        margin-top: var(--spacing-lg);
      }

      .alert {
        padding: var(--spacing-md);
        border-radius: var(--radius-md);
      }

      .alert-success {
        background: rgba(40, 167, 69, 0.1);
        border: 1px solid rgba(40, 167, 69, 0.3);
      }

      .alert-danger {
        background: rgba(220, 53, 69, 0.1);
        border: 1px solid rgba(220, 53, 69, 0.3);
      }

      .invite-link-container {
        display: flex;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-sm);
      }

      .invite-link {
        flex: 1;
        font-family: monospace;
        font-size: 0.85rem;
      }

      /* Info box */
      .info-box {
        background: var(--gray-50);
        border: 1px solid var(--gray-200);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
      }

      .info-box h4 {
        margin: 0 0 var(--spacing-sm);
        font-size: 0.9rem;
      }

      .info-box ul {
        margin: 0;
        padding-left: var(--spacing-lg);
        font-size: 0.85rem;
        color: var(--gray-600);
      }

      .info-box li {
        margin-bottom: var(--spacing-xs);
      }

      .loading {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--gray-500);
      }

      @media (max-width: 768px) {
        .admin-layout {
          grid-template-columns: 1fr;
        }

        .admin-nav {
          flex-direction: row;
          overflow-x: auto;
        }

        .admin-nav-btn {
          flex-shrink: 0;
        }

        .pending-card {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-sm);
        }

        .pending-actions {
          width: 100%;
        }

        .pending-actions .btn {
          flex: 1;
        }
      }
    </style>
  `;
}
