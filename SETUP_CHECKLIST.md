# 🚀 Firebase Auth & SendGrid - Setup Checklist

Use this checklist to configure Firebase Authentication with SendGrid email verification.

---

## ☐ Part 1: Firebase Setup

### ☐ 1.1 Create Firebase Project
- [ ] Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] Click "Add project" (or select existing)
- [ ] Follow setup wizard
- [ ] Project created successfully

### ☐ 1.2 Enable Authentication
- [ ] Click "Authentication" in sidebar
- [ ] Click "Get started"
- [ ] Go to "Sign-in method" tab
- [ ] Click "Email/Password"
- [ ] Enable "Email/Password" (first toggle)
- [ ] Click "Save"

### ☐ 1.3 Get Firebase Configuration
- [ ] Click gear icon ⚙️ → "Project settings"
- [ ] Scroll to "Your apps"
- [ ] Click web icon `</>`
- [ ] Register app with nickname
- [ ] Copy configuration object
- [ ] Save config values

### ☐ 1.4 Create Firestore Database
- [ ] Click "Firestore Database" in sidebar
- [ ] Click "Create database"
- [ ] Start in production mode
- [ ] Choose location (e.g., us-central)
- [ ] Click "Enable"
- [ ] Database created

### ☐ 1.5 Set Firestore Security Rules
- [ ] Go to "Rules" tab in Firestore
- [ ] Copy rules from `docs/FIREBASE_AUTH_SENDGRID_SETUP.md`
- [ ] Click "Publish"
- [ ] Rules deployed

### ☐ 1.6 Configure Storage (Optional)
- [ ] Click "Storage" in sidebar
- [ ] Click "Get started"
- [ ] Start in production mode
- [ ] Choose same location as Firestore
- [ ] Set storage rules
- [ ] Storage ready

---

## ☐ Part 2: SendGrid Setup

