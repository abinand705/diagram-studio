import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import WelcomeScreen from './WelcomeScreen';
import reportWebVitals from './reportWebVitals';

const RootComponent = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // 5 second timer for the welcome screen
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowWelcome(false);
      }, 1000); // Wait for the blur transition
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowWelcome(false);
    }, 1000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#f8fafc', position: 'relative' }}>
      
      {/* Welcome Screen Layer */}
      {showWelcome && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isTransitioning ? 0 : 1,
          filter: isTransitioning ? 'blur(20px)' : 'blur(0px)',
          transform: isTransitioning ? 'scale(1.05)' : 'scale(1)',
          pointerEvents: isTransitioning ? 'none' : 'auto'
        }}>
          <WelcomeScreen onSkip={handleSkip} />
        </div>
      )}

      {/* Main App Layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: (!showWelcome || isTransitioning) ? 1 : 0,
        filter: (!showWelcome || isTransitioning) ? 'blur(0px)' : 'blur(20px)',
        transform: (!showWelcome || isTransitioning) ? 'scale(1)' : 'scale(0.95)',
      }}>
        <App />
      </div>

    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
