/**
 * Subscription Management Service
 * Handles user plan upgrades, downgrades, and subscription management
 */

import { db } from './firebase';

class SubscriptionService {
  /**
   * Upgrade user to a new plan
   * @param {Object} upgradeData - Contains userId, plan, paymentDetails
   * @returns {Promise<Object>} Subscription details
   */
  async upgradeUserPlan(upgradeData) {
    const { userId, plan, paymentDetails, billingInfo } = upgradeData;

    try {
      // Validate plan
      const validPlans = ['free', 'pro', 'premium'];
      if (!validPlans.includes(plan)) {
        throw new Error('Invalid plan selected');
      }

      // Create subscription record
      const subscription = {
        userId,
        plan,
        status: 'active',
        startDate: new Date().toISOString(),
        billingCycle: 'monthly',
        paymentMethod: paymentDetails.method,
        lastPaymentDate: new Date().toISOString(),
        nextBillingDate: this.calculateNextBillingDate(),
        amount: this.getPlanPrice(plan),
        currency: 'USD',
        transactionId: paymentDetails.transactionId,
        billingInfo: {
          email: billingInfo.email,
          country: billingInfo.country,
          zipCode: billingInfo.zipCode,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store in database (Firebase/your backend)
      await this.storeSubscription(subscription);

      // Update user profile
      await this.updateUserProfile(userId, { plan, subscription });

      // Send confirmation email
      await this.sendUpgradeConfirmationEmail({
        email: billingInfo.email,
        plan,
        subscription,
      });

      return subscription;
    } catch (error) {
      console.error('Error upgrading user plan:', error);
      throw new Error('Failed to upgrade plan: ' + error.message);
    }
  }

  /**
   * Store subscription in database
   */
  async storeSubscription(subscription) {
    try {
      // If using Firebase
      if (db && db.collection) {
        const subscriptionRef = db.collection('subscriptions').doc(subscription.userId);
        await subscriptionRef.set(subscription, { merge: true });
      } else {
        // Use localStorage as fallback for demo
        const subscriptions = JSON.parse(localStorage.getItem('nebula_subscriptions') || '{}');
        subscriptions[subscription.userId] = subscription;
        localStorage.setItem('nebula_subscriptions', JSON.stringify(subscriptions));
      }
    } catch (error) {
      console.error('Error storing subscription:', error);
      throw error;
    }
  }

  /**
   * Update user profile with new plan
   */
  async updateUserProfile(userId, updates) {
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('nebulaUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.id === userId || user.email === userId) {
          const updatedUser = {
            ...user,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('nebulaUser', JSON.stringify(updatedUser));
          
          // Trigger storage event for other tabs
          window.dispatchEvent(new Event('storage'));
        }
      }

      // If using Firebase
      if (db && db.collection) {
        const userRef = db.collection('users').doc(userId);
        await userRef.update({
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId) {
    try {
      // Try Firebase first
      if (db && db.collection) {
        const subscriptionRef = db.collection('subscriptions').doc(userId);
        const doc = await subscriptionRef.get();
        if (doc.exists) {
          return doc.data();
        }
      }

      // Fallback to localStorage
      const subscriptions = JSON.parse(localStorage.getItem('nebula_subscriptions') || '{}');
      return subscriptions[userId] || null;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId, reason = '') {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      const cancelledSubscription = {
        ...subscription,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        endDate: subscription.nextBillingDate, // Access until end of billing period
      };

      await this.storeSubscription(cancelledSubscription);

      // Send cancellation email
      await this.sendCancellationEmail({
        email: subscription.billingInfo.email,
        plan: subscription.plan,
        endDate: subscription.nextBillingDate,
      });

      return cancelledSubscription;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription || subscription.status !== 'cancelled') {
        throw new Error('No cancelled subscription found');
      }

      const reactivatedSubscription = {
        ...subscription,
        status: 'active',
        reactivatedAt: new Date().toISOString(),
        nextBillingDate: this.calculateNextBillingDate(),
      };

      await this.storeSubscription(reactivatedSubscription);

      return reactivatedSubscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }

  /**
   * Calculate next billing date (30 days from now)
   */
  calculateNextBillingDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString();
  }

  /**
   * Get plan pricing
   */
  getPlanPrice(plan) {
    const prices = {
      free: 0,
      pro: 9.99,
      premium: 19.99,
    };
    return prices[plan] || 0;
  }

  /**
   * Send upgrade confirmation email
   */
  async sendUpgradeConfirmationEmail(data) {
    try {
      // Use existing email service
      const functionsUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
      
      if (functionsUrl) {
        const response = await fetch(`${functionsUrl}/sendUpgradeConfirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            plan: data.plan,
            price: this.getPlanPrice(data.plan),
            transactionId: data.subscription.transactionId,
          }),
        });

        if (!response.ok) {
          console.warn('Failed to send confirmation email:', response.statusText);
        }
      } else {
        console.log('📧 [DEMO MODE] Upgrade confirmation email would be sent to:', data.email);
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Don't throw - email is not critical to the upgrade process
    }
  }

  /**
   * Send cancellation email
   */
  async sendCancellationEmail(data) {
    try {
      console.log('📧 Cancellation email would be sent to:', data.email);
      // Implement when needed
    } catch (error) {
      console.error('Error sending cancellation email:', error);
    }
  }

  /**
   * Get subscription features and limits
   */
  getSubscriptionFeatures(plan) {
    const features = {
      free: {
        recordings: 10,
        quality: '720p',
        storage: 500, // MB
        support: 'Community',
        advancedFeatures: false,
      },
      pro: {
        recordings: -1, // Unlimited
        quality: '1080p',
        storage: 10240, // 10GB
        support: 'Priority',
        advancedFeatures: true,
        customBranding: true,
        teamCollaboration: true,
      },
      premium: {
        recordings: -1, // Unlimited
        quality: '4K',
        storage: 102400, // 100GB
        support: '24/7 Premium',
        advancedFeatures: true,
        customBranding: true,
        teamCollaboration: true,
        aiEditing: true,
        apiAccess: true,
        analytics: true,
      },
    };

    return features[plan] || features.free;
  }

  /**
   * Check if user has access to a feature
   */
  hasFeatureAccess(userPlan, feature) {
    const planFeatures = this.getSubscriptionFeatures(userPlan);
    return planFeatures[feature] === true || planFeatures[feature] === -1;
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(userId) {
    try {
      // Get from database or calculate
      const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
      const userRecordings = recordings.filter(r => r.userId === userId);
      
      const totalSize = userRecordings.reduce((sum, r) => sum + (r.size || 0), 0);
      const recordingsThisMonth = userRecordings.filter(r => {
        const recordingDate = new Date(r.createdAt);
        const now = new Date();
        return recordingDate.getMonth() === now.getMonth() &&
               recordingDate.getFullYear() === now.getFullYear();
      }).length;

      return {
        recordingsThisMonth,
        totalRecordings: userRecordings.length,
        storageUsed: totalSize,
        storageUnit: 'MB',
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return {
        recordingsThisMonth: 0,
        totalRecordings: 0,
        storageUsed: 0,
        storageUnit: 'MB',
      };
    }
  }
}

// Export singleton instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;
