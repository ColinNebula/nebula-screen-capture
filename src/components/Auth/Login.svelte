<script>
  import { createEventDispatcher } from 'svelte';
  import authService from '../../services/authService';

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let loading = false;
  let error = '';

  async function handleLogin() {
    error = '';
    
    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }

    loading = true;

    try {
      const user = await authService.login(email, password);
      console.log('✅ Login successful!', user);
      
      // Check if email is verified
      const isVerified = await authService.isEmailVerified();
      
      if (!isVerified) {
        dispatch('unverified', user);
      } else {
        dispatch('success', user);
      }
    } catch (err) {
      error = err.message;
      console.error('Login error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <h1>🌌 Welcome Back</h1>
      <p>Sign in to Nebula Screen Capture</p>
    </div>

    {#if error}
      <div class="error-message">
        ⚠️ {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="email">Email</label>
        <input
          type="email"
          id="email"
          bind:value={email}
          placeholder="your@email.com"
          disabled={loading}
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          placeholder="Your password"
          disabled={loading}
          required
        />
      </div>

      <div class="forgot-password">
        <button 
          type="button" 
          class="link-btn" 
          on:click={() => dispatch('switch', 'forgot')}
        >
          Forgot password?
        </button>
      </div>

      <button type="submit" class="submit-btn" disabled={loading}>
        {#if loading}
          Signing In...
        {:else}
          Sign In
        {/if}
      </button>
    </form>

    <div class="auth-footer">
      Don't have an account? 
      <button class="link-btn" on:click={() => dispatch('switch', 'signup')}>
        Sign Up
      </button>
    </div>
  </div>
</div>

<style>
  .auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .auth-card {
    background: white;
    border-radius: 20px;
    padding: 40px;
    max-width: 450px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .auth-header {
    text-align: center;
    margin-bottom: 30px;
  }

  .auth-header h1 {
    font-size: 32px;
    font-weight: 700;
    color: #333;
    margin: 0 0 10px 0;
  }

  .auth-header p {
    color: #666;
    margin: 0;
  }

  .error-message {
    background: #fee;
    color: #c33;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    border-left: 4px solid #c33;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-weight: 600;
    font-size: 14px;
  }

  .form-group input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
    box-sizing: border-box;
  }

  .form-group input:focus {
    outline: none;
    border-color: #667eea;
  }

  .form-group input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .forgot-password {
    text-align: right;
    margin-bottom: 20px;
  }

  .submit-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-footer {
    margin-top: 20px;
    text-align: center;
    color: #666;
  }

  .link-btn {
    background: none;
    border: none;
    color: #667eea;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }

  .link-btn:hover {
    color: #764ba2;
  }
</style>
