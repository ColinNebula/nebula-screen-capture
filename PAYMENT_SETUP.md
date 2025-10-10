# Payment Integration Setup Guide# Payment Gateway Setup Guide



## ✅ What's ImplementedThis guide will help you configure Stripe and PayPal payment processing for Nebula Screen Capture.



### Payment Processing## Table of Contents

- **Stripe Integration**: Credit/debit card payments- [Overview](#overview)

- **PayPal Integration**: PayPal button with order creation- [Stripe Setup](#stripe-setup)

- **Card Validation**: Luhn algorithm for card number verification- [PayPal Setup](#paypal-setup)

- **Secure Handling**: PCI-compliant payment processing- [Testing Payments](#testing-payments)

- [Going Live](#going-live)

### Email Notifications- [Troubleshooting](#troubleshooting)

- Upgrade confirmation emails

- Transaction details---

- Plan feature lists

- Professional HTML templates## Overview



### FeaturesNebula Screen Capture supports two payment methods:

- Real-time payment processing- **Stripe**: Credit/Debit card processing

- Multiple payment methods- **PayPal**: PayPal account or guest checkout

- Automatic email confirmations

- Error handling and validationUsers can choose their preferred payment method during the upgrade process.

- Demo mode for testing

---

---

## Stripe Setup

## 🔧 Setup Instructions

### 1. Create a Stripe Account

### 1. Stripe Setup1. Visit [https://stripe.com](https://stripe.com)

2. Click "Start now" and complete registration

1. **Create Stripe Account**3. Verify your email address

   - Go to: https://dashboard.stripe.com/register

   - Complete account verification### 2. Get API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

2. **Get API Keys**2. Copy your **Publishable key** (starts with `pk_test_`)

   - Visit: https://dashboard.stripe.com/apikeys3. Copy your **Secret key** (starts with `sk_test_`)

   - Copy your **Publishable key** (starts with `pk_test_...`)4. Add them to your `.env` file:

   - Copy your **Secret key** (starts with `sk_test_...`)```bash

REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

3. **Add to Environment Variables**REACT_APP_STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

   ```bash```

   # In .env

   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE### 3. Create Products and Prices

   1. Go to [Products](https://dashboard.stripe.com/products)

   # In functions/.env2. Click "Add product"

   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE3. Create two products:

   ```

#### Pro Plan

4. **Create Products & Prices** (Optional for production)- **Name**: Pro Plan

   - Go to: https://dashboard.stripe.com/products- **Pricing**: $9.99 USD / month (recurring)

   - Create "Pro Plan" - $9.99/month- **Billing period**: Monthly

   - Create "Premium Plan" - $19.99/month- Copy the **Price ID** (starts with `price_`)

   - Copy the Price IDs and add to .env- Add to `.env`:

```bash

### 2. PayPal SetupREACT_APP_STRIPE_PRO_PRICE_ID=price_YOUR_PRO_ID_HERE

```

1. **Create PayPal Developer Account**

   - Go to: https://developer.paypal.com#### Premium Plan

   - Sign in with PayPal account- **Name**: Premium Plan

- **Pricing**: $19.99 USD / month (recurring)

2. **Create App**- **Billing period**: Monthly

   - Visit: https://developer.paypal.com/dashboard/applications- Copy the **Price ID** (starts with `price_`)

   - Click "Create App"- Add to `.env`:

   - Choose "Merchant" as app type```bash

   - Name it "Nebula Screen Capture"REACT_APP_STRIPE_PREMIUM_PRICE_ID=price_YOUR_PREMIUM_ID_HERE

```

3. **Get Credentials**

   - Copy **Client ID**### 4. Enable Test Mode

   - Copy **Secret** (for backend)- Make sure you're using **test mode** keys (they start with `test`)

- Toggle is in the top right of Stripe Dashboard

4. **Add to Environment Variables**

   ```bash---

   # In .env

   REACT_APP_PAYPAL_CLIENT_ID=YOUR_CLIENT_ID_HERE## PayPal Setup

   REACT_APP_PAYPAL_MODE=sandbox  # or 'live' for production

   ### 1. Create a PayPal Developer Account

   # In functions/.env1. Visit [PayPal Developer](https://developer.paypal.com)

   PAYPAL_CLIENT_SECRET=YOUR_SECRET_HERE2. Log in with your PayPal account or create a new one

   ```3. Go to [Dashboard](https://developer.paypal.com/dashboard/)



### 3. SendGrid Email Setup### 2. Create an App

1. Click "Apps & Credentials"

1. **Create SendGrid Account**2. Make sure you're on the **Sandbox** tab

   - Go to: https://signup.sendgrid.com3. Click "Create App"

   - Complete email verification4. Enter app name (e.g., "Nebula Screen Capture")

5. Click "Create App"

2. **Create API Key**

   - Visit: https://app.sendgrid.com/settings/api_keys### 3. Get Client ID

   - Click "Create API Key"1. After creating the app, you'll see your **Client ID**

   - Name: "Nebula Email Service"2. Copy it and add to `.env`:

   - Permission: "Full Access"```bash

   - Copy the API key (shown once!)REACT_APP_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID_HERE

REACT_APP_PAYPAL_MODE=sandbox

3. **Verify Sender Email**```

   - Go to: https://app.sendgrid.com/settings/sender_auth

   - Add `noreply@nebula3ddev.com` (or your domain)### 4. Configure Return URLs (Optional for production)

   - Complete verification process1. In your app settings, add:

   - **Return URL**: Your app's payment success page

4. **Add to Environment Variables**   - **Cancel URL**: Your app's payment cancel page

   ```bash

   # In functions/.env---

   SENDGRID_API_KEY=SG.YOUR_API_KEY_HERE

   FROM_EMAIL=noreply@nebula3ddev.com## Testing Payments

   ADMIN_EMAIL=admin@nebula3ddev.com

   ```### Testing Stripe



### 4. Firebase Functions SetupUse these test card numbers:

- **Success**: `4242 4242 4242 4242`

1. **Install Dependencies**- **Decline**: `4000 0000 0000 0002`

   ```bash- **3D Secure**: `4000 0025 0000 3155`

   cd functions

   npm installAny future expiry date (e.g., `12/25`) and any 3-digit CVV will work.

   ```

### Testing PayPal

2. **Configure Environment**

   ```bash1. Create sandbox accounts in [PayPal Sandbox](https://developer.paypal.com/dashboard/accounts)

   # Create functions/.env file2. Create a **Personal Account** (for buyer)

   cp .env.example .env3. Use these credentials to test checkout

   4. PayPal provides test accounts with email/password

   # Add your keys:

   SENDGRID_API_KEY=...**Default Sandbox Test Account:**

   STRIPE_SECRET_KEY=...- Email: Will be shown in your sandbox accounts

   PAYPAL_CLIENT_SECRET=...- Password: Set when creating the sandbox account

   ```

---

3. **Deploy Functions**

   ```bash## Going Live

   firebase deploy --only functions

   ```### Stripe Production

1. Complete [Stripe account verification](https://dashboard.stripe.com/account/onboarding)

4. **Update Frontend URL**2. Switch to **Live mode** in Stripe Dashboard

   ```bash3. Get your **live keys** (they start with `pk_live_` and `sk_live_`)

   # In .env4. Update `.env`:

   REACT_APP_FIREBASE_FUNCTIONS_URL=https://us-central1-your-project.cloudfunctions.net```bash

   ```REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY

REACT_APP_STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY

---```

5. Create live products and update price IDs

## 🧪 Testing

### PayPal Production

### Test Mode (Current State)1. Switch to **Live** tab in PayPal Developer Dashboard

2. Create a new app or use existing one

The app is currently in **DEMO MODE**:3. Get your **Live Client ID**

- ✅ Payments are simulated (2-second delay)4. Update `.env`:

- ✅ Emails are logged to console```bash

- ✅ No real charges occurREACT_APP_PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID

- ✅ Transaction IDs are generatedREACT_APP_PAYPAL_MODE=production

```

### Testing Stripe

### Environment Configuration

**Test Card Numbers:**Update your `.env` for production:

- Success: `4242 4242 4242 4242````bash

- Decline: `4000 0000 0000 0002`NODE_ENV=production

- CVV: Any 3 digits (e.g., `123`)REACT_APP_ENABLE_STRIPE=true

- Expiry: Any future date (e.g., `12/25`)REACT_APP_ENABLE_PAYPAL=true

- Name: Any nameREACT_APP_CURRENCY=USD

```

### Testing PayPal

---

1. Switch payment method to PayPal

2. Fill billing information## Current Implementation Status

3. Click PayPal button

4. Login with PayPal sandbox credentials### ✅ Completed Features

5. Complete payment- Payment modal with Stripe and PayPal support

- Credit card form with real-time validation

**Sandbox Accounts:**- Billing information collection

- Create at: https://developer.paypal.com/dashboard/accounts- Payment method selection toggle

- Form validation and error handling

---- Loading states during processing

- Security badges and trust indicators

## 📧 Email Templates- Dark mode support

- Responsive design

The following emails are automatically sent:

### 🔄 Mock Implementation (Ready for Integration)

### 1. Upgrade ConfirmationThe current implementation uses **mock payment processing**:

**Sent when:** User completes payment```javascript

**Includes:**// In PaymentModal.js

- Plan name (Pro/Premium)const handleStripePayment = async () => {

- Features list  // TODO: Replace with actual Stripe API integration

- Billing amount  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulates API call

- Welcome message  return {

    success: true,

### 2. Welcome Email    transactionId: 'mock_' + Date.now(),

**Sent when:** User registers    // ...

**Includes:**  };

- Getting started guide};

- Feature overview```

- Support links

### 🚀 Next Steps for Production

### 3. Password Reset1. **Backend API**: Create server endpoints to handle payments

**Sent when:** User requests password reset   - `/api/create-payment-intent` for Stripe

**Includes:**   - `/api/paypal-checkout` for PayPal

- Reset link (1-hour expiry)2. **Stripe Integration**: Use `@stripe/stripe-js` and Stripe Elements

- Security notice3. **PayPal Integration**: Use PayPal JavaScript SDK

4. **Webhooks**: Set up webhook handlers for payment events

### 4. Storage Warning5. **Database**: Store transaction records and update user subscriptions

**Sent when:** Storage > 80% full

**Includes:**---

- Current usage

- Suggestions## Environment Variables Reference

- Upgrade options

```bash

---# Stripe

REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY

## 🔒 SecurityREACT_APP_STRIPE_SECRET_KEY=sk_test_YOUR_KEY  # Backend only!

REACT_APP_STRIPE_PRO_PRICE_ID=price_XXX

### Implemented Security FeaturesREACT_APP_STRIPE_PREMIUM_PRICE_ID=price_XXX



1. **PCI Compliance**# PayPal

   - No card data stored locallyREACT_APP_PAYPAL_CLIENT_ID=YOUR_CLIENT_ID

   - Stripe handles tokenizationREACT_APP_PAYPAL_MODE=sandbox  # or 'production'

   - SSL encryption

# Payment Settings

2. **Rate Limiting**REACT_APP_CURRENCY=USD

   - 100 emails per hour per IPREACT_APP_ENABLE_STRIPE=true

   - Prevents spam/abuseREACT_APP_ENABLE_PAYPAL=true

REACT_APP_PAYMENT_SUCCESS_URL=${PUBLIC_URL}/payment/success

3. **Input Validation**REACT_APP_PAYMENT_CANCEL_URL=${PUBLIC_URL}/payment/cancel

   - Email format validation```

   - Card number Luhn check

   - CVV length validation---

   - Expiry date format

## Troubleshooting

4. **Error Handling**

   - User-friendly error messages### Stripe Issues

   - No sensitive data exposed- **Invalid API key**: Make sure you're using the correct mode (test vs live)

   - Logging for debugging- **Price ID not found**: Verify the price ID exists in your Stripe products

- **Card declined**: Use test card numbers in test mode

---

### PayPal Issues

## 🚀 Going Live- **Client ID error**: Verify you copied the correct client ID from the right mode

- **Redirect issues**: Check return URLs are correctly configured

### Pre-Production Checklist- **Sandbox login**: Make sure you're using sandbox test accounts



- [ ] Get real Stripe keys (pk_live_... and sk_live_...)### General Issues

- [ ] Switch PayPal to live mode- **Environment variables not loading**: Restart your development server

- [ ] Verify SendGrid sender domain- **CORS errors**: Backend API needs to allow requests from your frontend domain

- [ ] Deploy Firebase functions- **Network errors**: Check browser console and network tab for specific errors

- [ ] Test full payment flow

- [ ] Set up webhook endpoints (Stripe/PayPal)---

- [ ] Configure proper error monitoring

- [ ] Add analytics tracking## Security Best Practices



### Environment Variables for Production1. **Never commit** `.env` file to git (it's in `.gitignore`)

2. **Never expose** secret keys in client-side code

```bash3. **Always validate** payment amounts on the backend

# .env.production4. **Use HTTPS** in production

REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...5. **Implement webhooks** to handle payment events reliably

REACT_APP_PAYPAL_CLIENT_ID=your_live_client_id6. **Store sensitive keys** in environment variables or secret managers

REACT_APP_PAYPAL_MODE=live7. **Validate user input** on both client and server

REACT_APP_FIREBASE_FUNCTIONS_URL=https://us-central1-your-project.cloudfunctions.net8. **Log security events** for audit trails



# functions/.env (production)---

SENDGRID_API_KEY=SG.live_key...

STRIPE_SECRET_KEY=sk_live_...## Resources

PAYPAL_CLIENT_SECRET=live_secret...

FROM_EMAIL=noreply@yourdomain.com### Stripe

```- [Documentation](https://stripe.com/docs)

- [Testing Cards](https://stripe.com/docs/testing)

---- [API Reference](https://stripe.com/docs/api)

- [React Integration](https://stripe.com/docs/stripe-js/react)

## 🐛 Troubleshooting

### PayPal

### Stripe Issues- [Developer Portal](https://developer.paypal.com)

- [JavaScript SDK](https://developer.paypal.com/sdk/js/)

**Problem:** "Stripe not configured" warning- [Sandbox Testing](https://developer.paypal.com/tools/sandbox/)

- Check REACT_APP_STRIPE_PUBLISHABLE_KEY is set- [API Reference](https://developer.paypal.com/api/rest/)

- Restart dev server after adding .env variables

### Support

**Problem:** Payment fails immediately- For payment issues: Contact Stripe/PayPal support

- Verify API keys are correct- For app issues: Check the main README.md

- Check Stripe dashboard for errors- For security concerns: See SECURITY.md

- Ensure test cards are used in test mode

---

### PayPal Issues

## Payment Flow

**Problem:** PayPal button doesn't load

- Check REACT_APP_PAYPAL_CLIENT_ID is set```

- Verify internet connectionUser clicks "Upgrade" → 

- Check browser console for errors  UpgradePlanModal opens →

    User selects plan (Pro/Premium) →

**Problem:** Payment fails after PayPal login      PaymentModal opens →

- Ensure sandbox mode matches sandbox account        User selects payment method (Stripe/PayPal) →

- Check PayPal dashboard for transaction logs          User fills billing info and payment details →

            Form validation runs →

### Email Issues              Payment processing begins →

                [Mock] Success/Error →

**Problem:** Emails not sending                  User plan upgraded →

- Verify SENDGRID_API_KEY is set                    Success notification shown

- Check sender email is verified```

- Review Firebase Functions logs

- Check SendGrid activity feed---



**Problem:** Emails go to spam**Note**: This is a development setup guide. For production deployment, implement proper backend API endpoints, webhook handlers, and database integration for handling real payments and subscription management.

- Verify sender domain (SPF, DKIM)
- Use authenticated domain
- Avoid spam trigger words

---

## 📞 Support

- **Stripe Docs**: https://stripe.com/docs
- **PayPal Docs**: https://developer.paypal.com/docs
- **SendGrid Docs**: https://docs.sendgrid.com
- **Firebase Docs**: https://firebase.google.com/docs

---

## 📝 Notes

- Always test in sandbox/test mode first
- Keep API keys secure and never commit to Git
- Monitor payment logs regularly
- Set up webhook endpoints for production
- Consider adding subscription management
- Implement refund handling for production

---

**Happy coding! 🚀**
