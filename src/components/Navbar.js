import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Shirt, Sparkles, Calendar, Upload, LogIn, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import './Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/wardrobe', label: 'Wardrobe', icon: Shirt, public: false },
    { path: '/outfits', label: 'Outfits', icon: Sparkles, public: false },
    { path: '/planner', label: 'Planner', icon: Calendar, public: false },
    { path: '/upload', label: 'Upload', icon: Upload, public: false },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            <Logo size="medium" />
          </Link>

          {isAuthenticated && user && (
            <>
              <div className="navbar-welcome-container">
                <div className="navbar-welcome">
                  Welcome, {user.name}
                </div>
                <div className="navbar-date">
                  {(() => {
                    const date = new Date();
                    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const day = date.getDate();
                    const month = date.toLocaleDateString('en-US', { month: 'short' });
                    return `${weekday}, ${day} ${month}`;
                  })()}
                </div>
              </div>
              <div className="navbar-divider"></div>
            </>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-menu">
          {navItems
            .filter(item => item.public || isAuthenticated)
            .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {isAuthenticated && isAdmin() && (
            <Link
              to="/admin"
              className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <Shield size={18} />
              <span>Admin</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="navbar-user">
              <Link 
                to="/profile" 
                className={`user-info ${location.pathname === '/profile' ? 'active' : ''}`}
              >
                <User size={18} />
                <span>Profile</span>
              </Link>
              <button onClick={handleLogout} className="logout-button">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="navbar-link">
              <LogIn size={18} />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="mobile-menu-button" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          {navItems
            .filter(item => item.public || isAuthenticated)
            .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-menu-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {isAuthenticated && isAdmin() && (
            <Link
              to="/admin"
              className={`mobile-menu-link ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Shield size={20} />
              <span>Admin</span>
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link 
                to="/profile" 
                className="mobile-user-info"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User size={20} />
                <span>Profile</span>
              </Link>
              <button onClick={handleLogout} className="mobile-logout-button">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="mobile-menu-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LogIn size={20} />
              <span>Login</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
