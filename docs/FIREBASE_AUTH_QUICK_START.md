# Firebase Authentication - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Get Firebase Credentials

```bash
# Go to: https://console.firebase.google.com/
# Create project → Add web app → Copy config
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-your-project.cloudfunctions.net
VITE_APP_URL=http://localhost:3000
```

### 3. Enable Authentication

```bash
# In Firebase Console:
# Authentication → Get Started → Email/Password → Enable → Save
```

### 4. Deploy Functions

```bash
cd functions
npm install
firebase login
firebase deploy --only functions
```

### 5. Configure SendGrid

```env
# In functions/.env:
SENDGRID_API_KEY=SG.your_key_here
NO_REPLY_EMAIL=your@email.com
SUPPORT_EMAIL=your@email.com
```

### 6. Test It

```bash
npm run dev
# Sign up → Check email → Verify code → Done! ✅
```

---

## 📖 Usage in Your App

### Import Auth Service

```javascript
import authService from './services/authService';
```

### Sign Up

```javascript
const { user, verificationCode } = await authService.signup(
  'user@example.com',
  'password123',
  'John Doe'
);
console.log('Verification Code:', verificationCode);
```

### Verify Email

```javascript
await authService.verifyEmailWithCode(code, userId);
```

### Log In

```javascript
const user = await authService.login('user@example.com', 'password123');
```

### Check Auth State

```javascript
authService.onAuthStateChange((user) => {
  if (user) {
    console.log('User logged in:', user.email);
  } else {
    console.log('User logged out');
  }
});
```

---

## 🎨 Using UI Components

### Full Auth Flow

```svelte
<script>
  import AuthContainer from './components/Auth/AuthContainer.svelte';
  
  function handleAuthenticated(event) {
    console.log('User authenticated:', event.detail);
    // Redirect to dashboard
  }
  
  function handleVerified() {
    console.log('Email verified!');
    // Redirect to app
  }
</script>

<AuthContainer 
  on:authenticated={handleAuthenticated}
  on:verified={handleVerified}
/>
```

### Individual Components

```svelte
<!-- Signup -->
<Signup on:success={handleSignup} />

<!-- Login -->
<Login on:success={handleLogin} on:unverified={handleUnverified} />

<!-- Verify Email -->
<VerifyEmail {userEmail} {userId} prefilledCode={code} on:verified={handleVerified} />

<!-- Forgot Password -->
<ForgotPassword on:switch={handleSwitch} />
```

---

## ✨ Features

### ✅ What's Included

- **Email/Password Authentication** - Secure signup and login
- **Email Verification** - 6-digit codes sent via SendGrid
- **Visual Code Display** - See verification codes on-screen for testing
- **Password Reset** - Forgot password flow
- **Beautiful UI** - Professional Svelte components
- **Persistent Sessions** - Stay logged in across browser restarts
- **Error Handling** - User-friendly error messages
- **Rate Limiting** - Built-in protection against abuse

### 📧 Email Features

- Professional HTML email templates
- 6-digit verification codes
- Clickable verification links
- Welcome emails after verification
- Password reset emails
- Customizable email content

### 🧪 Testing Features

- Verification codes displayed on-screen
- Copy-to-clipboard functionality
- Console logging for debugging
- Works with Firebase emulators

---

## 🔒 Security Best Practices

- ✅ All passwords are hashed by Firebase
- ✅ HTTPS only in production
- ✅ Email verification required
- ✅ Rate limiting on sensitive operations
- ✅ Firestore security rules enforced
- ✅ Environment variables for secrets
- ✅ Input validation and sanitization

---

## 📚 API Reference

### authService.signup(email, password, displayName)
Create new user account

**Returns:** `{ user, verificationCode, verificationUrl }`

### authService.login(email, password)
Sign in existing user

**Returns:** `user`

### authService.verifyEmailWithCode(code, userId)
Verify email with 6-digit code

**Returns:** `boolean`

### authService.resendVerificationEmail()
Send new verification email

**Returns:** `{ verificationCode, verificationUrl }`

### authService.sendPasswordReset(email)
Send password reset email

**Returns:** `void`

### authService.logout()
Sign out current user

**Returns:** `void`

### authService.onAuthStateChange(callback)
Listen to auth state changes

**Returns:** Unsubscribe function

---

## 🐛 Common Issues

### "Firebase not configured"
→ Check `.env` file has all `VITE_FIREBASE_*` variables

### "Email not received"
→ Check spam folder, verify SendGrid sender

### "Invalid verification code"
→ Codes expire after 24 hours, request a new one

### "Permission denied"
→ Check Firestore security rules match your setup

---

## 📖 Full Documentation

For detailed setup instructions, see [FIREBASE_AUTH_SENDGRID_SETUP.md](./FIREBASE_AUTH_SENDGRID_SETUP.md)

---

## 🎉 Ready to Go!

Your authentication system is now set up! Users can sign up, verify their email, and log in securely.

**Happy coding!** 🚀
