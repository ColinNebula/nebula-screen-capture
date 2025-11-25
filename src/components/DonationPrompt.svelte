<script>
  import { createEventDispatcher } from 'svelte';
  
  export let show = false;
  
  const dispatch = createEventDispatcher();
  
  // Donation options
  const donationAmounts = [
    { amount: 5, label: '$5', description: 'Buy us a coffee ☕' },
    { amount: 10, label: '$10', description: 'Support development 🚀' },
    { amount: 25, label: '$25', description: 'Power user support 💪' },
    { amount: 50, label: '$50', description: 'Champion sponsor 🏆' }
  ];
  
  let selectedAmount = 10;
  let customAmount = '';
  let showCustom = false;
  
  // PayPal and Stripe configuration
  const PAYPAL_EMAIL = 'your-paypal-email@example.com'; // Replace with your PayPal email
  const STRIPE_PAYMENT_LINK = 'https://donate.stripe.com/your-link'; // Replace with your Stripe link
  
  function handlePayPal() {
    const amount = showCustom && customAmount ? customAmount : selectedAmount;
    const paypalUrl = `https://www.paypal.com/donate/?hosted_button_id=YOUR_BUTTON_ID&amount=${amount}`;
    window.open(paypalUrl, '_blank');
    close();
  }
  
  function handleStripe() {
    const amount = showCustom && customAmount ? customAmount : selectedAmount;
    // For custom amounts, you'd need to create a Stripe Checkout Session via API
    // For now, opening the payment link
    window.open(STRIPE_PAYMENT_LINK, '_blank');
    close();
  }
  
  function selectAmount(amount) {
    selectedAmount = amount;
    showCustom = false;
    customAmount = '';
  }
  
  function toggleCustom() {
    showCustom = !showCustom;
    if (showCustom) {
      customAmount = '';
    }
  }
  
  function close() {
    dispatch('close');
  }
  
  function handleMaybeLater() {
    // Store that user dismissed, show again after 30 days
    localStorage.setItem('donationDismissed', Date.now().toString());
    close();
  }
</script>

