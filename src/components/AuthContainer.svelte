<script>
  import LoginForm from './LoginForm.svelte';
  import RegisterForm from './RegisterForm.svelte';

  export let onLogin = () => {};
  export let onRegister = () => {};

  let showLogin = true;

  function toggleForm() {
    showLogin = !showLogin;
  }
</script>

<div class="auth-container">
  <div class="auth-content">
    {#if showLogin}
      <LoginForm {onLogin} />
    {:else}
      <RegisterForm {onRegister} />
    {/if}
    
    <div class="auth-toggle">
      <button on:click={toggleForm}>
        {showLogin ? "Don't have an account? Register" : "Already have an account? Login"}
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
    background: var(--bg-secondary, #f8fafc);
    padding: 2rem;
  }

  .auth-content {
    width: 100%;
    max-width: 420px;
  }

  .auth-toggle {
    text-align: center;
    margin-top: 1.5rem;
  }

  .auth-toggle button {
    background: none;
    border: none;
    color: var(--brand-primary, #667eea);
    cursor: pointer;
    font-size: 0.95rem;
    text-decoration: underline;
    transition: opacity 0.2s;
    padding: 0.5rem;
  }

  .auth-toggle button:hover {
    opacity: 0.8;
  }
</style>
