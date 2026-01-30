import React from 'react';
import './Logo.css';

const Logo = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large'
  };

  return (
    <div className={`logo-container ${sizeClasses[size]} ${className}`}>
      <img 
        src="/images/logo.png" 
        alt="Style-It Logo" 
        className="logo-image"
        onError={(e) => {
          // Fallback to text if image doesn't exist
          e.target.style.display = 'none';
          e.target.nextElementSibling.style.display = 'flex';
        }}
      />
      <span className="logo-text" style={{ display: 'none' }}>
        <span className="logo-word-style">Style</span>
        <span className="logo-word-it">It</span>
      </span>
    </div>
  );
};

export default Logo;

