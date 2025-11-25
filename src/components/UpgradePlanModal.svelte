<script>
  import { createEventDispatcher } from 'svelte';
  import { user } from '../stores/user.js';
  import PaymentModal from './PaymentModal.svelte';
  
  export let currentPlan = 'free';
  export let onClose = () => {};
  export let onUpgrade = () => {};
  
  const dispatch = createEventDispatcher();
  
  let showPaymentModal = false;
  let selectedPlan = null;
  
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Up to 10 recordings per month',
        '720p video quality',
        '500 MB storage',
        'Basic editing tools',
        'Community support'
      ],
      color: '#94a3b8',
      current: currentPlan === 'free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99',
      period: 'per month',
      features: [
        'Unlimited recordings',
        '1080p video quality',
        '10 GB storage',
        'Advanced editing tools',
        'Priority support',
        'Custom branding',
        'Team collaboration'
      ],
      color: '#34d399',
      popular: true,
      current: currentPlan === 'pro'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99',
      period: 'per month',
      features: [
        'Everything in Pro',
        '4K video quality',
        '100 GB storage',
        'AI-powered editing',
        '24/7 premium support',
        'API access',
        'Advanced analytics',
        'White-label solution'
      ],
      color: '#fbbf24',
      current: currentPlan === 'premium'
    }
  ];
  
  function handleUpgradeClick(plan) {
    if (plan.id === currentPlan) {
      return; // Already on this plan
    }
    
    if (plan.id === 'free') {
      // Handle downgrade
      return;
    }
    
    selectedPlan = plan;
    showPaymentModal = true;
  }
  
  function handlePaymentClose() {
    showPaymentModal = false;
    selectedPlan = null;
  }
  
  function handlePaymentSuccess(result) {
    showPaymentModal = false;
    onUpgrade(selectedPlan.id, result);
    dispatch('upgrade', { plan: selectedPlan.id, result });
    onClose();
  }
  
  function handlePaymentError(error) {
    console.error('Payment error:', error);
    // Keep modal open to allow retry
  }
  
  function handleClose() {
    if (!showPaymentModal) {
      onClose();
      dispatch('close');
    }
  }
</script>

