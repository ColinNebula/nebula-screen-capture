# 🔒 Secure Pro Upgrade System

## Overview

A comprehensive, secure payment and subscription management system that allows users to safely upgrade to Pro or Premium plans.

## 🎯 Key Features

### Security Features
- ✅ **No Card Storage**: Never stores card data locally
- ✅ **Tokenization**: All payment data tokenized by Stripe/PayPal
- ✅ **Input Validation**: Client and server-side validation
- ✅ **Webhook Verification**: Payment confirmation via webhooks
- ✅ **Encrypted Communication**: HTTPS only
- ✅ **Rate Limiting**: Prevents abuse
- ✅ **Fraud Detection**: Integrated with payment providers

### Subscription Management
- ✅ **Plan Upgrades**: Free → Pro → Premium
- ✅ **Plan Downgrades**: Grace period support
- ✅ **Cancellation**: Cancel anytime with access until period end
- ✅ **Reactivation**: Easy reactivation of cancelled subscriptions
- ✅ **Usage Tracking**: Monitor storage and recording limits
- ✅ **Billing History**: View all transactions

### Payment Methods
- 💳 **Stripe**: Credit/Debit cards
- 💰 **PayPal**: PayPal account or guest checkout

## 📁 File Structure

```
src/
├── services/
│   ├── subscriptionService.js      # Subscription management
│   ├── securePaymentService.js     # Secure payment processing
│   ├── firebase.js                 # Firebase initialization
│   └── paymentService.js           # Legacy (to be refactored)
├── components/
│   ├── PaymentModal.js             # Payment UI
│   ├── UpgradePlanModal.js         # Plan selection UI
│   ├── SubscriptionManager.svelte  # Manage subscription
│   └── PremiumFeature.js           # Feature access control
└── utils/
    └── planFeatures.js             # Plan configuration
```

## 🚀 Setup Instructions

### 1. Environment Variables

Create/update `.env`:

```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
VITE_STRIPE_SECRET_KEY=sk_test_YOUR_KEY  # Backend only!

# PayPal
VITE_PAYPAL_CLIENT_ID=YOUR_CLIENT_ID
VITE_PAYPAL_SECRET=YOUR_SECRET  # Backend only!

# Backend API
VITE_BACKEND_API_URL=https://your-api.com/api
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-PROJECT.cloudfunctions.net

# Firebase (optional - for production)
VITE_FIREBASE_API_KEY=YOUR_KEY
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT
# ... other Firebase config
```

### 2. Install Dependencies

```bash
npm install @stripe/stripe-js @paypal/react-paypal-js
```

### 3. Backend Setup (Required for Production)

Create these endpoints:

#### `/api/create-payment-intent` (POST)
```javascript
// Create Stripe payment intent
{
  planId: string,
  userId: string,
  amount: number,
  currency: string,
  billingInfo: object
}
```

#### `/api/verify-paypal-payment` (POST)
```javascript
// Verify PayPal order
{
  orderId: string,
  planId: string,
  userId: string
}
```

#### `/api/webhooks/stripe` (POST)
```javascript
// Handle Stripe webhooks
// Verify signature and process events
```

#### `/api/webhooks/paypal` (POST)
```javascript
// Handle PayPal webhooks
// Verify signature and process events
```

## 📖 Usage

### Basic Upgrade Flow

1. **User clicks "Upgrade"**
   ```javascript
   import UpgradePlanModal from './components/UpgradePlanModal';
   
   <UpgradePlanModal
     currentPlan="free"
     onClose={() => setShowUpgrade(false)}
     onUpgrade={handleUpgrade}
   />
   ```

2. **Select Plan** (Pro or Premium)

3. **Fill Payment Info**
   - Billing email, country, zip code
   - Payment method (Stripe or PayPal)
   - Card details (for Stripe)

4. **Process Payment**
   ```javascript
   import securePaymentService from './services/securePaymentService';
   
   const result = await securePaymentService.processStripePayment({
     plan: { id: 'pro', name: 'Pro' },
     userId: user.id,
     billingInfo: { email, country, zipCode }
   });
   ```

5. **Subscription Created**
   - User profile updated
   - Confirmation email sent
   - Features unlocked immediately

### Check Feature Access

```javascript
import subscriptionService from './services/subscriptionService';

const user = getCurrentUser();
const hasAccess = subscriptionService.hasFeatureAccess(
  user.plan, 
  'customBranding'
);

if (hasAccess) {
  // Show feature
} else {
  // Show upgrade prompt
}
```

### Get Usage Stats

```javascript
const stats = await subscriptionService.getUsageStats(userId);
console.log(stats);
// {
//   recordingsThisMonth: 5,
//   totalRecordings: 23,
//   storageUsed: 245.6,
//   storageUnit: 'MB'
// }
```

### Cancel Subscription

```javascript
await subscriptionService.cancelSubscription(
  userId, 
  'Not using enough'
);
```

### Reactivate Subscription

```javascript
await subscriptionService.reactivateSubscription(userId);
```

## 🎨 UI Components

### UpgradePlanModal
Shows plan comparison and selection
```javascript
<UpgradePlanModal
  currentPlan={user.plan}
  onClose={handleClose}
  onUpgrade={handleUpgrade}
/>
```

### PaymentModal
Handles payment collection
```javascript
<PaymentModal
  plan={{ id: 'pro', name: 'Pro', price: '$9.99' }}
  onClose={handleClose}
  onPaymentSuccess={handleSuccess}
  onPaymentError={handleError}
/>
```

