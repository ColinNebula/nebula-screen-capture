import React from 'react';
import { checkFeatureAccess } from '../utils/planFeatures';
import './PremiumFeature.css';

const PremiumFeature = ({ 
  feature, 
  userPlan, 
  children, 
  fallback = null, 
  showUpgradePrompt = true,
  onUpgrade 
}) => {
  const hasAccess = checkFeatureAccess(userPlan, feature);

  if (hasAccess) {
    return children;
  }

  if (!showUpgradePrompt) {
    return fallback;
  }

  const getFeatureDescription = (feature) => {
    const descriptions = {
      webcamOverlay: 'Add your webcam to recordings for a personal touch',
      areaSelection: 'Record specific areas of your screen with precision',
      advancedAudio: 'Professional audio controls and noise suppression',
      cloudStorage: 'Store recordings securely in the cloud',
      teamSharing: 'Share recordings with your team instantly',
      analytics: 'Track recording performance and viewer engagement',
      customBranding: 'Add your logo and brand to recordings',
      prioritySupport: '24/7 priority support from our experts',
      exportFormats: 'Export in multiple formats (MP4, MOV, AVI)',
      scheduledRecording: 'Schedule recordings for automatic capture',
      liveStreaming: 'Stream live to platforms like YouTube and Twitch',
      aiTranscription: 'AI-powered automatic transcription and subtitles',
      videoEditing: 'Built-in video editing tools and effects',
      bulkOperations: 'Manage multiple recordings at once',
      apiAccess: 'Full API access for integrations',
      customDomain: 'Host recordings on your custom domain'
    };
    return descriptions[feature] || 'Premium feature';
  };

  const getRequiredPlan = (feature) => {
    // Check which plan first includes this feature
    const plans = ['pro', 'premium'];
    for (const plan of plans) {
      if (checkFeatureAccess(plan, feature)) {
        return plan;
      }
    }
    return 'pro';
  };

  const requiredPlan = getRequiredPlan(feature);

  return (
    <div className="premium-feature-wrapper">
      <div className="premium-overlay">
        <div className="premium-content">
          <div className="premium-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h3>Premium Feature</h3>
          <p>{getFeatureDescription(feature)}</p>
          <div className="plan-badge">
            {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} Plan Required
          </div>
          <button className="upgrade-button" onClick={onUpgrade}>
            Upgrade Now
          </button>
        </div>
      </div>
      <div className="premium-content-blurred">
        {children}
      </div>
    </div>
  );
};

export default PremiumFeature;