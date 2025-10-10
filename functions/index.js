const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const cors = require('cors')({ origin: true });
const express = require('express');

// Load environment variables
require('dotenv').config();

// Initialize Firebase Admin
admin.initializeApp();

// Initialize SendGrid with environment variable
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Email addresses from environment variables
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'colinnebula@gmail.com';
const NO_REPLY_EMAIL = process.env.NO_REPLY_EMAIL || 'noreply@nebula3ddev.com';

// Rate limiting store (in-memory, resets on cold start)
const emailRateLimit = new Map();

// Helper: Check rate limit (100 emails per hour per IP)
const checkRateLimit = (ip) => {
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);
  
  if (!emailRateLimit.has(ip)) {
    emailRateLimit.set(ip, []);
  }
  
  const requests = emailRateLimit.get(ip).filter(time => time > hourAgo);
  
  if (requests.length >= 100) {
    return false;
  }
  
  requests.push(now);
  emailRateLimit.set(ip, requests);
  return true;
};

// Helper: Validate email
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Helper: Sanitize input
const sanitize = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
};

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

const getEmailTemplate = (type, data) => {
  const baseStyle = `
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
      color: #333;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  `;

  const templates = {
    welcome: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌌 Welcome to Nebula!</h1>
          </div>
          <div class="content">
            <h2>Hi ${sanitize(data.name)}! 👋</h2>
            <p>Welcome to <strong>Nebula Screen Capture</strong> - your ultimate screen recording companion!</p>
            
            <p>🎉 <strong>You're all set!</strong> Here's what you can do:</p>
            <ul>
              <li>📹 Record your screen in HD quality</li>
              <li>🎤 Capture audio from system or microphone</li>
              <li>✂️ Select custom recording areas</li>
              <li>💾 5GB of free storage</li>
              <li>⏱️ Up to 30 minutes per recording</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="https://nebula3ddev.com" class="button">Start Recording Now</a>
            </p>
            
            <p>Need help? Check out our <a href="https://nebula3ddev.com/help">Help Center</a> or reply to this email.</p>
            
            <p>Happy recording! 🚀</p>
            <p><strong>The Nebula Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 Nebula 3D Dev. All rights reserved.</p>
            <p><a href="https://nebula3ddev.com">Website</a> | <a href="https://nebula3ddev.com/privacy.html">Privacy</a> | <a href="mailto:${SUPPORT_EMAIL}">Support</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    
    passwordReset: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your Nebula Screen Capture account.</p>
            
            <p style="text-align: center;">
              <a href="https://nebula3ddev.com/reset-password?token=${sanitize(data.resetToken)}" class="button">Reset Password</a>
            </p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password won't change.</p>
            
            <p>For security reasons, never share this link with anyone.</p>
            
            <p>Stay secure! 🔐<br><strong>The Nebula Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 Nebula 3D Dev. All rights reserved.</p>
            <p>If the button doesn't work, copy this link:<br>
            <small>https://nebula3ddev.com/reset-password?token=${sanitize(data.resetToken)}</small></p>
          </div>
        </div>
      </body>
      </html>
    `,
    
    upgradeConfirmation: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Upgrade Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Welcome to ${sanitize(data.plan)} Plan!</h2>
            <p>Hi ${sanitize(data.name)},</p>
            <p>Your upgrade to the <strong>${sanitize(data.plan)}</strong> plan is now active!</p>
            
            <h3>✨ Your New Features:</h3>
            <ul>
              ${data.plan === 'Pro' ? `
                <li>🎬 1 hour recording sessions</li>
                <li>📹 4K quality recordings</li>
                <li>☁️ 10GB cloud storage</li>
                <li>🎨 Webcam overlay</li>
                <li>🎙️ Advanced audio controls</li>
                <li>✂️ Video editing tools</li>
                <li>🤖 AI transcription</li>
                <li>⭐ Priority support</li>
              ` : `
                <li>⏱️ Unlimited recording time</li>
                <li>📹 4K quality recordings</li>
                <li>☁️ 100GB cloud storage</li>
                <li>👥 Team collaboration</li>
                <li>📊 Advanced analytics</li>
                <li>🎨 Custom branding</li>
                <li>📡 Live streaming</li>
                <li>🔌 API access</li>
              `}
            </ul>
            
            <p><strong>Billing:</strong> $${sanitize(data.price)}/month</p>
            
            <p style="text-align: center;">
              <a href="https://nebula3ddev.com" class="button">Start Using Premium Features</a>
            </p>
            
            <p>Thank you for your support! 💜<br><strong>The Nebula Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 Nebula 3D Dev. All rights reserved.</p>
            <p><a href="https://nebula3ddev.com/account">Manage Subscription</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    
    storageWarning: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Storage Alert</h1>
          </div>
          <div class="content">
            <h2>Your Storage is Running Low</h2>
            <p>Hi ${sanitize(data.name)},</p>
            <p>You're using <strong>${sanitize(data.storageUsed)}GB</strong> of your <strong>${sanitize(data.maxStorage)}GB</strong> storage limit (${Math.round((data.storageUsed / data.maxStorage) * 100)}%).</p>
            
            <h3>📊 What you can do:</h3>
            <ul>
              <li>🗑️ Delete old recordings you no longer need</li>
              <li>⬆️ Upgrade to get more storage</li>
              <li>📦 Download and backup important recordings</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="https://nebula3ddev.com/recordings" class="button">Manage Recordings</a>
            </p>
            
            <p>Need more space? Our Pro plan includes 10GB, and Premium gets 100GB!</p>
            
            <p><strong>The Nebula Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 Nebula 3D Dev. All rights reserved.</p>
            <p><a href="https://nebula3ddev.com/upgrade">View Plans</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    
    support: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 Support Request Received</h1>
          </div>
          <div class="content">
            <h2>We Got Your Message!</h2>
            <p>Hi ${sanitize(data.name)},</p>
            <p>Thank you for contacting Nebula support. We've received your message and will get back to you within 24 hours.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Subject:</strong> ${sanitize(data.subject)}</p>
              <p><strong>Your message:</strong></p>
              <p>${sanitize(data.message)}</p>
            </div>
            
            <p>In the meantime, you might find these helpful:</p>
            <ul>
              <li><a href="https://nebula3ddev.com/help">Help Center</a></li>
              <li><a href="https://nebula3ddev.com/faq">Frequently Asked Questions</a></li>
            </ul>
            
            <p>Thanks for your patience! 🙏<br><strong>The Nebula Support Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 Nebula 3D Dev. All rights reserved.</p>
            <p>Support Email: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
    
    recordingShare: `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyle}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 Someone Shared a Recording!</h1>
          </div>
          <div class="content">
            <h2>${sanitize(data.fromName)} shared a recording with you</h2>
            
            ${data.message ? `
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Message:</strong></p>
                <p>"${sanitize(data.message)}"</p>
              </div>
            ` : ''}
            
            <p style="text-align: center;">
              <a href="${sanitize(data.recordingUrl)}" class="button">View Recording</a>
            </p>
            
            <p><small>This link is valid for 30 days.</small></p>
            
            <p><strong>The Nebula Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 Nebula 3D Dev. All rights reserved.</p>
            <p>Get your own Nebula account: <a href="https://nebula3ddev.com">nebula3ddev.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `,

    emailVerification: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${baseStyle}
          .verification-code {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 20px;
            text-align: center;
            border-radius: 12px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
          }
          .alternative {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hi ${sanitize(data.name)}! 👋</h2>
            <p>Thanks for signing up for <strong>Nebula Screen Capture</strong>!</p>
            <p>We just need to verify your email address to complete your registration.</p>
            
            <h3>🔐 Your Verification Code:</h3>
            <div class="verification-code">${sanitize(data.verificationToken)}</div>
            
            <p style="text-align: center;">
              <a href="${sanitize(data.verificationUrl)}" class="button">Verify Email Now</a>
            </p>
            
            <div class="alternative">
              <p><strong>Alternative Method:</strong></p>
              <p>Copy and paste this code into the verification page, or click the button above.</p>
              <p><strong>This code expires in 24 hours.</strong></p>
            </div>
            
            <p>If you didn't create a Nebula account, you can safely ignore this email.</p>
            
            <p>See you soon! 🚀<br><strong>The Nebula Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 Nebula 3D Dev. All rights reserved.</p>
            <p>Need help? <a href="mailto:${SUPPORT_EMAIL}">Contact Support</a></p>
          </div>
        </div>
      </body>
      </html>
    `,

    welcomeVerified: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${baseStyle}
          .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .feature-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }
          .feature-icon {
            font-size: 36px;
            margin-bottom: 10px;
          }
          @media (max-width: 600px) {
            .feature-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Email Verified!</h1>
          </div>
          <div class="content">
            <h2>Welcome to Nebula, ${sanitize(data.name)}! 🌌</h2>
            <p><strong>Your email has been verified successfully!</strong></p>
            <p>You're now ready to start creating amazing screen recordings.</p>
            
            <div class="feature-grid">
              <div class="feature-card">
                <div class="feature-icon">📹</div>
                <h3>HD Recording</h3>
                <p>Record in stunning 1080p quality</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">🎤</div>
                <h3>Audio Capture</h3>
                <p>System sound & microphone</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">✂️</div>
                <h3>Custom Areas</h3>
                <p>Select what to record</p>
              </div>
              <div class="feature-card">
                <div class="feature-icon">💾</div>
                <h3>5GB Storage</h3>
                <p>Free cloud storage included</p>
              </div>
            </div>
            
            <h3>🚀 Quick Start Guide:</h3>
            <ol style="text-align: left; line-height: 2;">
              <li><strong>Click "New Recording"</strong> to start</li>
              <li><strong>Choose your capture area</strong> (screen, window, or custom)</li>
              <li><strong>Enable audio</strong> if needed</li>
              <li><strong>Click "Start Recording"</strong> and you're live!</li>
              <li><strong>Save & Share</strong> your recording</li>
            </ol>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://ColinNebula.github.io/nebula-screen-capture/" class="button">Start Recording Now</a>
            </p>
            
            <p>Need help? Check out our <a href="https://ColinNebula.github.io/nebula-screen-capture/#help">Help & Support</a> or watch our tutorial videos.</p>
            
            <p>Happy recording! 🎬<br><strong>The Nebula Team</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 Nebula 3D Dev. All rights reserved.</p>
            <p>
              <a href="https://ColinNebula.github.io/nebula-screen-capture/">Dashboard</a> | 
              <a href="mailto:${SUPPORT_EMAIL}">Support</a> | 
              <a href="https://ColinNebula.github.io/nebula-screen-capture/#upgrade">Upgrade</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return templates[type] || '';
};

