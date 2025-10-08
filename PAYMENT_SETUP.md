# Payment Gateway Setup Guide

This guide will help you configure Stripe and PayPal payment processing for Nebula Screen Capture.

## Table of Contents
- [Overview](#overview)
- [Stripe Setup](#stripe-setup)
- [PayPal Setup](#paypal-setup)
- [Testing Payments](#testing-payments)
- [Going Live](#going-live)
- [Troubleshooting](#troubleshooting)

---

## Overview

Nebula Screen Capture supports two payment methods:
- **Stripe**: Credit/Debit card processing
- **PayPal**: PayPal account or guest checkout

Users can choose their preferred payment method during the upgrade process.

---

## Stripe Setup

### 1. Create a Stripe Account
1. Visit [https://stripe.com](https://stripe.com)
2. Click "Start now" and complete registration
3. Verify your email address

### 2. Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add them to your `.env` file:
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
REACT_APP_STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

### 3. Create Products and Prices
1. Go to [Products](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Create two products:

#### Pro Plan
- **Name**: Pro Plan
- **Pricing**: $9.99 USD / month (recurring)
- **Billing period**: Monthly
- Copy the **Price ID** (starts with `price_`)
- Add to `.env`:
```bash
REACT_APP_STRIPE_PRO_PRICE_ID=price_YOUR_PRO_ID_HERE
```

#### Premium Plan
- **Name**: Premium Plan
- **Pricing**: $19.99 USD / month (recurring)
- **Billing period**: Monthly
- Copy the **Price ID** (starts with `price_`)
- Add to `.env`:
```bash
REACT_APP_STRIPE_PREMIUM_PRICE_ID=price_YOUR_PREMIUM_ID_HERE
```

### 4. Enable Test Mode
- Make sure you're using **test mode** keys (they start with `test`)
- Toggle is in the top right of Stripe Dashboard

---

## PayPal Setup

### 1. Create a PayPal Developer Account
1. Visit [PayPal Developer](https://developer.paypal.com)
2. Log in with your PayPal account or create a new one
3. Go to [Dashboard](https://developer.paypal.com/dashboard/)

### 2. Create an App
1. Click "Apps & Credentials"
2. Make sure you're on the **Sandbox** tab
3. Click "Create App"
4. Enter app name (e.g., "Nebula Screen Capture")
5. Click "Create App"

### 3. Get Client ID
1. After creating the app, you'll see your **Client ID**
2. Copy it and add to `.env`:
```bash
REACT_APP_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_HERE
REACT_APP_PAYPAL_MODE=sandbox
```

### 4. Configure Return URLs (Optional for production)
1. In your app settings, add:
   - **Return URL**: Your app's payment success page
   - **Cancel URL**: Your app's payment cancel page

---

## Testing Payments

### Testing Stripe

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Any future expiry date (e.g., `12/25`) and any 3-digit CVV will work.

### Testing PayPal

1. Create sandbox accounts in [PayPal Sandbox](https://developer.paypal.com/dashboard/accounts)
2. Create a **Personal Account** (for buyer)
3. Use these credentials to test checkout
4. PayPal provides test accounts with email/password

**Default Sandbox Test Account:**
- Email: Will be shown in your sandbox accounts
- Password: Set when creating the sandbox account

---

## Going Live

### Stripe Production
1. Complete [Stripe account verification](https://dashboard.stripe.com/account/onboarding)
2. Switch to **Live mode** in Stripe Dashboard
3. Get your **live keys** (they start with `pk_live_` and `sk_live_`)
4. Update `.env`:
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
REACT_APP_STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
```
5. Create live products and update price IDs

### PayPal Production
1. Switch to **Live** tab in PayPal Developer Dashboard
2. Create a new app or use existing one
3. Get your **Live Client ID**
4. Update `.env`:
```bash
REACT_APP_PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID
REACT_APP_PAYPAL_MODE=production
```

### Environment Configuration
Update your `.env` for production:
```bash
NODE_ENV=production
REACT_APP_ENABLE_STRIPE=true
REACT_APP_ENABLE_PAYPAL=true
REACT_APP_CURRENCY=USD
```

---

## Current Implementation Status

### ✅ Completed Features
- Payment modal with Stripe and PayPal support
- Credit card form with real-time validation
- Billing information collection
- Payment method selection toggle
- Form validation and error handling
- Loading states during processing
- Security badges and trust indicators
- Dark mode support
- Responsive design

### 🔄 Mock Implementation (Ready for Integration)
The current implementation uses **mock payment processing**:
```javascript
// In PaymentModal.js
const handleStripePayment = async () => {
  // TODO: Replace with actual Stripe API integration
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulates API call
  return {
    success: true,
    transactionId: 'mock_' + Date.now(),
    // ...
  };
};
```

### 🚀 Next Steps for Production
1. **Backend API**: Create server endpoints to handle payments
   - `/api/create-payment-intent` for Stripe
   - `/api/paypal-checkout` for PayPal
2. **Stripe Integration**: Use `@stripe/stripe-js` and Stripe Elements
3. **PayPal Integration**: Use PayPal JavaScript SDK
4. **Webhooks**: Set up webhook handlers for payment events
5. **Database**: Store transaction records and update user subscriptions

---

## Environment Variables Reference

```bash
# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
REACT_APP_STRIPE_SECRET_KEY=sk_test_YOUR_KEY  # Backend only!
REACT_APP_STRIPE_PRO_PRICE_ID=price_XXX
REACT_APP_STRIPE_PREMIUM_PRICE_ID=price_XXX

# PayPal
REACT_APP_PAYPAL_CLIENT_ID=YOUR_CLIENT_ID
REACT_APP_PAYPAL_MODE=sandbox  # or 'production'

# Payment Settings
REACT_APP_CURRENCY=USD
REACT_APP_ENABLE_STRIPE=true
REACT_APP_ENABLE_PAYPAL=true
REACT_APP_PAYMENT_SUCCESS_URL=${PUBLIC_URL}/payment/success
REACT_APP_PAYMENT_CANCEL_URL=${PUBLIC_URL}/payment/cancel
```

---

## Troubleshooting

### Stripe Issues
- **Invalid API key**: Make sure you're using the correct mode (test vs live)
- **Price ID not found**: Verify the price ID exists in your Stripe products
- **Card declined**: Use test card numbers in test mode

### PayPal Issues
- **Client ID error**: Verify you copied the correct client ID from the right mode
- **Redirect issues**: Check return URLs are correctly configured
- **Sandbox login**: Make sure you're using sandbox test accounts

### General Issues
- **Environment variables not loading**: Restart your development server
- **CORS errors**: Backend API needs to allow requests from your frontend domain
- **Network errors**: Check browser console and network tab for specific errors

---

## Security Best Practices

1. **Never commit** `.env` file to git (it's in `.gitignore`)
2. **Never expose** secret keys in client-side code
3. **Always validate** payment amounts on the backend
4. **Use HTTPS** in production
5. **Implement webhooks** to handle payment events reliably
6. **Store sensitive keys** in environment variables or secret managers
7. **Validate user input** on both client and server
8. **Log security events** for audit trails

---

## Resources

### Stripe
- [Documentation](https://stripe.com/docs)
- [Testing Cards](https://stripe.com/docs/testing)
- [API Reference](https://stripe.com/docs/api)
- [React Integration](https://stripe.com/docs/stripe-js/react)

### PayPal
- [Developer Portal](https://developer.paypal.com)
- [JavaScript SDK](https://developer.paypal.com/sdk/js/)
- [Sandbox Testing](https://developer.paypal.com/tools/sandbox/)
- [API Reference](https://developer.paypal.com/api/rest/)

### Support
- For payment issues: Contact Stripe/PayPal support
- For app issues: Check the main README.md
- For security concerns: See SECURITY.md

---

## Payment Flow

```
User clicks "Upgrade" → 
  UpgradePlanModal opens →
    User selects plan (Pro/Premium) →
      PaymentModal opens →
        User selects payment method (Stripe/PayPal) →
          User fills billing info and payment details →
            Form validation runs →
              Payment processing begins →
                [Mock] Success/Error →
                  User plan upgraded →
                    Success notification shown
```

---

**Note**: This is a development setup guide. For production deployment, implement proper backend API endpoints, webhook handlers, and database integration for handling real payments and subscription management.
