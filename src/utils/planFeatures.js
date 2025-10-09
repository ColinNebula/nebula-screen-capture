// Premium features configuration
export const PLAN_FEATURES = {
  free: {
    maxRecordingDuration: 1800, // 30 minutes (increased from 10)
    maxResolution: '1080p',
    maxFileSize: 250 * 1024 * 1024, // 250MB (increased from 100MB)
    maxStorage: 5 * 1024 * 1024 * 1024, // 5GB (increased from 1GB)
    recordingsPerDay: -1, // Unlimited (removed daily limit)
    formats: ['webm'],
    features: {
      basicRecording: true,
      audioRecording: true,
      webcamOverlay: false,
      areaSelection: true, // Now available for free users
      advancedAudio: false,
      cloudStorage: false,
      teamSharing: false,
      analytics: false,
      customBranding: false,
      prioritySupport: false,
      exportFormats: false,
      scheduledRecording: false,
      liveStreaming: false,
      aiTranscription: false,
      videoEditing: false,
      bulkOperations: false,
      apiAccess: false,
      customDomain: false
    }
  },
  pro: {
    maxRecordingDuration: 3600, // 1 hour
    maxResolution: '4K',
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
    recordingsPerDay: 50,
    formats: ['webm', 'mp4', 'mov'],
    features: {
      basicRecording: true,
      audioRecording: true,
      webcamOverlay: true,
      areaSelection: true,
      advancedAudio: true,
      cloudStorage: true,
      teamSharing: false,
      analytics: true,
      customBranding: false,
      prioritySupport: true,
      exportFormats: true,
      scheduledRecording: true,
      liveStreaming: false,
      aiTranscription: true,
      videoEditing: true,
      bulkOperations: true,
      apiAccess: false,
      customDomain: false
    }
  },
  premium: {
    maxRecordingDuration: -1, // Unlimited
    maxResolution: '4K',
    maxFileSize: -1, // Unlimited
    maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
    recordingsPerDay: -1, // Unlimited
    formats: ['webm', 'mp4', 'mov', 'avi', 'mkv'],
    features: {
      basicRecording: true,
      audioRecording: true,
      webcamOverlay: true,
      areaSelection: true,
      advancedAudio: true,
      cloudStorage: true,
      teamSharing: true,
      analytics: true,
      customBranding: true,
      prioritySupport: true,
      exportFormats: true,
      scheduledRecording: true,
      liveStreaming: true,
      aiTranscription: true,
      videoEditing: true,
      bulkOperations: true,
      apiAccess: true,
      customDomain: true
    }
  }
};

export const checkFeatureAccess = (userPlan, feature) => {
  const plan = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free;
  return plan.features[feature] || false;
};

export const getPlanLimits = (userPlan) => {
  return PLAN_FEATURES[userPlan] || PLAN_FEATURES.free;
};

export const getPlanPrice = (plan) => {
  const prices = {
    free: 0,
    pro: 9.99,
    premium: 19.99
  };
  return prices[plan] || 0;
};