// =============================================================================
// EMAIL FUNCTIONS
// =============================================================================

// 1. Welcome Email
exports.sendWelcomeEmail = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Rate limiting
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { email, name } = req.body;

      // Validation
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      const msg = {
        to: email,
        from: NO_REPLY_EMAIL,
        subject: '🌌 Welcome to Nebula Screen Capture!',
        html: getEmailTemplate('welcome', { name: name || 'there' })
      };

      await sgMail.send(msg);
      
      functions.logger.info('Welcome email sent to:', email);
      return res.status(200).json({ success: true, message: 'Welcome email sent' });
    } catch (error) {
      functions.logger.error('Error sending welcome email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });
});

// 2. Password Reset Email
exports.sendPasswordReset = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { email, resetToken } = req.body;

      if (!email || !isValidEmail(email) || !resetToken) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const msg = {
        to: email,
        from: NO_REPLY_EMAIL,
        subject: '🔒 Reset Your Nebula Password',
        html: getEmailTemplate('passwordReset', { resetToken })
      };

      await sgMail.send(msg);
      
      functions.logger.info('Password reset email sent to:', email);
      return res.status(200).json({ success: true, message: 'Reset email sent' });
    } catch (error) {
      functions.logger.error('Error sending reset email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });
});

// 3. Upgrade Confirmation Email
exports.sendUpgradeConfirmation = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { email, name, plan, price } = req.body;

      if (!email || !isValidEmail(email) || !plan || !price) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const msg = {
        to: email,
        from: NO_REPLY_EMAIL,
        subject: `🎉 Welcome to ${plan} Plan!`,
        html: getEmailTemplate('upgradeConfirmation', { name, plan, price })
      };

      await sgMail.send(msg);
      
      functions.logger.info('Upgrade confirmation sent to:', email);
      return res.status(200).json({ success: true, message: 'Confirmation sent' });
    } catch (error) {
      functions.logger.error('Error sending upgrade email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });
});

