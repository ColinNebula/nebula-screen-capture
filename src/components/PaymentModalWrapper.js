// Payment Integration Wrapper Component
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentModalContent from './PaymentModalContent';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

// PayPal configuration
const paypalOptions = {
  "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID || '',
  currency: "USD",
  intent: "capture",
};

const PaymentModalWrapper = ({ plan, onClose, onPaymentSuccess, onPaymentError }) => {
  const stripeOptions = {
    // Stripe Elements options
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#667eea',
        colorBackground: '#ffffff',
        colorText: '#1a1a2e',
        colorDanger: '#dc2626',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <Elements stripe={stripePromise} options={stripeOptions}>
        <PaymentModalContent
          plan={plan}
          onClose={onClose}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
        />
      </Elements>
    </PayPalScriptProvider>
  );
};

export default PaymentModalWrapper;
