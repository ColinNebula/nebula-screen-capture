import React from 'react';

const NebulaLogo = ({ size = 40, color = "currentColor", className = "", animated = false }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`nebula-logo ${className} ${animated ? 'nebula-animated' : ''}`}
      style={{ '--logo-color': color }}
    >
      {/* Outer ring - represents screen capture area */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        stroke={color} 
        strokeWidth="3" 
        fill="none"
        strokeDasharray="8 4"
        opacity="0.6"
        className="capture-ring"
      />
      
      {/* Main nebula shape - cosmic cloud */}
      <path 
        d="M25 40 Q35 25 50 30 Q65 35 75 45 Q70 60 55 65 Q40 70 30 55 Q20 50 25 40 Z" 
        fill={color}
        opacity="0.8"
        className="nebula-cloud"
      />
      
      {/* Inner glow effect */}
      <ellipse 
        cx="48" 
        cy="48" 
        rx="18" 
        ry="12" 
        fill={color}
        opacity="0.4"
        className="inner-glow"
      />
      
      {/* Recording dot - pulsing center */}
      <circle 
        cx="50" 
        cy="50" 
        r="8" 
        fill={color}
        className="recording-dot"
      >
        {animated && (
          <>
            <animate 
              attributeName="r" 
              values="6;10;6" 
              dur="2s" 
              repeatCount="indefinite"
            />
            <animate 
              attributeName="opacity" 
              values="1;0.6;1" 
              dur="2s" 
              repeatCount="indefinite"
            />
          </>
        )}
      </circle>
      
      {/* Corner capture indicators */}
      <rect x="15" y="15" width="8" height="8" fill={color} opacity="0.7" className="corner-indicator" />
      <rect x="77" y="15" width="8" height="8" fill={color} opacity="0.7" className="corner-indicator" />
      <rect x="15" y="77" width="8" height="8" fill={color} opacity="0.7" className="corner-indicator" />
      <rect x="77" y="77" width="8" height="8" fill={color} opacity="0.7" className="corner-indicator" />
      
      {/* Connecting lines */}
      <line x1="23" y1="19" x2="35" y2="31" stroke={color} strokeWidth="2" opacity="0.5" className="connection-line" />
      <line x1="77" y1="23" x2="65" y2="35" stroke={color} strokeWidth="2" opacity="0.5" className="connection-line" />
      <line x1="23" y1="81" x2="35" y2="69" stroke={color} strokeWidth="2" opacity="0.5" className="connection-line" />
      <line x1="77" y1="81" x2="65" y2="69" stroke={color} strokeWidth="2" opacity="0.5" className="connection-line" />
      
      {/* Add CSS styles */}
      <style jsx>{`
        .nebula-logo {
          transition: all 0.3s ease;
        }
        
        .nebula-animated .capture-ring {
          animation: rotateRing 20s linear infinite;
        }
        
        .nebula-animated .corner-indicator {
          animation: pulse 3s ease-in-out infinite;
        }
        
        .nebula-animated .connection-line {
          animation: fadeInOut 4s ease-in-out infinite;
        }
        
        @keyframes rotateRing {
          from { transform-origin: 50px 50px; transform: rotate(0deg); }
          to { transform-origin: 50px 50px; transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.3; }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </svg>
  );
};

export default NebulaLogo;