import React from 'react';
import NebulaLogo from './NebulaLogo';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = "Loading...", size = 48 }) => {
  return (
    <div className="loading-spinner">
      <div className="loading-logo">
        <NebulaLogo size={size} color="#667eea" className="spinning-logo" />
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;