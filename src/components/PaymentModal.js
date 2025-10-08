import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './PaymentModal.css';

const PaymentModal = ({ plan, onClose, onPaymentSuccess, onPaymentError }) => {
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [billingInfo, setBillingInfo] = useState({
    email: '',
    country: '',
    zipCode: '',
  });
  const [errors, setErrors] = useState({});

  const planPrices = {
    pro: { amount: 9.99, currency: 'USD' },
    premium: { amount: 19.99, currency: 'USD' },
  };

  const currentPlan = planPrices[plan.id] || planPrices.pro;

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      formattedValue = formattedValue.slice(0, 19); // 16 digits + 3 spaces
    }

    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
    }

    // Format CVV
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBillingInputChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate billing info
    if (!billingInfo.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(billingInfo.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!billingInfo.country) {
      newErrors.country = 'Country is required';
    }

    if (!billingInfo.zipCode) {
      newErrors.zipCode = 'Zip/Postal code is required';
    }

    if (paymentMethod === 'stripe') {
      // Validate card details
      const cardNumberClean = cardDetails.cardNumber.replace(/\s/g, '');
      
      if (!cardDetails.cardNumber) {
        newErrors.cardNumber = 'Card number is required';
      } else if (cardNumberClean.length < 13 || cardNumberClean.length > 19) {
        newErrors.cardNumber = 'Invalid card number';
      }

      if (!cardDetails.cardName) {
        newErrors.cardName = 'Cardholder name is required';
      }

      if (!cardDetails.expiryDate) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
        newErrors.expiryDate = 'Invalid format (MM/YY)';
      }

      if (!cardDetails.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (cardDetails.cvv.length < 3) {
        newErrors.cvv = 'Invalid CVV';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStripePayment = async () => {
    try {
      // In production, integrate with Stripe API
      const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
      
      if (!stripePublicKey) {
        console.warn('Stripe not configured - using demo mode');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful payment
      const paymentResult = {
        success: true,
        transactionId: `stripe_${Date.now()}`,
        amount: currentPlan.amount,
        currency: currentPlan.currency,
        plan: plan.id,
        method: 'stripe',
      };

      return paymentResult;
    } catch (error) {
      throw new Error('Payment processing failed');
    }
  };

  const handlePayPalPayment = async () => {
    try {
      // In production, integrate with PayPal SDK
      console.log('Processing PayPal payment...');

      // Simulate PayPal checkout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful payment
      const paymentResult = {
        success: true,
        transactionId: `paypal_${Date.now()}`,
        amount: currentPlan.amount,
        currency: currentPlan.currency,
        plan: plan.id,
        method: 'paypal',
      };

      return paymentResult;
    } catch (error) {
      throw new Error('PayPal payment failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      let paymentResult;

      if (paymentMethod === 'stripe') {
        paymentResult = await handleStripePayment();
      } else {
        paymentResult = await handlePayPalPayment();
      }

      // Success notification
      onPaymentSuccess({
        ...paymentResult,
        billingInfo,
      });

      onClose();
    } catch (error) {
      setErrors({ general: error.message });
      onPaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Complete Your Upgrade</h2>
            <p className="modal-subtitle">
              You're upgrading to <strong>{plan.name}</strong> plan
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="modal-body payment-body">
          {errors.general && (
            <div className="error-banner">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {errors.general}
            </div>
          )}

          <div className="payment-summary">
            <div className="summary-row">
              <span>Plan</span>
              <span className="summary-value">{plan.name}</span>
            </div>
            <div className="summary-row">
              <span>Billing Cycle</span>
              <span className="summary-value">Monthly</span>
            </div>
            <div className="summary-row total">
              <span>Total Due Today</span>
              <span className="summary-value">
                ${currentPlan.amount.toFixed(2)} {currentPlan.currency}
              </span>
            </div>
          </div>

          <div className="payment-methods">
            <h3>Select Payment Method</h3>
            <div className="method-buttons">
              <button
                className={`method-btn ${paymentMethod === 'stripe' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('stripe')}
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                Credit/Debit Card
              </button>
              <button
                className={`method-btn ${paymentMethod === 'paypal' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('paypal')}
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.32 21.97a.546.546 0 0 1-.26-.32c-.03-.15-.01-.3.06-.44l2.4-5.54H7.5a.5.5 0 0 1-.48-.63L8.8 9.65c.06-.19.23-.32.43-.32h5.28c.2 0 .37.13.43.32l1.78 5.39a.5.5 0 0 1-.48.63h-3.02l-2.4 5.54a.546.546 0 0 1-.26.32c-.13.07-.28.08-.42.03-.14-.05-.25-.15-.31-.29z"/>
                </svg>
                PayPal
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-section">
              <h3>Billing Information</h3>
              
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={billingInfo.email}
                  onChange={handleBillingInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="your@email.com"
                  disabled={isProcessing}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Country *</label>
                  <select
                    name="country"
                    value={billingInfo.country}
                    onChange={handleBillingInputChange}
                    className={errors.country ? 'error' : ''}
                    disabled={isProcessing}
                  >
                    <option value="">Select Country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="FI">Finland</option>
                    <option value="JP">Japan</option>
                    <option value="KR">South Korea</option>
                    <option value="SG">Singapore</option>
                    <option value="IN">India</option>
                    <option value="BR">Brazil</option>
                    <option value="MX">Mexico</option>
                  </select>
                  {errors.country && <span className="error-text">{errors.country}</span>}
                </div>

                <div className="form-group">
                  <label>Zip/Postal Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={billingInfo.zipCode}
                    onChange={handleBillingInputChange}
                    className={errors.zipCode ? 'error' : ''}
                    placeholder="12345"
                    disabled={isProcessing}
                  />
                  {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
                </div>
              </div>
            </div>

            {paymentMethod === 'stripe' && (
              <div className="form-section">
                <h3>Card Details</h3>
                
                <div className="form-group">
                  <label>Card Number *</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleCardInputChange}
                    className={errors.cardNumber ? 'error' : ''}
                    placeholder="1234 5678 9012 3456"
                    disabled={isProcessing}
                  />
                  {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
                </div>

                <div className="form-group">
                  <label>Cardholder Name *</label>
                  <input
                    type="text"
                    name="cardName"
                    value={cardDetails.cardName}
                    onChange={handleCardInputChange}
                    className={errors.cardName ? 'error' : ''}
                    placeholder="John Doe"
                    disabled={isProcessing}
                  />
                  {errors.cardName && <span className="error-text">{errors.cardName}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date *</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleCardInputChange}
                      className={errors.expiryDate ? 'error' : ''}
                      placeholder="MM/YY"
                      disabled={isProcessing}
                    />
                    {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
                  </div>

                  <div className="form-group">
                    <label>CVV *</label>
                    <input
                      type="text"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleCardInputChange}
                      className={errors.cvv ? 'error' : ''}
                      placeholder="123"
                      disabled={isProcessing}
                    />
                    {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="paypal-info">
                <div className="info-box">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                  </svg>
                  <p>You'll be redirected to PayPal to complete your payment securely.</p>
                </div>
              </div>
            )}

            <div className="security-badges">
              <div className="badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                <span>SSL Encrypted</span>
              </div>
              <div className="badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                <span>PCI Compliant</span>
              </div>
              <div className="badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Money-Back Guarantee</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn-cancel" disabled={isProcessing}>
                Cancel
              </button>
              <button type="submit" className="btn-pay" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    Pay ${currentPlan.amount.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="payment-footer">
            <p>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              Your payment information is secure and encrypted. We never store your full card details.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PaymentModal;
