import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, Shirt, Camera } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container" style={{ height: '100%' }}>
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">
            <img 
              src="/images/logo.png" 
              alt="Style-It Logo" 
              className="hero-logo-image"
              onError={(e) => {
                // Fallback to text if image doesn't exist
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="hero-logo-text" style={{ display: 'none' }}>
              <span className="hero-style">Style</span><span className="hero-it">It</span>
            </div>
          </div>
          <p className="hero-tagline">Your Personal Wardrobe Assistant</p>
          <p className="hero-description">
            Organize your wardrobe, discover new outfit combinations, and plan your style effortlessly.
          </p>
        </div>
        
        <div className="hero-features">
          <Link to="/upload" className="feature-card">
            <div className="feature-icon">
              <Camera size={32} />
              </div>
            <h3 className="feature-title">Smart Upload</h3>
            <p className="feature-text">Capture or upload your clothes for instant AI categorization</p>
          </Link>
            
          <Link to="/wardrobe" className="feature-card">
            <div className="feature-icon">
              <Shirt size={32} />
              </div>
            <h3 className="feature-title">My Wardrobe</h3>
            <p className="feature-text">Browse and manage your complete clothing collection</p>
          </Link>
            
          <Link to="/outfits" className="feature-card">
            <div className="feature-icon">
              <Sparkles size={32} />
              </div>
            <h3 className="feature-title">Outfit Recommendations</h3>
            <p className="feature-text">Get personalized outfit suggestions based on your style</p>
          </Link>
            
          <Link to="/planner" className="feature-card">
            <div className="feature-icon">
              <Calendar size={32} />
              </div>
            <h3 className="feature-title">Outfit Planning</h3>
            <p className="feature-text">Plan your outfits ahead for any occasion</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
