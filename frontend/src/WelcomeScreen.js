import React, { useEffect, useState } from 'react';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onSkip }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5000;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const p = Math.min((elapsed / duration) * 100, 100);
      setProgress(p);
      
      if (elapsed < duration) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, []);

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="logo-container">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="app-logo">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </div>
        <h1 className="app-title">Diagram Studio</h1>
        <p className="app-version">v9.0</p>
        <p className="app-description">
          A powerful, intuitive workspace for mapping your ideas, designing architectures, and creating beautiful diagrams.
        </p>
        
        <div className="advanced-spinner-container">
          <svg className="advanced-spinner" width="80" height="80" viewBox="0 0 80 80">
            {/* Outer spinning ring */}
            <circle 
              className="spin-ring outer"
              cx="40" cy="40" r="36"
            />
            {/* Progress track */}
            <circle 
              className="progress-ring-track"
              cx="40" cy="40" r="28"
            />
            {/* Progress fill */}
            <circle 
              className="progress-ring-fill"
              cx="40" cy="40" r="28"
              style={{ strokeDashoffset: `${176 - (176 * progress) / 100}` }}
            />
            {/* Inner spinning ring */}
            <circle 
              className="spin-ring inner"
              cx="40" cy="40" r="20"
            />
          </svg>
        </div>
        <p className="loading-text">Initializing canvas components...</p>
        
        <button className="skip-button" onClick={onSkip}>Skip</button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
