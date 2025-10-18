<script>
  import { user } from '../stores/user.js';
  import { addNotification } from '../stores/notifications.js';
  import NebulaLogo from './NebulaLogo.svelte';
  
  export let onLogin = () => {};

  let email = '';
  let password = '';
  let loading = false;
  let showAdminLogin = false;
  let adminUsername = '';
  let adminPassword = '';

  // Admin credentials (in production, handle via backend)
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'Nebula@Admin2025!',
    email: 'colinnebula@gmail.com',
  };

  async function handleSubmit() {
    if (!email || !password) {
      addNotification('Please fill in all fields', 'error');
      return;
    }

    loading = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: email,
        name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=667eea&color=fff`,
        plan: 'free',
        recordingsCount: 0,
        storageUsed: 0,
        maxStorage: 5120
      };
      
      user.set(userData);
      addNotification('Login successful!', 'success');
      
      if (onLogin) {
        onLogin(userData);
      }
    } catch (error) {
      addNotification(error.message || 'Login failed', 'error');
    } finally {
      loading = false;
    }
  }

  function handleAdminSubmit() {
    const isValidUsername = adminUsername === ADMIN_CREDENTIALS.username || 
                           adminUsername === ADMIN_CREDENTIALS.email;
    const isValidPassword = adminPassword === ADMIN_CREDENTIALS.password;
    
    if (isValidUsername && isValidPassword) {
      const adminData = {
        id: 'admin-001',
        name: 'Colin Nebula',
        email: ADMIN_CREDENTIALS.email,
        avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23dc2626" width="100" height="100"/%3E%3Ctext fill="white" font-size="45" font-weight="bold" x="50%25" y="50%25" text-anchor="middle" dy=".35em"%3EA%3C/text%3E%3C/svg%3E',
        plan: 'admin',
        isAdmin: true,
        privileges: {
          unlimitedRecordings: true,
          unlimitedStorage: true,
          maxQuality: '4K',
          accessAllFeatures: true,
        },
        recordingsCount: 0,
        storageUsed: 0,
        maxStorage: Infinity,
      };
      
      user.set(adminData);
      addNotification('Admin login successful!', 'success');
      showAdminLogin = false;
      
      if (onLogin) {
        onLogin(adminData);
      }
    } else {
      addNotification('Invalid admin credentials', 'error');
    }
  }

  function handleKeyDown(e) {
    if (e.altKey && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      showAdminLogin = true;
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="login-form">
  <div class="login-header">
    <NebulaLogo size={64} color="#667eea" animated={true} />
    <h2>Welcome back</h2>
    <p>Sign in to your Nebula Screen Capture account</p>
  </div>

  <form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
      <label for="email">Email</label>
      <input
        type="email"
        id="email"
        bind:value={email}
        placeholder="your@email.com"
        disabled={loading}
      />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        bind:value={password}
        placeholder="••••••••"
        disabled={loading}
      />
    </div>

    <button type="submit" disabled={loading}>
      {loading ? 'Logging in...' : 'Login'}
    </button>

    <button type="button" on:click={() => showAdminLogin = !showAdminLogin} class="admin-toggle">
      {showAdminLogin ? 'Hide' : 'Show'} Admin Login (Alt+O)
    </button>
  </form>

  {#if showAdminLogin}
    <div class="admin-login-section">
      <h3>Administrator Login</h3>
      <div class="form-group">
        <label for="admin-username">Admin Username</label>
        <input
          type="text"
          id="admin-username"
          bind:value={adminUsername}
          placeholder="admin or colinnebula@gmail.com"
        />
      </div>

      <div class="form-group">
        <label for="admin-password">Admin Password</label>
        <input
          type="password"
          id="admin-password"
          bind:value={adminPassword}
          placeholder="Admin password"
        />
      </div>

      <button type="button" on:click={handleAdminSubmit} class="admin-submit">
        Sign In as Admin
      </button>

      <div class="admin-info">
        <small>
          Username: <code>{ADMIN_CREDENTIALS.username}</code> or <code>{ADMIN_CREDENTIALS.email}</code><br>
          Password: <code>Nebula@Admin2025!</code>
        </small>
      </div>
    </div>
  {/if}
</div>

<style>
  .login-form {
    background: var(--bg-primary, #ffffff);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.1));
  }

  h2 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary, #1a202c);
    text-align: center;
    font-size: 1.75rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-secondary, #2d3748);
    font-size: 0.9rem;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-primary, #e2e8f0);
    border-radius: 8px;
    background: var(--bg-secondary, #f8fafc);
    color: var(--text-primary, #1a202c);
    font-size: 1rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: var(--brand-primary, #667eea);
  }

  input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button {
    width: 100%;
    padding: 0.75rem;
    background: var(--brand-primary, #667eea);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-top: 0.5rem;
  }

  button:hover:not(:disabled) {
    opacity: 0.9;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .demo-btn {
    background: var(--bg-tertiary, #f1f5f9);
    color: var(--text-primary, #1a202c);
    margin-top: 0.75rem;
  }

  .demo-btn:hover:not(:disabled) {
    background: var(--border-primary, #e2e8f0);
  }

  .admin-toggle {
    background: var(--bg-tertiary, #f1f5f9);
    color: var(--text-secondary, #2d3748);
    margin-top: 0.75rem;
    font-size: 0.85rem;
  }

  .admin-toggle:hover {
    background: var(--border-primary, #e2e8f0);
  }

  .admin-login-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-primary, #e2e8f0);
  }

  .admin-login-section h3 {
    color: #dc2626;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }

  .admin-submit {
    background: #dc2626;
    margin-top: 0;
  }

  .admin-submit:hover {
    background: #b91c1c;
  }

  .admin-info {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--bg-secondary, #f8fafc);
    border-radius: 6px;
    color: var(--text-secondary, #2d3748);
  }

  .admin-info code {
    background: var(--bg-tertiary, #f1f5f9);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.85rem;
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-header p {
    color: var(--text-secondary, #2d3748);
    margin: 0.5rem 0 0 0;
  }
</style>