{#if show}
  <div class="donation-overlay" on:click={close}>
    <div class="donation-modal" on:click|stopPropagation>
      <button class="close-btn" on:click={close} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      
      <div class="donation-header">
        <div class="icon-circle">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <h2>Support Nebula Screen Capture</h2>
        <p class="tagline">Help us improve the app and make the world better! 🌍</p>
      </div>
      
      <div class="donation-content">
        <div class="benefits">
          <div class="benefit-item">
            <span class="benefit-icon">🚀</span>
            <span>Faster development</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">✨</span>
            <span>More features</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🛡️</span>
            <span>Better support</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🌟</span>
            <span>Forever free</span>
          </div>
        </div>
        
        <div class="amount-selector">
          <p class="select-label">Choose an amount:</p>
          <div class="amount-grid">
            {#each donationAmounts as { amount, label, description }}
              <button 
                class="amount-btn" 
                class:selected={selectedAmount === amount && !showCustom}
                on:click={() => selectAmount(amount)}
              >
                <span class="amount-label">{label}</span>
                <span class="amount-desc">{description}</span>
              </button>
            {/each}
            
            <button 
              class="amount-btn custom-btn" 
              class:selected={showCustom}
              on:click={toggleCustom}
            >
              <span class="amount-label">Custom</span>
              <span class="amount-desc">Your choice 💝</span>
            </button>
          </div>
          
          {#if showCustom}
            <div class="custom-input-wrapper">
              <span class="currency-symbol">$</span>
              <input 
                type="number" 
                class="custom-input"
                bind:value={customAmount}
                placeholder="Enter amount"
                min="1"
                step="1"
              />
            </div>
          {/if}
        </div>
        
        <div class="payment-methods">
          <p class="payment-label">Choose payment method:</p>
          <div class="payment-buttons">
            <button class="payment-btn paypal-btn" on:click={handlePayPal}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.806.806 0 01-.795.68H8.29c-.366 0-.656-.33-.592-.689l.76-4.813.018-.117a.806.806 0 01.795-.68h.5c3.238 0 5.774-1.314 6.514-5.12.256-1.313.192-2.447-.3-3.327.163-.062.332-.117.507-.164 1.698-.455 2.974.04 3.575 1.74z"/>
                <path d="M9.145 8.17c.1-.658.59-1.076 1.254-1.076h4.394c.522 0 1.01.043 1.467.134a6.6 6.6 0 011.15.354c.178.07.349.148.512.233.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.806.806 0 01-.795.68H5.146a.592.592 0 01-.584-.689l1.74-11.02c.1-.658.59-1.076 1.254-1.076h2.589z"/>
              </svg>
              <span>PayPal</span>
            </button>
            
            <button class="payment-btn stripe-btn" on:click={handleStripe}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.479 9.883c-1.626-.604-2.512-1.067-2.512-1.803 0-.622.511-1.114 1.433-1.114 1.777 0 3.018.897 3.018.897l1.112-2.515s-1.334-.897-3.936-.897c-3.115 0-5.304 1.784-5.304 4.298 0 1.893 1.334 2.897 3.115 3.513 1.626.604 2.512 1.114 2.512 1.803 0 .623-.511 1.114-1.626 1.114-2.234 0-3.936-1.335-3.936-1.335l-1.112 2.515s1.626 1.335 4.653 1.335c3.115 0 5.496-1.56 5.496-4.298.001-1.893-1.432-2.897-3.213-3.513z"/>
              </svg>
              <span>Credit Card</span>
            </button>
          </div>
        </div>
        
        <div class="donation-footer">
          <p class="commitment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            Nebula will always remain free and open-source
          </p>
          <button class="maybe-later-btn" on:click={handleMaybeLater}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .donation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
    padding: 20px;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .donation-modal {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 24px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
    animation: slideUp 0.3s ease;
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }
  
  .close-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .close-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .donation-header {
    text-align: center;
    padding: 40px 40px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .icon-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  }
  
  .icon-circle svg {
    width: 40px;
    height: 40px;
    color: white;
  }
  
  .donation-header h2 {
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .tagline {
    font-size: 16px;
    color: #94a3b8;
    margin: 0;
  }
  
  .donation-content {
    padding: 32px 40px 40px;
  }
  
  .benefits {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  
  .benefit-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 14px;
    color: #e2e8f0;
  }
  
  .benefit-icon {
    font-size: 24px;
  }
  
  .select-label, .payment-label {
    font-size: 14px;
    font-weight: 600;
    color: #cbd5e1;
    margin-bottom: 16px;
  }
  
  .amount-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .amount-btn {
    padding: 16px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .amount-btn:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: rgba(102, 126, 234, 0.5);
  }
  
  .amount-btn.selected {
    background: rgba(102, 126, 234, 0.2);
    border-color: #667eea;
  }
  
  .amount-label {
    font-size: 20px;
    font-weight: 700;
    color: #e2e8f0;
  }
  
  .amount-desc {
    font-size: 12px;
    color: #94a3b8;
  }
  
  .custom-input-wrapper {
    position: relative;
    margin-top: 12px;
  }
  
  .currency-symbol {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    font-weight: 600;
    color: #94a3b8;
  }
  
  .custom-input {
    width: 100%;
    padding: 14px 16px 14px 36px;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #e2e8f0;
    font-size: 16px;
    transition: all 0.2s;
  }
  
  .custom-input:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
  
  .payment-methods {
    margin-top: 32px;
  }
  
  .payment-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .payment-btn {
    padding: 16px 20px;
    border-radius: 12px;
    border: 2px solid;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  
  .payment-btn svg {
    width: 24px;
    height: 24px;
  }
  
  .paypal-btn {
    background: #0070ba;
    border-color: #0070ba;
    color: white;
  }
  
  .paypal-btn:hover {
    background: #005a94;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 112, 186, 0.3);
  }
  
  .stripe-btn {
    background: #635bff;
    border-color: #635bff;
    color: white;
  }
  
  .stripe-btn:hover {
    background: #524bd0;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(99, 91, 255, 0.3);
  }
  
  .donation-footer {
    margin-top: 32px;
    text-align: center;
  }
  
  .commitment {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 14px;
    color: #94a3b8;
    margin-bottom: 16px;
  }
  
  .commitment svg {
    width: 18px;
    height: 18px;
    color: #10b981;
  }
  
  .maybe-later-btn {
    padding: 10px 24px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
  }
  
  .maybe-later-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
  }
  
  @media (max-width: 640px) {
    .donation-modal {
      margin: 0;
      border-radius: 24px 24px 0 0;
    }
    
    .benefits {
      grid-template-columns: 1fr;
    }
    
    .amount-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
