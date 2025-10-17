import React from 'react';
import './EnhancedErrorMessage.css';

const EnhancedErrorMessage = ({ error, onRetry, onDismiss }) => {
  const getErrorDetails = (error) => {
    const errorType = error.name || 'Error';
    const errorMessage = error.message || 'An unknown error occurred';

    // Enhanced error handling with specific recovery suggestions
    const errorMap = {
      'NotAllowedError': {
        title: 'Permission Denied',
        message: 'Screen recording permission was denied.',
        icon: '🔒',
        suggestions: [
          'Click "Start Recording" again and allow screen sharing',
          'Check your browser permissions for this site',
          'Make sure you select a screen/window to share'
        ],
        canRetry: true
      },
      'NotFoundError': {
        title: 'No Screen Available',
        message: 'No screen or window was selected for recording.',
        icon: '🖥️',
        suggestions: [
          'Select a screen, window, or tab when prompted',
          'Make sure you have at least one display connected',
          'Try sharing your entire screen instead of a specific window'
        ],
        canRetry: true
      },
      'NotReadableError': {
        title: 'Device Unavailable',
        message: 'The recording device is unavailable or in use.',
        icon: '⚠️',
        suggestions: [
          'Close other apps that might be using screen capture',
          'Restart your browser and try again',
          'Check if another recording is already active'
        ],
        canRetry: true
      },
      'AbortError': {
        title: 'Recording Aborted',
        message: 'Recording was stopped unexpectedly.',
        icon: '❌',
        suggestions: [
          'The user or system stopped the screen share',
          'Try starting a new recording',
          'Make sure your device has enough storage space'
        ],
        canRetry: true
      },
      'NotSupportedError': {
        title: 'Not Supported',
        message: 'Screen recording is not supported in your browser.',
        icon: '🚫',
        suggestions: [
          'Use Google Chrome, Firefox, or Edge (version 72+)',
          'Update your browser to the latest version',
          'For iOS users: Use the native screen recording feature'
        ],
        canRetry: false
      },
      'InvalidStateError': {
        title: 'Invalid Recording State',
        message: 'Cannot perform this action in the current state.',
        icon: '⚡',
        suggestions: [
          'Stop the current recording before starting a new one',
          'Refresh the page and try again',
          'Clear your browser cache and reload'
        ],
        canRetry: true
      },
      'QuotaExceededError': {
        title: 'Storage Quota Exceeded',
        message: 'Not enough storage space for recording.',
        icon: '💾',
        suggestions: [
          'Delete old recordings to free up space',
          'Download important recordings and remove them',
          'Upgrade your plan for more storage',
          'Clear browser data and cache'
        ],
        canRetry: false
      },
      'SecurityError': {
        title: 'Security Error',
        message: 'Recording blocked for security reasons.',
        icon: '🛡️',
        suggestions: [
          'Make sure you\'re using HTTPS (secure connection)',
          'Check if content security policies are blocking recording',
          'Try recording in an incognito/private window'
        ],
        canRetry: true
      }
    };

    return errorMap[errorType] || {
      title: 'Recording Error',
      message: errorMessage,
      icon: '⚠️',
      suggestions: [
        'Try reloading the page and starting again',
        'Check your internet connection',
        'Contact support if the problem persists'
      ],
      canRetry: true
    };
  };

  const details = getErrorDetails(error);

  return (
    <div className="enhanced-error-overlay" onClick={onDismiss}>
      <div className="enhanced-error-message" onClick={(e) => e.stopPropagation()}>
        <div className="error-icon">{details.icon}</div>
        
        <h3 className="error-title">{details.title}</h3>
        <p className="error-description">{details.message}</p>

        <div className="error-suggestions">
          <h4>💡 How to fix this:</h4>
          <ul>
            {details.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>

        {error.message && (
          <details className="error-technical">
            <summary>Technical Details</summary>
            <code>{error.name}: {error.message}</code>
          </details>
        )}

        <div className="error-actions">
          <button className="dismiss-btn" onClick={onDismiss}>
            Close
          </button>
          {details.canRetry && onRetry && (
            <button className="retry-btn" onClick={onRetry}>
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedErrorMessage;
