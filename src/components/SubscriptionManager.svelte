<script>
  import { onMount } from 'svelte';
  import { user } from '../stores/user.js';
  import { addNotification } from '../stores/notifications.js';
  import subscriptionService from '../services/subscriptionService.js';
  import UpgradePlanModal from './UpgradePlanModal.svelte';
  
  let subscription = null;
  let usage = null;
  let loading = true;
  let showUpgradeModal = false;
  let showCancelModal = false;
  let cancelReason = '';
  
  onMount(async () => {
    await loadSubscriptionData();
  });
  
  async function loadSubscriptionData() {
    loading = true;
    try {
      if ($user) {
        subscription = await subscriptionService.getUserSubscription($user.id || $user.email);
        usage = await subscriptionService.getUsageStats($user.id || $user.email);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      addNotification('Failed to load subscription data', 'error');
    } finally {
      loading = false;
    }
  }
  
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  function getPlanBadgeColor(plan) {
    const colors = {
      free: '#94a3b8',
      pro: '#34d399',
      premium: '#fbbf24'
    };
    return colors[plan] || colors.free;
  }
  
  function getStoragePercentage() {
    if (!usage || !subscription) return 0;
    const features = subscriptionService.getSubscriptionFeatures(subscription.plan);
    return (usage.storageUsed / features.storage) * 100;
  }
  
  function getStorageBarColor() {
    const percentage = getStoragePercentage();
    if (percentage >= 90) return '#dc2626';
    if (percentage >= 75) return '#f59e0b';
    return '#10b981';
  }
  
  async function handleCancelSubscription() {
    if (!cancelReason.trim()) {
      addNotification('Please provide a reason for cancellation', 'warning');
      return;
    }
    
    try {
      await subscriptionService.cancelSubscription($user.id || $user.email, cancelReason);
      addNotification('Subscription cancelled successfully', 'success');
      showCancelModal = false;
      cancelReason = '';
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      addNotification('Failed to cancel subscription: ' + error.message, 'error');
    }
  }
  
  async function handleReactivate() {
    try {
      await subscriptionService.reactivateSubscription($user.id || $user.email);
      addNotification('Subscription reactivated! 🎉', 'success');
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      addNotification('Failed to reactivate subscription', 'error');
    }
  }
  
  function handleUpgrade(planId, result) {
    addNotification(`Successfully upgraded to ${planId}! 🚀`, 'success');
    loadSubscriptionData();
  }
</script>

<div class="subscription-manager">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading subscription details...</p>
    </div>
  {:else}
    <div class="manager-header">
      <h2>Subscription Management</h2>
      <p>Manage your plan and billing</p>
    </div>
    
    <!-- Current Plan Card -->
    <div class="card plan-card">
      <div class="card-header">
        <h3>Current Plan</h3>
        {#if subscription}
          <span 
            class="plan-badge" 
            style="background-color: {getPlanBadgeColor(subscription.plan)}"
          >
            {subscription.plan.toUpperCase()}
          </span>
        {/if}
      </div>
      
      {#if subscription}
        <div class="plan-details">
          <div class="detail-row">
            <span class="label">Status</span>
            <span class="value {subscription.status}">
              {subscription.status === 'active' ? '✓ Active' : 
               subscription.status === 'cancelled' ? '⚠ Cancelled' : 
               subscription.status}
            </span>
          </div>
          
          <div class="detail-row">
            <span class="label">Plan</span>
            <span class="value">{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Amount</span>
            <span class="value">${subscription.amount.toFixed(2)} USD/{subscription.billingCycle}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Started</span>
            <span class="value">{formatDate(subscription.startDate)}</span>
          </div>
          
          {#if subscription.nextBillingDate}
            <div class="detail-row">
              <span class="label">Next Billing</span>
              <span class="value">{formatDate(subscription.nextBillingDate)}</span>
            </div>
          {/if}
          
          {#if subscription.status === 'cancelled' && subscription.endDate}
            <div class="detail-row warning">
              <span class="label">Access Until</span>
              <span class="value">{formatDate(subscription.endDate)}</span>
            </div>
          {/if}
        </div>
        
        <div class="plan-actions">
          {#if subscription.plan !== 'premium'}
            <button class="action-btn primary" on:click={() => showUpgradeModal = true}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14l5-5 5 5H7z"/>
              </svg>
              Upgrade Plan
            </button>
          {/if}
          
          {#if subscription.status === 'active' && subscription.plan !== 'free'}
            <button class="action-btn danger" on:click={() => showCancelModal = true}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
              Cancel Subscription
            </button>
          {/if}
          
          {#if subscription.status === 'cancelled'}
            <button class="action-btn success" on:click={handleReactivate}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Reactivate Subscription
            </button>
          {/if}
        </div>
      {:else}
        <div class="no-subscription">
          <p>You're currently on the Free plan</p>
          <button class="action-btn primary" on:click={() => showUpgradeModal = true}>
            Upgrade to Pro or Premium
          </button>
        </div>
      {/if}
    </div>
    
    <!-- Usage Stats Card -->
    {#if usage}
      <div class="card usage-card">
        <div class="card-header">
          <h3>Usage Statistics</h3>
        </div>
        
        <div class="usage-stats">
          <div class="stat-item">
            <div class="stat-label">Recordings This Month</div>
            <div class="stat-value">{usage.recordingsThisMonth}</div>
          </div>
          
          <div class="stat-item">
            <div class="stat-label">Total Recordings</div>
            <div class="stat-value">{usage.totalRecordings}</div>
          </div>
          
          <div class="stat-item full-width">
            <div class="stat-label">Storage Used</div>
            <div class="storage-bar">
              <div 
                class="storage-progress" 
                style="width: {getStoragePercentage()}%; background-color: {getStorageBarColor()}"
              ></div>
            </div>
            <div class="storage-text">
              {usage.storageUsed.toFixed(2)} {usage.storageUnit} / 
              {#if subscription}
                {subscriptionService.getSubscriptionFeatures(subscription.plan).storage} MB
              {:else}
                500 MB
              {/if}
              ({getStoragePercentage().toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Payment Method Card -->
    {#if subscription && subscription.paymentMethod}
      <div class="card payment-card">
        <div class="card-header">
          <h3>Payment Method</h3>
        </div>
        
        <div class="payment-details">
          <div class="payment-method">
            <svg viewBox="0 0 24 24" fill="currentColor">
              {#if subscription.paymentMethod === 'stripe'}
                <path d="M3 3h18v18H3V3zm16 16V5H5v14h14z"/>
              {:else}
                <path d="M8.32 21.97a.546.546 0 0 1-.26-.32c-.03-.15-.01-.3.05-.44l2.12-7.44H7.5c-.44 0-.83-.24-1.03-.63-.2-.39-.16-.85.11-1.2l9-11.5a.55.55 0 0 1 .7-.14c.24.12.38.36.36.62l-.5 7.44h2.73c.44 0 .83.24 1.03.63.2.39.16.85-.11 1.2l-9 11.5a.55.55 0 0 1-.47.28z"/>
              {/if}
            </svg>
            <span>{subscription.paymentMethod === 'stripe' ? 'Credit Card' : 'PayPal'}</span>
          </div>
          
          <div class="billing-info">
            <div class="info-row">
              <span class="info-label">Billing Email</span>
              <span class="info-value">{subscription.billingInfo?.email || 'Not provided'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Country</span>
              <span class="info-value">{subscription.billingInfo?.country || 'Not provided'}</span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Cancel Modal -->
{#if showCancelModal}
  <div class="modal-overlay" on:click={() => showCancelModal = false}>
    <div class="modal cancel-modal" on:click|stopPropagation>
      <h3>Cancel Subscription</h3>
      <p>We're sorry to see you go! Your subscription will remain active until the end of your billing period.</p>
      
      <div class="form-group">
        <label for="cancelReason">Please tell us why you're cancelling (optional)</label>
        <textarea
          id="cancelReason"
          bind:value={cancelReason}
          placeholder="Your feedback helps us improve..."
          rows="4"
        ></textarea>
      </div>
      
      <div class="modal-actions">
        <button class="action-btn" on:click={() => showCancelModal = false}>
          Keep Subscription
        </button>
        <button class="action-btn danger" on:click={handleCancelSubscription}>
          Confirm Cancellation
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Upgrade Modal -->
{#if showUpgradeModal}
  <UpgradePlanModal
    currentPlan={subscription?.plan || 'free'}
    onClose={() => showUpgradeModal = false}
    onUpgrade={handleUpgrade}
  />
{/if}

<style>
  .subscription-manager {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
  }
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border-color, #e2e8f0);
    border-top-color: var(--primary-color, #667eea);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .manager-header {
    margin-bottom: 2rem;
  }
  
  .manager-header h2 {
    margin: 0 0 0.5rem;
    color: var(--text-primary, #1e293b);
    font-size: 2rem;
    font-weight: 700;
  }
  
  .manager-header p {
    margin: 0;
    color: var(--text-secondary, #64748b);
  }
  
  .card {
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .card-header h3 {
    margin: 0;
    color: var(--text-primary, #1e293b);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .plan-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .plan-details {
    margin-bottom: 1.5rem;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .detail-row.warning {
    background: #fef2f2;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-top: 0.5rem;
  }
  
  .label {
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
  }
  
  .value {
    color: var(--text-primary, #1e293b);
    font-weight: 600;
  }
  
  .value.active {
    color: #10b981;
  }
  
  .value.cancelled {
    color: #f59e0b;
  }
  
  .plan-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .action-btn {
    flex: 1;
    min-width: 150px;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }
  
  .action-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .action-btn.primary {
    background: var(--primary-color, #667eea);
    color: white;
  }
  
  .action-btn.primary:hover {
    background: var(--primary-hover, #5568d3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .action-btn.danger {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  
  .action-btn.danger:hover {
    background: #dc2626;
    color: white;
  }
  
  .action-btn.success {
    background: #d1fae5;
    color: #059669;
    border: 1px solid #a7f3d0;
  }
  
  .action-btn.success:hover {
    background: #10b981;
    color: white;
  }
  
  .no-subscription {
    text-align: center;
    padding: 2rem;
  }
  
  .no-subscription p {
    margin: 0 0 1rem;
    color: var(--text-secondary, #64748b);
  }
  
  .usage-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .stat-item.full-width {
    grid-column: 1 / -1;
    text-align: left;
  }
  
  .stat-label {
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    color: var(--text-primary, #1e293b);
    font-size: 2rem;
    font-weight: 700;
  }
  
  .storage-bar {
    width: 100%;
    height: 8px;
    background: var(--border-color, #e2e8f0);
    border-radius: 4px;
    overflow: hidden;
    margin: 0.5rem 0;
  }
  
  .storage-progress {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: 4px;
  }
  
  .storage-text {
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
  }
  
  .payment-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .payment-method {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--summary-bg, #f8fafc);
    border-radius: 8px;
  }
  
  .payment-method svg {
    width: 32px;
    height: 32px;
    color: var(--primary-color, #667eea);
  }
  
  .payment-method span {
    font-weight: 600;
    color: var(--text-primary, #1e293b);
  }
  
  .billing-info {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
  }
  
  .info-label {
    color: var(--text-secondary, #64748b);
    font-size: 0.875rem;
  }
  
  .info-value {
    color: var(--text-primary, #1e293b);
    font-weight: 500;
  }
  
  /* Modal styles */
  .modal-overlay {
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
  }
  
  .modal {
    background: var(--modal-bg, #ffffff);
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
  }
  
  .modal h3 {
    margin: 0 0 1rem;
    color: var(--text-primary, #1e293b);
    font-size: 1.5rem;
  }
  
  .modal p {
    margin: 0 0 1.5rem;
    color: var(--text-secondary, #64748b);
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-primary, #1e293b);
    font-weight: 500;
  }
  
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border-color, #e2e8f0);
    border-radius: 8px;
    font-family: inherit;
    resize: vertical;
  }
  
  textarea:focus {
    outline: none;
    border-color: var(--primary-color, #667eea);
  }
  
  .modal-actions {
    display: flex;
    gap: 1rem;
  }
  
  /* Dark mode */
  :global([data-theme="dark"]) .subscription-manager {
    --card-bg: #1e293b;
    --modal-bg: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --border-color: #334155;
    --summary-bg: #0f172a;
  }
  
  @media (max-width: 640px) {
    .subscription-manager {
      padding: 1rem;
    }
    
    .plan-actions {
      flex-direction: column;
    }
    
    .action-btn {
      width: 100%;
    }
    
    .usage-stats {
      grid-template-columns: 1fr;
    }
    
    .modal-actions {
      flex-direction: column;
    }
  }
</style>
