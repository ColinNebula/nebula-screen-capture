import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe only if key is available
let stripePromise = null;
const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

if (stripeKey && stripeKey.startsWith('pk_')) {
  stripePromise = loadStripe(stripeKey);
} else {
  console.warn('⚠️ Stripe publishable key not configured - using demo mode');
}

export const paymentService = {
  /**
   * Process Stripe Payment
   */
  async processStripePayment(paymentData) {
    try {
      const { plan, billingInfo, cardDetails, userEmail, userName } = paymentData;
      
      // In production, you would send this to your backend
      // For now, we'll simulate a successful payment
      
      console.log('Processing Stripe payment:', {
        plan: plan.id,
        amount: plan.price,
        email: billingInfo.email
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment
      const transactionId = `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        transactionId,
        amount: plan.price,
        currency: 'USD',
        method: 'stripe',
        plan: plan.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw new Error('Payment processing failed. Please try again.');
    }
  },

  /**
   * Process PayPal Payment
   */
  async processPayPalPayment(paymentData) {
    try {
      const { plan, billingInfo, orderID } = paymentData;
      
      console.log('Processing PayPal payment:', {
        plan: plan.id,
        amount: plan.price,
        orderID
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate successful payment
      const transactionId = orderID || `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        transactionId,
        amount: plan.price,
        currency: 'USD',
        method: 'paypal',
        plan: plan.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('PayPal payment error:', error);
      throw new Error('Payment processing failed. Please try again.');
    }
  },

  /**
   * Send Payment Confirmation Email
   */
  async sendPaymentConfirmationEmail(emailData) {
    try {
      const { email, name, plan, transactionId, amount } = emailData;
      
      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('nebulaUser') || '{}');
      
      const emailPayload = {
        email: email || user.email,
        name: name || user.name,
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        price: amount
      };

      // In development, log the email that would be sent
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:', emailPayload);
        console.log('Transaction ID:', transactionId);
        return { success: true, message: 'Email logged (development mode)' };
      }

      // Call Firebase function to send email
      const functionsUrl = process.env.REACT_APP_FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/nebula-screen-capture/us-central1';
      
      const response = await fetch(`${functionsUrl}/sendUpgradeConfirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      if (!response.ok) {
        throw new Error('Failed to send confirmation email');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Email send error:', error);
      // Don't fail the payment if email fails
      return { success: false, error: error.message };
    }
  },

  /**
   * Validate Card Number (Luhn Algorithm)
   */
  validateCardNumber(cardNumber) {
    const digits = cardNumber.replace(/\s/g, '');
    
    if (!/^\d+$/.test(digits)) return false;
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },

  /**
   * Get Card Brand from Number
   */
  getCardBrand(cardNumber) {
    const digits = cardNumber.replace(/\s/g, '');
    
    const brands = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      diners: /^3(?:0[0-5]|[68])/,
      jcb: /^35/
    };
    
    for (const [brand, pattern] of Object.entries(brands)) {
      if (pattern.test(digits)) {
        return brand;
      }
    }
    
    return 'unknown';
  },

  /**
   * Format Card Number for Display
   */
  formatCardNumber(value) {
    const digits = value.replace(/\s/g, '');
    const brand = this.getCardBrand(digits);
    
    // AMEX format: 4-6-5
    if (brand === 'amex') {
      return digits.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
    }
    
    // Default format: 4-4-4-4
    return digits.replace(/(\d{4})/g, '$1 ').trim();
  }
};

export default paymentService;
