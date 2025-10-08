import React from 'react';
import { createPortal } from 'react-dom';
import './UpgradePlanModal.css';

const UpgradePlanModal = ({ currentPlan, onClose, onUpgrade }) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Up to 10 recordings per month',
        '720p video quality',
        '500 MB storage',
        'Basic editing tools',
        'Community support',
      ],
      color: '#94a3b8',
      current: currentPlan === 'free',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99',
      period: 'per month',
      features: [
        'Unlimited recordings',
        '1080p video quality',
        '10 GB storage',
        'Advanced editing tools',
        'Priority support',
        'Custom branding',
        'Team collaboration',
      ],
      color: '#34d399',
      popular: true,
      current: currentPlan === 'pro',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99',
      period: 'per month',
      features: [
        'Everything in Pro',
        '4K video quality',
        '100 GB storage',
        'AI-powered editing',
        '24/7 premium support',
        'API access',
        'Advanced analytics',
        'White-label solution',
      ],
      color: '#fbbf24',
      current: currentPlan === 'premium',
    },
  ];

  const handleUpgrade = (planId) => {
    if (planId !== currentPlan) {
      onUpgrade(planId);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content upgrade-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Upgrade Your Plan</h2>
            <p className="modal-subtitle">Choose the perfect plan for your needs</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="modal-body upgrade-body">
          <div className="plans-grid">
            {plans.map(plan => (
              <div 
                key={plan.id}
                className={`plan-card ${plan.current ? 'current' : ''} ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && (
                  <div className="popular-badge">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Most Popular
                  </div>
                )}

                <div className="plan-header">
                  <h3 className="plan-name" style={{ color: plan.color }}>{plan.name}</h3>
                  <div className="plan-price">
                    <span className="price-amount">{plan.price}</span>
                    <span className="price-period">/{plan.period}</span>
                  </div>
                </div>

                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button 
                  className={`plan-button ${plan.current ? 'current-plan' : ''}`}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.current}
                >
                  {plan.current ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Current Plan
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      {plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="upgrade-footer-info">
            <div className="info-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Cancel anytime, no commitment</span>
            </div>
            <div className="info-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>14-day money-back guarantee</span>
            </div>
            <div className="info-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Secure payment processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpgradePlanModal;
