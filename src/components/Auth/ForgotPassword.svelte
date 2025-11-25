<script>
  import { createEventDispatcher } from 'svelte';
  import authService from '../../services/authService';

  const dispatch = createEventDispatcher();

  let email = '';
  let loading = false;
  let error = '';
  let success = false;

  async function handlePasswordReset() {
    error = '';
    
    if (!email) {
      error = 'Please enter your email address';
      return;
    }

    loading = true;

    try {
      await authService.sendPasswordReset(email);
      success = true;
    } catch (err) {
      error = err.message;
      console.error('Password reset error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    {#if !success}
      <div class="auth-header">
        <h1>🔒 Reset Password</h1>
        <p>Enter your email to receive reset instructions</p>
      </div>

      {#if error}
        <div class="error-message">
          ⚠️ {error}
        </div>
      {/if}

      <form on:submit|preventDefault={handlePasswordReset}>
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

        <button type="submit" class="submit-btn" disabled={loading}>
          {#if loading}
            Sending...
          {:else}
            Send Reset Link
          {/if}
        </button>
      </form>

      <div class="auth-footer">
        Remember your password? 
        <button class="link-btn" on:click={() => dispatch('switch', 'login')}>
          Sign In
        </button>
      </div>
    {:else}
      <div class="success-message">
        <div class="success-icon">📧</div>
        <h2>Check Your Email</h2>
        <p>We've sent password reset instructions to <strong>{email}</strong></p>
        <p class="small">If you don't see the email, check your spam folder.</p>
        
        <button class="submit-btn" on:click={() => dispatch('switch', 'login')}>
          Back to Sign In
        </button>
      </div>
    {/if}
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

  .success-message {
    text-align: center;
    padding: 20px 0;
  }

  .success-icon {
    font-size: 80px;
    margin-bottom: 20px;
  }

  .success-message h2 {
    color: #333;
    font-size: 28px;
    margin: 0 0 15px 0;
  }

  .success-message p {
    color: #666;
    margin: 10px 0;
    line-height: 1.6;
  }

  .success-message .small {
    font-size: 14px;
    color: #999;
    margin-bottom: 30px;
  }
</style>
