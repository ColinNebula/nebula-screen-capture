<script>
  import { user } from '../stores/user.js';
  import { addNotification } from '../stores/notifications.js';
  
  export let onRegister = () => {};

  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;

  async function handleSubmit() {
    if (!email || !password || !confirmPassword) {
      addNotification('Please fill in all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      addNotification('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      addNotification('Password must be at least 6 characters', 'error');
      return;
    }

    loading = true;
    try {
      // TODO: Implement Firebase auth
      // For now, simulate registration
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
      addNotification('Registration successful!', 'success');
      
      if (onRegister) {
        onRegister(userData);
      }
    } catch (error) {
      addNotification(error.message || 'Registration failed', 'error');
    } finally {
      loading = false;
    }
  }
</script>

<div class="register-form">
  <h2>Create Account</h2>
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

    <div class="form-group">
      <label for="confirmPassword">Confirm Password</label>
      <input
        type="password"
        id="confirmPassword"
        bind:value={confirmPassword}
        placeholder="••••••••"
        disabled={loading}
      />
    </div>

    <button type="submit" disabled={loading}>
      {loading ? 'Creating Account...' : 'Register'}
    </button>
  </form>
</div>

<style>
  .register-form {
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
</style>
