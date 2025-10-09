# 📧 Email System Setup Guide - Firebase + SendGrid

## Overview

This guide will help you set up a complete email system for Nebula Screen Capture using Firebase Functions and SendGrid.

**Cost**: Free tier covers most needs
- Firebase Functions: 2M invocations/month free
- SendGrid: 100 emails/day free (3,000/month)

---

## 🚀 Quick Setup (30 minutes)

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase in Your Project

```bash
# In your project root
firebase init

# Select these options:
# ✅ Functions
# ✅ Hosting (optional, if deploying to Firebase)
# ? Use existing project or create new? Create new project
# ? Project name: nebula-screen-capture
# ? Language: JavaScript
# ? ESLint: Yes
# ? Install dependencies: Yes
```

### Step 4: Install Dependencies

```bash
cd functions
npm install @sendgrid/mail cors express
cd ..
```

### Step 5: Get SendGrid API Key

1. Go to: https://signup.sendgrid.com/
2. Create free account
3. Navigate to: Settings > API Keys
4. Click "Create API Key"
5. Name: "Nebula Screen Capture"
6. Select "Full Access"
7. Copy the API key (you won't see it again!)

### Step 6: Configure Firebase Environment

```bash
# Set SendGrid API key
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY_HERE"

# Set your email addresses
firebase functions:config:set email.support="colinnebula@gmail.com"
firebase functions:config:set email.noreply="noreply@nebula3ddev.com"

# Verify configuration
firebase functions:config:get
```

### Step 7: Verify Sender Email in SendGrid

1. Go to SendGrid Dashboard
2. Settings > Sender Authentication
3. Click "Verify a Single Sender"
4. Enter: colinnebula@gmail.com
5. Check your email and verify

### Step 8: Deploy Functions

```bash
firebase deploy --only functions
```

### Step 9: Update Your React App

Add the Firebase Functions URL to your `.env`:

```bash
REACT_APP_FIREBASE_FUNCTIONS_URL=https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net
```

---

## 📧 Available Email Functions

Once deployed, you'll have these email endpoints:

### 1. **Welcome Email** (User Registration)
```
POST /sendWelcomeEmail
Body: { email, name }
```

### 2. **Password Reset**
```
POST /sendPasswordReset
Body: { email, resetToken }
```

### 3. **Plan Upgrade Confirmation**
```
POST /sendUpgradeConfirmation
Body: { email, name, plan, price }
```

### 4. **Storage Warning** (80% full)
```
POST /sendStorageWarning
Body: { email, name, storageUsed, maxStorage }
```

### 5. **Support Ticket**
```
POST /sendSupportEmail
Body: { email, name, subject, message }
```

### 6. **Recording Share**
```
POST /sendRecordingShare
Body: { email, fromName, recordingUrl, message }
```

---

## 🔧 Integration in React App

### Example: Send Welcome Email on Registration

```javascript
// In RegisterForm.js
const sendWelcomeEmail = async (email, name) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_FIREBASE_FUNCTIONS_URL}/sendWelcomeEmail`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      }
    );
    
    if (response.ok) {
      console.log('Welcome email sent!');
    }
  } catch (error) {
    console.error('Email send failed:', error);
  }
};

// Call after successful registration
onRegister(userData);
sendWelcomeEmail(userData.email, userData.name);
```

---

## 📊 SendGrid Free Tier Limits

- **100 emails/day** = 3,000/month
- Email validation
- Activity tracking
- Deliverability insights
- Template editor

### Upgrade Options:
- **Essentials**: $19.95/month - 50,000 emails
- **Pro**: $89.95/month - 1.5M emails

---

## 🎨 Email Templates Included

All emails use responsive HTML templates with:
- Nebula branding (purple gradient)
- Mobile-friendly design
- Call-to-action buttons
- Footer with unsubscribe option

---

## 🔒 Security Features

- ✅ CORS enabled for your domain only
- ✅ Rate limiting (100 emails/hour per IP)
- ✅ Email validation
- ✅ Sanitized inputs
- ✅ No API key exposed to client

---

## 📈 Monitoring & Analytics

### Firebase Console
- View function logs
- Monitor invocations
- Check errors
- Performance metrics

### SendGrid Dashboard
- Email delivery stats
- Open rates (if tracking enabled)
- Bounce/spam reports
- Engagement analytics

---

## 🐛 Troubleshooting

### "Permission denied" error
```bash
firebase login --reauth
```

### "SendGrid API key invalid"
```bash
# Re-set the key
firebase functions:config:set sendgrid.key="NEW_API_KEY"
firebase deploy --only functions
```

### Emails not sending
1. Check SendGrid sender is verified
2. Check Firebase Functions logs: `firebase functions:log`
3. Verify API key is set: `firebase functions:config:get`
4. Check SendGrid activity feed

### CORS errors
- Verify your domain is in CORS whitelist
- Check REACT_APP_FIREBASE_FUNCTIONS_URL is correct

---

## 💰 Cost Calculator

**Estimated monthly costs (small app):**

| Users | Emails/month | Firebase | SendGrid | Total |
|-------|--------------|----------|----------|-------|
| 100   | 500          | $0       | $0       | $0    |
| 1,000 | 5,000        | $0       | $19.95   | $20   |
| 10,000| 50,000       | $0       | $19.95   | $20   |

Firebase Functions free tier covers up to 2M invocations!

---

## 📝 Next Steps After Setup

1. ✅ Test each email function
2. ✅ Customize email templates with your branding
3. ✅ Set up email preferences in user settings
4. ✅ Add unsubscribe functionality
5. ✅ Monitor delivery rates
6. ✅ Add email queue for large batches
7. ✅ Set up email analytics

---

## 🎯 Production Checklist

Before going live:

- [ ] SendGrid sender email verified
- [ ] Firebase Functions deployed
- [ ] All functions tested
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Email templates reviewed
- [ ] Unsubscribe links working
- [ ] Error handling in place
- [ ] Monitoring alerts set up
- [ ] Backup email provider (optional)

---

## 📚 Useful Resources

- Firebase Functions Docs: https://firebase.google.com/docs/functions
- SendGrid API Docs: https://docs.sendgrid.com/api-reference
- Email Best Practices: https://sendgrid.com/blog/email-best-practices/
- HTML Email Templates: https://github.com/sendgrid/email-templates

---

## 🆘 Support

**Issues with setup?**
- Firebase: https://firebase.google.com/support
- SendGrid: https://support.sendgrid.com/
- Email: colinnebula@gmail.com

---

**Prepared by**: GitHub Copilot  
**Date**: October 9, 2025  
**For**: Nebula Screen Capture Email System
