import React, { useState, useEffect, useCallback } from 'react';
import { Shirt } from 'lucide-react';
import { apiService } from '../services/ApiService';
import { getBackendBaseUrl } from '../utils/getBackendUrl';
import './Wardrobe.css';

// Auto-detect backend URL based on current hostname
const BACKEND_BASE_URL = getBackendBaseUrl();

const Wardrobe = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editOccasionTags, setEditOccasionTags] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [categories, setCategories] = useState([
    { id: 'all', label: 'All Items', color: '#d9e3f7' }
  ]);
  const [occasions, setOccasions] = useState([
    { id: 'all', label: 'All Occasions', color: '#10b981' }
  ]);

  // Load categories and occasions from API
  useEffect(() => {
    const loadCategoriesAndOccasions = async () => {
      try {
        const [categoriesData, occasionsData] = await Promise.all([
          apiService.getCategories(),
          apiService.getOccasions()
        ]);
        
        // Map API categories to frontend format
        const mappedCategories = [
    { id: 'all', label: 'All Items', color: '#d9e3f7' },
          ...categoriesData.map(cat => ({
            id: cat.id,
            label: cat.label,
            color: cat.color
          }))
        ];
        
        // Map API occasions to frontend format
        const mappedOccasions = [
    { id: 'all', label: 'All Occasions', color: '#10b981' },
          ...occasionsData.map(occ => ({
            id: occ.id,
            label: occ.label,
            color: occ.color
          }))
        ];
        
        setCategories(mappedCategories);
        setOccasions(mappedOccasions);
      } catch (error) {
        console.error('Error loading categories/occasions:', error);
        // Keep default values on error
      }
    };
    
    loadCategoriesAndOccasions();
  }, []);

  const loadWardrobeItems = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading wardrobe items from API...');
      const items = await apiService.getWardrobeItems();
      console.log('📦 Items received from API:', items);
      
      // Debug: Log occasion tags for each item
      items.forEach((item, index) => {
        console.log(`📋 Item ${index}:`, item.name, 'Occasion Tags:', item.occasionTags, 'Type:', typeof item.occasionTags);
      });
      
      setWardrobeItems(items);
    } catch (error) {
      console.error('❌ Error loading wardrobe items:', error);
      console.log('📱 Falling back to local storage...');
      // Fallback to local storage if API fails
      const savedItems = localStorage.getItem('wardrobeItems');
      if (savedItems) {
        console.log('📱 Local storage items:', JSON.parse(savedItems));
        setWardrobeItems(JSON.parse(savedItems));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load wardrobe items from MongoDB API
  useEffect(() => {
    console.log('🔄 useEffect triggered - loading wardrobe items...');
    loadWardrobeItems();
    
    // Refresh wardrobe items every 30 seconds to catch new uploads
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh triggered...');
      loadWardrobeItems();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadWardrobeItems]);

  // Start editing an item
  const startEditing = (item) => {
    console.log('🔍 Starting to edit item:', item.name);
    console.log('🔍 Item occasion tags:', item.occasionTags, 'Type:', typeof item.occasionTags);
    
    setEditingItem(item);
    setEditCategory(item.category || '');
    
    // Handle different data formats for occasion tags
    let occasionTags = [];
    if (item.occasionTags) {
      if (Array.isArray(item.occasionTags)) {
        // If it's an array, check if elements contain commas and split them
        occasionTags = item.occasionTags.flatMap(tag => {
          if (typeof tag === 'string' && tag.includes(',')) {
            return tag.split(',').map(t => t.trim());
          }
          return tag;
        });
      } else if (typeof item.occasionTags === 'string') {
        // If it's a string, split by comma
        occasionTags = item.occasionTags.split(',').map(tag => tag.trim());
      }
    }
    
    console.log('🔍 Processed occasion tags for editing:', occasionTags);
    setEditOccasionTags(occasionTags);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null);
    setEditCategory('');
    setEditOccasionTags([]);
  };

  // Save edited item
  const saveEditing = async () => {
    if (!editingItem) return;
    
    try {
      const updatedItem = await apiService.updateWardrobeItem(editingItem._id, {
        category: editCategory,
        occasionTags: editOccasionTags
      });
      
      // Update local state
      setWardrobeItems(items => 
        items.map(item => 
          item._id === editingItem._id ? updatedItem : item
        )
      );
      
      cancelEditing();
    } catch (error) {
      console.error('❌ Error updating item:', error);
    }
  };

  // Save wardrobe items to localStorage (fallback only)
  useEffect(() => {
    // Only save to localStorage if we're using local storage (no API available)
    if (wardrobeItems.length > 0 && wardrobeItems[0].id && !wardrobeItems[0]._id) {
      localStorage.setItem('wardrobeItems', JSON.stringify(wardrobeItems));
    }
  }, [wardrobeItems]);

  // Filter items based on category and occasion
  const filteredItems = wardrobeItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || 
                           item.category.toLowerCase() === selectedCategory.toLowerCase();
    
    // Handle different formats of occasionTags for filtering
    let matchesOccasion = selectedOccasion === 'all';
    if (!matchesOccasion && item.occasionTags) {
      if (Array.isArray(item.occasionTags)) {
        // Check if any element in the array contains the selected occasion
        matchesOccasion = item.occasionTags.some(tag => {
          if (typeof tag === 'string' && tag.includes(',')) {
            // If tag contains commas, split and check each part
            return tag.split(',').map(t => t.trim()).includes(selectedOccasion);
          }
          return tag === selectedOccasion;
        });
      } else if (typeof item.occasionTags === 'string') {
        // If it's a string, split by comma and check
        matchesOccasion = item.occasionTags.split(',').map(tag => tag.trim()).includes(selectedOccasion);
      }
    }
    
    return matchesCategory && matchesOccasion;
  });

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleOccasionSelect = (occasion) => {
    setSelectedOccasion(occasion);
  };

  const removeItem = async (itemId) => {
    try {
      await apiService.deleteWardrobeItem(itemId);
      setWardrobeItems(prev => prev.filter(item => item._id !== itemId && item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      // Fallback to local storage
      setWardrobeItems(prev => prev.filter(item => item.id !== itemId));
      localStorage.setItem('wardrobeItems', JSON.stringify(wardrobeItems.filter(item => item.id !== itemId)));
    }
  };

  // Mock data for demonstration
  const addMockItems = () => {
    const mockItems = [
      {
        id: 1,
        name: 'Blue Denim Jeans',
        category: 'Pants',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzMzMzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CbHVlIEplYW5zPC90ZXh0Pgo8L3N2Zz4K',
        tags: ['casual', 'denim', 'blue'],
        confidence: 0.95
      },
      {
        id: 2,
        name: 'White Cotton T-Shirt',
        category: 'Shirts',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjIiLz4KPHR4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMzMzMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5XaGl0ZSBULVNoaXJ0PC90ZXh0Pgo8L3N2Zz4K',
        tags: ['casual', 'cotton', 'white'],
        confidence: 0.88
      }
    ];
    setWardrobeItems(mockItems);
  };

  return (
    <div className="wardrobe-container">
      <div className="wardrobe-header">
        <h1>My Wardrobe</h1>
        <p>Browse and manage your clothing items</p>
      </div>

      <div className="filters-wrapper">
        {/* Category Tabs */}
        <div className="category-tabs">
        {categories.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
                className={`category-tab ${isActive ? 'active' : ''}`}
              onClick={() => handleCategorySelect(category.id)}
                style={{ '--tab-color': category.color }}
            >
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

        {/* Occasion Filter */}
        <div className="occasion-filter-wrapper">
          <select
            className="occasion-select"
            value={selectedOccasion}
            onChange={(e) => handleOccasionSelect(e.target.value)}
          >
            {occasions.map((occasion) => (
              <option key={occasion.id} value={occasion.id}>
                {occasion.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="wardrobe-stats">
        <div className="stat-card">
          <h3>{wardrobeItems.length}</h3>
          <p>Total Items</p>
        </div>
        <div className="stat-card">
          <h3>{filteredItems.length}</h3>
          <p>Filtered Results</p>
        </div>
      </div>

      <div className="wardrobe-content">
        {filteredItems.length === 0 ? (
          <div className="empty-wardrobe">
            <div className="empty-icon">
              <Shirt size={64} />
            </div>
            <h3>No items found</h3>
            <p>Start building your wardrobe by uploading some clothes!</p>
          </div>
        ) : (
          <div className="wardrobe-grid">
            {filteredItems.map((item) => (
              <div key={item._id || item.id} className="wardrobe-item">
                <div 
                  className="item-image"
                  onClick={() => {
                    setSelectedItem(item);
                    setShowItemModal(true);
                    // Reset editing state when opening modal
                    if (editingItem) {
                      cancelEditing();
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <img 
                    src={item.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${item.image}` : item.image} 
                    alt={item.name} 
                    onError={(e) => {
                      console.error('❌ Image failed to load:', item.image);
                      console.error('🔗 Attempted URL:', item.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${item.image}` : item.image);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Item Details Modal */}
        {showItemModal && selectedItem && (
          <div className="item-modal-overlay" onClick={() => {
            setShowItemModal(false);
            cancelEditing();
          }}>
            <div className="item-modal-content" onClick={(e) => e.stopPropagation()}>
                  <button 
                className="item-modal-close"
                onClick={() => {
                  setShowItemModal(false);
                  cancelEditing();
                }}
                  >
                    ×
                  </button>
              
              <div className="item-modal-image">
                <img 
                  src={selectedItem.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${selectedItem.image}` : selectedItem.image} 
                  alt={selectedItem.name}
                  onError={(e) => {
                    console.error('❌ Image failed to load in modal:', selectedItem.image);
                    console.error('🔗 Attempted URL:', selectedItem.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${selectedItem.image}` : selectedItem.image);
                  }} 
                />
                </div>
              
              <div className="item-modal-details">
                {editingItem && editingItem._id === selectedItem._id ? (
                    // Editing mode
                    <div className="edit-form">
                      <div className="edit-section">
                        <label className="edit-label">Category:</label>
                        <select 
                          value={editCategory} 
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="edit-select"
                        >
                        {categories.filter(cat => cat.id !== 'all').map(category => (
                          <option key={category.id} value={category.id.toUpperCase()}>
                            {category.label}
                          </option>
                        ))}
                        </select>
                      </div>
                      
                      <div className="edit-section">
                        <label className="edit-label">Occasions:</label>
                        <div className="edit-occasion-tags">
                        {occasions.filter(occ => occ.id !== 'all').map(occasion => {
                          const occasionId = occasion.id.toLowerCase();
                          const isChecked = editOccasionTags.includes(occasionId) || editOccasionTags.includes(occasion.label.toLowerCase());
                            return (
                            <label key={occasion.id} className="edit-occasion-tag-label">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                    setEditOccasionTags([...editOccasionTags, occasionId]);
                                    } else {
                                    setEditOccasionTags(editOccasionTags.filter(tag => tag !== occasionId && tag !== occasion.label.toLowerCase()));
                                    }
                                  }}
                                />
                              <span className="edit-occasion-tag-text">{occasion.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="edit-buttons">
                      <button onClick={() => {
                        saveEditing();
                        setShowItemModal(false);
                      }} className="save-btn">Save Changes</button>
                      <button onClick={() => {
                        cancelEditing();
                      }} className="cancel-btn">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                    {/* Category Badge */}
                    <p className="item-modal-category">{selectedItem.category}</p>
                      
                      {/* Occasion Tags */}
                    {selectedItem.occasionTags && selectedItem.occasionTags.length > 0 && (
                        <div className="tags-section">
                          <div className="tags-label">Occasions:</div>
                          <div className="occasion-tags">
                            {(() => {
                            let itemOccasions = [];
                            if (Array.isArray(selectedItem.occasionTags)) {
                              itemOccasions = selectedItem.occasionTags.flatMap(tag => {
                                  if (typeof tag === 'string' && tag.includes(',')) {
                                    return tag.split(',').map(t => t.trim());
                                  }
                                  return tag;
                                });
                            } else if (typeof selectedItem.occasionTags === 'string') {
                              itemOccasions = selectedItem.occasionTags.split(',').map(tag => tag.trim());
                            }
                            
                            // Use dynamic occasions from API
                            const validOccasionIds = occasions.filter(occ => occ.id !== 'all').map(occ => occ.id.toLowerCase());
                            const validOccasionLabels = occasions.filter(occ => occ.id !== 'all').map(occ => occ.label.toLowerCase());
                            const filteredOccasions = itemOccasions.filter(occasion => {
                              const occLower = occasion.toLowerCase();
                              return validOccasionIds.includes(occLower) || validOccasionLabels.includes(occLower);
                            });
                            
                            // Map to display labels
                            const occasionDisplay = filteredOccasions.map(occ => {
                              const occLower = occ.toLowerCase();
                              const matchingOcc = occasions.find(o => 
                                o.id.toLowerCase() === occLower || o.label.toLowerCase() === occLower
                              );
                              return matchingOcc ? matchingOcc.label : occ;
                            });
                            
                            return occasionDisplay.map((occasion, index) => (
                              <span key={index} className="occasion-tag">{occasion}</span>
                            ));
                            })()}
                          </div>
                        </div>
                      )}
                      
                    {/* Style Information */}
                    {selectedItem.style && selectedItem.style !== 'unknown' && (
                      <div className="item-info-section">
                        <div className="info-label">Style</div>
                        <span className="info-value">{selectedItem.style}</span>
                      </div>
                    )}
                    
                    {/* Metadata Section */}
                    <div className="item-metadata">
                      {/* Date Created */}
                      {selectedItem.createdAt && (
                        <div className="metadata-item">
                          <span className="metadata-label">Added:</span>
                          <span className="metadata-value">
                            {new Date(selectedItem.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                      
                      </div>
                    
                    <div className="item-modal-actions">
                      <button 
                        onClick={() => {
                          startEditing(selectedItem);
                        }}
                        className="edit-item-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          setItemToDelete(selectedItem);
                          setShowDeleteConfirm(true);
                        }}
                        className="delete-item-btn"
                      >
                        Delete
                      </button>
                    </div>
                    </>
                  )}
                </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirm-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </div>
              <h3 className="delete-confirm-title">Delete Item?</h3>
              <p className="delete-confirm-message">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              <div className="delete-confirm-buttons">
                <button 
                  className="delete-confirm-cancel"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="delete-confirm-delete"
                  onClick={() => {
                    if (itemToDelete) {
                      removeItem(itemToDelete._id || itemToDelete.id);
                      setShowItemModal(false);
                    }
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wardrobe;
