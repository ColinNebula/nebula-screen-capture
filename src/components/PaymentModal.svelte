<script>
  import { createEventDispatcher } from 'svelte';
  import { user } from '../stores/user.js';
  import { addNotification } from '../stores/notifications.js';
  import securePaymentService from '../services/securePaymentService.js';
  
  export let plan = { id: 'pro', name: 'Pro', price: '$9.99' };
  export let onClose = () => {};
  export let onPaymentSuccess = () => {};
  export let onPaymentError = () => {};
  
  const dispatch = createEventDispatcher();
  
  let paymentMethod = 'stripe';
  let isProcessing = false;
  let errors = {};
  
  let billingInfo = {
    email: $user?.email || '',
    country: '',
    zipCode: ''
  };
  
  let cardDetails = {
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  };
  
  const planPrices = {
    free: 0,
    pro: 9.99,
    premium: 19.99
  };
  
  const currentPlan = planPrices[plan.id] || planPrices.pro;
  
  function handleBillingChange(e) {
    const { name, value } = e.target;
    billingInfo[name] = value;
    if (errors[name]) {
      errors[name] = '';
    }
  }
  
  function handleCardChange(e) {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Format card number
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    
    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
    }
    
    // Format CVV
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    cardDetails[name] = formattedValue;
    if (errors[name]) {
      errors[name] = '';
    }
  }
  
  function validateForm() {
    const newErrors = {};
    
    // Validate billing info
    if (!billingInfo.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!billingInfo.country) {
      newErrors.country = 'Country is required';
    }
    
    if (!billingInfo.zipCode) {
      newErrors.zipCode = 'Zip code is required';
    }
    
    // Validate card details for Stripe
    if (paymentMethod === 'stripe') {
      if (!cardDetails.cardNumber) {
        newErrors.cardNumber = 'Card number is required';
      } else if (cardDetails.cardNumber.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = 'Invalid card number';
      }
      
      if (!cardDetails.cardName) {
        newErrors.cardName = 'Cardholder name is required';
      }
      
      if (!cardDetails.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
        newErrors.expiryDate = 'Invalid format (MM/YY)';
      }
      
      if (!cardDetails.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (cardDetails.cvv.length < 3) {
        newErrors.cvv = 'Invalid CVV';
      }
    }
    
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm()) {
      return;
    }
    
    isProcessing = true;
    errors = {};
    
    try {
      let result;
      
      if (paymentMethod === 'stripe') {
        result = await securePaymentService.processStripePayment({
          plan: {
            id: plan.id,
            name: plan.name,
            price: currentPlan
          },
          userId: $user.id || $user.email,
          billingInfo,
          cardDetails
        });
      } else {
        // PayPal would be handled by PayPal button
        errors.general = 'Please use the PayPal button below';
        isProcessing = false;
        return;
      }
      
      if (result.success) {
        addNotification(`Successfully upgraded to ${plan.name} plan! 🎉`, 'success');
        
        // Update user in store
        user.update(u => ({
          ...u,
          plan: plan.id,
          subscription: result.subscription
        }));
        
        onPaymentSuccess(result);
        dispatch('success', result);
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      errors.general = error.message || 'Payment processing failed. Please try again.';
      addNotification('Payment failed: ' + error.message, 'error');
      onPaymentError(error);
    } finally {
      isProcessing = false;
    }
  }
  
  function handleClose() {
    if (!isProcessing) {
      onClose();
      dispatch('close');
    }
  }
</script>

<div class="payment-modal-overlay" on:click={handleClose}>
  <div class="payment-modal" on:click|stopPropagation>
    <button class="close-button" on:click={handleClose} disabled={isProcessing}>
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
    
    <div class="payment-header">
      <h2>Upgrade to {plan.name}</h2>
      <p class="payment-subtitle">Complete your purchase securely</p>
    </div>
    
    <div class="payment-summary">
      <div class="summary-row">
        <span>Plan</span>
        <span class="summary-value">{plan.name}</span>
      </div>
      <div class="summary-row">
        <span>Billing Cycle</span>
        <span class="summary-value">Monthly</span>
      </div>
      <div class="summary-row total">
        <span>Total Due Today</span>
        <span class="summary-value">${currentPlan.toFixed(2)} USD</span>
      </div>
    </div>
    
    {#if errors.general}
      <div class="error-banner">
        ⚠️ {errors.general}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-section">
        <h3>Payment Method</h3>
        <div class="payment-method-buttons">
          <button 
            type="button"
            class="method-btn {paymentMethod === 'stripe' ? 'active' : ''}"
            on:click={() => paymentMethod = 'stripe'}
            disabled={isProcessing}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v18H3V3zm16 16V5H5v14h14z"/>
            </svg>
            Credit Card
          </button>
          <button 
            type="button"
            class="method-btn {paymentMethod === 'paypal' ? 'active' : ''}"
            on:click={() => paymentMethod = 'paypal'}
            disabled={isProcessing}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.32 21.97a.546.546 0 0 1-.26-.32c-.03-.15-.01-.3.05-.44l2.12-7.44H7.5c-.44 0-.83-.24-1.03-.63-.2-.39-.16-.85.11-1.2l9-11.5a.55.55 0 0 1 .7-.14c.24.12.38.36.36.62l-.5 7.44h2.73c.44 0 .83.24 1.03.63.2.39.16.85-.11 1.2l-9 11.5a.55.55 0 0 1-.47.28z"/>
            </svg>
            PayPal
          </button>
        </div>
      </div>
      
      <div class="form-section">
        <h3>Billing Information</h3>
        
        <div class="form-group">
          <label for="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            bind:value={billingInfo.email}
            on:input={handleBillingChange}
            class:error={errors.email}
            disabled={isProcessing}
            placeholder="your@email.com"
          />
          {#if errors.email}
            <span class="error-text">{errors.email}</span>
          {/if}
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="country">Country *</label>
            <select
              id="country"
              name="country"
              bind:value={billingInfo.country}
              on:change={handleBillingChange}
              class:error={errors.country}
              disabled={isProcessing}
            >
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="JP">Japan</option>
              <option value="Other">Other</option>
            </select>
            {#if errors.country}
              <span class="error-text">{errors.country}</span>
            {/if}
          </div>
          
          <div class="form-group">
            <label for="zipCode">Zip Code *</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              bind:value={billingInfo.zipCode}
              on:input={handleBillingChange}
              class:error={errors.zipCode}
              disabled={isProcessing}
              placeholder="12345"
            />
            {#if errors.zipCode}
              <span class="error-text">{errors.zipCode}</span>
            {/if}
          </div>
        </div>
      </div>
      
      {#if paymentMethod === 'stripe'}
        <div class="form-section">
          <h3>Card Details</h3>
          
          <div class="form-group">
            <label for="cardNumber">Card Number *</label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={cardDetails.cardNumber}
              on:input={handleCardChange}
              class:error={errors.cardNumber}
              disabled={isProcessing}
              placeholder="1234 5678 9012 3456"
              maxlength="19"
            />
            {#if errors.cardNumber}
              <span class="error-text">{errors.cardNumber}</span>
            {/if}
          </div>
          
          <div class="form-group">
            <label for="cardName">Cardholder Name *</label>
            <input
              type="text"
              id="cardName"
              name="cardName"
              value={cardDetails.cardName}
              on:input={handleCardChange}
              class:error={errors.cardName}
              disabled={isProcessing}
              placeholder="John Doe"
            />
            {#if errors.cardName}
              <span class="error-text">{errors.cardName}</span>
            {/if}
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="expiryDate">Expiry Date *</label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                value={cardDetails.expiryDate}
                on:input={handleCardChange}
                class:error={errors.expiryDate}
                disabled={isProcessing}
                placeholder="MM/YY"
                maxlength="5"
              />
              {#if errors.expiryDate}
                <span class="error-text">{errors.expiryDate}</span>
              {/if}
            </div>
            
            <div class="form-group">
              <label for="cvv">CVV *</label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                value={cardDetails.cvv}
                on:input={handleCardChange}
                class:error={errors.cvv}
                disabled={isProcessing}
                placeholder="123"
                maxlength="4"
              />
              {#if errors.cvv}
                <span class="error-text">{errors.cvv}</span>
              {/if}
            </div>
          </div>
        </div>
      {/if}
      
      <div class="security-badges">
        <div class="badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          Secure Payment
        </div>
        <div class="badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
          SSL Encrypted
        </div>
        <div class="badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.07-.35-.11-.54-.11H13v-6c0-.83-.67-1.5-1.5-1.5S10 6.67 10 7.5v10.74l-3.43-.72c-.08-.01-.15-.03-.24-.03-.31 0-.59.13-.79.33l-.79.8 4.94 4.94c.27.27.65.44 1.06.44h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.02-.14.02-.2 0-.62-.38-1.16-.91-1.38z"/>
          </svg>
          No Card Storage
        </div>
      </div>
      
      <button 
        type="submit" 
        class="pay-button"
        disabled={isProcessing}
      >
        {#if isProcessing}
          <span class="spinner"></span>
          Processing...
        {:else}
          Pay ${currentPlan.toFixed(2)} USD
        {/if}
      </button>
      
      {#if paymentMethod === 'paypal'}
        <div class="paypal-info">
          <p>You'll be redirected to PayPal to complete your purchase</p>
        </div>
      {/if}
    </form>
    
    <div class="payment-footer">
      <p>By completing this purchase, you agree to our <a href="/terms.html" target="_blank">Terms of Service</a></p>
    </div>
  </div>
</div>

<style>
  .payment-modal-overlay {
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
    z-index: 10000;
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
  
  .payment-modal {
    background: var(--modal-bg, #ffffff);
    border-radius: 16px;
    max-width: 600px;
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
  }
  
  .close-button:hover {
    background: var(--hover-bg, #f1f5f9);
    color: var(--text-primary, #1e293b);
  }
  
  .close-button svg {
    width: 24px;
    height: 24px;
  }
  
  .payment-header {
    padding: 2rem 2rem 1rem;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }
  
  .payment-header h2 {
    margin: 0 0 0.5rem;
    color: var(--text-primary, #1e293b);
    font-size: 1.75rem;
    font-weight: 700;
  }
  
  .payment-subtitle {
    margin: 0;
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
  }
  
  .payment-summary {
    padding: 1.5rem 2rem;
    background: var(--summary-bg, #f8fafc);
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
  }
  
  .summary-row:last-child {
    margin-bottom: 0;
  }
  
  .summary-row.total {
    font-size: 1.125rem;
    font-weight: 700;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color, #e2e8f0);
    margin-top: 0.75rem;
    color: var(--primary-color, #667eea);
  }
  
  .error-banner {
    background: #fef2f2;
    color: #dc2626;
    padding: 1rem;
    margin: 1rem 2rem;
    border-radius: 8px;
    border-left: 4px solid #dc2626;
    font-size: 0.875rem;
  }
  
  form {
    padding: 2rem;
  }
  
  .form-section {
    margin-bottom: 2rem;
  }
  
  .form-section h3 {
    margin: 0 0 1rem;
    color: var(--text-primary, #1e293b);
    font-size: 1rem;
    font-weight: 600;
  }
  
  .payment-method-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .method-btn {
    padding: 1rem;
    border: 2px solid var(--border-color, #e2e8f0);
    background: var(--button-bg, #ffffff);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--text-secondary, #64748b);
    transition: all 0.2s;
  }
  
  .method-btn:hover {
    border-color: var(--primary-color, #667eea);
  }
  
  .method-btn.active {
    border-color: var(--primary-color, #667eea);
    background: var(--primary-light, #eef2ff);
    color: var(--primary-color, #667eea);
  }
  
  .method-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-primary, #1e293b);
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  input, select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 2px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    font-size: 1rem;
    color: var(--text-primary, #1e293b);
    background: var(--input-bg, #ffffff);
    transition: all 0.2s;
  }
  
  input:focus, select:focus {
    outline: none;
    border-color: var(--primary-color, #667eea);
  }
  
  input.error, select.error {
    border-color: #dc2626;
  }
  
  input:disabled, select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .error-text {
    display: block;
    color: #dc2626;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  .security-badges {
    display: flex;
    gap: 1rem;
    margin: 1.5rem 0;
    flex-wrap: wrap;
  }
  
  .badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary, #64748b);
    font-size: 0.75rem;
  }
  
  .badge svg {
    width: 16px;
    height: 16px;
    color: var(--success-color, #10b981);
  }
  
  .pay-button {
    width: 100%;
    padding: 1rem;
    background: var(--primary-color, #667eea);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .pay-button:hover:not(:disabled) {
    background: var(--primary-hover, #5568d3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .pay-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .paypal-info {
    text-align: center;
    margin-top: 1rem;
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
  }
  
  .payment-footer {
    padding: 1rem 2rem 2rem;
    text-align: center;
    font-size: 0.75rem;
    color: var(--text-secondary, #64748b);
  }
  
  .payment-footer a {
    color: var(--primary-color, #667eea);
    text-decoration: none;
  }
  
  .payment-footer a:hover {
    text-decoration: underline;
  }
  
  /* Dark mode */
  :global([data-theme="dark"]) .payment-modal {
    --modal-bg: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border-color: #334155;
    --summary-bg: #0f172a;
    --button-bg: #0f172a;
    --input-bg: #0f172a;
    --hover-bg: #334155;
  }
  
  @media (max-width: 640px) {
    .payment-method-buttons {
      grid-template-columns: 1fr;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .security-badges {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
</style>
