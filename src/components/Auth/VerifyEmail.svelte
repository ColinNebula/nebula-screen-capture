<script>
  import { createEventDispatcher } from 'svelte';
  import authService from '../../services/authService';

  const dispatch = createEventDispatcher();

  export let userEmail = '';
  export let userId = '';
  export let prefilledCode = '';

  let verificationCode = prefilledCode || '';
  let loading = false;
  let error = '';
  let success = false;
  let resendCooldown = 0;
  let displayCode = '';
  let displayUrl = '';

  // Handle prefilled code from URL
  if (prefilledCode) {
    verificationCode = prefilledCode;
  }

  async function handleVerify() {
    error = '';
    
    if (!verificationCode || verificationCode.length !== 6) {
      error = 'Please enter a valid 6-digit verification code';
      return;
    }

    if (!userId) {
      error = 'User ID not found. Please sign up again.';
      return;
    }

    loading = true;

    try {
      await authService.verifyEmailWithCode(verificationCode, userId);
      success = true;
      
      // Redirect to app after a short delay
      setTimeout(() => {
        dispatch('verified');
      }, 2000);
    } catch (err) {
      error = err.message;
      console.error('Verification error:', err);
    } finally {
      loading = false;
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    
    error = '';
    loading = true;

    try {
      const result = await authService.resendVerificationEmail();
      
      // Show the new code on screen for testing
      displayCode = result.verificationCode;
      displayUrl = result.verificationUrl;
      
      // Start cooldown
      resendCooldown = 60;
      const interval = setInterval(() => {
        resendCooldown--;
        if (resendCooldown <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      alert('✅ Verification email sent! Check your inbox and the code displayed below.');
    } catch (err) {
      error = err.message;
      console.error('Resend error:', err);
    } finally {
      loading = false;
    }
  }

  function copyCode() {
    if (displayCode) {
      navigator.clipboard.writeText(displayCode);
      alert('Code copied to clipboard!');
    }
  }
</script>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      {#if success}
        <h1>✅ Email Verified!</h1>
        <p>Redirecting to your dashboard...</p>
      {:else}
        <h1>✨ Verify Your Email</h1>
        <p>We sent a verification code to <strong>{userEmail}</strong></p>
      {/if}
    </div>

    {#if !success}
      {#if error}
        <div class="error-message">
          ⚠️ {error}
        </div>
      {/if}

      {#if displayCode}
        <div class="code-display-section">
          <h3>🔐 Your New Verification Code:</h3>
          <div class="code-display" on:click={copyCode}>
            {displayCode}
          </div>
          <p class="hint">Click to copy • Expires in 24 hours</p>
        </div>
      {/if}

      <form on:submit|preventDefault={handleVerify}>
        <div class="form-group">
          <label for="code">Verification Code</label>
          <input
            type="text"
            id="code"
            bind:value={verificationCode}
            placeholder="Enter 6-digit code"
            maxlength="6"
            pattern="[0-9]{6}"
            disabled={loading}
            required
            class="code-input"
          />
          <p class="input-hint">Enter the 6-digit code from your email</p>
        </div>

        <button type="submit" class="submit-btn" disabled={loading}>
          {#if loading}
            Verifying...
          {:else}
            Verify Email
          {/if}
        </button>
      </form>

      <div class="resend-section">
        <p>Didn't receive the email?</p>
        <button 
          type="button" 
          class="resend-btn" 
          on:click={handleResend}
          disabled={loading || resendCooldown > 0}
        >
          {#if resendCooldown > 0}
            Resend in {resendCooldown}s
          {:else if loading}
            Sending...
          {:else}
            Resend Verification Email
          {/if}
        </button>
      </div>

      <div class="help-section">
        <h3>💡 Tips:</h3>
        <ul>
          <li>Check your spam/junk folder</li>
          <li>Make sure {userEmail} is correct</li>
          <li>Code expires in 24 hours</li>
          <li>For testing: The code is displayed above after resending</li>
        </ul>
      </div>
    {:else}
      <div class="success-animation">
        <div class="checkmark">✓</div>
        <p>Your email has been successfully verified!</p>
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
    max-width: 550px;
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

  .code-display-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 25px;
    border: 2px dashed #667eea;
  }

  .code-display-section h3 {
    color: #333;
    margin: 0 0 15px 0;
    font-size: 16px;
    text-align: center;
  }

  .code-display {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 36px;
    font-weight: bold;
    letter-spacing: 8px;
    padding: 20px;
    text-align: center;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    transition: transform 0.2s;
    user-select: all;
  }

  .code-display:hover {
    transform: scale(1.02);
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

  .code-input {
    width: 100%;
    padding: 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 28px;
    font-weight: bold;
    text-align: center;
    letter-spacing: 8px;
    font-family: 'Courier New', monospace;
    transition: border-color 0.3s;
    box-sizing: border-box;
  }

  .code-input:focus {
    outline: none;
    border-color: #667eea;
  }

  .code-input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .input-hint, .hint {
    text-align: center;
    color: #999;
    font-size: 13px;
    margin-top: 8px;
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

  .resend-section {
    margin-top: 30px;
    text-align: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 12px;
  }

  .resend-section p {
    margin: 0 0 10px 0;
    color: #666;
  }

  .resend-btn {
    background: white;
    border: 2px solid #667eea;
    color: #667eea;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .resend-btn:hover:not(:disabled) {
    background: #667eea;
    color: white;
  }

  .resend-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .help-section {
    margin-top: 25px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 12px;
  }

  .help-section h3 {
    color: #333;
    margin: 0 0 12px 0;
    font-size: 16px;
  }

  .help-section ul {
    margin: 0;
    padding-left: 25px;
    color: #666;
    line-height: 1.8;
  }

  .success-animation {
    text-align: center;
    padding: 40px 0;
  }

  .checkmark {
    width: 100px;
    height: 100px;
    margin: 0 auto 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60px;
    animation: scaleIn 0.5s ease-out;
  }

  @keyframes scaleIn {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }

  .success-animation p {
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }
</style>
