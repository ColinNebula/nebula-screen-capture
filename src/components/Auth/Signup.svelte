<script>
  import { createEventDispatcher } from 'svelte';
  import authService from '../../services/authService';

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let confirmPassword = '';
  let displayName = '';
  let loading = false;
  let error = '';
  let showVerificationCode = false;
  let verificationCode = '';
  let verificationUrl = '';

  async function handleSignup() {
    error = '';
    
    // Validation
    if (!email || !password || !displayName) {
      error = 'Please fill in all fields';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (password.length < 6) {
      error = 'Password must be at least 6 characters';
      return;
    }

    loading = true;

    try {
      const result = await authService.signup(email, password, displayName);
      console.log('✅ Signup successful!', result);
      
      // Show verification code on screen
      verificationCode = result.verificationCode;
      verificationUrl = result.verificationUrl;
      showVerificationCode = true;
      
      // Emit success event
      dispatch('success', result);
    } catch (err) {
      error = err.message;
      console.error('Signup error:', err);
    } finally {
      loading = false;
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(verificationCode);
    alert('Verification code copied to clipboard!');
  }

  function copyUrl() {
    navigator.clipboard.writeText(verificationUrl);
    alert('Verification link copied to clipboard!');
  }
</script>

<div class="auth-container">
  {#if !showVerificationCode}
    <div class="auth-card">
      <div class="auth-header">
        <h1>🌌 Create Account</h1>
        <p>Join Nebula Screen Capture</p>
      </div>

      {#if error}
        <div class="error-message">
          ⚠️ {error}
        </div>
      {/if}

      <form on:submit|preventDefault={handleSignup}>
        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            bind:value={displayName}
            placeholder="Your name"
            disabled={loading}
            required
          />
        </div>

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
            placeholder="At least 6 characters"
            disabled={loading}
            required
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            bind:value={confirmPassword}
            placeholder="Repeat password"
            disabled={loading}
            required
          />
        </div>

        <button type="submit" class="submit-btn" disabled={loading}>
          {#if loading}
            Creating Account...
          {:else}
            Sign Up
          {/if}
        </button>
      </form>

      <div class="auth-footer">
        Already have an account? 
        <button class="link-btn" on:click={() => dispatch('switch', 'login')}>
          Sign In
        </button>
      </div>
    </div>
  {:else}
    <div class="auth-card verification-card">
      <div class="auth-header">
        <h1>✨ Verify Your Email</h1>
        <p>We've sent a verification email to <strong>{email}</strong></p>
      </div>

      <div class="verification-display">
        <div class="verification-section">
          <h3>🔐 Your Verification Code:</h3>
          <div class="code-display" on:click={copyCode}>
            {verificationCode}
          </div>
          <p class="hint">Click to copy</p>
        </div>

        <div class="divider">OR</div>

        <div class="verification-section">
          <h3>🔗 Verification Link:</h3>
          <div class="url-display" on:click={copyUrl}>
            <input 
              type="text" 
              value={verificationUrl} 
              readonly 
            />
          </div>
          <p class="hint">Click to copy link</p>
        </div>

        <div class="instructions">
          <h3>📧 What's Next?</h3>
          <ol>
            <li>Check your email inbox for the verification email</li>
            <li>Click the verification button in the email</li>
            <li>Or manually enter the code shown above</li>
            <li>You can also use the verification link</li>
          </ol>
          
          <div class="info-box">
            <strong>For Testing:</strong> The verification code and link are displayed above. 
            In production, you would only receive these via email.
          </div>
        </div>

        <button 
          class="submit-btn" 
          on:click={() => dispatch('switch', 'verify')}
        >
          Go to Verification Page
        </button>
      </div>
    </div>
  {/if}
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
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .verification-card {
    max-width: 700px;
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

  /* Verification Display Styles */
  .verification-display {
    margin-top: 20px;
  }

  .verification-section {
    margin-bottom: 30px;
  }

  .verification-section h3 {
    color: #333;
    margin-bottom: 12px;
    font-size: 18px;
  }

  .code-display {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 42px;
    font-weight: bold;
    letter-spacing: 12px;
    padding: 25px;
    text-align: center;
    border-radius: 12px;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    transition: transform 0.2s;
    user-select: all;
  }

  .code-display:hover {
    transform: scale(1.02);
  }

  .url-display {
    background: #f8f9fa;
    padding: 12px;
    border-radius: 8px;
    border: 2px solid #e0e0e0;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .url-display:hover {
    border-color: #667eea;
  }

  .url-display input {
    width: 100%;
    background: transparent;
    border: none;
    font-size: 14px;
    color: #333;
    user-select: all;
    font-family: monospace;
  }

  .hint {
    text-align: center;
    color: #999;
    font-size: 12px;
    margin-top: 8px;
  }

  .divider {
    text-align: center;
    color: #999;
    font-weight: bold;
    margin: 30px 0;
    position: relative;
  }

  .divider::before,
  .divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: #e0e0e0;
  }

  .divider::before {
    left: 0;
  }

  .divider::after {
    right: 0;
  }

  .instructions {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
  }

  .instructions h3 {
    color: #333;
    margin-bottom: 12px;
    font-size: 18px;
  }

  .instructions ol {
    margin: 0;
    padding-left: 20px;
    color: #666;
    line-height: 1.8;
  }

  .info-box {
    background: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 12px;
    margin-top: 15px;
    border-radius: 4px;
    color: #856404;
    font-size: 14px;
  }
</style>