### PremiumFeature
Restricts features to premium users
```javascript
<PremiumFeature
  feature="customBranding"
  userPlan={user.plan}
  onUpgrade={handleUpgrade}
>
  <BrandingSettings />
</PremiumFeature>
```

## 🔐 Security Best Practices

### DO ✅
- Use HTTPS in production
- Validate all input client and server-side
- Use environment variables for secrets
- Implement webhook signature verification
- Log security events
- Use PCI-compliant payment providers
- Implement rate limiting
- Hash/encrypt sensitive data

### DON'T ❌
- Store card numbers
- Store CVV codes
- Commit `.env` files
- Expose secret keys in client code
- Trust client-side validation alone
- Use HTTP in production
- Store payment tokens unnecessarily

## 🧪 Testing

### Demo Mode (No Backend)
The system works in demo mode without a backend:
- Simulates payment processing
- Creates local subscriptions
- Logs email notifications
- All features functional

### Test Mode (With Backend)
Use test credentials:

**Stripe:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**PayPal:**
- Use sandbox accounts
- Create in PayPal Developer Dashboard

### Production Mode
- Switch to live API keys
- Verify webhook endpoints
- Test with real payments (small amounts)
- Monitor logs and analytics

## 📊 Database Schema

### Subscriptions Collection
```javascript
{
  userId: string,              // User ID
  plan: 'free'|'pro'|'premium', // Current plan
  status: 'active'|'cancelled'|'expired',
  startDate: ISO8601,          // Subscription start
  endDate: ISO8601,            // End date (if cancelled)
  nextBillingDate: ISO8601,    // Next charge date
  billingCycle: 'monthly'|'yearly',
  amount: number,              // Price in USD
  paymentMethod: 'stripe'|'paypal',
  transactionId: string,       // Last transaction
  billingInfo: {
    email: string,
    country: string,
    zipCode: string
  },
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

### Transactions Collection
```javascript
{
  id: string,                  // Transaction ID
  userId: string,
  type: 'charge'|'refund',
  amount: number,
  currency: 'USD',
  status: 'succeeded'|'failed',
  paymentMethod: 'stripe'|'paypal',
  plan: string,
  timestamp: ISO8601,
  metadata: object
}
```

## 🔄 Webhook Handling

### Stripe Webhooks

1. **Configure in Stripe Dashboard**
   - Add endpoint: `https://your-api.com/api/webhooks/stripe`
   - Select events: `payment_intent.*`, `customer.subscription.*`
   - Copy signing secret

2. **Verify Signature**
   ```javascript
   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
   const sig = request.headers['stripe-signature'];
   
   const event = stripe.webhooks.constructEvent(
     request.body,
     sig,
     process.env.STRIPE_WEBHOOK_SECRET
   );
   ```

3. **Handle Events**
   ```javascript
   switch (event.type) {
     case 'payment_intent.succeeded':
       await activateSubscription(event.data.object);
       break;
     case 'customer.subscription.deleted':
       await deactivateSubscription(event.data.object);
       break;
   }
   ```

### PayPal Webhooks

1. **Configure in PayPal Dashboard**
   - Add webhook: `https://your-api.com/api/webhooks/paypal`
   - Select events: `PAYMENT.*`, `BILLING.SUBSCRIPTION.*`

2. **Verify Webhook**
   ```javascript
   const verification = await verifyPayPalWebhook(headers, body);
   if (!verification.verified) {
     throw new Error('Invalid webhook');
   }
   ```

## 📧 Email Notifications

Automatic emails sent for:
- ✅ Upgrade confirmation
- ✅ Payment successful
- ✅ Payment failed
- ✅ Subscription cancelled
- ✅ Renewal reminder
- ✅ Storage limit warnings

Configure in Firebase Functions or your backend.

## 🐛 Troubleshooting

### "Payment processing failed"
- Check API keys are correct
- Verify backend endpoint is accessible
- Check network console for errors
- Ensure webhook signatures match

### "Subscription not updating"
- Check database connection
- Verify user ID matches
- Check localStorage/Firebase sync
- Review console for errors

### "Feature still locked after upgrade"
- Reload page to refresh user data
- Check subscription status in database
- Verify plan name matches exactly
- Clear cache and try again

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [PayPal Developer Docs](https://developer.paypal.com/docs)
- [Payment Security Guide](./PAYMENT_SETUP.md)
- [Firebase Setup](./docs/FIREBASE_DEPLOY.md)

## 🚀 Production Deployment

1. **Backend Setup**
   - Deploy payment endpoints
   - Configure webhooks
   - Set up monitoring

2. **Environment Variables**
   - Switch to live keys
   - Update webhook secrets
   - Configure CORS

3. **Testing**
   - Test complete flow
   - Verify webhooks work
   - Check email delivery
   - Monitor error logs

4. **Go Live**
   - Update frontend to production
   - Monitor transactions
   - Set up alerts
   - Customer support ready

## 💡 Future Enhancements

- [ ] Annual billing with discount
- [ ] Coupon/promo code support
- [ ] Team/family plans
- [ ] Usage-based billing
- [ ] Multiple payment methods per user
- [ ] Automatic payment retry
- [ ] Invoice generation
- [ ] Tax calculation
- [ ] Multi-currency support
- [ ] Apple Pay / Google Pay

---

**Status:** Ready for testing and production deployment with backend integration  
**Last Updated:** October 20, 2025  
**Version:** 1.0.0
