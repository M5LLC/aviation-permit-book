/**
 * Login Page Component
 */

import { getBranding } from '../../config/branding.js';
import { signIn, signUp, resetPassword } from '../../services/auth.js';

// Page state
let currentView = 'login'; // 'login', 'register', 'forgot'

/**
 * Render the login page
 * @returns {string} HTML string
 */
export function renderLoginPage() {
  const appName = getBranding('appName');
  const logoUrl = getBranding('logoUrl');

  return `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <img src="${logoUrl}" alt="${appName}" class="auth-logo" onerror="this.style.display='none'">
          <h1 class="auth-title">${appName}</h1>
          <p class="auth-subtitle">Aviation Permit Management</p>
        </div>

        <div class="auth-card">
          <div id="auth-form-container">
            ${renderLoginForm()}
          </div>

          <div id="auth-message" class="auth-message hidden"></div>
        </div>

        <div class="auth-footer">
          <p class="text-muted">Need help? Contact your administrator.</p>
        </div>
      </div>
    </div>
    ${renderAuthStyles()}
  `;
}

/**
 * Render login form
 */
function renderLoginForm() {
  return `
    <h2 class="auth-form-title">Sign In</h2>
    <form id="login-form" class="auth-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" class="input" required
               placeholder="your@email.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" class="input" required
               placeholder="Enter your password" autocomplete="current-password">
      </div>
      <button type="submit" class="btn btn-primary btn-full">
        Sign In
      </button>
    </form>
    <div class="auth-links">
      <button type="button" id="show-forgot" class="link-btn">Forgot password?</button>
      <span class="auth-divider">|</span>
      <button type="button" id="show-register" class="link-btn">Request access</button>
    </div>
  `;
}

/**
 * Render registration form
 */
function renderRegisterForm() {
  return `
    <h2 class="auth-form-title">Request Access</h2>
    <form id="register-form" class="auth-form">
      <div class="form-group">
        <label for="reg-name">Full Name</label>
        <input type="text" id="reg-name" name="displayName" class="input" required
               placeholder="Your full name" autocomplete="name">
      </div>
      <div class="form-group">
        <label for="reg-email">Email</label>
        <input type="email" id="reg-email" name="email" class="input" required
               placeholder="your@email.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label for="reg-org">Organization Code</label>
        <input type="text" id="reg-org" name="organizationId" class="input" required
               placeholder="Enter organization code">
        <small class="form-hint">Ask your administrator for your organization code.</small>
      </div>
      <div class="form-group">
        <label for="reg-password">Password</label>
        <input type="password" id="reg-password" name="password" class="input" required
               placeholder="Create a password (min 6 characters)" autocomplete="new-password"
               minlength="6">
      </div>
      <div class="form-group">
        <label for="reg-password2">Confirm Password</label>
        <input type="password" id="reg-password2" name="password2" class="input" required
               placeholder="Confirm your password" autocomplete="new-password">
      </div>
      <button type="submit" class="btn btn-primary btn-full">
        Request Access
      </button>
    </form>
    <div class="auth-links">
      <button type="button" id="show-login" class="link-btn">Back to sign in</button>
    </div>
  `;
}

/**
 * Render forgot password form
 */
function renderForgotForm() {
  return `
    <h2 class="auth-form-title">Reset Password</h2>
    <p class="auth-form-desc">Enter your email and we'll send you a reset link.</p>
    <form id="forgot-form" class="auth-form">
      <div class="form-group">
        <label for="forgot-email">Email</label>
        <input type="email" id="forgot-email" name="email" class="input" required
               placeholder="your@email.com" autocomplete="email">
      </div>
      <button type="submit" class="btn btn-primary btn-full">
        Send Reset Link
      </button>
    </form>
    <div class="auth-links">
      <button type="button" id="show-login" class="link-btn">Back to sign in</button>
    </div>
  `;
}

/**
 * Show message on auth page
 */
function showMessage(message, type = 'info') {
  const el = document.getElementById('auth-message');
  if (el) {
    el.textContent = message;
    el.className = `auth-message alert alert-${type}`;
    el.classList.remove('hidden');
  }
}

