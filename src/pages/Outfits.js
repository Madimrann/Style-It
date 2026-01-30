import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, RefreshCw, X, Bookmark, Trash2, Calendar, Lightbulb, Edit2, Shirt, Plus, Info, RotateCcw, AlertCircle } from 'lucide-react';
import { apiService } from '../services/ApiService';
import './Outfits.css';

// Get backend base URL for serving static files (uploads)
import { getBackendBaseUrl } from '../utils/getBackendUrl';

// Auto-detect backend URL based on current hostname
const BACKEND_BASE_URL = getBackendBaseUrl();

const Outfits = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showOccasionSelector, setShowOccasionSelector] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [outfitToSave, setOutfitToSave] = useState(null);
  const [showCustomOutfitModal, setShowCustomOutfitModal] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [selectedWardrobeItems, setSelectedWardrobeItems] = useState([]); // Items in the outfit
  const [tempSelectedItems, setTempSelectedItems] = useState([]); // Items selected in the modal
  const [showItemSelectionModal, setShowItemSelectionModal] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showRemoveItemConfirm, setShowRemoveItemConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [selectedOccasionFilter, setSelectedOccasionFilter] = useState(''); // For item selection modal
  const [customOutfitName, setCustomOutfitName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // Duplicate warning message
  const [editingOutfitId, setEditingOutfitId] = useState(null);
  const [editingOutfitName, setEditingOutfitName] = useState('');
  const [lastSelectedOccasion, setLastSelectedOccasion] = useState(null); // Store last selected occasion for refresh
  const [selectedItemDetail, setSelectedItemDetail] = useState(null); // For showing item details
  const [selectedOutfitToEdit, setSelectedOutfitToEdit] = useState(null); // For edit/delete modal
  const [showOutfitEditModal, setShowOutfitEditModal] = useState(false);

  const [occasionsList, setOccasionsList] = useState(['Casual', 'Work', 'Formal', 'Sporty']);

  // Load occasions from API
  useEffect(() => {
    const loadOccasions = async () => {
      try {
        const occasionsData = await apiService.getOccasions();
        const occasionLabels = occasionsData.map(occ => occ.label || occ.name || occ);
        setOccasionsList(occasionLabels.length > 0 ? occasionLabels : ['Casual', 'Work', 'Formal', 'Sporty']);
        setOccasions(occasionsData); // Set full occasion objects for custom outfit modal
      } catch (error) {
        console.error('Error loading occasions:', error);
        // Keep default values on error
      }
    };
    
    loadOccasions();
  }, []);

  // Load saved outfits from MongoDB
  useEffect(() => {
    const loadSavedOutfits = async () => {
      try {
        console.log('🔍 Loading saved outfits from MongoDB...');
        const outfits = await apiService.getSavedOutfits();
        console.log('✅ Loaded saved outfits from MongoDB:', outfits);
        setSavedOutfits(outfits);
      } catch (error) {
        console.error('❌ Error loading saved outfits from MongoDB:', error);
        // Fallback to localStorage if MongoDB fails
        const saved = localStorage.getItem('savedOutfits');
        if (saved) {
          try {
            const parsedSaved = JSON.parse(saved);
            console.log('📱 Fallback: Loaded from localStorage:', parsedSaved);
            setSavedOutfits(parsedSaved);
          } catch (parseError) {
            console.error('❌ Error parsing localStorage fallback:', parseError);
            setSavedOutfits([]);
          }
        } else {
          console.log('📭 No saved outfits found anywhere');
          setSavedOutfits([]);
        }
      }
    };

    loadSavedOutfits();
  }, []);

  // Load wardrobe items and categories for custom outfit creation and item details
  useEffect(() => {
    const loadData = async () => {
      try {
        const [items, categoriesData] = await Promise.all([
          apiService.getWardrobeItems(),
          apiService.getCategories()
        ]);
        setWardrobeItems(items);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data for custom outfit:', error);
      }
    };
    if (showCustomOutfitModal || showOutfitEditModal) {
      loadData();
    }
  }, [showCustomOutfitModal, showOutfitEditModal]);

  const getWardrobeItems = async () => {
    try {
      // Try to get items from API first
      const items = await apiService.getWardrobeItems();
      return items;
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
      // Fallback to localStorage
      const savedItems = localStorage.getItem('wardrobeItems');
      return savedItems ? JSON.parse(savedItems) : [];
    }
  };

  const generateAIRecommendation = async (occasion) => {
    setLoading(true);
    
    try {
      console.log('🤖 Generating outfit recommendation for occasion:', occasion);
      
      // Store the selected occasion for refresh functionality
      setLastSelectedOccasion(occasion);

      const recommendation = await apiService.getOutfitRecommendation(occasion);
      
      // Check for duplicate warning in recommendation - show immediately
      if (recommendation && recommendation.duplicateWarning && recommendation.duplicateWarning.isDuplicate) {
        setDuplicateWarning(recommendation.duplicateWarning.message);
      } else {
        setDuplicateWarning(null);
      }
      
      if (recommendation && recommendation.recommendedOutfit) {
        // Convert the new format to the expected format
        const formattedRecommendation = {
          occasion: recommendation.occasion,
          items: [
            recommendation.recommendedOutfit.top,
            // Add outerwear right after top if available
            ...(recommendation.recommendedOutfit.outerwear ? [recommendation.recommendedOutfit.outerwear] : []),
            recommendation.recommendedOutfit.bottom,
            recommendation.recommendedOutfit.shoes
          ].filter(Boolean), // Remove null items
          stylingTips: recommendation.stylingTips,
          confidence: recommendation.confidence,
          availableItems: recommendation.availableItems
        };
        // Add all accessories (now an array) if available
        if (recommendation.recommendedOutfit.accessories && Array.isArray(recommendation.recommendedOutfit.accessories)) {
          formattedRecommendation.items.push(...recommendation.recommendedOutfit.accessories);
        } else if (recommendation.recommendedOutfit.accessories) {
          // Backward compatibility: if it's a single item, convert to array
          formattedRecommendation.items.push(recommendation.recommendedOutfit.accessories);
        }
        
        setRecommendations([formattedRecommendation]);
        setShowOccasionSelector(false);
      } else if (recommendation && recommendation.message) {
        alert(recommendation.message);
      } else {
        alert('No suitable outfit found for this occasion. Try adding more items to your wardrobe!');
      }
    } catch (error) {
      console.error('Outfit recommendation error:', error);
      alert('Failed to generate recommendation. Please try again.');
    }
    
    setLoading(false);
  };

  // Handle refresh button - regenerate with last selected occasion
  const handleRefresh = () => {
    if (lastSelectedOccasion) {
      // If we have a last selected occasion, regenerate with it
      generateAIRecommendation(lastSelectedOccasion);
    } else {
      // If no previous occasion, show the selector modal
      setShowOccasionSelector(true);
    }
  };


  const handleSaveOutfitClick = (outfit) => {
    // Set the outfit to save and show name modal
    setOutfitToSave(outfit);
    setCustomOutfitName(outfit.occasion || '');
    setShowNameModal(true);
  };

  const confirmSaveOutfit = async () => {
    if (!outfitToSave) return;
    
    const finalName = customOutfitName.trim() || outfitToSave.occasion || 'Saved Outfit';
    setShowNameModal(false);
    
    await saveOutfit(outfitToSave, finalName);
    setOutfitToSave(null);
    setCustomOutfitName('');
  };

  const cancelSaveOutfit = () => {
    setShowNameModal(false);
    setOutfitToSave(null);
    setCustomOutfitName('');
  };

  const saveOutfit = async (outfit, customName = null) => {
    console.log('💾 Saving outfit to MongoDB:', outfit);
    
    try {
      // Prepare outfit data for MongoDB
      const outfitToSave = {
        name: customName || outfit.occasion || 'Saved Outfit',
        items: outfit.items || [],
        occasion: outfit.occasion || 'Casual',
        confidence: outfit.confidence || 0.8,
        createdAt: new Date()
      };
      
      console.log('✅ Outfit data prepared for MongoDB:', outfitToSave);
      
      // Save to MongoDB
      const savedOutfit = await apiService.saveOutfit(outfitToSave);
      console.log('🎉 Outfit saved to MongoDB:', savedOutfit);
      
      // Update local state (remove duplicateWarning from saved outfit before storing)
      const { duplicateWarning: _, ...outfitToStore } = savedOutfit;
      setSavedOutfits(prev => {
        const newSavedOutfits = [outfitToStore, ...prev];
        console.log('📋 Updated local state:', newSavedOutfits);
        return newSavedOutfits;
      });
      
    } catch (error) {
      console.error('❌ Error saving outfit to MongoDB:', error);
      
      // Fallback to localStorage
      console.log('📱 Fallback: Saving to localStorage...');
      const outfitToSave = {
        ...outfit,
        name: customName || outfit.occasion || 'Saved Outfit',
        id: Date.now(),
        savedAt: new Date().toISOString()
      };
      
      setSavedOutfits(prev => {
        const newSavedOutfits = [outfitToSave, ...prev];
        // Also save to localStorage as backup
        localStorage.setItem('savedOutfits', JSON.stringify(newSavedOutfits));
        console.log('📱 Saved to localStorage as fallback:', newSavedOutfits);
        return newSavedOutfits;
      });
    }
  };

  const handleDeleteClick = (outfitId) => {
    setOutfitToDelete(outfitId);
    setShowDeleteConfirm(true);
  };

  const toggleWardrobeItemSelection = (item) => {
    if (showItemSelectionModal) {
      // When in selection modal, toggle temp selection
      setTempSelectedItems(prev => {
        const isSelected = prev.some(selected => selected._id === item._id);
        if (isSelected) {
          return prev.filter(selected => selected._id !== item._id);
        } else {
          return [...prev, item];
        }
      });
    } else {
      // When in main modal, remove from outfit
      setSelectedWardrobeItems(prev => prev.filter(selected => selected._id !== item._id));
    }
  };

  const saveCustomOutfit = async () => {
    if (selectedWardrobeItems.length === 0) {
      alert('Please select at least one item for your outfit');
      return;
    }

    const outfitName = customOutfitName.trim() || 'Custom Outfit';
    
    // Validate outfit name length
    if (outfitName.length > 50) {
      alert('Outfit name must be 50 characters or less');
      return;
    }
    
    // Map items to preserve original structure with proper IDs and relative image paths
    // This matches how recommendation items are structured from the backend
    const items = selectedWardrobeItems.map((item) => {
      // Extract relative image path if it's a full URL
      let imagePath = item.image || '';
      if (imagePath && imagePath.includes('/uploads/')) {
        // Extract relative path from full URL
        const uploadsIndex = imagePath.indexOf('/uploads/');
        imagePath = imagePath.substring(uploadsIndex);
      } else if (imagePath && !imagePath.startsWith('/')) {
        // If it's not a full URL and doesn't start with /, ensure it's a relative path
        imagePath = imagePath.startsWith('uploads/') ? `/${imagePath}` : imagePath;
      }
      
      // Preserve the original item structure, matching recommendation items format
      return {
        _id: item._id, // Preserve MongoDB _id
        id: item._id || item.id, // Use _id as id for consistency
        name: item.name || 'Item',
        category: item.category || 'Unknown',
        image: imagePath, // Keep as relative path like recommendation items
        // Preserve other fields that might be needed
        ...(item.style && { style: item.style }),
        ...(item.description && { description: item.description }),
        ...(item.colors && { colors: item.colors })
      };
    });
    
    const outfit = {
      name: outfitName,
      items: items,
      occasion: 'Casual',
      confidence: 1.0,
      createdAt: new Date()
    };

    await saveOutfit(outfit, outfitName);
    setShowCustomOutfitModal(false);
    setShowItemSelectionModal(false);
    setSelectedWardrobeItems([]);
    setSelectedCategory('');
    setSelectedOccasion('');
    setCustomOutfitName('');
  };

  const removeSavedOutfit = async (outfitId) => {
    console.log('🗑️ Removing outfit with ID:', outfitId);
    
    try {
      // Delete from MongoDB
      await apiService.deleteSavedOutfit(outfitId);
      console.log('🎉 Outfit deleted from MongoDB');
      
      // Update local state
      setSavedOutfits(prev => {
        const filtered = prev.filter(outfit => outfit._id !== outfitId && outfit.id !== outfitId);
        console.log('📋 Outfits after removal from MongoDB:', filtered);
        return filtered;
      });
      
    } catch (error) {
      console.error('❌ Error deleting outfit from MongoDB:', error);
      
      // Fallback to localStorage
      console.log('📱 Fallback: Removing from localStorage...');
      setSavedOutfits(prev => {
        const filtered = prev.filter(outfit => outfit.id !== outfitId);
        localStorage.setItem('savedOutfits', JSON.stringify(filtered));
        console.log('📱 Removed from localStorage as fallback:', filtered);
        return filtered;
      });
    }
    
    setShowDeleteConfirm(false);
    setOutfitToDelete(null);
  };

  const startEditingName = (outfit) => {
    setEditingOutfitId(outfit._id || outfit.id);
    setEditingOutfitName(outfit.name || outfit.occasion || '');
  };

  const cancelEditingName = () => {
    setEditingOutfitId(null);
    setEditingOutfitName('');
  };

  const saveOutfitName = async (outfitId) => {
    if (!editingOutfitName.trim()) return;
    
    try {
      // Update outfit name in local state (we'll add API endpoint later if needed)
      setSavedOutfits(prev => 
        prev.map(outfit => 
          (outfit._id === outfitId || outfit.id === outfitId) 
            ? { ...outfit, name: editingOutfitName.trim() }
            : outfit
        )
      );
      
      cancelEditingName();
    } catch (error) {
      console.error('Error updating outfit name:', error);
      cancelEditingName();
    }
  };

  // Function to manually reload saved outfits (for debugging)
  const reloadSavedOutfits = async () => {
    try {
      console.log('🔄 Manually reloading saved outfits from MongoDB...');
      const outfits = await apiService.getSavedOutfits();
      console.log('✅ Manually loaded saved outfits from MongoDB:', outfits);
      setSavedOutfits(outfits);
    } catch (error) {
      console.error('❌ Error manually loading saved outfits from MongoDB:', error);
      
      // Fallback to localStorage
      const saved = localStorage.getItem('savedOutfits');
      console.log('📱 Fallback: Manually reloading from localStorage:', saved);
      if (saved) {
        try {
          const parsedSaved = JSON.parse(saved);
          console.log('✅ Fallback: Manually parsed saved outfits:', parsedSaved);
          setSavedOutfits(parsedSaved);
        } catch (parseError) {
          console.error('❌ Error parsing localStorage fallback:', parseError);
          setSavedOutfits([]);
        }
      } else {
        console.log('📭 No saved outfits found during manual reload');
        setSavedOutfits([]);
      }
    }
  };


  return (
    <div className="outfits-container">
      <div className="outfits-header">
        <h1>Outfit Recommendations</h1>
        <p>Generate New Outfit</p>
      </div>

      <div className="recommendation-actions">
        <button 
          className="action-btn primary-btn"
          onClick={() => setShowOccasionSelector(true)}
          disabled={loading}
        >
          <Sparkles size={20} />
          {loading ? 'Styling...' : 'Style It!'}
        </button>

        <button 
          className="action-btn tertiary-btn"
          onClick={() => setShowSavedModal(true)}
        >
          <Bookmark size={20} />
          View Saved ({savedOutfits.length})
        </button>

        <button 
          className="action-btn secondary-btn"
          onClick={() => {
            setShowCustomOutfitModal(true);
            setSelectedWardrobeItems([]);
            setSelectedCategory('');
            setSelectedOccasion('');
            setCustomOutfitName('');
          }}
        >
          <Plus size={20} />
          Create Your Own
        </button>
      </div>

      {/* Occasion Selector Modal */}
      {showOccasionSelector && (
        <div className="modal-overlay" onClick={() => setShowOccasionSelector(false)}>
          <div className="modal-content occasion-selector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Occasion</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowOccasionSelector(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <p className="occasion-description">
                Choose an occasion to get a personalized outfit recommendation based on your wardrobe, or select Random for a mixed outfit.
              </p>
              
              <div className="occasions-grid">
                {occasionsList.map((occasion) => (
                  <button
                    key={occasion}
                    className="occasion-btn"
                    onClick={() => generateAIRecommendation(occasion)}
                    disabled={loading}
                  >
                    <Calendar size={16} />
                    {occasion}
                  </button>
                ))}
                <button
                  className="occasion-btn random-btn"
                  onClick={() => generateAIRecommendation('random')}
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  Random
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="recommendation-display">
        {recommendations.length > 0 ? (
          <div className="outfit-recommendation">
            <div className="outfit-header">
              <h3>{recommendations[0].occasion === 'random' ? 'Random Outfit' : (recommendations[0].occasion || 'Recommended Outfit')}</h3>
              <div className="outfit-actions">
                {/* Small duplicate warning notification */}
                {duplicateWarning && (
                  <div className="duplicate-warning-small">
                    <AlertCircle size={14} />
                    <span>{duplicateWarning}</span>
                  </div>
                )}
                <button 
                  className="save-btn"
                  onClick={() => handleSaveOutfitClick(recommendations[0])}
                >
                  <Heart size={18} />
                  Save
                </button>
                <button className="refresh-btn" onClick={handleRefresh} disabled={loading}>
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
            
            {/* Human Body Layout Outfit Display */}
            <div className="outfit-body-layout">
              {/* Group items by category */}
              {(() => {
                const groupedItems = {
                  top: null,
                  bottom: null,
                  shoes: null,
                  outerwear: null,
                  accessories: []
                };

                recommendations[0].items.forEach(item => {
                  const category = (item.category || '').toUpperCase();
                  const itemNameUpper = (item.name || '').toUpperCase();
                  
                  // Check for outerwear first (by category OR if categorized as tops but name suggests outerwear)
                  const isOuterwearByCategory = ['OUTERWEAR', 'JACKET', 'COAT', 'JACKETS'].includes(category) || 
                                                category.includes('JACKET') || category.includes('COAT') || category.includes('OUTERWEAR');
                  // Check item name for all outerwear types
                  const outerwearKeywords = [
                    'JACKET', 'COAT', 'BLAZER', 'WINDBREAKER', 
                    'PARKA', 'BOMBER', 'TRENCH', 'RAINCOAT', 'RAIN COAT',
                    'VEST', 'SWEATER COAT', 'SWEATER JACKET'
                  ];
                  const isOuterwearByName = (category === 'TOPS' || category === 'TOP') && 
                                           outerwearKeywords.some(keyword => itemNameUpper.includes(keyword));
                  
                  if (isOuterwearByCategory || isOuterwearByName) {
                    if (!groupedItems.outerwear) groupedItems.outerwear = item;
                  } else if (['TOPS', 'TOP'].includes(category)) {
                    if (!groupedItems.top) groupedItems.top = item;
                  } else if (['BOTTOMS', 'BOTTOM'].includes(category)) {
                    if (!groupedItems.bottom) groupedItems.bottom = item;
                  } else if (['SHOES', 'SHOE', 'FOOTWEAR'].includes(category)) {
                    if (!groupedItems.shoes) groupedItems.shoes = item;
                  } else if (['ACCESSORIES', 'ACCESSORY'].includes(category)) {
                    groupedItems.accessories.push(item);
                  }
                });

                return (
                  <div className="outfit-body-container">
                    {/* First Row: Outerwear (if exists) and Top */}
                    {groupedItems.outerwear && (
                      <div className="outfit-item-wrapper outfit-outerwear" onClick={() => setSelectedItemDetail(groupedItems.outerwear)}>
                        <div className="outfit-item-body-layout">
                      <img 
                            src={groupedItems.outerwear.image && groupedItems.outerwear.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${groupedItems.outerwear.image}` : groupedItems.outerwear.image} 
                            alt="Outerwear" 
                            onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                          />
                          <button className="item-info-btn" title="View details">
                            <Info size={14} />
                          </button>
                    </div>
                      </div>
                    )}

                    {groupedItems.top && (
                      <div className="outfit-item-wrapper outfit-top" onClick={() => setSelectedItemDetail(groupedItems.top)}>
                        <div className="outfit-item-body-layout">
                          <img 
                            src={groupedItems.top.image && groupedItems.top.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${groupedItems.top.image}` : groupedItems.top.image} 
                            alt="Top" 
                            onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                          />
                          <button className="item-info-btn" title="View details">
                            <Info size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Second Row: Bottom and Shoes */}
                    {groupedItems.bottom && (
                      <div className="outfit-item-wrapper outfit-bottom" onClick={() => setSelectedItemDetail(groupedItems.bottom)}>
                        <div className="outfit-item-body-layout">
                          <img 
                            src={groupedItems.bottom.image && groupedItems.bottom.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${groupedItems.bottom.image}` : groupedItems.bottom.image} 
                            alt="Bottom" 
                            onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                          />
                          <button className="item-info-btn" title="View details">
                            <Info size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {groupedItems.shoes && (
                      <div className="outfit-item-wrapper outfit-shoes" onClick={() => setSelectedItemDetail(groupedItems.shoes)}>
                        <div className="outfit-item-body-layout">
                          <img 
                            src={groupedItems.shoes.image && groupedItems.shoes.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${groupedItems.shoes.image}` : groupedItems.shoes.image} 
                            alt="Shoes" 
                            onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                          />
                          <button className="item-info-btn" title="View details">
                            <Info size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Third Row: Accessories */}
                    {groupedItems.accessories.length > 0 && (
                      <>
                        {groupedItems.accessories.map((item, idx) => (
                          <div 
                            key={idx}
                            className="outfit-item-wrapper outfit-accessory-item"
                            onClick={() => setSelectedItemDetail(item)}
                          >
                            <div className="outfit-item-body-layout outfit-accessory-item-layout">
                              <img 
                                src={item.image && item.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${item.image}` : item.image} 
                                alt="Accessory" 
                                onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                              />
                              <button className="item-info-btn" title="View details">
                                <Info size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="empty-recommendation">
            <div className="empty-icon">
              <Sparkles size={64} />
            </div>
            <h3>No outfit generated yet</h3>
            <p>Click "Style It!" to generate your outfit!</p>
          </div>
        )}
      </div>

      {/* Saved Outfits Modal */}
      {showSavedModal && (
        <div className="modal-overlay" onClick={() => setShowSavedModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Saved Outfits ({savedOutfits.length})</h2>
              <div className="modal-header-actions">
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowSavedModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="modal-body">
              {savedOutfits.length === 0 ? (
                <div className="empty-saved-modal">
                  <div className="empty-icon">
                    <Heart size={64} />
                  </div>
                  <h3>No saved outfits yet</h3>
                  <p>Save your favorite outfits to see them here!</p>
                </div>
              ) : (
                <div className="saved-outfits-grid-modal">
                  {savedOutfits.map((outfit) => {
                    const outfitId = outfit._id || outfit.id; // Handle both MongoDB _id and localStorage id
                    const savedDate = outfit.createdAt || outfit.savedAt; // Handle both MongoDB createdAt and localStorage savedAt
                    const occasion = outfit.occasion || outfit.name || 'Saved Outfit';
                    
                    const displayName = outfit.name || occasion;
                    
                    return (
                      <div 
                        key={outfitId} 
                        className="saved-outfit-modal"
                        onClick={() => {
                          setSelectedOutfitToEdit(outfit);
                          setShowOutfitEditModal(true);
                        }}
                      >
                        <div className="saved-outfit-top">
                          <h4 className="outfit-name-display">{displayName}</h4>
                        </div>
                        
                        <div className="saved-items-row">
                          {outfit.items && outfit.items.map((item, index) => (
                            <div key={index} className="saved-item">
                              <img 
                                src={item.image && item.image.startsWith('/uploads/') 
                                  ? `${BACKEND_BASE_URL}${item.image}` 
                                  : item.image || '/placeholder-image.png'} 
                                alt={item.name || 'Outfit item'} 
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div className="saved-outfit-footer">
                          <span className="saved-date">
                            Saved {(() => {
                              const date = new Date(savedDate);
                              const day = date.getDate();
                              const month = date.toLocaleDateString('en-US', { month: 'short' });
                              const year = date.getFullYear();
                              return `${day} ${month} ${year}`;
                            })()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                          )}
                        </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => {
          setShowDeleteConfirm(false);
          setOutfitToDelete(null);
        }}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
                        </div>
            <h3 className="delete-confirm-title">Delete Outfit?</h3>
            <p className="delete-confirm-message">
              Are you sure you want to delete this outfit? This action cannot be undone.
            </p>
            <div className="delete-confirm-buttons">
              <button 
                className="delete-confirm-cancel"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setOutfitToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-delete"
                onClick={() => {
                  if (outfitToDelete) {
                    removeSavedOutfit(outfitToDelete);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Outfit Modal */}
      {showOutfitEditModal && selectedOutfitToEdit && (
        <div className="modal-overlay" onClick={() => {
          setShowOutfitEditModal(false);
          setSelectedOutfitToEdit(null);
          cancelEditingName();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Outfit</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowOutfitEditModal(false);
                  setSelectedOutfitToEdit(null);
                  cancelEditingName();
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body edit-outfit-modal-body">
              <div className="edit-outfit-split">
                {/* Left Side - Outfit Name */}
                <div className="edit-outfit-left">
                  <div className="edit-outfit-section">
                    <h3 className="edit-outfit-title">Outfit Name</h3>
                    
                    {editingOutfitId === (selectedOutfitToEdit._id || selectedOutfitToEdit.id) ? (
                      <div className="edit-outfit-name-input-wrapper">
                        <input
                          type="text"
                          value={editingOutfitName}
                          onChange={(e) => setEditingOutfitName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveOutfitName(selectedOutfitToEdit._id || selectedOutfitToEdit.id);
                              setShowOutfitEditModal(false);
                              setSelectedOutfitToEdit(null);
                            } else if (e.key === 'Escape') {
                              cancelEditingName();
                            }
                          }}
                          className="edit-outfit-name-input"
                          autoFocus
                        />
                        <div className="edit-outfit-name-actions">
                          <button 
                            className="btn-save-name"
                            onClick={() => {
                              saveOutfitName(selectedOutfitToEdit._id || selectedOutfitToEdit.id);
                              setShowOutfitEditModal(false);
                              setSelectedOutfitToEdit(null);
                            }}
                          >
                            Save
                          </button>
                          <button 
                            className="btn-cancel-name"
                            onClick={cancelEditingName}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p 
                        className="edit-outfit-name-display"
                        onClick={() => startEditingName(selectedOutfitToEdit)}
                      >
                        {selectedOutfitToEdit.name || selectedOutfitToEdit.occasion || 'Saved Outfit'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="edit-outfit-divider"></div>

                {/* Right Side - Outfit Items */}
                <div className="edit-outfit-right">
                  {selectedOutfitToEdit.items && selectedOutfitToEdit.items.length > 0 && (
                    <div className="edit-outfit-section">
                      <h3 className="edit-outfit-title">
                        Outfit Items <span className="edit-outfit-count">({selectedOutfitToEdit.items.length})</span>
                      </h3>
                      <div className="edit-outfit-items-grid">
                        {selectedOutfitToEdit.items.map((item, index) => {
                          // Find full item data from wardrobe if available (to get occasionTags, createdAt, etc.)
                          const fullItem = item._id 
                            ? wardrobeItems.find(wardrobeItem => 
                                wardrobeItem._id === item._id || 
                                wardrobeItem._id?.toString() === item._id?.toString() ||
                                wardrobeItem.id === item._id ||
                                wardrobeItem.id?.toString() === item._id?.toString()
                              )
                            : null;
                          // Use full item data if found, otherwise use the item from outfit
                          // Merge to preserve image from outfit item (might be processed differently)
                          const itemToShow = fullItem ? { ...fullItem, image: item.image || fullItem.image } : item;
                          
                          return (
                            <div 
                              key={index} 
                              className="edit-outfit-item" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItemDetail(itemToShow);
                              }}
                            >
                              <img 
                                src={item.image && item.image.startsWith('/uploads/') 
                                  ? `${BACKEND_BASE_URL}${item.image}` 
                                  : item.image || '/placeholder-image.png'} 
                                alt={item.name || 'Outfit item'} 
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowOutfitEditModal(false);
                  setSelectedOutfitToEdit(null);
                  cancelEditingName();
                }}
              >
                Close
              </button>
              <button 
                className="delete-outfit-btn"
                onClick={() => {
                  const outfitId = selectedOutfitToEdit._id || selectedOutfitToEdit.id;
                  setShowOutfitEditModal(false);
                  setSelectedOutfitToEdit(null);
                  setOutfitToDelete(outfitId);
                  setShowDeleteConfirm(true);
                }}
                style={{ background: '#ef4444', color: 'white' }}
              >
                <Trash2 size={16} />
                Delete Outfit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Name Modal */}
      {showNameModal && (
        <div className="modal-overlay" onClick={cancelSaveOutfit}>
          <div className="modal-content name-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Name Your Outfit</h2>
              <button 
                className="modal-close-btn"
                onClick={cancelSaveOutfit}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <p className="name-modal-description">
                Give your outfit a memorable name like "Wedding Outfit", "Birthday Dad Outfit", etc.
              </p>
              
              <div className="form-group">
                <label>Outfit Name</label>
                <input
                  type="text"
                  placeholder="e.g., Wedding Outfit, Birthday Dad Outfit, Date Night"
                  value={customOutfitName}
                  onChange={(e) => setCustomOutfitName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      confirmSaveOutfit();
                    }
                  }}
                  className="form-input"
                  autoFocus
                />
                <small className="form-hint">
                  Leave empty to use occasion name: {outfitToSave?.occasion || 'Casual'}
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={cancelSaveOutfit}>
                Cancel
              </button>
              <button className="btn-primary" onClick={confirmSaveOutfit}>
                Save Outfit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Outfit Creation Modal */}
      {showCustomOutfitModal && (
        <div className="modal-overlay" onClick={() => setShowCustomOutfitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Create Your Own</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowCustomOutfitModal(false);
                  setSelectedWardrobeItems([]);
                  setSelectedCategory('');
                  setSelectedOccasion('');
                  setCustomOutfitName('');
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Main Content Area - Empty space for selected items */}
            <div style={{ 
              flex: '1 1 auto',
              padding: '20px', 
              background: '#f9fafb',
              minHeight: '300px',
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: selectedWardrobeItems.length === 0 ? 'center' : 'flex-start',
              alignItems: selectedWardrobeItems.length === 0 ? 'center' : 'stretch',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {selectedWardrobeItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                  <Shirt size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '15px', margin: 0 }}>Your outfit will appear here</p>
                  <p style={{ fontSize: '13px', margin: '8px 0 0 0', opacity: 0.7 }}>Click "Add" to select items</p>
                </div>
              ) : (
                <div 
                  className="selected-items-grid"
                  style={{ 
                    width: '100%'
                  }}>
                  {selectedWardrobeItems.map((item) => {
                    const isFilename = item.name && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.name);
                    const displayName = isFilename ? item.category || 'Item' : (item.name || item.category || 'Item');
                    return (
                      <div
                        key={item._id || item.id}
                        style={{
                          position: 'relative',
                          background: '#fff',
                          borderRadius: '12px',
                          padding: '8px',
                          border: '1px solid #e5e7eb',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                        onClick={() => toggleWardrobeItemSelection(item)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToRemove(item);
                            setShowRemoveItemConfirm(true);
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '24px',
                            height: '24px',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '50%',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '14px',
                            zIndex: 10
                          }}
                        >
                          <X size={14} />
                        </button>
                        <div style={{
                          width: '100%',
                          maxWidth: '100%',
                          aspectRatio: '1',
                          background: '#f9fafb',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          marginBottom: '8px'
                        }}>
                          <img
                            src={item.image && item.image.startsWith('/uploads/') 
                              ? `${BACKEND_BASE_URL}${item.image}` 
                              : item.image || '/placeholder-image.png'}
                            alt={displayName}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              e.target.src = '/placeholder-image.png';
                            }}
                          />
                        </div>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          color: '#111827',
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {displayName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Section - Add Button and Details */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
              {/* Outfit Details */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  Outfit Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., My Outfit"
                  value={customOutfitName}
                  onChange={(e) => setCustomOutfitName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: '#fff'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    if (selectedWardrobeItems.length > 0) {
                      setShowClearAllConfirm(true);
                    } else {
                      setSelectedCategory('');
                      setSelectedWardrobeItems([]);
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    border: selectedWardrobeItems.length > 0 ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: selectedWardrobeItems.length > 0 ? '#ef4444' : '#fff',
                    color: selectedWardrobeItems.length > 0 ? '#fff' : '#374151',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    flex: 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {selectedWardrobeItems.length > 0 ? 'Clear All' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    setShowItemSelectionModal(true);
                    setTempSelectedItems([]);
                    setSelectedCategory('');
                  }}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#8B9DC3',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  + Add
                </button>
                <button
                  onClick={saveCustomOutfit}
                  disabled={selectedWardrobeItems.length === 0}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: selectedWardrobeItems.length > 0 ? '#10b981' : '#d1d5db',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: selectedWardrobeItems.length > 0 ? 'pointer' : 'not-allowed',
                    flex: 1
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Selection Modal - Appears when Add is clicked */}
      {showItemSelectionModal && (
        <div className="modal-overlay" style={{ zIndex: 2001 }} onClick={() => setSelectedCategory('')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '85vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>Select items</h2>
              <button 
                className="modal-close-btn"
                onClick={() => {
                  setShowItemSelectionModal(false);
                  setTempSelectedItems([]);
                  setSelectedCategory('');
                  setSelectedOccasionFilter('');
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Category and Occasion Filters */}
              <div style={{ 
                marginBottom: '16px', 
                padding: '16px', 
                background: '#f9fafb', 
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                flexShrink: 0
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px',
                  marginBottom: '12px'
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151' 
                    }}>
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '12px',
                        paddingRight: '36px'
                      }}
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => {
                        const catId = (cat.id || cat._id).toLowerCase();
                        return (
                          <option key={cat.id || cat._id} value={catId}>
                            {cat.label || cat.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151' 
                    }}>
                      Occasion
                    </label>
                    <select
                      value={selectedOccasionFilter}
                      onChange={(e) => setSelectedOccasionFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '12px',
                        paddingRight: '36px'
                      }}
                    >
                      <option value="">All Occasions</option>
                      {occasions.map((occasion) => (
                        <option key={occasion.id || occasion._id} value={occasion.id || occasion._id || occasion.label?.toLowerCase() || occasion.name?.toLowerCase()}>
                          {occasion.label || occasion.name || occasion}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {(selectedCategory || selectedOccasionFilter) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedOccasionFilter('');
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#ffffff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#6b7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Filtered Items Count */}
              {(() => {
                const filteredItems = wardrobeItems.filter(item => {
                  // Category filter
                  if (selectedCategory && (!item.category || item.category.toLowerCase() !== selectedCategory.toLowerCase())) {
                    return false;
                  }
                  // Occasion filter - match the Wardrobe page logic exactly
                  if (selectedOccasionFilter) {
                    let matchesOccasion = false;
                    if (item.occasionTags) {
                      if (Array.isArray(item.occasionTags)) {
                        // Check if any element in the array contains the selected occasion
                        matchesOccasion = item.occasionTags.some(tag => {
                          if (typeof tag === 'string' && tag.includes(',')) {
                            // If tag contains commas, split and check each part
                            return tag.split(',').map(t => t.trim()).includes(selectedOccasionFilter);
                          }
                          // Compare directly (occasionTags are stored as lowercase, selectedOccasionFilter is now the ID which is also lowercase)
                          return tag === selectedOccasionFilter;
                        });
                      } else if (typeof item.occasionTags === 'string') {
                        // If it's a string, split by comma and check
                        matchesOccasion = item.occasionTags.split(',').map(tag => tag.trim()).includes(selectedOccasionFilter);
                      }
                    }
                    if (!matchesOccasion) {
                      return false;
                    }
                  }
                  return true;
                });

                return (
                  <>
                    {tempSelectedItems.length > 0 && (
                      <div style={{ 
                        marginBottom: '16px', 
                        padding: '12px', 
                        background: '#e0e7ff', 
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#8B9DC3',
                        fontWeight: '500'
                      }}>
                        {tempSelectedItems.length} item{tempSelectedItems.length > 1 ? 's' : ''} selected
                      </div>
                    )}
                    {(selectedCategory || selectedOccasionFilter) && (
                      <div style={{ 
                        marginBottom: '16px', 
                        padding: '10px 12px', 
                        background: '#f0f9ff', 
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#0369a1',
                        fontWeight: '500'
                      }}>
                        Showing {filteredItems.length} of {wardrobeItems.length} items
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Items Grid */}
              {wardrobeItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <Shirt size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No wardrobe items found. Upload some items first!</p>
                </div>
              ) : (
                <div className="wardrobe-items-selection-grid" style={{ maxHeight: 'none', overflowY: 'auto', padding: '4px', gridTemplateColumns: 'repeat(4, 1fr)', flex: 1, minHeight: 0 }} id="style-it-your-own-grid">
                  {(() => {
                    // Calculate filtered items (same logic as stats display)
                    const filteredItems = wardrobeItems.filter(item => {
                      // Category filter
                      if (selectedCategory && (!item.category || item.category.toLowerCase() !== selectedCategory.toLowerCase())) {
                        return false;
                      }
                      // Occasion filter - match the Wardrobe page logic exactly
                      if (selectedOccasionFilter) {
                        let matchesOccasion = false;
                        if (item.occasionTags) {
                          if (Array.isArray(item.occasionTags)) {
                            // Check if any element in the array contains the selected occasion
                            matchesOccasion = item.occasionTags.some(tag => {
                              if (typeof tag === 'string' && tag.includes(',')) {
                                // If tag contains commas, split and check each part
                                return tag.split(',').map(t => t.trim()).includes(selectedOccasionFilter);
                              }
                              // Compare directly (occasionTags are stored as lowercase, selectedOccasionFilter is now the ID which is also lowercase)
                              return tag === selectedOccasionFilter;
                            });
                          } else if (typeof item.occasionTags === 'string') {
                            // If it's a string, split by comma and check
                            matchesOccasion = item.occasionTags.split(',').map(tag => tag.trim()).includes(selectedOccasionFilter);
                          }
                        }
                        if (!matchesOccasion) {
                          return false;
                        }
                      }
                      return true;
                    });

                    if (filteredItems.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666', gridColumn: '1 / -1' }}>
                          <Shirt size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                          <p>No items match your filters.</p>
                          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                            Try adjusting your category or occasion filters.
                          </p>
                        </div>
                      );
                    }

                    return filteredItems.map((item) => {
                      const isSelected = tempSelectedItems.some(selected => selected._id === item._id);
                      const isFilename = item.name && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.name);
                      const displayName = isFilename ? item.category || 'Item' : (item.name || item.category || 'Item');
                      
                      return (
                        <div
                          key={item._id || item.id}
                          className="wardrobe-selection-item"
                          onClick={() => toggleWardrobeItemSelection(item)}
                          style={{
                            border: isSelected ? '3px solid #8B9DC3' : '2px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            background: isSelected ? '#e0e7ff' : '#fff',
                            position: 'relative',
                            transform: isSelected ? 'scale(0.98)' : 'scale(1)',
                            boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#8B9DC3';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(79, 70, 229, 0.2)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                            }
                          }}
                        >
                          <div style={{
                            width: '100%',
                            aspectRatio: '1',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            marginBottom: '8px',
                            position: 'relative'
                          }}>
                            <img
                              src={item.image && item.image.startsWith('/uploads/') 
                                ? `${BACKEND_BASE_URL}${item.image}` 
                                : item.image || '/placeholder-image.png'}
                              alt={displayName}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                              }}
                              onError={(e) => {
                                e.target.src = '/placeholder-image.png';
                              }}
                            />
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            {!isFilename && displayName && (
                              <p style={{ 
                                margin: 0, 
                                fontSize: '13px', 
                                fontWeight: '600', 
                                color: '#111827',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {displayName}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0, background: '#fff' }}>
              <button
                onClick={() => {
                  setShowItemSelectionModal(false);
                  setTempSelectedItems([]);
                  setSelectedCategory('');
                  setSelectedOccasionFilter('');
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add temp selected items to the outfit
                  setSelectedWardrobeItems(prev => {
                    const newItems = tempSelectedItems.filter(temp => 
                      !prev.some(existing => existing._id === temp._id)
                    );
                    return [...prev, ...newItems];
                  });
                  setShowItemSelectionModal(false);
                  setTempSelectedItems([]);
                  setSelectedCategory('');
                  setSelectedOccasionFilter('');
                }}
                disabled={tempSelectedItems.length === 0}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: tempSelectedItems.length > 0 ? '#8B9DC3' : '#d1d5db',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: tempSelectedItems.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Select ({tempSelectedItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearAllConfirm(false)}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <h3 className="delete-confirm-title">Clear All Items?</h3>
            <p className="delete-confirm-message">
              Are you sure you want to remove all items from this outfit? This action cannot be undone.
            </p>
            <div className="delete-confirm-buttons">
              <button 
                className="delete-confirm-cancel"
                onClick={() => setShowClearAllConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-delete"
                onClick={() => {
                  setSelectedWardrobeItems([]);
                  setSelectedCategory('');
                  setShowClearAllConfirm(false);
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Item Confirmation Modal */}
      {showRemoveItemConfirm && itemToRemove && (
        <div className="modal-overlay" onClick={() => {
          setShowRemoveItemConfirm(false);
          setItemToRemove(null);
        }}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </div>
            <h3 className="delete-confirm-title">Remove Item?</h3>
            <p className="delete-confirm-message">
              Are you sure you want to remove this item from your outfit?
            </p>
            <div className="delete-confirm-buttons">
              <button 
                className="delete-confirm-cancel"
                onClick={() => {
                  setShowRemoveItemConfirm(false);
                  setItemToRemove(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-delete"
                onClick={() => {
                  toggleWardrobeItemSelection(itemToRemove);
                  setShowRemoveItemConfirm(false);
                  setItemToRemove(null);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal - Moved to root level to work from anywhere */}
      {selectedItemDetail && (
        <div className="item-detail-modal-overlay" onClick={() => setSelectedItemDetail(null)}>
          <div className="item-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="item-detail-header">
              <h3>Item Details</h3>
              <button className="close-detail-btn" onClick={() => setSelectedItemDetail(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="item-detail-content">
              <div className="item-detail-image">
                <img 
                  src={selectedItemDetail.image && selectedItemDetail.image.startsWith('/uploads/') ? `${BACKEND_BASE_URL}${selectedItemDetail.image}` : selectedItemDetail.image} 
                  alt="Item" 
                  onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                />
              </div>
              <div className="item-detail-info">
                <div className="detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{selectedItemDetail.category || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Occasions:</span>
                  <span className="detail-value">
                    {(() => {
                      if (!selectedItemDetail.occasionTags || 
                          (Array.isArray(selectedItemDetail.occasionTags) && selectedItemDetail.occasionTags.length === 0)) {
                        return 'N/A';
                      }
                      
                      let itemOccasions = [];
                      if (Array.isArray(selectedItemDetail.occasionTags)) {
                        itemOccasions = selectedItemDetail.occasionTags.flatMap(tag => {
                          if (typeof tag === 'string' && tag.includes(',')) {
                            return tag.split(',').map(t => t.trim());
                          }
                          return tag;
                        });
                      } else if (typeof selectedItemDetail.occasionTags === 'string') {
                        itemOccasions = selectedItemDetail.occasionTags.split(',').map(tag => tag.trim());
                      }
                      
                      // Match occasion IDs/labels with loaded occasions
                      const validOccasionIds = occasions.filter(occ => occ.id !== 'all').map(occ => occ.id.toLowerCase());
                      const validOccasionLabels = occasions.filter(occ => occ.id !== 'all').map(occ => occ.label.toLowerCase());
                      
                      const matchedOccasions = itemOccasions.map(occ => {
                        const occLower = occ.toLowerCase();
                        const matched = occasions.find(o => 
                          o.id.toLowerCase() === occLower || 
                          o.label.toLowerCase() === occLower
                        );
                        return matched ? matched.label : occ;
                      }).filter(Boolean);
                      
                      return matchedOccasions.length > 0 ? matchedOccasions.join(', ') : 'N/A';
                    })()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date Uploaded:</span>
                  <span className="detail-value">
                    {selectedItemDetail.createdAt 
                      ? (() => {
                          const date = new Date(selectedItemDetail.createdAt);
                          const day = date.getDate();
                          const month = date.toLocaleDateString('en-US', { month: 'short' });
                          const year = date.getFullYear();
                          return `${day} ${month} ${year}`;
                        })()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Outfits;
