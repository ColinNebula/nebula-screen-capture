/**
 * Email Verification Service
 * Handles email verification for new user signups
 */

const EMAIL_VERIFICATION_KEY = 'nebula_email_verifications';
const VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class EmailVerificationService {
  /**
   * Generate a verification token
   */
  generateToken() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(userData) {
    const token = this.generateToken();
    const expiresAt = Date.now() + VERIFICATION_EXPIRY;

    // Store verification data
    const verifications = this.getStoredVerifications();
    verifications[userData.email] = {
      token,
      expiresAt,
      email: userData.email,
      name: userData.name,
      userId: userData.id,
      createdAt: Date.now(),
      verified: false
    };
    localStorage.setItem(EMAIL_VERIFICATION_KEY, JSON.stringify(verifications));

    // Construct verification link
    const baseUrl = window.location.origin + window.location.pathname;
    const verificationUrl = `${baseUrl}#/verify-email?token=${token}&email=${encodeURIComponent(userData.email)}`;

    // Get Firebase Functions URL
    const functionsUrl = process.env.REACT_APP_API_URL || 'https://nebula-screen-capture.firebaseapp.com';

    try {
      // Send email via Firebase Functions
      const response = await fetch(`${functionsUrl}/sendVerificationEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name,
          verificationUrl,
          token
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send verification email');
      }

      console.log('📧 Verification email sent to:', userData.email);
      console.log('🔗 Verification URL:', verificationUrl);
      
      return {
        success: true,
        token,
        verificationUrl,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      
      // Fallback: Log to console in demo mode
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL VERIFICATION (Demo Mode)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${userData.email}`);
      console.log(`Name: ${userData.name}`);
      console.log(`Subject: Verify your Nebula Screen Capture account`);
      console.log('');
      console.log('Click the link below to verify your email:');
      console.log(verificationUrl);
      console.log('');
      console.log('Or use this code:', token.split('-')[1]);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return {
        success: true,
        token,
        verificationUrl,
        message: 'Verification link logged to console (demo mode)',
        isDemoMode: true
      };
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(email, token) {
    const verifications = this.getStoredVerifications();
    const verification = verifications[email];

    if (!verification) {
      return {
        success: false,
        error: 'No verification found for this email'
      };
    }

    if (verification.verified) {
      return {
        success: false,
        error: 'Email already verified'
      };
    }

    if (verification.token !== token) {
      return {
        success: false,
        error: 'Invalid verification token'
      };
    }

    if (Date.now() > verification.expiresAt) {
      return {
        success: false,
        error: 'Verification link has expired. Please request a new one.'
      };
    }

    // Mark as verified
    verification.verified = true;
    verification.verifiedAt = Date.now();
    verifications[email] = verification;
    localStorage.setItem(EMAIL_VERIFICATION_KEY, JSON.stringify(verifications));

    // Send welcome email
    await this.sendWelcomeEmail(verification);

    console.log('✅ Email verified successfully:', email);

    return {
      success: true,
      message: 'Email verified successfully!',
      userId: verification.userId
    };
  }

  /**
   * Check if email is verified
   */
  isEmailVerified(email) {
    const verifications = this.getStoredVerifications();
    const verification = verifications[email];
    return verification && verification.verified;
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    const verifications = this.getStoredVerifications();
    const verification = verifications[email];

    if (!verification) {
      return {
        success: false,
        error: 'No account found with this email'
      };
    }

    if (verification.verified) {
      return {
        success: false,
        error: 'Email already verified'
      };
    }

    // Generate new token
    const token = this.generateToken();
    const expiresAt = Date.now() + VERIFICATION_EXPIRY;

    verification.token = token;
    verification.expiresAt = expiresAt;
    verification.resendCount = (verification.resendCount || 0) + 1;
    verification.lastResendAt = Date.now();

    verifications[email] = verification;
    localStorage.setItem(EMAIL_VERIFICATION_KEY, JSON.stringify(verifications));

    // Send new verification email
    return await this.sendVerificationEmail({
      email: verification.email,
      name: verification.name,
      id: verification.userId
    });
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(userData) {
    const functionsUrl = process.env.REACT_APP_API_URL || 'https://nebula-screen-capture.firebaseapp.com';

    try {
      const response = await fetch(`${functionsUrl}/sendWelcomeEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send welcome email');
      }

      console.log('🎉 Welcome email sent to:', userData.email);
      return { success: true };
    } catch (error) {
      console.error('Welcome email failed:', error);
      
      // Log to console in demo mode
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 WELCOME EMAIL (Demo Mode)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`To: ${userData.email}`);
      console.log(`Name: ${userData.name}`);
      console.log(`Subject: Welcome to Nebula Screen Capture!`);
      console.log('');
      console.log(`Hi ${userData.name},`);
      console.log('');
      console.log('Welcome to Nebula Screen Capture! Your account is now active.');
      console.log('Start recording professional screen captures today!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return { success: true, isDemoMode: true };
    }
  }

  /**
   * Get stored verifications
   */
  getStoredVerifications() {
    try {
      const stored = localStorage.getItem(EMAIL_VERIFICATION_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading verifications:', error);
      return {};
    }
  }

  /**
   * Clean up expired verifications
   */
  cleanupExpiredVerifications() {
    const verifications = this.getStoredVerifications();
    const now = Date.now();
    let cleaned = 0;

    Object.keys(verifications).forEach(email => {
      const verification = verifications[email];
      if (!verification.verified && now > verification.expiresAt) {
        delete verifications[email];
        cleaned++;
      }
    });

    if (cleaned > 0) {
      localStorage.setItem(EMAIL_VERIFICATION_KEY, JSON.stringify(verifications));
      console.log(`🧹 Cleaned up ${cleaned} expired verifications`);
    }

    return cleaned;
  }

  /**
   * Get verification status
   */
  getVerificationStatus(email) {
    const verifications = this.getStoredVerifications();
    const verification = verifications[email];

    if (!verification) {
      return { status: 'not_found' };
    }

    if (verification.verified) {
      return {
        status: 'verified',
        verifiedAt: verification.verifiedAt
      };
    }

    if (Date.now() > verification.expiresAt) {
      return {
        status: 'expired',
        expiresAt: verification.expiresAt
      };
    }

    return {
      status: 'pending',
      expiresAt: verification.expiresAt,
      createdAt: verification.createdAt
    };
  }
}

// Export singleton instance
const emailVerificationService = new EmailVerificationService();

// Clean up expired verifications on load
emailVerificationService.cleanupExpiredVerifications();

export default emailVerificationService;