/**
 * Hide message
 */
function hideMessage() {
  const el = document.getElementById('auth-message');
  if (el) {
    el.classList.add('hidden');
  }
}

/**
 * Switch auth view
 */
function switchView(view) {
  currentView = view;
  const container = document.getElementById('auth-form-container');

  if (container) {
    switch (view) {
      case 'register':
        container.innerHTML = renderRegisterForm();
        break;
      case 'forgot':
        container.innerHTML = renderForgotForm();
        break;
      default:
        container.innerHTML = renderLoginForm();
    }
    attachFormHandlers();
    hideMessage();
  }
}

/**
 * Attach form event handlers
 */
function attachFormHandlers() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const email = formData.get('email');
      const password = formData.get('password');

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      const result = await signIn(email, password);

      if (!result.success) {
        showMessage(result.error, 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
      // Success is handled by auth state change
    });
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const password = formData.get('password');
      const password2 = formData.get('password2');

      if (password !== password2) {
        showMessage('Passwords do not match.', 'danger');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Requesting access...';

      const result = await signUp({
        email: formData.get('email'),
        password,
        displayName: formData.get('displayName'),
        organizationId: formData.get('organizationId'),
      });

      if (result.success) {
        showMessage(result.message, 'success');
        submitBtn.textContent = 'Request Sent';
      } else {
        showMessage(result.error, 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request Access';
      }
    });
  }

  // Forgot password form
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const email = formData.get('email');

      const submitBtn = forgotForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      const result = await resetPassword(email);

      if (result.success) {
        showMessage(result.message, 'success');
        submitBtn.textContent = 'Email Sent';
      } else {
        showMessage(result.error, 'danger');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
      }
    });
  }

  // View switchers
  document.getElementById('show-register')?.addEventListener('click', () => switchView('register'));
  document.getElementById('show-forgot')?.addEventListener('click', () => switchView('forgot'));
  document.getElementById('show-login')?.addEventListener('click', () => switchView('login'));
}

// Auto-attach handlers when loaded
setTimeout(attachFormHandlers, 0);

/**
 * Render auth page styles
 */
function renderAuthStyles() {
  return `
    <style>
      .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        padding: var(--spacing-lg);
      }

      .auth-container {
        width: 100%;
        max-width: 400px;
      }

      .auth-header {
        text-align: center;
        margin-bottom: var(--spacing-xl);
        color: var(--white);
      }

      .auth-logo {
        height: 60px;
        width: auto;
        margin-bottom: var(--spacing-md);
      }

      .auth-title {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 var(--spacing-xs);
      }

      .auth-subtitle {
        opacity: 0.8;
        margin: 0;
      }

      .auth-card {
        background: var(--white);
        border-radius: var(--radius-lg);
        padding: var(--spacing-xl);
        box-shadow: var(--shadow-lg);
      }

      .auth-form-title {
        font-size: 1.25rem;
        color: var(--primary);
        margin: 0 0 var(--spacing-lg);
        text-align: center;
      }

      .auth-form-desc {
        color: var(--gray-600);
        font-size: 0.875rem;
        text-align: center;
        margin: -0.5rem 0 var(--spacing-lg);
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .form-group label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--gray-700);
      }

      .form-hint {
        font-size: 0.75rem;
        color: var(--gray-500);
      }

      .btn-full {
        width: 100%;
        padding: var(--spacing-md);
        margin-top: var(--spacing-sm);
      }

      .auth-links {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-lg);
        padding-top: var(--spacing-lg);
        border-top: 1px solid var(--gray-200);
      }

      .link-btn {
        background: none;
        border: none;
        color: var(--primary);
        font-size: 0.875rem;
        cursor: pointer;
        padding: 0;
      }

      .link-btn:hover {
        text-decoration: underline;
      }

      .auth-divider {
        color: var(--gray-300);
      }

      .auth-message {
        margin-top: var(--spacing-md);
      }

      .auth-footer {
        text-align: center;
        margin-top: var(--spacing-lg);
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.875rem;
      }

      .auth-footer .text-muted {
        color: inherit;
      }
    </style>
  `;
}
