<script>
  import Login from './Login.svelte';
  import Signup from './Signup.svelte';
  import VerifyEmail from './VerifyEmail.svelte';
  import ForgotPassword from './ForgotPassword.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let currentView = 'login'; // 'login', 'signup', 'verify', 'forgot'
  let userEmail = '';
  let userId = '';
  let verificationCode = '';

  function handleSwitch(event) {
    currentView = event.detail;
  }

  function handleSignupSuccess(event) {
    const { user, verificationCode: code } = event.detail;
    userEmail = user.email;
    userId = user.uid;
    verificationCode = code;
    currentView = 'verify';
  }

  function handleLoginSuccess(event) {
    dispatch('authenticated', event.detail);
  }

  function handleLoginUnverified(event) {
    const user = event.detail;
    userEmail = user.email;
    userId = user.uid;
    currentView = 'verify';
  }

  function handleVerified() {
    dispatch('verified');
  }
</script>

<div class="auth-wrapper">
  {#if currentView === 'login'}
    <Login 
      on:success={handleLoginSuccess}
      on:unverified={handleLoginUnverified}
      on:switch={handleSwitch}
    />
  {:else if currentView === 'signup'}
    <Signup 
      on:success={handleSignupSuccess}
      on:switch={handleSwitch}
    />
  {:else if currentView === 'verify'}
    <VerifyEmail 
      {userEmail}
      {userId}
      prefilledCode={verificationCode}
      on:verified={handleVerified}
    />
  {:else if currentView === 'forgot'}
    <ForgotPassword 
      on:switch={handleSwitch}
    />
  {/if}
</div>

<style>
  .auth-wrapper {
    width: 100%;
    height: 100%;
  }
</style>