### ☐ 2.1 Create SendGrid Account
- [ ] Go to [SendGrid](https://sendgrid.com/)
- [ ] Sign up for free account
- [ ] Verify email address
- [ ] Account activated

### ☐ 2.2 Verify Sender
**Option A: Single Sender** (Quick)
- [ ] Go to Settings → [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
- [ ] Click "Verify a Single Sender"
- [ ] Fill in details (name, email, etc.)
- [ ] Click "Create"
- [ ] Check email and verify

**Option B: Domain Authentication** (Production)
- [ ] Go to Settings → Sender Authentication
- [ ] Click "Authenticate Your Domain"
- [ ] Add DNS records to domain
- [ ] Wait for verification

### ☐ 2.3 Create API Key
- [ ] Go to Settings → [API Keys](https://app.sendgrid.com/settings/api_keys)
- [ ] Click "Create API Key"
- [ ] Choose "Restricted Access"
- [ ] Name: "Nebula Firebase Functions"
- [ ] Mail Send → Full Access
- [ ] Click "Create & View"
- [ ] **COPY THE KEY NOW** (won't see again)
- [ ] Store key securely

---

## ☐ Part 3: Project Configuration

### ☐ 3.1 Configure Main App
- [ ] Create `.env` file (copy from `.env.example`)
- [ ] Add `VITE_FIREBASE_API_KEY`
- [ ] Add `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] Add `VITE_FIREBASE_PROJECT_ID`
- [ ] Add `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] Add `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] Add `VITE_FIREBASE_APP_ID`
- [ ] Add `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- [ ] Add `VITE_FIREBASE_FUNCTIONS_URL` (update after deploy)
- [ ] Add `VITE_APP_URL` (e.g., http://localhost:3000)
- [ ] Restart dev server

### ☐ 3.2 Configure Firebase Functions
- [ ] Navigate to `functions/` folder
- [ ] Create `.env` file (copy from `.env.example`)
- [ ] Add `SENDGRID_API_KEY=SG.xxx`
- [ ] Add `SUPPORT_EMAIL=your@email.com`
- [ ] Add `NO_REPLY_EMAIL=noreply@yourdomain.com`
- [ ] Save file

### ☐ 3.3 Install Dependencies
- [ ] Run `npm install` (main project)
- [ ] Run `cd functions && npm install`
- [ ] All packages installed

---

## ☐ Part 4: Deploy

### ☐ 4.1 Login to Firebase
- [ ] Run `firebase login`
- [ ] Complete browser authentication
- [ ] Logged in successfully

### ☐ 4.2 Initialize Firebase (if needed)
- [ ] Run `firebase init`
- [ ] Select: Functions, Firestore, Hosting, Storage
- [ ] Follow prompts
- [ ] Initialization complete

### ☐ 4.3 Deploy Functions
- [ ] Run `firebase deploy --only functions`
- [ ] Wait for deployment
- [ ] Copy Functions URL from output
- [ ] Update `VITE_FIREBASE_FUNCTIONS_URL` in `.env`
- [ ] Restart dev server

---

## ☐ Part 5: Testing

### ☐ 5.1 Test Signup
- [ ] Run `npm run dev`
- [ ] Navigate to signup page
- [ ] Enter email, password, name
- [ ] Click "Sign Up"
- [ ] See verification code on screen ✨
- [ ] Check email inbox
- [ ] Verification email received

### ☐ 5.2 Test Email Verification
- [ ] Copy code from screen or email
- [ ] Paste into verification page
- [ ] Click "Verify Email"
- [ ] Success message shown
- [ ] Welcome email received

### ☐ 5.3 Test Login
- [ ] Navigate to login page
- [ ] Enter verified email and password
- [ ] Click "Sign In"
- [ ] Logged in successfully
- [ ] User data loaded

### ☐ 5.4 Test Password Reset
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] Click "Send Reset Link"
- [ ] Check email
- [ ] Reset email received

### ☐ 5.5 Test Resend Verification
- [ ] Create unverified account
- [ ] Click "Resend verification email"
- [ ] New code displayed on screen ✨
- [ ] New email received
- [ ] Can verify with new code

---

## ☐ Part 6: Production Checklist

### ☐ 6.1 Security
- [ ] Add production domain to Firebase authorized domains
- [ ] Review and test Firestore security rules
- [ ] Review and test Storage security rules
- [ ] Enable HTTPS only
- [ ] Remove console.log statements
- [ ] Enable Firebase App Check

### ☐ 6.2 SendGrid
- [ ] Verify domain (not just single sender)
- [ ] Set up SPF records
- [ ] Set up DKIM records
- [ ] Set up DMARC records
- [ ] Test email deliverability
- [ ] Monitor SendGrid dashboard

### ☐ 6.3 Firebase
- [ ] Enable billing for production usage
- [ ] Set budget alerts
- [ ] Monitor usage dashboard
- [ ] Set up Firestore backups
- [ ] Configure CORS settings
- [ ] Test with production URLs

### ☐ 6.4 Final Testing
- [ ] Test complete signup flow
- [ ] Test email verification
- [ ] Test login persistence
- [ ] Test password reset
- [ ] Test on mobile devices
- [ ] Test email deliverability
- [ ] Check spam folder placement

---

## ☐ Part 7: Integration

### ☐ 7.1 Add to Your App
- [ ] Import `AuthContainer` component
- [ ] Add to app routes
- [ ] Handle authentication events
- [ ] Redirect authenticated users
- [ ] Show/hide UI based on auth state

### ☐ 7.2 Protect Routes
- [ ] Check auth state on route changes
- [ ] Redirect unauthenticated users
- [ ] Verify email verification status
- [ ] Handle token expiration

### ☐ 7.3 User Experience
- [ ] Add loading states
- [ ] Show error messages
- [ ] Implement logout functionality
- [ ] Add "remember me" option
- [ ] Test all user flows

---

## 📊 Progress Tracker

- **Firebase Setup**: ☐ 0/6 complete
- **SendGrid Setup**: ☐ 0/3 complete
- **Configuration**: ☐ 0/3 complete
- **Deployment**: ☐ 0/3 complete
- **Testing**: ☐ 0/5 complete
- **Production**: ☐ 0/4 complete
- **Integration**: ☐ 0/3 complete

**Total**: ☐ 0/27 complete

---

## 🎯 Quick Links

- [Firebase Console](https://console.firebase.google.com/)
- [SendGrid Dashboard](https://app.sendgrid.com/)
- [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
- [SendGrid Sender Auth](https://app.sendgrid.com/settings/sender_auth)
- [Firebase Documentation](https://firebase.google.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)

---

## 📚 Documentation

- Quick Start: `docs/FIREBASE_AUTH_QUICK_START.md`
- Full Setup: `docs/FIREBASE_AUTH_SENDGRID_SETUP.md`
- Implementation: `docs/FIREBASE_AUTH_IMPLEMENTATION_SUMMARY.md`
- README: `docs/AUTH_README.md`

---

## 💡 Tips

1. **Start with single sender** verification in SendGrid (faster)
2. **Test with emulators** before deploying (optional)
3. **Use .env.local** for local overrides
4. **Check Firebase Console** for error logs
5. **Monitor SendGrid activity** for delivery issues
6. **The verification code appears on screen** - no need to check email during testing!

---

## ❓ Need Help?

If you get stuck:
1. Check the documentation in `docs/` folder
2. Review `FIREBASE_AUTH_COMPLETE.md` for overview
3. Look at Firebase Console for errors
4. Check SendGrid Activity Feed
5. Review browser console for errors

---

**Good luck! 🚀**

Once you complete this checklist, your authentication system will be fully configured and ready to use!
