# Environment Setup Guide

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Copy the Firebase Functions environment file:**
   ```bash
   cp functions/.env.example functions/.env
   ```

3. **Fill in your credentials** (see sections below)

---

## Required Environment Variables

### 1. Admin Credentials

Open `.env` and set:

```env
REACT_APP_ADMIN_USERNAME=your_admin_username
REACT_APP_ADMIN_PASSWORD=your_secure_password
REACT_APP_ADMIN_EMAIL=your_email@example.com
```

⚠️ **Security Note:** In production, admin authentication should be handled by Firebase Authentication or a backend service, not environment variables.

---

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Navigate to **Project Settings** > **General** > **Your apps**
4. Click the web app icon (</>) or "Add app" if none exists
5. Copy the configuration values to your `.env`:

```env
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### 3. Payment Integration (Optional)

#### Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** to `.env`:
   ```env
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Copy your **Secret key** to `functions/.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   ```

#### PayPal

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications)
2. Create or select an app
3. Copy **Client ID** to `.env`:
   ```env
   REACT_APP_PAYPAL_CLIENT_ID=AXXXxxx
   ```
4. Copy **Secret** to `functions/.env`:
   ```env
   PAYPAL_SECRET=EXXXxxx
   ```

---

### 4. Email Service (SendGrid)

1. Go to [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
2. Create a new API key with **Full Access**
3. Copy to `functions/.env`:
   ```env
   SENDGRID_API_KEY=SG.xxx
   SUPPORT_EMAIL=colinnebula@gmail.com
   NO_REPLY_EMAIL=noreply@nebula3ddev.com
   ```

---

## File Structure

```
nebula-screen-capture/
├── .env                    # Frontend environment variables (DO NOT COMMIT)
├── .env.example           # Frontend template (commit this)
├── functions/
│   ├── .env              # Backend environment variables (DO NOT COMMIT)
│   └── .env.example      # Backend template (commit this)
└── .gitignore            # Ensures .env files are ignored
```

---

## Security Checklist

- [x] `.env` files are in `.gitignore`
- [x] Never commit actual credentials
- [x] Use test/sandbox keys for development
- [x] Use production keys only in production environment
- [x] Rotate keys regularly
- [x] Use Firebase Functions for server-side operations
- [x] Never expose secret keys in client code

---

## Verification

Check that your environment is set up correctly:

```bash
# Check if .env exists
ls -la .env

# Verify it's ignored by git
git check-ignore .env

# Test the app
npm start
```

---

## Production Deployment

For production (Firebase Hosting), set environment variables via:

1. **Firebase Hosting**: Build with production `.env`:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

2. **Firebase Functions**: Set config via CLI:
   ```bash
   firebase functions:config:set \
     sendgrid.api_key="SG.xxx" \
     stripe.secret_key="sk_live_xxx" \
     paypal.secret="xxx"
   ```

   Or deploy with `.env`:
   ```bash
   firebase deploy --only functions
   ```

---

## Troubleshooting

### "process.env.REACT_APP_XXX is undefined"

- Ensure variable name starts with `REACT_APP_`
- Restart development server after changing `.env`
- Check for typos in variable names

### "Firebase initialization error"

- Verify all Firebase config values are correct
- Check Firebase project is active
- Ensure billing is enabled for Firebase Functions

### "Payment processing failed"

- Verify you're using correct environment keys (test vs production)
- Check Stripe/PayPal dashboard for error logs
- Ensure webhook URLs are configured

---

## Need Help?

- **Firebase Setup**: See `docs/FIREBASE_DEPLOY.md`
- **Payment Setup**: See `docs/PAYMENT_SETUP.md`
- **Email Verification**: See `docs/EMAIL_VERIFICATION_SETUP.md`
- **Security**: See `docs/SECURITY_GUIDE.md`

---

**Last Updated:** October 16, 2025
