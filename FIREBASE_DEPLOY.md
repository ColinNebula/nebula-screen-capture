# 🔥 Firebase Functions - Quick Deploy Guide

## Prerequisites Checklist
- [ ] Firebase account created
- [ ] SendGrid account created (free tier)
- [ ] SendGrid API key obtained
- [ ] Sender email verified in SendGrid
- [ ] Firebase CLI installed globally

---

## Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

---

## Step 2: Login to Firebase
```bash
firebase login
```
- Opens browser for Google authentication
- Select your Google account
- Grant permissions

---

## Step 3: Initialize Firebase (if needed)
```bash
firebase init
```
- Select: **Functions** (use spacebar to select)
- Use existing project or create new
- Language: **JavaScript**
- ESLint: **Yes** (optional)
- Install dependencies: **Yes**

---

## Step 4: Configure Environment Variables

### **Option A: Using .env file (Development)**
```bash
cd functions
cp .env.example .env
```

Edit `functions/.env`:
```env
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key_here
SUPPORT_EMAIL=support@yourdomain.com
NO_REPLY_EMAIL=noreply@yourdomain.com
DEMO_MODE=false
```

### **Option B: Using Firebase Config (Production)**
```bash
# Set individual variables
firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"
firebase functions:config:set emails.support="support@yourdomain.com"
firebase functions:config:set emails.noreply="noreply@yourdomain.com"

# View current config
firebase functions:config:get
```

---

## Step 5: Install Dependencies
```bash
cd functions
npm install
cd ..
```

**Dependencies installed:**
- `firebase-functions` v4.5.0
- `firebase-admin` v11.11.0
- `@sendgrid/mail` v7.7.0
- `express` v4.18.2
- `cors` v2.8.5
- `dotenv` v16.6.1

---

## Step 6: Test Locally (Optional)
```bash
# Install Firebase emulator
firebase init emulators

# Start emulator
firebase emulators:start --only functions
```

**Local Functions URLs:**
```
http://localhost:5001/YOUR-PROJECT-ID/us-central1/sendVerificationEmail
http://localhost:5001/YOUR-PROJECT-ID/us-central1/sendWelcomeEmailVerified
```

---

## Step 7: Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendVerificationEmail

# Deploy multiple specific functions
firebase deploy --only functions:sendVerificationEmail,sendWelcomeEmailVerified
```

**Deployment Output:**
```
✔  Deploy complete!

Functions:
  sendVerificationEmail(us-central1)
  sendWelcomeEmailVerified(us-central1)
  sendPasswordReset(us-central1)
  ...

Function URLs:
  https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/sendVerificationEmail
```

---

## Step 8: Update React App URLs

Edit `.env` in root directory:
```env
REACT_APP_FIREBASE_FUNCTIONS_URL=https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net
```

Replace `YOUR-PROJECT-ID` with your actual Firebase project ID.

---

## Step 9: Rebuild & Deploy React App
```bash
# Rebuild with new environment variables
npm run build

# Deploy to GitHub Pages
npm run deploy
```

---

## Step 10: Test Production Emails
1. Go to your GitHub Pages URL
2. Sign up with a **real email address**
3. Check your inbox for verification email
4. Click verification link
5. Check for welcome email

---

## 📊 Monitoring

### **View Function Logs:**
```bash
# Real-time logs
firebase functions:log

# Filter by function
firebase functions:log --only sendVerificationEmail

# Last 100 lines
firebase functions:log --lines 100
```

### **Firebase Console:**
- Visit: https://console.firebase.google.com
- Select your project
- Go to: **Functions** → **Dashboard**
- View: Invocations, Errors, Execution time

### **SendGrid Dashboard:**
- Visit: https://app.sendgrid.com/statistics
- View: Delivered, Opens, Clicks, Bounces, Spam reports

---

## 🔧 Troubleshooting

### **Error: Permission Denied**
```bash
# Re-login to Firebase
firebase login --reauth
```

### **Error: Functions not deploying**
```bash
# Clear Firebase cache
firebase functions:delete --all
firebase deploy --only functions
```

### **Error: SendGrid API key invalid**
```bash
# Verify API key has Mail Send permission
# Regenerate key in SendGrid dashboard
# Update Firebase config
firebase functions:config:set sendgrid.api_key="NEW_KEY"
```

### **Error: CORS issues**
```bash
# Check CORS is enabled in functions/index.js
# Already configured in your functions!
```

### **Error: Rate limit exceeded**
```bash
# Current limit: 100 emails/hour per IP
# Increase limit in functions/index.js if needed
```

---

## 💰 Cost Estimate

### **SendGrid Free Tier:**
- 100 emails/day permanently free
- All API features included

### **Firebase Free Tier (Spark Plan):**
- 2M function invocations/month
- 400,000 GB-seconds compute
- 200,000 CPU-seconds
- 5GB network egress

### **Typical Usage (1000 users/month):**
- Email verifications: 1000
- Welcome emails: 1000
- **Total emails:** 2000/month
- **Cost:** $0 (within free tier)

### **Upgrade Threshold:**
- SendGrid: >100 emails/day ($14.95/mo for Essentials)
- Firebase: >2M invocations/month (Pay-as-you-go)

---

## 🚀 Quick Commands Reference

```bash
# Install CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init functions