// 4. Storage Warning Email
exports.sendStorageWarning = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { email, name, storageUsed, maxStorage } = req.body;

      if (!email || !isValidEmail(email) || !storageUsed || !maxStorage) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const msg = {
        to: email,
        from: NO_REPLY_EMAIL,
        subject: '⚠️ Your Nebula Storage is Running Low',
        html: getEmailTemplate('storageWarning', { name, storageUsed, maxStorage })
      };

      await sgMail.send(msg);
      
      functions.logger.info('Storage warning sent to:', email);
      return res.status(200).json({ success: true, message: 'Warning sent' });
    } catch (error) {
      functions.logger.error('Error sending storage warning:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });
});

// 5. Support Email
exports.sendSupportEmail = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { email, name, subject, message } = req.body;

      if (!email || !isValidEmail(email) || !subject || !message) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      // Send confirmation to user
      const userMsg = {
        to: email,
        from: NO_REPLY_EMAIL,
        subject: '💬 We Received Your Support Request',
        html: getEmailTemplate('support', { name, subject, message })
      };

      // Send notification to support team
      const supportMsg = {
        to: SUPPORT_EMAIL,
        from: NO_REPLY_EMAIL,
        replyTo: email,
        subject: `Support Request: ${subject}`,
        text: `From: ${name} (${email})\n\nMessage:\n${message}`
      };

      await Promise.all([
        sgMail.send(userMsg),
        sgMail.send(supportMsg)
      ]);
      
      functions.logger.info('Support emails sent:', email);
      return res.status(200).json({ success: true, message: 'Support request sent' });
    } catch (error) {
      functions.logger.error('Error sending support email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });
});

