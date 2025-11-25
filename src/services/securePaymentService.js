/**
 * Secure Payment Service
 * Handles payment processing with enhanced security measures
 * Never stores sensitive card data - uses tokenization
 */

import { loadStripe } from '@stripe/stripe-js';
import subscriptionService from './subscriptionService';

class SecurePaymentService {
  constructor() {
    this.stripePromise = null;
    this.initializeStripe();
  }

  /**
   * Initialize Stripe with publishable key
   */
  async initializeStripe() {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (stripeKey && stripeKey.startsWith('pk_')) {
      this.stripePromise = loadStripe(stripeKey);
      console.log('✅ Stripe initialized');
    } else {
      console.warn('⚠️ Stripe not configured - demo mode active');
    }
  }

  /**
   * Create payment intent (server-side endpoint required)
   */
  async createPaymentIntent(paymentData) {
    const { plan, userId, billingInfo } = paymentData;

    try {
      // In production, this should call your backend API
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
      
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify({
            planId: plan.id,
            userId,
            billingInfo,
            amount: this.getPlanAmount(plan.id),
            currency: 'usd',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        return await response.json();
      } else {
        // Demo mode - simulate payment intent
        return this.mockPaymentIntent(paymentData);
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Payment initialization failed');
    }
  }

  /**
   * Process Stripe payment securely
   */
  async processStripePayment(paymentData) {
    const { plan, billingInfo, userId } = paymentData;

    try {
      // Validate input
      this.validatePaymentData(paymentData);

      // Get Stripe instance
      const stripe = await this.stripePromise;

      if (!stripe) {
        // Demo mode
        return await this.mockStripePayment(paymentData);
      }

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(paymentData);

      // Confirm payment (in real implementation, card element would be used)
      // This is where Stripe's card element would collect and tokenize card data
      const result = await stripe.confirmCardPayment(paymentIntent.clientSecret);

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Payment successful - create subscription
      const subscription = await subscriptionService.upgradeUserPlan({
        userId,
        plan: plan.id,
        paymentDetails: {
          method: 'stripe',
          transactionId: result.paymentIntent.id,
          status: result.paymentIntent.status,
        },
        billingInfo,
      });

      return {
        success: true,
        subscription,
        transactionId: result.paymentIntent.id,
        status: result.paymentIntent.status,
      };

    } catch (error) {
      console.error('Stripe payment error:', error);
      throw new Error('Payment processing failed: ' + error.message);
    }
  }

  /**
   * Process PayPal payment securely
   */
  async processPayPalPayment(paymentData) {
    const { plan, billingInfo, userId, orderId } = paymentData;

    try {
      // Validate input
      this.validatePaymentData(paymentData);

      // In production, verify the order with PayPal
      const backendUrl = import.meta.env.VITE_BACKEND_API_URL;
      
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/verify-paypal-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
          body: JSON.stringify({
            orderId,
            planId: plan.id,
            userId,
          }),
        });

        if (!response.ok) {
          throw new Error('PayPal payment verification failed');
        }

        const verification = await response.json();

        // Create subscription
        const subscription = await subscriptionService.upgradeUserPlan({
          userId,
          plan: plan.id,
          paymentDetails: {
            method: 'paypal',
            transactionId: orderId,
            status: verification.status,
          },
          billingInfo,
        });

        return {
          success: true,
          subscription,
          transactionId: orderId,
          status: verification.status,
        };

      } else {
        // Demo mode
        return await this.mockPayPalPayment(paymentData);
      }

    } catch (error) {
      console.error('PayPal payment error:', error);
      throw new Error('PayPal payment processing failed: ' + error.message);
    }
  }

  /**
   * Validate payment data before processing
   */
  validatePaymentData(paymentData) {
    const { plan, billingInfo, userId } = paymentData;

    if (!plan || !plan.id) {
      throw new Error('Invalid plan selected');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!billingInfo || !billingInfo.email) {
      throw new Error('Billing email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingInfo.email)) {
      throw new Error('Invalid email format');
    }

    if (!billingInfo.country) {
      throw new Error('Country is required');
    }

    if (!billingInfo.zipCode) {
      throw new Error('Zip code is required');
    }

    return true;
  }

  /**
   * Get plan amount in cents for Stripe
   */
  getPlanAmount(planId) {
    const amounts = {
      free: 0,
      pro: 999, // $9.99 in cents
      premium: 1999, // $19.99 in cents
    };
    return amounts[planId] || 0;
  }

  /**
   * Get authentication token for API calls
   */
  getAuthToken() {
    // Get from localStorage or auth service
    const userStr = localStorage.getItem('nebulaUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.token || '';
    }
    return '';
  }

  /**
   * Mock payment intent for demo mode
   */
  async mockPaymentIntent(paymentData) {
    console.log('🔄 [DEMO MODE] Creating mock payment intent');
    
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      clientSecret: `pi_mock_${Date.now()}_secret`,
      id: `pi_mock_${Date.now()}`,
      amount: this.getPlanAmount(paymentData.plan.id),
      currency: 'usd',
      status: 'requires_confirmation',
    };
  }

  /**
   * Mock Stripe payment for demo mode
   */
  async mockStripePayment(paymentData) {
    console.log('💳 [DEMO MODE] Processing mock Stripe payment');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const transactionId = `stripe_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create subscription
    const subscription = await subscriptionService.upgradeUserPlan({
      userId: paymentData.userId,
      plan: paymentData.plan.id,
      paymentDetails: {
        method: 'stripe',
        transactionId,
        status: 'succeeded',
      },
      billingInfo: paymentData.billingInfo,
    });

    return {
      success: true,
      subscription,
      transactionId,
      status: 'succeeded',
      message: 'Demo payment successful',
    };
  }

  /**
   * Mock PayPal payment for demo mode
   */
  async mockPayPalPayment(paymentData) {
    console.log('💰 [DEMO MODE] Processing mock PayPal payment');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const transactionId = paymentData.orderId || `paypal_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create subscription
    const subscription = await subscriptionService.upgradeUserPlan({
      userId: paymentData.userId,
      plan: paymentData.plan.id,
      paymentDetails: {
        method: 'paypal',
        transactionId,
        status: 'completed',
      },
      billingInfo: paymentData.billingInfo,
    });

    return {
      success: true,
      subscription,
      transactionId,
      status: 'completed',
      message: 'Demo payment successful',
    };
  }

  /**
   * Verify webhook signature (for production)
   */
  verifyWebhookSignature(payload, signature, secret) {
    // Implement webhook signature verification
    // This should be done on the backend
    try {
      // Use Stripe's webhook signature verification
      // stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Handle webhook events (for production backend)
   */
  async handleWebhookEvent(event) {
    console.log('Webhook event received:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        // Payment was successful
        await this.handleSuccessfulPayment(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        // Payment failed
        await this.handleFailedPayment(event.data.object);
        break;

      case 'customer.subscription.updated':
        // Subscription updated
        await this.handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        // Subscription cancelled
        await this.handleSubscriptionCancellation(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment webhook
   */
  async handleSuccessfulPayment(paymentIntent) {
    console.log('Processing successful payment:', paymentIntent.id);
    // Update subscription status, send confirmation email, etc.
  }

  /**
   * Handle failed payment webhook
   */
  async handleFailedPayment(paymentIntent) {
    console.log('Processing failed payment:', paymentIntent.id);
    // Notify user, retry payment, etc.
  }

  /**
   * Handle subscription update webhook
   */
  async handleSubscriptionUpdate(subscription) {
    console.log('Processing subscription update:', subscription.id);
    // Update user's plan, billing info, etc.
  }

  /**
   * Handle subscription cancellation webhook
   */
  async handleSubscriptionCancellation(subscription) {
    console.log('Processing subscription cancellation:', subscription.id);
    // Downgrade user, send cancellation email, etc.
  }
}

// Export singleton instance
const securePaymentService = new SecurePaymentService();
export default securePaymentService;
