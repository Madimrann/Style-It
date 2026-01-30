import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/ApiService';
import { User, Save, X, Eye, EyeOff, AlertCircle, Check, Shirt, Sparkles, Calendar, Trash2 } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    wardrobeItems: 0,
    savedOutfits: 0,
    plannedOutfits: 0
  });
  const [activity, setActivity] = useState({
    recentUploads: [],
    recentOutfits: []
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;
    
    try {
      setLoadingStats(true);
      const [wardrobeItems, savedOutfits, plannedOutfits] = await Promise.all([
        apiService.getWardrobeItems().catch(() => []),
        apiService.getSavedOutfits().catch(() => []),
        apiService.getPlannedOutfits().catch(() => [])
      ]);

      setStats({
        wardrobeItems: wardrobeItems.length || 0,
        savedOutfits: savedOutfits.length || 0,
        plannedOutfits: plannedOutfits.length || 0
      });

      // Get recent activity (last 5 items)
      const recentUploads = wardrobeItems
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
      
      const recentOutfits = savedOutfits
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);

      setActivity({
        recentUploads,
        recentOutfits
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password if changing
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      if (!formData.currentPassword) {
        setError('Current password is required to change password');
        return;
      }
    }

    setLoading(true);

    try {

      const updateData = {
        name: formData.name,
        email: formData.email
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const updatedUser = await apiService.updateProfile(user.id, updateData);
      
      // Update auth context
      setUser({
        ...user,
        name: updatedUser.name,
        email: updatedUser.email
      });

      setSuccess('Profile updated successfully!');
      
      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        setSuccess('');
      }, 3000);
      // Reload stats after update
      loadUserStats();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await apiService.deleteAccount();
      // Logout and redirect to home
      logout();
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete account');
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-icon">
          <User size={32} />
        </div>
        <div className="profile-header-content">
          <h1>Profile</h1>
          <p>Manage your account settings and view your statistics</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* Left Side - Statistics and Activity */}
        <div className="profile-left-column">
          {/* Wardrobe Stats Section */}
          <div className="profile-stats-section">
            <h3>Wardrobe Statistics</h3>
            {loadingStats ? (
              <div className="stats-loading">Loading...</div>
            ) : (
              <div className="stats-grid">
                <div className="stat-card clickable" onClick={() => navigate('/wardrobe')}>
                  <div className="stat-icon" style={{ background: '#eef2ff' }}>
                    <Shirt size={24} style={{ color: '#8B9DC3' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.wardrobeItems}</div>
                    <div className="stat-label">Wardrobe Items</div>
                  </div>
                </div>
                <div className="stat-card clickable" onClick={() => navigate('/outfits')}>
                  <div className="stat-icon" style={{ background: '#eef2ff' }}>
                    <Sparkles size={24} style={{ color: '#8B9DC3' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.savedOutfits}</div>
                    <div className="stat-label">Saved Outfits</div>
                  </div>
                </div>
                <div className="stat-card clickable" onClick={() => navigate('/planner')}>
                  <div className="stat-icon" style={{ background: '#eef2ff' }}>
                    <Calendar size={24} style={{ color: '#8B9DC3' }} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.plannedOutfits}</div>
                    <div className="stat-label">Planned Outfits</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Summary Section */}
          <div className="profile-activity-section">
            <h3>Recent Activity</h3>
            <div className="activity-content">
              <div className="activity-group">
                <h4>Recent Uploads</h4>
                {activity.recentUploads.length > 0 ? (
                  <div className="activity-list">
                    {activity.recentUploads.map((item, idx) => (
                      <div key={idx} className="activity-item">
                        <Shirt size={14} />
                        <span>{item.category || 'Item'}</span>
                        <span className="activity-date">
                          {item.createdAt ? formatDate(item.createdAt) : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="activity-empty">No recent uploads</p>
                )}
              </div>
              <div className="activity-group">
                <h4>Recent Outfits</h4>
                {activity.recentOutfits.length > 0 ? (
                  <div className="activity-list">
                    {activity.recentOutfits.map((outfit, idx) => (
                      <div key={idx} className="activity-item">
                        <Sparkles size={14} />
                        <span>{outfit.name || 'Unnamed Outfit'}</span>
                        <span className="activity-date">
                          {outfit.createdAt ? formatDate(outfit.createdAt) : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="activity-empty">No recent outfits</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="profile-divider"></div>

        {/* Right Side - Edit Form */}
        <div className="profile-right-column">
          <div className="profile-edit-section">
            <h2>Edit Profile</h2>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <Check size={20} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">
                  <User size={16} />
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <User size={16} />
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="password-section">
                <h3>Change Password (Optional)</h3>
                <p className="section-description">Leave blank if you don't want to change your password</p>

                <div className="form-group">
                  <label htmlFor="currentPassword">
                    <Eye size={16} />
                    Current Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">
                    <Eye size={16} />
                    New Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <Eye size={16} />
                    Confirm New Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-save"
                  disabled={loading}
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Delete Account Section */}
            <div className="profile-danger-section">
              <h3>Danger Zone</h3>
              <p className="danger-description">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                type="button"
                className="btn-delete"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 size={18} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Account</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
              <p style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
                Are you sure you want to delete your account?
              </p>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                This action cannot be undone. This will permanently delete your account, 
                all wardrobe items, saved outfits, and planned outfits.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-delete"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