# Install dependencies
cd functions && npm install && cd ..

# Test locally
firebase emulators:start --only functions

# Deploy
firebase deploy --only functions

# View logs
firebase functions:log

# Get config
firebase functions:config:get

# Set config
firebase functions:config:set key="value"

# Delete function
firebase functions:delete functionName

# Open Firebase console
firebase open functions
```

---

## 📧 Available Functions

After deployment, these endpoints will be available:

### **1. Email Verification**
```
POST https://us-central1-PROJECT-ID.cloudfunctions.net/sendVerificationEmail

Body: {
  "email": "user@example.com",
  "name": "User Name",
  "verificationToken": "abc123xyz",
  "verificationUrl": "https://your-app.com/#/verify?token=abc123"
}
```

### **2. Welcome Email**
```
POST https://us-central1-PROJECT-ID.cloudfunctions.net/sendWelcomeEmailVerified

Body: {
  "email": "user@example.com",
  "name": "User Name"
}
```

### **3. Password Reset**
```
POST https://us-central1-PROJECT-ID.cloudfunctions.net/sendPasswordReset

Body: {
  "email": "user@example.com",
  "resetToken": "reset123xyz"
}
```

### **4. Upgrade Confirmation**
```
POST https://us-central1-PROJECT-ID.cloudfunctions.net/sendUpgradeConfirmation

Body: {
  "email": "user@example.com",
  "name": "User Name",
  "plan": "Pro",
  "price": "9.99"
}
```

### **5. Storage Warning**
```
POST https://us-central1-PROJECT-ID.cloudfunctions.net/sendStorageWarning

Body: {
  "email": "user@example.com",
  "name": "User Name",
  "storageUsed": 4.5,
  "maxStorage": 5
}
```

### **6. Support Request**
```
POST https://us-central1-PROJECT-ID.cloudfunctions.net/sendSupportEmail

Body: {
  "email": "user@example.com",
  "name": "User Name",
  "subject": "Help needed",
  "message": "I need assistance..."
}
```

### **7. Recording Share**
```
POST https://us-central1-PROJECT-ID.cloudfunctions.net/sendRecordingShare

Body: {
  "email": "recipient@example.com",
  "fromName": "Sender Name",
  "recordingUrl": "https://your-app.com/recording/123",
  "message": "Check this out!"
}
```

---

## ✅ Deployment Checklist

- [ ] Firebase CLI installed
- [ ] Logged into Firebase
- [ ] SendGrid API key obtained
- [ ] Sender email verified
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Functions deployed successfully
- [ ] Function URLs copied
- [ ] React app .env updated
- [ ] React app rebuilt
- [ ] React app deployed
- [ ] Tested with real email
- [ ] Verified email delivery
- [ ] Checked SendGrid dashboard
- [ ] Monitored Firebase logs
- [ ] No errors in console

---

## 🎯 Success Indicators

### **Deployment Successful:**
- ✅ All functions show green checkmark
- ✅ Function URLs displayed
- ✅ No errors in deployment log

### **Functions Working:**
- ✅ Test email received in inbox
- ✅ Email not in spam folder
- ✅ Verification link works
- ✅ Welcome email received
- ✅ No errors in Firebase logs

### **Production Ready:**
- ✅ All tests passing
- ✅ Error handling works
- ✅ Rate limiting active
- ✅ Monitoring set up
- ✅ Costs within budget

---

## 🆘 Need Help?

### **Firebase Support:**
- Docs: https://firebase.google.com/docs/functions
- Community: https://firebase.google.com/community
- Stack Overflow: [firebase] tag

### **SendGrid Support:**
- Docs: https://docs.sendgrid.com/
- Support: https://support.sendgrid.com/
- Status: https://status.sendgrid.com/

### **Nebula Support:**
- Check: `EMAIL_VERIFICATION_SETUP.md`
- Read: `VERIFICATION_COMPLETE.md`
- Test: Open `test-verification.html`

---

**Ready to deploy?** Follow the steps above and you'll have production emails in minutes! 🚀

---

*Firebase Functions Quick Deploy Guide*  
*For Nebula Screen Capture*  
*Last Updated: October 10, 2025*