// 6. Recording Share Email
exports.sendRecordingShare = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { email, fromName, recordingUrl, message } = req.body;

      if (!email || !isValidEmail(email) || !fromName || !recordingUrl) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const msg = {
        to: email,
        from: NO_REPLY_EMAIL,
        subject: `🎬 ${fromName} shared a recording with you`,
        html: getEmailTemplate('recordingShare', { fromName, recordingUrl, message })
      };

      await sgMail.send(msg);
      
      functions.logger.info('Recording share sent to:', email);
      return res.status(200).json({ success: true, message: 'Share email sent' });
    } catch (error) {
      functions.logger.error('Error sending share email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });
});

// 7. Email Verification
exports.sendVerificationEmail = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      }

      const { email, name, verificationToken, verificationUrl } = req.body;

      if (!email || !isValidEmail(email) || !verificationToken || !verificationUrl) {
        return res.status(400).json({ error: 'Invalid request parameters' });
      }

      const msg = {
        to: email,
        from: NO_REPLY_EMAIL,
        subject: '✨ Verify Your Nebula Email Address',
        html: getEmailTemplate('emailVerification', { 
          name: name || 'there', 
          verificationToken,
          verificationUrl 
        })
      };

      await sgMail.send(msg);
      
      functions.logger.info('Verification email sent to:', email);
      return res.status(200).json({ 
        success: true, 
        message: 'Verification email sent successfully' 
      });
    } catch (error) {
      functions.logger.error('Error sending verification email:', error);
      return res.status(500).json({ 
        error: 'Failed to send verification email',
        details: error.message 
      });
    }
  });
});

// 8. Welcome Email (after verification)
exports.sendWelcomeEmailVerified = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const { email, name } = req.body;

      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      const msg = {
        to: email,
        from: NO_REPLY_EMAIL,
        subject: '🎉 Email Verified - Welcome to Nebula!',
        html: getEmailTemplate('welcomeVerified', { name: name || 'there' })
      };

      await sgMail.send(msg);
      
      functions.logger.info('Welcome (verified) email sent to:', email);
      return res.status(200).json({ 
        success: true, 
        message: 'Welcome email sent' 
      });
    } catch (error) {
      functions.logger.error('Error sending welcome email:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }
  });
});
