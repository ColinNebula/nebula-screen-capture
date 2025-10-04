import React, { useState } from 'react';
import NebulaLogo from './NebulaLogo';
import { PLAN_FEATURES, getPlanPrice } from '../utils/planFeatures';
import './UpgradeModal.css';

const UpgradeModal = ({ isVisible, onClose, currentPlan, onUpgrade }) => {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');

  if (!isVisible) return null;

  const getPrice = (plan) => {
    const basePrice = getPlanPrice(plan);
    return billingCycle === 'yearly' ? basePrice * 10 : basePrice; // 2 months free on yearly
  };

  const getFeatureIcon = (hasFeature) => (
    hasFeature ? (
      <svg className="feature-check" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    ) : (
      <svg className="feature-cross" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    )
  );

  const formatLimit = (value, unit) => {
    if (value === -1) return 'Unlimited';
    if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(0)}GB`;
    if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(0)}MB`;
    if (value >= 60) return `${(value / 60).toFixed(0)} hours`;
    return `${value}${unit}`;
  };

  const featureList = [
    { key: 'maxRecordingDuration', label: 'Recording Duration', format: (val) => formatLimit(val, ' min') },
    { key: 'maxResolution', label: 'Max Resolution' },
    { key: 'maxStorage', label: 'Storage', format: (val) => formatLimit(val, '') },
    { key: 'recordingsPerDay', label: 'Daily Recordings', format: (val) => val === -1 ? 'Unlimited' : val },
    { key: 'webcamOverlay', label: 'Webcam Overlay' },
    { key: 'areaSelection', label: 'Area Selection' },
    { key: 'advancedAudio', label: 'Advanced Audio' },
    { key: 'cloudStorage', label: 'Cloud Storage' },
    { key: 'exportFormats', label: 'Multiple Export Formats' },
    { key: 'scheduledRecording', label: 'Scheduled Recording' },
    { key: 'aiTranscription', label: 'AI Transcription' },
    { key: 'videoEditing', label: 'Video Editing Tools' },
    { key: 'analytics', label: 'Analytics Dashboard' },
    { key: 'teamSharing', label: 'Team Collaboration' },
    { key: 'liveStreaming', label: 'Live Streaming' },
    { key: 'customBranding', label: 'Custom Branding' },
    { key: 'apiAccess', label: 'API Access' },
    { key: 'prioritySupport', label: 'Priority Support' }
  ];

  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="upgrade-header">
          <div className="upgrade-title">
            <NebulaLogo size={32} color="#ffffff" />
            <h2>Upgrade Your Plan</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="billing-toggle">
          <button 
            className={billingCycle === 'monthly' ? 'active' : ''}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button 
            className={billingCycle === 'yearly' ? 'active' : ''}
            onClick={() => setBillingCycle('yearly')}
          >
            Yearly
            <span className="discount-badge">Save 17%</span>
          </button>
        </div>

        <div className="plans-container">
          {['free', 'pro', 'premium'].map(plan => {
            const planData = PLAN_FEATURES[plan];
            const price = getPrice(plan);
            const isCurrentPlan = plan === currentPlan;
            const isSelected = plan === selectedPlan;

            return (
              <div 
                key={plan}
                className={`plan-card ${isSelected ? 'selected' : ''} ${isCurrentPlan ? 'current' : ''}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="plan-header">
                  <h3>{plan.charAt(0).toUpperCase() + plan.slice(1)}</h3>
                  {isCurrentPlan && <span className="current-badge">Current</span>}
                  {plan === 'premium' && <span className="popular-badge">Most Popular</span>}
                </div>
                
                <div className="plan-price">
                  {price === 0 ? (
                    <span className="price-free">Free</span>
                  ) : (
                    <>
                      <span className="price-amount">${price}</span>
                      <span className="price-period">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                    </>
                  )}
                </div>

                <div className="plan-features">
                  {featureList.map(feature => {
                    let value;
                    let hasFeature = false;

                    if (feature.key in planData) {
                      value = planData[feature.key];
                      hasFeature = true;
                    } else if (feature.key in planData.features) {
                      hasFeature = planData.features[feature.key];
                      value = hasFeature;
                    }

                    return (
                      <div key={feature.key} className="feature-item">
                        {getFeatureIcon(hasFeature)}
                        <span className="feature-label">{feature.label}</span>
                        {feature.format && hasFeature && (
                          <span className="feature-value">{feature.format(value)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="upgrade-footer">
          <button 
            className="upgrade-confirm-btn"
            onClick={() => onUpgrade(selectedPlan)}
            disabled={selectedPlan === currentPlan}
          >
            {selectedPlan === currentPlan ? 'Current Plan' : `Upgrade to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`}
          </button>
          <p className="upgrade-note">
            Cancel anytime • 30-day money-back guarantee • Instant activation
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;