<div class="upgrade-modal-overlay" on:click={handleClose}>
  <div class="upgrade-modal" on:click|stopPropagation>
    <button class="close-button" on:click={handleClose}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
    
    <div class="modal-header">
      <h2>Upgrade Your Plan</h2>
      <p>Choose the perfect plan for your needs</p>
    </div>
    
    <div class="plans-container">
      {#each plans as plan}
        <div 
          class="plan-card {plan.current ? 'current' : ''}"
          style="--plan-color: {plan.color}"
        >
          {#if plan.popular}
            <div class="popular-badge">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Most Popular
            </div>
          {/if}
          
          <div class="plan-header">
            <h3 class="plan-name">{plan.name}</h3>
            <div class="plan-price">
              <span class="price-amount">{plan.price}</span>
              <span class="price-period">/{plan.period.split(' ')[plan.period.split(' ').length - 1]}</span>
            </div>
          </div>
          
          <ul class="plan-features">
            {#each plan.features as feature}
              <li>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                {feature}
              </li>
            {/each}
          </ul>
          
          <button 
            class="upgrade-button {plan.current ? 'current' : ''}"
            on:click={() => handleUpgradeClick(plan)}
            disabled={plan.current}
          >
            {#if plan.current}
              Current Plan
            {:else if plan.id === 'free'}
              Downgrade
            {:else}
              Upgrade Now
            {/if}
          </button>
        </div>
      {/each}
    </div>
    
    <div class="modal-footer">
      <div class="guarantee">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
        </svg>
        <div>
          <strong>30-Day Money-Back Guarantee</strong>
          <p>Cancel anytime, no questions asked</p>
        </div>
      </div>
    </div>
  </div>
</div>

{#if showPaymentModal && selectedPlan}
  <PaymentModal
    plan={selectedPlan}
    onClose={handlePaymentClose}
    onPaymentSuccess={handlePaymentSuccess}
    onPaymentError={handlePaymentError}
  />
{/if}

<style>
  .upgrade-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .upgrade-modal {
    background: var(--modal-bg, #ffffff);
    border-radius: 16px;
    max-width: 1200px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    position: relative;
    animation: slideUp 0.3s ease;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    color: var(--text-secondary, #64748b);
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s;
    z-index: 10;
  }
  
  .close-button:hover {
    background: var(--hover-bg, #f1f5f9);
    color: var(--text-primary, #1e293b);
  }
  
  .close-button svg {
    width: 24px;
    height: 24px;
  }
  
  .modal-header {
    padding: 3rem 2rem 2rem;
    text-align: center;
  }
  
  .modal-header h2 {
    margin: 0 0 0.5rem;
    color: var(--text-primary, #1e293b);
    font-size: 2rem;
    font-weight: 700;
  }
  
  .modal-header p {
    margin: 0;
    color: var(--text-secondary, #64748b);
    font-size: 1rem;
  }
  
  .plans-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
  }
  
  .plan-card {
    background: var(--card-bg, #ffffff);
    border: 2px solid var(--border-color, #e2e8f0);
    border-radius: 12px;
    padding: 2rem;
    position: relative;
    transition: all 0.3s;
  }
  
  .plan-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--plan-color);
  }
  
  .plan-card.current {
    border-color: var(--plan-color);
    box-shadow: 0 0 0 1px var(--plan-color);
  }
  
  .popular-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  .popular-badge svg {
    width: 14px;
    height: 14px;
  }
  
  .plan-header {
    text-align: center;
    margin-bottom: 1.5rem;
    padding-top: 0.5rem;
  }
  
  .plan-name {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    color: var(--plan-color);
  }
  
  .plan-price {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.25rem;
  }
  
  .price-amount {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text-primary, #1e293b);
  }
  
  .price-period {
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
  }
  
  .plan-features {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem;
  }
  
  .plan-features li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    color: var(--text-secondary, #475569);
    font-size: 0.875rem;
  }
  
  .plan-features svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: var(--plan-color);
    margin-top: 2px;
  }
  
  .upgrade-button {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--plan-color);
    color: white;
  }
  
  .upgrade-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .upgrade-button.current {
    background: var(--success-bg, #d1fae5);
    color: var(--success-color, #059669);
    cursor: default;
  }
  
  .upgrade-button:disabled {
    cursor: not-allowed;
  }
  
  .modal-footer {
    padding: 2rem;
    border-top: 1px solid var(--border-color, #e2e8f0);
    background: var(--footer-bg, #f8fafc);
  }
  
  .guarantee {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: left;
  }
  
  .guarantee svg {
    width: 48px;
    height: 48px;
    color: var(--success-color, #10b981);
    flex-shrink: 0;
  }
  
  .guarantee strong {
    display: block;
    color: var(--text-primary, #1e293b);
    margin-bottom: 0.25rem;
  }
  
  .guarantee p {
    margin: 0;
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
  }
  
  /* Dark mode */
  :global([data-theme="dark"]) .upgrade-modal {
    --modal-bg: #1e293b;
    --card-bg: #0f172a;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border-color: #334155;
    --hover-bg: #334155;
    --footer-bg: #0f172a;
    --success-bg: #064e3b;
    --success-color: #10b981;
  }
  
  @media (max-width: 768px) {
    .plans-container {
      grid-template-columns: 1fr;
    }
    
    .modal-header {
      padding: 2rem 1rem 1rem;
    }
    
    .modal-header h2 {
      font-size: 1.5rem;
    }
    
    .plans-container {
      padding: 1rem;
    }
    
    .plan-card {
      padding: 1.5rem;
    }
    
    .guarantee {
      flex-direction: column;
      text-align: center;
    }
  }
</style>
