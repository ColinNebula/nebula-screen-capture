<script>
  import { user } from '../stores/user.js';
  import { addNotification } from '../stores/notifications.js';
  
  export let onRegister = () => {};

  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let showPassword = false;
  let showConfirmPassword = false;
  let verificationSent = false;
  let verificationCode = '';
  let sentVerificationCode = '';

  function generateSecurePassword() {
    const length = 16;
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let generatedPassword = '';
    
    // Ensure at least one of each type
    generatedPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    generatedPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    generatedPassword += numbers[Math.floor(Math.random() * numbers.length)];
    generatedPassword += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      generatedPassword += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    generatedPassword = generatedPassword.split('').sort(() => Math.random() - 0.5).join('');
    
    password = generatedPassword;
    confirmPassword = generatedPassword;
    showPassword = true;
    showConfirmPassword = true;
    
    addNotification('Secure password generated!', 'success', 2000);
  }

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
      // Generate 6-digit verification code
      sentVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // TODO: Send verification email via Firebase or email service
      // For now, simulate sending email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Verification code (for testing):', sentVerificationCode);
      
      verificationSent = true;
      loading = false;
      
      addNotification('Verification email sent! Check your inbox.', 'success', 4000);
    } catch (error) {
      addNotification(error.message || 'Failed to send verification email', 'error');
      loading = false;
    }
  }

  async function handleVerification() {
    if (!verificationCode || verificationCode.length !== 6) {
      addNotification('Please enter the 6-digit verification code', 'error');
      return;
    }

    if (verificationCode !== sentVerificationCode) {
      addNotification('Invalid verification code. Please try again.', 'error');
      return;
    }

    loading = true;
    try {
      // TODO: Implement Firebase auth with email verification
      // For now, simulate account creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        email: email,
        name: email.split('@')[0],
        avatar: 'https://ui-avatars.com/api/?name=' + email.split('@')[0] + '&background=667eea&color=fff',
        plan: 'free',
        recordingsCount: 0,
        storageUsed: 0,
        maxStorage: 5120,
        emailVerified: true,
        createdAt: new Date().toISOString()
      };
      
      user.set(userData);
      addNotification('Email verified! Account created successfully.', 'success');
      
      if (onRegister) {
        onRegister(userData);
      }
    } catch (error) {
      addNotification(error.message || 'Verification failed', 'error');
    } finally {
      loading = false;
    }
  }

  async function resendVerification() {
    loading = true;
    try {
      // Generate new verification code
      sentVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // TODO: Resend verification email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('New verification code (for testing):', sentVerificationCode);
      
      verificationCode = '';
      addNotification('Verification code resent!', 'success');
    } catch (error) {
      addNotification('Failed to resend code', 'error');
    } finally {
      loading = false;
    }
  }
</script>

<div class="register-form">
  {#if !verificationSent}
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
        <div class="password-input-wrapper">
          {#if showPassword}
            <input
              type="text"
              id="password"
              bind:value={password}
              placeholder="Enter password"
              disabled={loading}
            />
          {:else}
            <input
              type="password"
              id="password"
              bind:value={password}
              placeholder="••••••••"
              disabled={loading}
            />
          {/if}
          <button
            type="button"
            class="toggle-password"
            on:click={() => showPassword = !showPassword}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        <button
          type="button"
          class="generate-password-btn"
          on:click={generateSecurePassword}
          disabled={loading}
        >
          🔐 Generate Secure Password
        </button>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <div class="password-input-wrapper">
          {#if showConfirmPassword}
            <input
              type="text"
              id="confirmPassword"
              bind:value={confirmPassword}
              placeholder="Enter password"
              disabled={loading}
            />
          {:else}
            <input
              type="password"
              id="confirmPassword"
              bind:value={confirmPassword}
              placeholder="••••••••"
              disabled={loading}
            />
          {/if}
          <button
            type="button"
            class="toggle-password"
            on:click={() => showConfirmPassword = !showConfirmPassword}
            title={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Sending verification...' : 'Create Account'}
      </button>
    </form>
  {:else}
    <h2>Verify Your Email</h2>
    <p class="verification-message">
      We've sent a 6-digit verification code to <strong>{email}</strong>. 
      Please enter it below to complete your registration.
    </p>
    
    <form on:submit|preventDefault={handleVerification}>
      <div class="form-group">
        <label for="verificationCode">Verification Code</label>
        <input
          type="text"
          id="verificationCode"
          bind:value={verificationCode}
          placeholder="000000"
          maxlength="6"
          pattern="[0-9]{6}"
          disabled={loading}
          class="verification-input"
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Verifying...' : 'Verify Email'}
      </button>
    </form>
    
    <div class="resend-section">
      <p>Didn't receive the code?</p>
      <button
        type="button"
        class="resend-btn"
        on:click={resendVerification}
        disabled={loading}
      >
        Resend Code
      </button>
    </div>
  {/if}
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

  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .password-input-wrapper input {
    padding-right: 2.5rem;
  }

  .toggle-password {
    position: absolute;
    right: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.25rem 0.5rem;
    opacity: 0.6;
    transition: opacity 0.2s;
    width: auto;
    margin: 0;
  }

  .toggle-password:hover {
    opacity: 1;
  }

  .generate-password-btn {
    width: 100%;
    padding: 0.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .generate-password-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .generate-password-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  button[type="submit"] {
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

  .verification-message {
    text-align: center;
    color: var(--text-secondary, #2d3748);
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--bg-secondary, #f8fafc);
    border-radius: 8px;
  }

  .verification-message strong {
    color: var(--brand-primary, #667eea);
    font-weight: 600;
  }

  .verification-input {
    text-align: center;
    font-size: 1.5rem;
    letter-spacing: 0.5rem;
    font-weight: 600;
  }

  .resend-section {
    margin-top: 1.5rem;
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid var(--border-primary, #e2e8f0);
  }

  .resend-section p {
    color: var(--text-secondary, #2d3748);
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
  }

  .resend-btn {
    background: none;
    color: var(--brand-primary, #667eea);
    border: 1px solid var(--brand-primary, #667eea);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    width: auto;
    margin: 0;
  }

  .resend-btn:hover:not(:disabled) {
    background: var(--brand-primary, #667eea);
    color: white;
    opacity: 1;
  }

  .resend-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
