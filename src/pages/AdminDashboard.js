import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/ApiService';
import { getBackendBaseUrl } from '../utils/getBackendUrl';
import { Users, Shirt, Sparkles, Calendar, Trash2, Shield, User, TrendingUp, AlertCircle, Plus, Edit2, Tag, Briefcase, GripVertical, X, Mail, Clock } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'categories', 'occasions'
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOccasionModal, setShowOccasionModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingOccasion, setEditingOccasion] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ id: '', label: '', color: '#3b82f6', order: 0, keywords: [] });
  const [occasionForm, setOccasionForm] = useState({ id: '', label: '', order: 0, keywords: [] });
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [showDeleteOccasionConfirm, setShowDeleteOccasionConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState({ type: null, id: null, name: null });
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemType, setDraggedItemType] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loadingUserStats, setLoadingUserStats] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null); // 'wardrobe', 'outfits', 'planned'
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteAllType, setDeleteAllType] = useState(null); // 'wardrobe', 'outfits', 'planned', 'all'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, categoriesData, occasionsData, statsData] = await Promise.all([
        apiService.getUsers(),
        apiService.getCategories(),
        apiService.getOccasions(),
        apiService.getAdminStats().catch(() => null) // Don't fail if stats endpoint fails
      ]);
      setUsers(usersData);
      setCategories(categoriesData);
      setOccasions(occasionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u._id === userId);
    setItemToDelete({ type: 'user', id: userId, name: userToDelete?.name || userToDelete?.email || 'this user' });
    setShowDeleteUserConfirm(true);
  };

  const confirmDeleteUser = async () => {
    try {
      await apiService.deleteUser(itemToDelete.id);
      setUsers(users.filter(u => u._id !== itemToDelete.id));
      setShowDeleteUserConfirm(false);
      setItemToDelete({ type: null, id: null, name: null });
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
      setShowDeleteUserConfirm(false);
      setItemToDelete({ type: null, id: null, name: null });
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const updatedUser = await apiService.updateUserRole(userId, newRole);
      setUsers(users.map(u => u._id === userId ? updatedUser : u));
      // Update selected user if viewing their details
      if (selectedUserDetail && selectedUserDetail._id === userId) {
        setSelectedUserDetail(updatedUser);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleViewUserDetail = async (user) => {
    setSelectedUserDetail(user);
    setShowUserDetail(true);
    setLoadingUserStats(true);
    
    try {
      const userId = user._id;
      console.log('🔍 Loading user details for:', userId);
      
      // Use admin endpoints to fetch user-specific data
      const [userWardrobeItems, userSavedOutfits, userPlannedOutfits] = await Promise.all([
        apiService.getUserWardrobeItems(userId).catch((err) => {
          console.error('Error fetching user wardrobe items:', err);
          return [];
        }),
        apiService.getUserSavedOutfits(userId).catch((err) => {
          console.error('Error fetching user saved outfits:', err);
          return [];
        }),
        apiService.getUserPlannedOutfits(userId).catch((err) => {
          console.error('Error fetching user planned outfits:', err);
          return [];
        })
      ]);
      
      console.log('✅ Loaded user data:', {
        wardrobeItems: userWardrobeItems.length,
        savedOutfits: userSavedOutfits.length,
        plannedOutfits: userPlannedOutfits.length
      });
      
      setUserStats({
        wardrobeItems: userWardrobeItems.length,
        savedOutfits: userSavedOutfits.length,
        plannedOutfits: userPlannedOutfits.length,
        wardrobeItemsList: userWardrobeItems,
        savedOutfitsList: userSavedOutfits,
        plannedOutfitsList: userPlannedOutfits
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats({
        wardrobeItems: 0,
        savedOutfits: 0,
        plannedOutfits: 0,
        wardrobeItemsList: [],
        savedOutfitsList: [],
        plannedOutfitsList: []
      });
    } finally {
      setLoadingUserStats(false);
    }
  };

  // User Content Management Functions
  const handleDeleteUserItem = async (itemId, type) => {
    if (!selectedUserDetail) return;
    
    try {
      const userId = selectedUserDetail._id;
      if (type === 'wardrobe') {
        await apiService.adminDeleteUserWardrobeItem(userId, itemId);
        // Refresh user stats
        handleViewUserDetail(selectedUserDetail);
      } else if (type === 'outfit') {
        await apiService.adminDeleteUserOutfit(userId, itemId);
        handleViewUserDetail(selectedUserDetail);
      } else if (type === 'planned') {
        await apiService.adminDeleteUserPlannedOutfit(userId, itemId);
        handleViewUserDetail(selectedUserDetail);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type} item`);
    }
  };

  const handleDeleteAllUserContent = async (contentType) => {
    if (!selectedUserDetail || !userStats) return;
    
    const userId = selectedUserDetail._id;
    
    try {
      if (contentType === 'wardrobe') {
        await Promise.all(userStats.wardrobeItemsList.map(item => 
          apiService.adminDeleteUserWardrobeItem(userId, item._id).catch(err => console.error('Error deleting item:', err))
        ));
      } else if (contentType === 'outfits') {
        await Promise.all(userStats.savedOutfitsList.map(outfit => 
          apiService.adminDeleteUserOutfit(userId, outfit._id).catch(err => console.error('Error deleting outfit:', err))
        ));
      } else if (contentType === 'planned') {
        await Promise.all(userStats.plannedOutfitsList.map(outfit => 
          apiService.adminDeleteUserPlannedOutfit(userId, outfit._id).catch(err => console.error('Error deleting planned outfit:', err))
        ));
      } else if (contentType === 'all') {
        // Delete all content
        await Promise.all([
          ...userStats.wardrobeItemsList.map(item => 
            apiService.adminDeleteUserWardrobeItem(userId, item._id).catch(err => console.error('Error deleting item:', err))
          ),
          ...userStats.savedOutfitsList.map(outfit => 
            apiService.adminDeleteUserOutfit(userId, outfit._id).catch(err => console.error('Error deleting outfit:', err))
          ),
          ...userStats.plannedOutfitsList.map(outfit => 
            apiService.adminDeleteUserPlannedOutfit(userId, outfit._id).catch(err => console.error('Error deleting planned outfit:', err))
          )
        ]);
      }
      
      // Refresh user stats
      handleViewUserDetail(selectedUserDetail);
      setShowDeleteAllConfirm(false);
      setDeleteAllType(null);
    } catch (error) {
      console.error('Error deleting user content:', error);
      alert('Failed to delete user content');
    }
  };

  // Category Management
  const handleCreateCategory = async () => {
    // Validation
    if (!categoryForm.id || !categoryForm.id.trim()) {
      alert('Category ID is required');
      return;
    }

    if (!categoryForm.label || !categoryForm.label.trim()) {
      alert('Category Label is required');
      return;
    }

    // Validate ID format (lowercase, alphanumeric and hyphens only, no spaces)
    const idRegex = /^[a-z0-9-]+$/;
    if (!idRegex.test(categoryForm.id)) {
      alert('Category ID must be lowercase, contain only letters, numbers, and hyphens, with no spaces');
      return;
    }

    // Check for duplicate ID
    const duplicateId = categories.find(c => c.id.toLowerCase() === categoryForm.id.toLowerCase());
    if (duplicateId) {
      alert(`Category ID "${categoryForm.id}" already exists. Please use a different ID.`);
      return;
    }

    try {
      const newCategory = await apiService.createCategory(categoryForm);
      setCategories([...categories, newCategory].sort((a, b) => a.order - b.order));
      setShowCategoryModal(false);
      setCategoryForm({ id: '', label: '', color: '#3b82f6', order: 0, keywords: [] });
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    // Validation
    if (!categoryForm.label || !categoryForm.label.trim()) {
      alert('Category Label is required');
      return;
    }

    try {
      const updated = await apiService.updateCategory(editingCategory.id, categoryForm);
      setCategories(categories.map(c => c.id === editingCategory.id ? updated : c).sort((a, b) => a.order - b.order));
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ id: '', label: '', color: '#3b82f6', order: 0, keywords: [] });
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    const categoryToDelete = categories.find(c => c.id === id);
    setItemToDelete({ type: 'category', id: id, name: categoryToDelete?.label || 'this category' });
    setShowDeleteCategoryConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    try {
      await apiService.deleteCategory(itemToDelete.id);
      setCategories(categories.filter(c => c.id !== itemToDelete.id));
      setShowDeleteCategoryConfirm(false);
      setItemToDelete({ type: null, id: null, name: null });
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete category');
      setShowDeleteCategoryConfirm(false);
      setItemToDelete({ type: null, id: null, name: null });
    }
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ 
      id: category.id, 
      label: category.label, 
      color: category.color, 
      order: category.order,
      keywords: category.keywords || []
    });
    setShowCategoryModal(true);
  };

  // Drag and Drop Handlers for Categories
  const handleCategoryDragStart = (e, category) => {
    setDraggedItem(category);
    setDraggedItemType('category');
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleCategoryDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
    setDraggedItemType(null);
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = async (e, targetCategory) => {
    e.preventDefault();
    if (!draggedItem || draggedItemType !== 'category' || draggedItem.id === targetCategory.id) {
      return;
    }

    // Store previous state for potential revert
    const previousCategories = [...categories];

    // Get sorted categories
    const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedCategories.findIndex(c => c.id === draggedItem.id);
    const targetIndex = sortedCategories.findIndex(c => c.id === targetCategory.id);

    // Reorder array
    const reordered = [...sortedCategories];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update order values
    const updatedCategories = reordered.map((cat, index) => ({
      ...cat,
      order: index + 1
    }));

    // Update local state immediately
    setCategories(updatedCategories);

    // Update each category's order in database
    try {
      await Promise.all(
        updatedCategories.map(cat => 
          apiService.updateCategory(cat.id, { ...cat, order: cat.order })
        )
      );
      console.log('✅ Categories reordered successfully');
    } catch (error) {
      console.error('Error updating category order:', error);
      // Revert on error
      setCategories(previousCategories);
      alert('Failed to update order. Please try again.');
    }
  };

  // Drag and Drop Handlers for Occasions
  const handleOccasionDragStart = (e, occasion) => {
    setDraggedItem(occasion);
    setDraggedItemType('occasion');
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleOccasionDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem(null);
    setDraggedItemType(null);
  };

  const handleOccasionDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleOccasionDrop = async (e, targetOccasion) => {
    e.preventDefault();
    if (!draggedItem || draggedItemType !== 'occasion' || draggedItem.id === targetOccasion.id) {
      return;
    }

    // Store previous state for potential revert
    const previousOccasions = [...occasions];

    // Get sorted occasions
    const sortedOccasions = [...occasions].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedOccasions.findIndex(o => o.id === draggedItem.id);
    const targetIndex = sortedOccasions.findIndex(o => o.id === targetOccasion.id);

    // Reorder array
    const reordered = [...sortedOccasions];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update order values
    const updatedOccasions = reordered.map((occ, index) => ({
      ...occ,
      order: index + 1
    }));

    // Update local state immediately
    setOccasions(updatedOccasions);

    // Update each occasion's order in database
    try {
      await Promise.all(
        updatedOccasions.map(occ => 
          apiService.updateOccasion(occ.id, { ...occ, order: occ.order })
        )
      );
      console.log('✅ Occasions reordered successfully');
    } catch (error) {
      console.error('Error updating occasion order:', error);
      // Revert on error
      setOccasions(previousOccasions);
      alert('Failed to update order. Please try again.');
    }
  };

  // Occasion Management
  const handleCreateOccasion = async () => {
    // Validation
    if (!occasionForm.id || !occasionForm.id.trim()) {
      alert('Occasion ID is required');
      return;
    }

    if (!occasionForm.label || !occasionForm.label.trim()) {
      alert('Occasion Label is required');
      return;
    }

    // Validate ID format (lowercase, alphanumeric and hyphens only, no spaces)
    const idRegex = /^[a-z0-9-]+$/;
    if (!idRegex.test(occasionForm.id)) {
      alert('Occasion ID must be lowercase, contain only letters, numbers, and hyphens, with no spaces');
      return;
    }

    // Check for duplicate ID
    const duplicateId = occasions.find(o => o.id.toLowerCase() === occasionForm.id.toLowerCase());
    if (duplicateId) {
      alert(`Occasion ID "${occasionForm.id}" already exists. Please use a different ID.`);
      return;
    }

    try {
      const newOccasion = await apiService.createOccasion(occasionForm);
      setOccasions([...occasions, newOccasion].sort((a, b) => a.order - b.order));
      setShowOccasionModal(false);
      setOccasionForm({ id: '', label: '', order: 0, keywords: [] });
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create occasion');
    }
  };

  const handleUpdateOccasion = async () => {
    // Validation
    if (!occasionForm.label || !occasionForm.label.trim()) {
      alert('Occasion Label is required');
      return;
    }

    try {
      const updated = await apiService.updateOccasion(editingOccasion.id, occasionForm);
      setOccasions(occasions.map(o => o.id === editingOccasion.id ? updated : o).sort((a, b) => a.order - b.order));
      setShowOccasionModal(false);
      setEditingOccasion(null);
      setOccasionForm({ id: '', label: '', order: 0, keywords: [] });
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update occasion');
    }
  };

  const handleDeleteOccasion = async (id) => {
    const occasionToDelete = occasions.find(o => o.id === id);
    setItemToDelete({ type: 'occasion', id: id, name: occasionToDelete?.label || 'this occasion' });
    setShowDeleteOccasionConfirm(true);
  };

  const confirmDeleteOccasion = async () => {
    try {
      await apiService.deleteOccasion(itemToDelete.id);
      setOccasions(occasions.filter(o => o.id !== itemToDelete.id));
      setShowDeleteOccasionConfirm(false);
      setItemToDelete({ type: null, id: null, name: null });
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete occasion');
      setShowDeleteOccasionConfirm(false);
      setItemToDelete({ type: null, id: null, name: null });
    }
  };

  const openEditOccasion = (occasion) => {
    setEditingOccasion(occasion);
    // Filter out auto-included keywords (id and label) from editable keywords
    const autoIncluded = [occasion.id.toLowerCase(), (occasion.label || '').toLowerCase()];
    const customKeywords = (occasion.keywords || []).filter(
      k => !autoIncluded.includes(k.toLowerCase().trim())
    );
    setOccasionForm({ 
      id: occasion.id, 
      label: occasion.label, 
      order: occasion.order,
      keywords: customKeywords
    });
    setShowOccasionModal(true);
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title">
          <Shield size={32} />
          <h1>Admin Dashboard</h1>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={18} />
          Overview
        </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Users
        </button>
        <button 
          className={`admin-tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={18} />
          Categories
        </button>
        <button 
          className={`admin-tab ${activeTab === 'occasions' ? 'active' : ''}`}
          onClick={() => setActiveTab('occasions')}
        >
          <Briefcase size={18} />
          Occasions
        </button>
      </div>

      {/* Overview/Statistics Tab */}
      {activeTab === 'overview' && (
        <div className="overview-section">
          <h2>System Overview</h2>
          
          {loading ? (
            <div className="loading-state">Loading statistics...</div>
          ) : stats ? (
            <div className="stats-grid">
              <div className="stat-card clickable" onClick={() => setActiveTab('users')}>
                <div className="stat-icon" style={{ background: '#eef2ff' }}>
                  <Users size={32} style={{ color: '#8B9DC3' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalUsers || users.length}</div>
                  <div className="stat-label">Total Users</div>
                  <div className="stat-sublabel">{users.filter(u => u.role === 'admin').length} admin(s)</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#eef2ff' }}>
                  <Shirt size={32} style={{ color: '#8B9DC3' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalWardrobeItems || 0}</div>
                  <div className="stat-label">Wardrobe Items</div>
                  <div className="stat-sublabel">All user wardrobe items</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#eef2ff' }}>
                  <Sparkles size={32} style={{ color: '#8B9DC3' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalOutfits || 0}</div>
                  <div className="stat-label">Saved Outfits</div>
                  <div className="stat-sublabel">User-created outfits</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#eef2ff' }}>
                  <Calendar size={32} style={{ color: '#8B9DC3' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalPlannedOutfits || 0}</div>
                  <div className="stat-label">Planned Outfits</div>
                  <div className="stat-sublabel">Calendar entries</div>
                </div>
              </div>

              <div className="stat-card clickable" onClick={() => setActiveTab('categories')}>
                <div className="stat-icon" style={{ background: '#eef2ff' }}>
                  <Tag size={32} style={{ color: '#8B9DC3' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{categories.length}</div>
                  <div className="stat-label">Categories</div>
                  <div className="stat-sublabel">Item categories</div>
                </div>
              </div>

              <div className="stat-card clickable" onClick={() => setActiveTab('occasions')}>
                <div className="stat-icon" style={{ background: '#eef2ff' }}>
                  <Briefcase size={32} style={{ color: '#8B9DC3' }} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{occasions.length}</div>
                  <div className="stat-label">Occasions</div>
                  <div className="stat-sublabel">Outfit occasions</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="error-state">
              <AlertCircle size={24} />
              <p>Failed to load statistics</p>
            </div>
          )}

        </div>
      )}

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="management-section">
          {/* Desktop Table View */}
          <div className="management-table-container desktop-view">
            <div className="section-header">
              <h2>User Management</h2>
              <button onClick={loadData} className="refresh-button">
                <TrendingUp size={18} />
                Refresh
              </button>
            </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr 
                  key={u._id}
                  onClick={() => handleViewUserDetail(u)}
                  style={{ cursor: 'pointer' }}
                  className="user-row"
                >
                  <td>
                    <span className="user-name">{u.name}</span>
                  </td>
                  <td>{u.email}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="role-select"
                      disabled={u._id === user?.id}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteUser(u._id); }}
                      className="delete-button"
                      disabled={u._id === user?.id}
                      title={u._id === user?.id ? 'Cannot delete your own account' : 'Delete user'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Mobile Card View */}
          <div className="users-cards-container mobile-view">
            {users.map((u) => (
            <div 
              key={u._id} 
              className="user-card"
              onClick={() => handleViewUserDetail(u)}
              style={{ cursor: 'pointer' }}
            >
              <div className="user-card-header">
                <div className="user-card-info">
                  <h3 className="user-name">{u.name}</h3>
                  <p className="user-email">{u.email}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteUser(u._id); }}
                  className="delete-button"
                  disabled={u._id === user?.id}
                  title={u._id === user?.id ? 'Cannot delete your own account' : 'Delete user'}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="user-card-details" onClick={(e) => e.stopPropagation()}>
                <div className="user-card-field">
                  <span className="field-label">Role:</span>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="role-select"
                    disabled={u._id === user?.id}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="user-card-field">
                  <span className="field-label">Created:</span>
                  <span className="field-value">{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="empty-state">
              <Users size={48} />
              <p>No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Categories Management */}
      {activeTab === 'categories' && (
        <div className="management-section">
          {/* Desktop Table View */}
          <div className="management-table-container desktop-view">
            <div className="section-header">
              <h2>Category Management</h2>
              <button onClick={() => { setEditingCategory(null); setCategoryForm({ id: '', label: '', color: '#3b82f6', order: categories.length, keywords: [] }); setShowCategoryModal(true); }} className="add-button">
                <Plus size={18} />
                Add Category
              </button>
            </div>
            <table className="management-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>ID</th>
                  <th>Label</th>
                  <th>Color</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.sort((a, b) => a.order - b.order).map((cat) => (
                  <tr 
                    key={cat._id || cat.id}
                    draggable
                    onDragStart={(e) => handleCategoryDragStart(e, cat)}
                    onDragEnd={handleCategoryDragEnd}
                    onDragOver={handleCategoryDragOver}
                    onDrop={(e) => handleCategoryDrop(e, cat)}
                    style={{ cursor: 'move' }}
                  >
                    <td style={{ color: '#8B9DC3', padding: '0.5rem' }}>
                      <GripVertical size={18} />
                    </td>
                    <td>{cat.id}</td>
                    <td>{cat.label}</td>
                    <td>
                      <div className="color-preview" style={{ backgroundColor: cat.color }}></div>
                      {cat.color}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => openEditCategory(cat)} className="edit-button">
                          <Edit2 size={16} />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="delete-button">
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="management-cards-container mobile-view">
            {categories.sort((a, b) => a.order - b.order).map((cat) => (
              <div 
                key={cat._id || cat.id} 
                className="management-card"
                draggable
                onDragStart={(e) => handleCategoryDragStart(e, cat)}
                onDragEnd={handleCategoryDragEnd}
                onDragOver={handleCategoryDragOver}
                onDrop={(e) => handleCategoryDrop(e, cat)}
                style={{ cursor: 'move' }}
              >
                <div className="management-card-header">
                  <div className="management-card-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GripVertical size={18} style={{ color: '#8B9DC3', flexShrink: 0 }} />
                    <div>
                      <h3 className="management-card-label">{cat.label}</h3>
                      <p className="management-card-id">ID: {cat.id}</p>
                    </div>
                  </div>
                  <div className="management-card-actions">
                    <div className="action-buttons">
                      <button onClick={() => openEditCategory(cat)} className="edit-button">
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="delete-button">
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="management-card-details">
                  <div className="management-card-field">
                    <span className="field-label">Color:</span>
                    <div className="color-field-value">
                      <div className="color-preview" style={{ backgroundColor: cat.color }}></div>
                      <span className="field-value">{cat.color}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="empty-state">
              <Tag size={48} />
              <p>No categories found</p>
            </div>
          )}
        </div>
      )}

      {/* Occasions Management */}
      {activeTab === 'occasions' && (
        <div className="management-section">
          {/* Desktop Table View */}
          <div className="management-table-container desktop-view">
            <div className="section-header">
              <h2>Occasion Management</h2>
              <button onClick={() => { setEditingOccasion(null); setOccasionForm({ id: '', label: '', order: occasions.length, keywords: [] }); setShowOccasionModal(true); }} className="add-button">
                <Plus size={18} />
                Add Occasion
              </button>
            </div>
            <table className="management-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>ID</th>
                  <th>Label</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {occasions.sort((a, b) => a.order - b.order).map((occ) => (
                  <tr 
                    key={occ._id || occ.id}
                    draggable
                    onDragStart={(e) => handleOccasionDragStart(e, occ)}
                    onDragEnd={handleOccasionDragEnd}
                    onDragOver={handleOccasionDragOver}
                    onDrop={(e) => handleOccasionDrop(e, occ)}
                    style={{ cursor: 'move' }}
                  >
                    <td style={{ color: '#8B9DC3', padding: '0.5rem' }}>
                      <GripVertical size={18} />
                    </td>
                    <td>{occ.id}</td>
                    <td>{occ.label}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => openEditOccasion(occ)} className="edit-button">
                          <Edit2 size={16} />
                          <span>Edit</span>
                        </button>
                        <button onClick={() => handleDeleteOccasion(occ.id)} className="delete-button">
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="management-cards-container mobile-view">
            {occasions.sort((a, b) => a.order - b.order).map((occ) => (
              <div 
                key={occ._id || occ.id} 
                className="management-card"
                draggable
                onDragStart={(e) => handleOccasionDragStart(e, occ)}
                onDragEnd={handleOccasionDragEnd}
                onDragOver={handleOccasionDragOver}
                onDrop={(e) => handleOccasionDrop(e, occ)}
                style={{ cursor: 'move' }}
              >
                <div className="management-card-header">
                  <div className="management-card-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GripVertical size={18} style={{ color: '#8B9DC3', flexShrink: 0 }} />
                    <div>
                      <h3 className="management-card-label">{occ.label}</h3>
                      <p className="management-card-id">ID: {occ.id}</p>
                    </div>
                  </div>
                  <div className="management-card-actions">
                    <div className="action-buttons">
                      <button onClick={() => openEditOccasion(occ)} className="edit-button">
                        <Edit2 size={16} />
                        <span>Edit</span>
                      </button>
                      <button onClick={() => handleDeleteOccasion(occ.id)} className="delete-button">
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {occasions.length === 0 && (
            <div className="empty-state">
              <Briefcase size={48} />
              <p>No occasions found</p>
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryForm({ id: '', label: '', color: '#3b82f6', order: 0, keywords: [] }); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <div className="form-group">
              <label>ID (lowercase, no spaces)</label>
              <input 
                type="text" 
                value={categoryForm.id} 
                onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                disabled={!!editingCategory}
                placeholder="e.g., jackets"
              />
              <small className="field-description">Internal identifier used by the system. Must be lowercase, no spaces. Used for AI matching and database queries.</small>
            </div>
            <div className="form-group">
              <label>Label</label>
              <input 
                type="text" 
                value={categoryForm.label} 
                onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
                placeholder="e.g., Jackets"
              />
              <small className="field-description">Display name shown to users in the app. Can have proper capitalization and spaces.</small>
            </div>
            <div className="form-group">
              <label>Color</label>
              <input 
                type="color" 
                value={categoryForm.color} 
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Keywords (comma-separated)</label>
              <textarea
                value={typeof categoryForm.keywords === 'string' 
                  ? categoryForm.keywords 
                  : (Array.isArray(categoryForm.keywords) ? categoryForm.keywords.join(', ') : '')}
                onChange={(e) => {
                  setCategoryForm({ ...categoryForm, keywords: e.target.value });
                }}
                onBlur={(e) => {
                  // Process keywords array when user leaves the field
                  const keywordsStr = e.target.value;
                  const keywordsArray = keywordsStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
                  setCategoryForm({ ...categoryForm, keywords: keywordsArray });
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="e.g., shirt, blouse, t-shirt, top"
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B9DC3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 157, 195, 0.1)';
                  // Convert array to string when focusing if needed
                  if (Array.isArray(categoryForm.keywords)) {
                    setCategoryForm({ ...categoryForm, keywords: categoryForm.keywords.join(', ') });
                  }
                }}
              />
              <small className="field-description">Keywords that the AI will use to detect this category. Separate multiple keywords with commas.</small>
            </div>
            <div className="modal-actions">
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryForm({ id: '', label: '', color: '#3b82f6', order: 0, keywords: [] }); }} className="cancel-button">Cancel</button>
              <button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory} className="save-button">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Occasion Modal */}
      {showOccasionModal && (
        <div className="modal-overlay" onClick={() => { setShowOccasionModal(false); setEditingOccasion(null); setOccasionForm({ id: '', label: '', order: 0, keywords: [] }); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingOccasion ? 'Edit Occasion' : 'Add Occasion'}</h3>
            <div className="form-group">
              <label>ID (lowercase, no spaces)</label>
              <input 
                type="text" 
                value={occasionForm.id} 
                onChange={(e) => setOccasionForm({ ...occasionForm, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                disabled={!!editingOccasion}
                placeholder="e.g., party"
              />
              <small className="field-description">Internal identifier used by the system. Must be lowercase, no spaces. Used for filtering and database queries.</small>
            </div>
            <div className="form-group">
              <label>Label</label>
              <input 
                type="text" 
                value={occasionForm.label} 
                onChange={(e) => setOccasionForm({ ...occasionForm, label: e.target.value })}
                placeholder="e.g., Party"
              />
              <small className="field-description">Display name shown to users in the app. Can have proper capitalization and spaces.</small>
            </div>
            <div className="form-group">
              <label>Keywords (comma-separated)</label>
              <textarea
                value={typeof occasionForm.keywords === 'string' 
                  ? occasionForm.keywords 
                  : (Array.isArray(occasionForm.keywords) ? occasionForm.keywords.join(', ') : '')}
                onChange={(e) => {
                  setOccasionForm({ ...occasionForm, keywords: e.target.value });
                }}
                onBlur={(e) => {
                  // Process keywords array when user leaves the field
                  const keywordsStr = e.target.value;
                  const keywordsArray = keywordsStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
                  // Filter out any auto-included keywords that user might have added
                  const autoIncluded = editingOccasion 
                    ? [editingOccasion.id.toLowerCase(), (editingOccasion.label || '').toLowerCase()]
                    : [];
                  const filteredKeywords = keywordsArray.filter(
                    k => !autoIncluded.includes(k.toLowerCase().trim())
                  );
                  setOccasionForm({ ...occasionForm, keywords: filteredKeywords });
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="e.g., dress shoe, oxford, elegant, ceremony"
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8B9DC3';
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 157, 195, 0.1)';
                  // Convert array to string when focusing if needed
                  if (Array.isArray(occasionForm.keywords)) {
                    setOccasionForm({ ...occasionForm, keywords: occasionForm.keywords.join(', ') });
                  }
                }}
              />
              <small className="field-description">Additional keywords that the AI will use to detect this occasion. Separate multiple keywords with commas. The ID and label are automatically included as keywords.</small>
            </div>
            <div className="modal-actions">
              <button onClick={() => { setShowOccasionModal(false); setEditingOccasion(null); setOccasionForm({ id: '', label: '', order: 0, keywords: [] }); }} className="cancel-button">Cancel</button>
              <button onClick={editingOccasion ? handleUpdateOccasion : handleCreateOccasion} className="save-button">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserConfirm && (
        <div className="modal-overlay delete-confirm-overlay" onClick={() => {
          setShowDeleteUserConfirm(false);
          setItemToDelete({ type: null, id: null, name: null });
        }}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <h3 className="delete-confirm-title">Delete User?</h3>
            <p className="delete-confirm-message">
              Are you sure you want to delete <strong>{itemToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="delete-confirm-buttons">
              <button 
                className="delete-confirm-cancel"
                onClick={() => {
                  setShowDeleteUserConfirm(false);
                  setItemToDelete({ type: null, id: null, name: null });
                }}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-delete"
                onClick={confirmDeleteUser}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryConfirm && (
        <div className="modal-overlay delete-confirm-overlay" onClick={() => {
          setShowDeleteCategoryConfirm(false);
          setItemToDelete({ type: null, id: null, name: null });
        }}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <h3 className="delete-confirm-title">Delete Category?</h3>
            <p className="delete-confirm-message">
              Are you sure you want to delete the category <strong>{itemToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="delete-confirm-buttons">
              <button 
                className="delete-confirm-cancel"
                onClick={() => {
                  setShowDeleteCategoryConfirm(false);
                  setItemToDelete({ type: null, id: null, name: null });
                }}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-delete"
                onClick={confirmDeleteCategory}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Occasion Confirmation Modal */}
      {showDeleteOccasionConfirm && (
        <div className="modal-overlay delete-confirm-overlay" onClick={() => {
          setShowDeleteOccasionConfirm(false);
          setItemToDelete({ type: null, id: null, name: null });
        }}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <h3 className="delete-confirm-title">Delete Occasion?</h3>
            <p className="delete-confirm-message">
              Are you sure you want to delete the occasion <strong>{itemToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="delete-confirm-buttons">
              <button 
                className="delete-confirm-cancel"
                onClick={() => {
                  setShowDeleteOccasionConfirm(false);
                  setItemToDelete({ type: null, id: null, name: null });
                }}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-delete"
                onClick={confirmDeleteOccasion}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetail && selectedUserDetail && (
        <div className="modal-overlay" onClick={() => { setShowUserDetail(false); setSelectedUserDetail(null); setUserStats(null); }}>
          <div className="modal-content user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button 
                className="modal-close-btn"
                onClick={() => { setShowUserDetail(false); setSelectedUserDetail(null); setUserStats(null); }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-detail-info">
                <div className="user-detail-header">
                  <div className="user-avatar" style={{ background: '#eef2ff', color: '#8B9DC3' }}>
                    <User size={32} />
                  </div>
                  <div className="user-detail-name">
                    <h3>{selectedUserDetail.name}</h3>
                    <p className="user-detail-email">
                      <Mail size={16} />
                      {selectedUserDetail.email}
                    </p>
                    <p className="user-detail-role">
                      <Shield size={16} />
                      {selectedUserDetail.role === 'admin' ? 'Administrator' : 'User'}
                    </p>
                    <p className="user-detail-created">
                      <Clock size={16} />
                      Joined: {new Date(selectedUserDetail.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {loadingUserStats ? (
                  <div className="loading-state">Loading user statistics...</div>
                ) : userStats ? (
                  <div className="user-stats-grid">
                    <div className="user-stat-card">
                      <div className="user-stat-icon" style={{ background: '#eef2ff' }}>
                        <Shirt size={24} style={{ color: '#8B9DC3' }} />
                      </div>
                      <div className="user-stat-content">
                        <div className="user-stat-value">{userStats.wardrobeItems}</div>
                        <div className="user-stat-label">Wardrobe Items</div>
                      </div>
                    </div>

                    <div className="user-stat-card">
                      <div className="user-stat-icon" style={{ background: '#eef2ff' }}>
                        <Sparkles size={24} style={{ color: '#8B9DC3' }} />
                      </div>
                      <div className="user-stat-content">
                        <div className="user-stat-value">{userStats.savedOutfits}</div>
                        <div className="user-stat-label">Saved Outfits</div>
                      </div>
                    </div>

                    <div className="user-stat-card">
                      <div className="user-stat-icon" style={{ background: '#eef2ff' }}>
                        <Calendar size={24} style={{ color: '#8B9DC3' }} />
                      </div>
                      <div className="user-stat-content">
                        <div className="user-stat-value">{userStats.plannedOutfits}</div>
                        <div className="user-stat-label">Planned Outfits</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="error-state">Failed to load user statistics</div>
                )}

                {/* Actionable Content Management Sections */}
                {userStats && (
                  <>
                    {/* Wardrobe Items Management */}
                    <div className="user-detail-section">
                      <div className="user-section-header">
                        <div>
                          <h4>Wardrobe Items ({userStats.wardrobeItems})</h4>
                          <p className="section-description">Manage user's wardrobe items</p>
                        </div>
                        <div className="section-actions">
                          {userStats.wardrobeItems > 0 && (
                            <button 
                              className="btn-danger-small"
                              onClick={() => { setDeleteAllType('wardrobe'); setShowDeleteAllConfirm(true); }}
                            >
                              <Trash2 size={16} />
                              Delete All
                            </button>
                          )}
                          <button 
                            className="btn-expand"
                            onClick={() => setExpandedSection(expandedSection === 'wardrobe' ? null : 'wardrobe')}
                          >
                            {expandedSection === 'wardrobe' ? 'Collapse' : 'View All'}
                          </button>
                        </div>
                      </div>
                      {expandedSection === 'wardrobe' && userStats.wardrobeItemsList.length > 0 && (
                        <div className="user-content-list">
                          {userStats.wardrobeItemsList.map((item) => (
                            <div key={item._id} className="user-content-item">
                              <div className="content-item-info">
                                {item.image && (
                                  <img 
                                    src={item.image.startsWith('http') ? item.image : `${getBackendBaseUrl()}${item.image}`}
                                    alt={item.name || 'Item'}
                                    className="content-item-thumb"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                )}
                                <div>
                                  <div className="content-item-name">{item.name || 'Unnamed Item'}</div>
                                  <div className="content-item-meta">{item.category} • {new Date(item.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <button 
                                className="btn-delete-item"
                                onClick={() => {
                                  if (window.confirm(`Delete "${item.name || 'this item'}"?`)) {
                                    handleDeleteUserItem(item._id, 'wardrobe');
                                  }
                                }}
                                title="Delete item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Saved Outfits Management */}
                    <div className="user-detail-section">
                      <div className="user-section-header">
                        <div>
                          <h4>Saved Outfits ({userStats.savedOutfits})</h4>
                          <p className="section-description">Manage user's saved outfits</p>
                        </div>
                        <div className="section-actions">
                          {userStats.savedOutfits > 0 && (
                            <button 
                              className="btn-danger-small"
                              onClick={() => { setDeleteAllType('outfits'); setShowDeleteAllConfirm(true); }}
                            >
                              <Trash2 size={16} />
                              Delete All
                            </button>
                          )}
                          <button 
                            className="btn-expand"
                            onClick={() => setExpandedSection(expandedSection === 'outfits' ? null : 'outfits')}
                          >
                            {expandedSection === 'outfits' ? 'Collapse' : 'View All'}
                          </button>
                        </div>
                      </div>
                      {expandedSection === 'outfits' && userStats.savedOutfitsList.length > 0 && (
                        <div className="user-content-list">
                          {userStats.savedOutfitsList.map((outfit) => (
                            <div key={outfit._id} className="user-content-item">
                              <div className="content-item-info">
                                <div>
                                  <div className="content-item-name">{outfit.name || 'Unnamed Outfit'}</div>
                                  <div className="content-item-meta">
                                    {outfit.items?.length || 0} items • {outfit.occasion || 'No occasion'} • {new Date(outfit.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <button 
                                className="btn-delete-item"
                                onClick={() => {
                                  if (window.confirm(`Delete "${outfit.name || 'this outfit'}"?`)) {
                                    handleDeleteUserItem(outfit._id, 'outfit');
                                  }
                                }}
                                title="Delete outfit"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Planned Outfits Management */}
                    <div className="user-detail-section">
                      <div className="user-section-header">
                        <div>
                          <h4>Planned Outfits ({userStats.plannedOutfits})</h4>
                          <p className="section-description">Manage user's planned outfits</p>
                        </div>
                        <div className="section-actions">
                          {userStats.plannedOutfits > 0 && (
                            <button 
                              className="btn-danger-small"
                              onClick={() => { setDeleteAllType('planned'); setShowDeleteAllConfirm(true); }}
                            >
                              <Trash2 size={16} />
                              Delete All
                            </button>
                          )}
                          <button 
                            className="btn-expand"
                            onClick={() => setExpandedSection(expandedSection === 'planned' ? null : 'planned')}
                          >
                            {expandedSection === 'planned' ? 'Collapse' : 'View All'}
                          </button>
                        </div>
                      </div>
                      {expandedSection === 'planned' && userStats.plannedOutfitsList.length > 0 && (
                        <div className="user-content-list">
                          {userStats.plannedOutfitsList.map((outfit) => (
                            <div key={outfit._id} className="user-content-item">
                              <div className="content-item-info">
                                <div>
                                  <div className="content-item-name">{outfit.name || 'Unnamed Outfit'}</div>
                                  <div className="content-item-meta">
                                    {outfit.items?.length || 0} items • {new Date(outfit.date).toLocaleDateString()} • {outfit.occasion || 'No occasion'}
                                  </div>
                                </div>
                              </div>
                              <button 
                                className="btn-delete-item"
                                onClick={() => {
                                  if (window.confirm(`Delete planned outfit for ${new Date(outfit.date).toLocaleDateString()}?`)) {
                                    handleDeleteUserItem(outfit._id, 'planned');
                                  }
                                }}
                                title="Delete planned outfit"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Clear All Data Option */}
                    {(userStats.wardrobeItems > 0 || userStats.savedOutfits > 0 || userStats.plannedOutfits > 0) && (
                      <div className="user-detail-section danger-section">
                        <h4 style={{ color: '#dc2626' }}>Danger Zone</h4>
                        <p className="section-description">Permanently delete all user content</p>
                        <button 
                          className="btn-danger"
                          onClick={() => { setDeleteAllType('all'); setShowDeleteAllConfirm(true); }}
                        >
                          <Trash2 size={18} />
                          Clear All User Data
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => { 
                  setShowUserDetail(false); 
                  setSelectedUserDetail(null); 
                  setUserStats(null);
                  setExpandedSection(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="modal-overlay" onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllType(null); }}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <AlertCircle size={24} style={{ color: '#dc2626' }} />
              <h3>Confirm Deletion</h3>
            </div>
            <div className="delete-confirm-body">
              <p>
                {deleteAllType === 'wardrobe' && `Are you sure you want to delete ALL ${userStats?.wardrobeItems || 0} wardrobe items for ${selectedUserDetail?.name}?`}
                {deleteAllType === 'outfits' && `Are you sure you want to delete ALL ${userStats?.savedOutfits || 0} saved outfits for ${selectedUserDetail?.name}?`}
                {deleteAllType === 'planned' && `Are you sure you want to delete ALL ${userStats?.plannedOutfits || 0} planned outfits for ${selectedUserDetail?.name}?`}
                {deleteAllType === 'all' && `Are you sure you want to delete ALL content (${(userStats?.wardrobeItems || 0) + (userStats?.savedOutfits || 0) + (userStats?.plannedOutfits || 0)} items) for ${selectedUserDetail?.name}? This action cannot be undone.`}
              </p>
            </div>
            <div className="delete-confirm-actions">
              <button 
                className="delete-confirm-cancel"
                onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllType(null); }}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-delete"
                onClick={() => handleDeleteAllUserContent(deleteAllType)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

