import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Edit2, X, Upload, Shirt, Plus, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Planner.css';
import { apiService } from '../services/ApiService';

// Get backend base URL for serving static files (uploads)
import { getBackendBaseUrl } from '../utils/getBackendUrl';

// Auto-detect backend URL based on current hostname
const BACKEND_BASE_URL = getBackendBaseUrl();

// Helper function to process image URLs (moved outside component to prevent recreation)
const processImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  // If it's already a full URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Replace localhost with current hostname if needed
    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      return imageUrl.replace(/https?:\/\/[^/]+/, `${protocol}//${hostname}:5000`);
    }
    return imageUrl;
  }
  // If it's a relative path starting with /uploads/, convert to full URL
  if (imageUrl.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${imageUrl}`;
  }
  return imageUrl;
};

// Helper function to format date as YYYY-MM-DD in local time (avoid timezone issues)
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get display name (hide filenames)
const getDisplayName = (name, category) => {
  if (!name) return category || 'Item';
  // Check if name is a filename (contains file extension)
  const isFilename = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);
  return isFilename ? (category || 'Item') : name;
};

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plannedOutfits, setPlannedOutfits] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [newOutfit, setNewOutfit] = useState({
    name: '',
    occasion: '',
    items: [],
    notes: ''
  });
  const [showSavedOutfitsModal, setShowSavedOutfitsModal] = useState(false);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [showWardrobeItemsModal, setShowWardrobeItemsModal] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [selectedWardrobeItems, setSelectedWardrobeItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [showItemDeleteConfirm, setShowItemDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showClearOutfitConfirm, setShowClearOutfitConfirm] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // Duplicate warning message

  // Load planned outfits from MongoDB
  useEffect(() => {
    const loadPlannedOutfits = async () => {
      try {
        const plannedOutfitsData = await apiService.getPlannedOutfits();
        console.log('📅 Loaded planned outfits from MongoDB:', plannedOutfitsData);
        
        // Convert array to object keyed by date
        const outfitsByDate = {};
        plannedOutfitsData.forEach(plannedOutfit => {
          // Parse date correctly - extract date components in local time to avoid timezone issues
          const dateValue = plannedOutfit.date;
          let dateObj;
          
          if (typeof dateValue === 'string') {
            // Extract date part from ISO string (YYYY-MM-DDTHH:mm:ss.sssZ -> YYYY-MM-DD)
            const datePart = dateValue.split('T')[0];
            if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
              const [year, month, day] = datePart.split('-').map(Number);
              // Create date using local time (month is 0-indexed)
              dateObj = new Date(year, month - 1, day);
            } else {
              // Fallback: parse as date and use local components
              const parsed = new Date(dateValue);
              dateObj = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
            }
          } else if (dateValue instanceof Date) {
            // If it's already a Date object, use local date components (ignore time)
            dateObj = new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
          } else {
            // Fallback: create date from value and use local components
            const parsed = new Date(dateValue);
            dateObj = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
          }
          
          const dateKey = formatDateKey(dateObj);
          
          // Get items - handle both direct items and referenced outfit items
          let items = [];
          if (plannedOutfit.items && Array.isArray(plannedOutfit.items) && plannedOutfit.items.length > 0) {
            // Items stored directly in plannedOutfit
            items = plannedOutfit.items.map((item, index) => ({
              id: item.id || `item-${dateKey}-${index}`,
              _id: item._id || item.id || null, // Preserve _id for duplicate detection
              name: getDisplayName(item.name, item.category),
              image: processImageUrl(item.image),
              category: item.category || 'Unknown'
            }));
          } else if (plannedOutfit.outfit && plannedOutfit.outfit.items && Array.isArray(plannedOutfit.outfit.items)) {
            // Items from referenced outfit
            items = plannedOutfit.outfit.items.map((item, index) => ({
              id: item.id || `item-${dateKey}-${index}`,
              _id: item._id || item.id || null, // Preserve _id for duplicate detection
              name: getDisplayName(item.name, item.category),
              image: processImageUrl(item.image),
              category: item.category || 'Unknown'
            }));
          }
          
          // Process outfit name to hide filenames
          const outfitName = plannedOutfit.name || plannedOutfit.outfit?.name || '';
          const processedOutfitName = getDisplayName(outfitName, plannedOutfit.occasion || plannedOutfit.outfit?.occasion);
          
          const outfitData = {
            _id: plannedOutfit._id, // Store MongoDB _id for deletion
            name: processedOutfitName,
            occasion: plannedOutfit.occasion || plannedOutfit.outfit?.occasion || '',
            items: items,
            notes: plannedOutfit.notes || ''
          };
          // Only store if there are items
          if (items.length > 0) {
            outfitsByDate[dateKey] = outfitData;
          }
        });
        
        setPlannedOutfits(outfitsByDate);
        
        // Also save to localStorage as backup
        localStorage.setItem('plannedOutfits', JSON.stringify(outfitsByDate));
      } catch (error) {
        console.error('Error loading planned outfits from MongoDB:', error);
        // Fallback to localStorage
    const saved = localStorage.getItem('plannedOutfits');
    if (saved) {
          try {
      setPlannedOutfits(JSON.parse(saved));
          } catch (e) {
            console.error('Error parsing localStorage data:', e);
          }
        }
    }
    };
    loadPlannedOutfits();
  }, []);

  // Load saved outfits from MongoDB
  useEffect(() => {
    const loadSavedOutfits = async () => {
      try {
        const outfits = await apiService.getSavedOutfits();
        setSavedOutfits(outfits);
      } catch (error) {
        console.error('Error loading saved outfits:', error);
      }
    };
    loadSavedOutfits();
  }, []);

  // Load wardrobe items, categories, and occasions from MongoDB
  useEffect(() => {
    const loadData = async () => {
      try {
        const [items, categoriesData, occasionsData] = await Promise.all([
          apiService.getWardrobeItems(),
          apiService.getCategories(),
          apiService.getOccasions()
        ]);
        setWardrobeItems(items);
        setCategories(categoriesData);
        setOccasions(occasionsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Generate week dates - memoized to prevent unnecessary recalculations
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      dates.push(day);
    }
    return dates;
  }, [selectedDate]);

  const getDateKey = (date) => {
    return formatDateKey(date);
  };

  const getOutfitForDate = useCallback((date) => {
    const dateKey = formatDateKey(date);
    const outfit = plannedOutfits[dateKey];
    // Only return outfit if it has items
    if (outfit && outfit.items && outfit.items.length > 0) {
      return outfit;
    }
    return null;
  }, [plannedOutfits]);

  // Function to check if a date has a planned outfit for highlighting
  const dayHasOutfit = useCallback((date) => {
    const outfit = getOutfitForDate(date);
    return outfit !== null;
  }, [getOutfitForDate]);

  // Function to apply className to dates with outfits in DatePicker
  const dayClassName = useCallback((date) => {
    return dayHasOutfit(date) ? 'has-planned-outfit' : '';
  }, [dayHasOutfit]);

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatDayNumber = (date) => {
    return date.getDate();
  };

  const formatMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Get dynamic week label based on selected date - memoized
  const weekLabel = useMemo(() => {
    const today = new Date();
    const selectedWeekStart = weekDates[0];
    const todayWeekStart = (() => {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return start;
    })();
    
    // Check if it's the same week as today
    if (selectedWeekStart.toDateString() === todayWeekStart.toDateString()) {
      return 'This Week';
    }
    
    // Check if it's next week
    const nextWeekStart = new Date(todayWeekStart);
    nextWeekStart.setDate(todayWeekStart.getDate() + 7);
    if (selectedWeekStart.toDateString() === nextWeekStart.toDateString()) {
      return 'Next Week';
    }
    
    // Check if it's last week
    const lastWeekStart = new Date(todayWeekStart);
    lastWeekStart.setDate(todayWeekStart.getDate() - 7);
    if (selectedWeekStart.toDateString() === lastWeekStart.toDateString()) {
      return 'Last Week';
    }
    
    // For other weeks, show the date range
    const weekEnd = weekDates[6];
    const startMonth = formatMonthName(selectedWeekStart);
    const endMonth = formatMonthName(weekEnd);
    
    if (startMonth === endMonth) {
      return `${startMonth} ${selectedWeekStart.getDate()}-${weekEnd.getDate()}`;
    } else {
      return `${startMonth} ${selectedWeekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}`;
    }
  }, [weekDates]);

  const openModal = (date) => {
    setSelectedDay(date);
    const dateKey = getDateKey(date);
    const existingOutfit = plannedOutfits[dateKey];
    
    if (existingOutfit && existingOutfit.items && existingOutfit.items.length > 0) {
      setNewOutfit(existingOutfit);
    } else {
      setNewOutfit({
        name: '',
        occasion: '',
        items: [],
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDay(null);
    setNewOutfit({
      name: '',
      occasion: '',
      items: [],
      notes: ''
    });
  };

  const saveOutfit = async () => {
    if (!selectedDay) return;
    
    const dateKey = getDateKey(selectedDay);
    const existingOutfit = plannedOutfits[dateKey];
    
    // Validate outfit name length if provided
    if (newOutfit.name && newOutfit.name.trim().length > 50) {
      alert('Outfit name must be 50 characters or less');
      return;
    }
    
    // Check if outfit is empty (no items)
    if (!newOutfit.items || newOutfit.items.length === 0) {
      // If there's an existing outfit, delete it
      if (existingOutfit && existingOutfit._id) {
        try {
          await apiService.removePlannedOutfit(existingOutfit._id);
          console.log('🗑️ Deleted empty planned outfit');
        } catch (error) {
          console.error('Error deleting planned outfit:', error);
        }
      }
      
      // Remove from local state
      setPlannedOutfits(prev => {
        const updated = { ...prev };
        delete updated[dateKey];
        localStorage.setItem('plannedOutfits', JSON.stringify(updated));
        return updated;
      });
      
      closeModal();
      return;
    }
    
    try {
      // Save to MongoDB
      const plannedOutfitData = {
        date: selectedDay,
        name: newOutfit.name || '',
        occasion: newOutfit.occasion || '',
        items: newOutfit.items || [],
        notes: newOutfit.notes || ''
      };
      
      console.log('💾 Saving planned outfit:', plannedOutfitData);
      console.log('💾 Items being saved:', newOutfit.items);
      console.log('💾 Items count:', newOutfit.items?.length);
      
      // Save/update planned outfit (backend handles update if exists for same date)
      const saved = await apiService.planOutfit(plannedOutfitData);
      console.log('✅ Saved planned outfit response:', saved);
      console.log('✅ Saved items:', saved.items);
      
      // Check for duplicate warning in response
      if (saved && saved.duplicateWarning && saved.duplicateWarning.isDuplicate) {
        setDuplicateWarning(saved.duplicateWarning.message);
      }
      
      // Update local state - preserve _id if it exists (remove duplicateWarning from saved before storing)
      const { duplicateWarning: _, ...savedOutfit } = saved;
      setPlannedOutfits(prev => {
        const updated = {
      ...prev,
      [dateKey]: { 
        ...newOutfit,
        _id: existingOutfit?._id || savedOutfit._id // Preserve existing _id or use new one from saved response
      }
        };
        // Also save to localStorage as backup
        localStorage.setItem('plannedOutfits', JSON.stringify(updated));
        return updated;
      });
      
    closeModal();
    } catch (error) {
      console.error('Error saving planned outfit:', error);
      // Fallback to localStorage only
      setPlannedOutfits(prev => {
        const updated = {
      ...prev,
      [dateKey]: { ...newOutfit }
        };
        localStorage.setItem('plannedOutfits', JSON.stringify(updated));
        return updated;
      });
    closeModal();
    }
  };

  const openSavedOutfitsModal = () => {
    setShowSavedOutfitsModal(true);
  };

  // Helper function to check for duplicate outfit on different dates
  const checkDuplicateOutfit = useCallback((items, currentDate) => {
    if (!items || items.length === 0) return null;
    
    // Get item IDs (use _id if available, otherwise id)
    const itemIds = items
      .map(item => item._id || item.id)
      .filter(Boolean)
      .sort()
      .map(id => id.toString());
    
    if (itemIds.length === 0) return null;
    
    // Check all planned outfits for exact match (same items) on different dates
    const currentDateKey = formatDateKey(currentDate);
    
    for (const [dateKey, outfit] of Object.entries(plannedOutfits)) {
      // Skip if same date
      if (dateKey === currentDateKey) continue;
      
      // Skip if outfit has no items
      if (!outfit.items || outfit.items.length === 0) continue;
      
      // Get outfit item IDs
      const outfitItemIds = outfit.items
        .map(item => item._id || item.id)
        .filter(Boolean)
        .sort()
        .map(id => id.toString());
      
      // Check if exact match (same items)
      if (JSON.stringify(outfitItemIds) === JSON.stringify(itemIds)) {
        // Parse the date from dateKey (YYYY-MM-DD)
        const [year, month, day] = dateKey.split('-').map(Number);
        const savedDate = new Date(year, month - 1, day);
        
        return {
          isDuplicate: true,
          message: `This outfit was saved on ${(() => {
            const weekday = savedDate.toLocaleDateString('en-US', { weekday: 'long' });
            const day = savedDate.getDate();
            const month = savedDate.toLocaleDateString('en-US', { month: 'short' });
            const year = savedDate.getFullYear();
            return `${weekday}, ${day} ${month} ${year}`;
          })()}.`,
          date: savedDate
        };
      }
    }
    
    return null;
  }, [plannedOutfits]);

  // Check for duplicate outfit whenever items or selectedDay changes
  useEffect(() => {
    if (selectedDay && newOutfit.items && newOutfit.items.length > 0) {
      const duplicateCheck = checkDuplicateOutfit(newOutfit.items, selectedDay);
      if (duplicateCheck && duplicateCheck.isDuplicate) {
        setDuplicateWarning(duplicateCheck.message);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [newOutfit.items, selectedDay, checkDuplicateOutfit]);

  const selectSavedOutfit = (outfit) => {
    // Populate the form with the selected saved outfit
    setNewOutfit(prev => {
      // Process items to hide category labels
      const processedItems = outfit.items ? outfit.items.map((item, index) => {
        const originalName = item.name || '';
        const isFilename = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(originalName);
        const category = item.category || '';
        const nameMatchesCategory = originalName && category && originalName.toLowerCase() === category.toLowerCase();
        const isCategoryLabel = originalName && originalName.toUpperCase() === originalName && ['TOPS', 'BOTTOMS', 'SHOES', 'ACCESSORIES', 'OUTERWEAR', 'CLOTHING'].includes(originalName.toUpperCase());
        // If name is a filename, category, or matches category, use empty string (will be hidden in display)
        const displayName = (isFilename || isCategoryLabel || nameMatchesCategory) ? '' : originalName;
        
        return {
          id: Date.now() + index,
          name: displayName || '', // Store empty string instead of category
          image: item.image && item.image.startsWith('/uploads/') 
            ? `${BACKEND_BASE_URL}${item.image}` 
            : item.image,
          category: category,
          _id: item._id || item.id // Preserve original ID for duplicate checking
    };
      }) : prev.items;
      
      return {
      ...prev,
        name: outfit.name || outfit.occasion || prev.name || '',
        occasion: outfit.occasion || prev.occasion || '',
        items: processedItems
      };
    });
    setShowSavedOutfitsModal(false);
  };

  const openWardrobeItemsModal = () => {
    setShowWardrobeItemsModal(true);
    setSelectedWardrobeItems([]);
    setSelectedCategory('');
    setSelectedOccasion('');
  };

  const toggleWardrobeItemSelection = (item) => {
    setSelectedWardrobeItems(prev => {
      const isSelected = prev.some(selected => selected._id === item._id);
      if (isSelected) {
        return prev.filter(selected => selected._id !== item._id);
      } else {
        return [...prev, item];
      }
    });
  };

  const addSelectedWardrobeItems = () => {
    if (selectedWardrobeItems.length === 0) return;
    
    const newItems = selectedWardrobeItems.map((item, index) => ({
      id: Date.now() + index,
      name: item.name || 'Item',
      image: item.image && item.image.startsWith('/uploads/') 
        ? `${BACKEND_BASE_URL}${item.image}` 
        : item.image,
      category: item.category || 'Unknown',
      _id: item._id || item.id // Preserve original ID for duplicate checking
    }));

    setNewOutfit(prev => {
      const updatedItems = [...prev.items, ...newItems];
      
      // Check for duplicate outfit on different dates
      if (selectedDay) {
        const duplicateCheck = checkDuplicateOutfit(updatedItems, selectedDay);
        if (duplicateCheck && duplicateCheck.isDuplicate) {
          setDuplicateWarning(duplicateCheck.message);
        } else {
          setDuplicateWarning(null);
        }
      }
      
      return {
        ...prev,
        items: updatedItems
      };
    });
    
    setShowWardrobeItemsModal(false);
    setSelectedWardrobeItems([]);
  };

  return (
    <div className="planner-container">
      <div className="planner-header">
        <h1>Outfit Planner</h1>
        <p>Plan your outfits ahead of time</p>
      </div>

      {/* Duplicate Warning Banner */}
      {duplicateWarning && (
        <div className="duplicate-warning-banner">
          <AlertCircle size={20} />
          <span>{duplicateWarning}</span>
          <button 
            className="duplicate-warning-close"
            onClick={() => setDuplicateWarning(null)}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="date-selector">
        <div className="date-picker-wrapper">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="dd/MM/yyyy"
            className="date-picker"
            placeholderText="Select a date"
            dayClassName={dayClassName}
          />
          <Calendar size={20} className="calendar-icon" />
        </div>
      </div>

      <div className="week-section">
        <h2>{weekLabel}</h2>
        
        <div className="week-container">
          <div className="week-grid">
            {weekDates.map((date, index) => {
              const outfit = getOutfitForDate(date);
              const isCurrentDay = isToday(date);
              
              return (
                <div 
                  key={index} 
                  className={`day-card ${isCurrentDay ? 'today' : ''}`}
                  onClick={() => openModal(date)}
                >
                  <div className="day-header">
                    <div className="day-info">
                      <span className="day-name">{formatDayName(date)}</span>
                      <span className="day-date">
                        {formatDayNumber(date)}, {formatMonthName(date)}
                      </span>
                    </div>
                  </div>

                  <div className="day-content">
                    {outfit && outfit.items && outfit.items.length > 0 ? (
                      <div className="planned-outfit">
                        <div className="outfit-preview">
                          {outfit.items.slice(0, 4).map((item, itemIndex) => (
                            <div key={itemIndex} className="outfit-preview-item">
                              <img 
                                src={item.image && item.image.startsWith('/uploads/') 
                                  ? `${BACKEND_BASE_URL}${item.image}` 
                                  : item.image || '/placeholder-image.png'} 
                                alt={item.name || 'Outfit item'}
                              className="outfit-item-image"
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.png';
                                }}
                            />
                            </div>
                          ))}
                          {outfit.items.length > 4 && (
                            <div className="outfit-preview-more">
                              +{outfit.items.length - 4}
                            </div>
                          )}
                        </div>
                        <div className="outfit-details">
                          <h4 className="outfit-name">{outfit.name || outfit.occasion || 'Planned Outfit'}</h4>
                        </div>
                      </div>
                    ) : (
                      <div className="no-outfit">
                        <span>No outfit planned</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </div>

          {/* Outfit Planning Modal */}
          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', maxWidth: '900px', maxHeight: '90vh' }}>
                <div className="modal-header" style={{ flexShrink: 0 }}>
                  <h3>
                    {selectedDay ? (() => {
                      const weekday = selectedDay.toLocaleDateString('en-US', { weekday: 'long' });
                      const day = selectedDay.getDate();
                      const month = selectedDay.toLocaleDateString('en-US', { month: 'short' });
                      return `Plan Outfit - ${weekday}, ${day} ${month}`;
                    })() : 'Plan Outfit'}
                  </h3>
                  <button className="close-btn" onClick={closeModal}>
                    <X size={24} />
                  </button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  <div className="outfit-form-split">
                    <div className="outfit-form-left">
                      <div className="form-group">
                        <label>Outfit Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Wedding Outfit, Birthday Outfit, Date Night"
                          value={newOutfit.name}
                          onChange={(e) => setNewOutfit(prev => ({ ...prev, name: e.target.value }))}
                          className="form-input"
                        />
                      </div>

                      {/* Small duplicate warning notification */}
                      {duplicateWarning && (
                        <div className="duplicate-warning-small">
                          <AlertCircle size={14} />
                          <span>{duplicateWarning}</span>
                        </div>
                      )}
                    </div>

                    <div className="outfit-form-divider"></div>

                    <div className="outfit-form-right">
                      <div className="form-group">
                      <div className="form-group-header">
                      <label>Items</label>
                        {newOutfit.items.length > 0 && (
                            <button 
                            className="clear-outfit-btn"
                            onClick={() => setShowClearOutfitConfirm(true)}
                            title="Clear all items"
                            >
                              <X size={16} />
                            Clear Outfit
                            </button>
                        )}
                          </div>
                      {newOutfit.items.length > 0 ? (
                        <div className="outfit-items-grid">
                          {newOutfit.items.map((item) => {
                            // Check if name is a filename (contains file extension)
                            const isFilename = item.name && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.name);
                            // Only show name if it's not a filename and exists - never show category
                            // Also check if the name matches the category (common case where name was set to category)
                            const name = item.name || '';
                            const category = item.category || '';
                            const nameMatchesCategory = name && category && name.toLowerCase() === category.toLowerCase();
                            // Check if name is a category label (uppercase like TOPS, BOTTOMS)
                            const isCategoryLabel = name && name.toUpperCase() === name && ['TOPS', 'BOTTOMS', 'SHOES', 'ACCESSORIES', 'OUTERWEAR', 'CLOTHING'].includes(name.toUpperCase());
                            // Don't display if name is 'Item' (default placeholder)
                            const isItemPlaceholder = name && name.toLowerCase() === 'item';
                            const displayName = (isFilename || isCategoryLabel || nameMatchesCategory || isItemPlaceholder) ? null : (name || null);
                            
                            return (
                              <div key={item.id} className="outfit-item-card">
                                <div className="outfit-item-image-wrapper">
                                  <img 
                                    src={item.image && item.image.startsWith('/uploads/') 
                                      ? `${BACKEND_BASE_URL}${item.image}` 
                                      : item.image || '/placeholder-image.png'} 
                                    alt={displayName || 'Item'}
                                    className="outfit-item-card-image"
                                    onError={(e) => {
                                      e.target.src = '/placeholder-image.png';
                                    }}
                                  />
                                  <button
                                    className="outfit-item-remove-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setItemToDelete(item);
                                      setShowItemDeleteConfirm(true);
                                    }}
                                    title="Remove this item"
                                  >
                                    <X size={14} />
                            </button>
                          </div>
                                {displayName && (
                                  <div className="outfit-item-card-info">
                                    <span className="outfit-item-card-name">{displayName}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                      <div className="add-items-buttons">
                        <button className="add-item-btn" onClick={openSavedOutfitsModal}>
                          <Plus size={20} />
                          <span>Add Saved Outfit</span>
                        </button>
                        <button className="add-item-btn add-individual-btn" onClick={openWardrobeItemsModal}>
                          <Shirt size={20} />
                          <span>Add Individual Items</span>
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ flexShrink: 0 }}>
                  <button className="btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={saveOutfit}>
                    Save Outfit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Saved Outfits Selection Modal */}
          {showSavedOutfitsModal && (
            <div className="modal-overlay" onClick={() => setShowSavedOutfitsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                  <h3>Select a Saved Outfit</h3>
                  <button className="close-btn" onClick={() => setShowSavedOutfitsModal(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="modal-body">
                  {savedOutfits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <p>No saved outfits available.</p>
                      <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                        Save outfits from the Outfits page first.
                      </p>
                    </div>
                  ) : (
                    <div className="saved-outfits-grid-modal">
                      {savedOutfits.map((outfit) => (
                        <div
                          key={outfit._id || outfit.id}
                          onClick={() => selectSavedOutfit(outfit)}
                          className="saved-outfit-modal"
                        >
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                            {outfit.name || outfit.occasion || 'Saved Outfit'}
                          </h4>
                          <div className="saved-outfit-items-grid">
                            {outfit.items && outfit.items.slice(0, 4).map((item, index) => (
                              <img
                                key={index}
                                src={item.image && item.image.startsWith('/uploads/') 
                                  ? `${BACKEND_BASE_URL}${item.image}` 
                                  : item.image || '/placeholder-image.png'}
                                alt={item.name}
                                style={{
                                  width: '100%',
                                  aspectRatio: '1',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb'
                                }}
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                            ))}
                            {outfit.items && outfit.items.length > 4 && (
                              <div style={{
                                width: '100%',
                                aspectRatio: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f3f4f6',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#666',
                                fontWeight: '600'
                              }}>
                                +{outfit.items.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setShowSavedOutfitsModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wardrobe Items Selection Modal */}
          {showWardrobeItemsModal && (
            <div className="modal-overlay" onClick={() => setShowWardrobeItemsModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                  <h3>Select Items from Wardrobe</h3>
                  <button className="close-btn" onClick={() => setShowWardrobeItemsModal(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="modal-body">
                  {wardrobeItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <p>No items in your wardrobe.</p>
                      <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                        Upload items from the Wardrobe page first.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Filters */}
                      <div style={{ 
                        marginBottom: '20px', 
                        padding: '16px', 
                        background: '#f9fafb', 
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
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
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">All Categories</option>
                              {categories.map((cat) => (
                                <option key={cat.id || cat._id} value={cat.id || cat._id}>
                                  {cat.label || cat.name}
                                </option>
                              ))}
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
                              value={selectedOccasion}
                              onChange={(e) => setSelectedOccasion(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '14px',
                                background: '#ffffff',
                                color: '#374151',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="">All Occasions</option>
                              {occasions.map((occ) => (
                                <option key={occ.id || occ._id} value={(occ.id || occ._id).toLowerCase()}>
                                  {occ.label || occ.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {(selectedCategory || selectedOccasion) && (
                          <button
                            onClick={() => {
                              setSelectedCategory('');
                              setSelectedOccasion('');
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
                          // Category comparison - match Wardrobe page logic (case-insensitive)
                          const matchesCategory = !selectedCategory || 
                            (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());
                          
                          // Occasion comparison - match Wardrobe page logic exactly
                          let matchesOccasion = !selectedOccasion;
                          if (!matchesOccasion && item.occasionTags) {
                            if (Array.isArray(item.occasionTags)) {
                              // Check if any element in the array contains the selected occasion
                              matchesOccasion = item.occasionTags.some(tag => {
                                if (!tag) return false;
                                const tagStr = typeof tag === 'string' ? tag : String(tag);
                                // Handle comma-separated tags
                                if (tagStr.includes(',')) {
                                  return tagStr.split(',').map(t => t.trim().toLowerCase()).includes(selectedOccasion.toLowerCase());
                                }
                                return tagStr.toLowerCase() === selectedOccasion.toLowerCase();
                              });
                            } else if (typeof item.occasionTags === 'string') {
                              // If it's a string, split by comma and check
                              const tags = item.occasionTags.split(',').map(tag => tag.trim().toLowerCase());
                              matchesOccasion = tags.includes(selectedOccasion.toLowerCase());
                            }
                          }
                          
                          return matchesCategory && matchesOccasion;
                        });
                        
                        return (
                          <>
                            {selectedWardrobeItems.length > 0 && (
                              <div style={{ 
                                marginBottom: '16px', 
                                padding: '12px', 
                                background: '#e0e7ff', 
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#8B9DC3',
                                fontWeight: '500'
                              }}>
                                {selectedWardrobeItems.length} item{selectedWardrobeItems.length > 1 ? 's' : ''} selected
                              </div>
                            )}
                            {(selectedCategory || selectedOccasion) && (
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
                            {filteredItems.length === 0 ? (
                              <div style={{ textAlign: 'center', padding: '40px' }}>
                                <p>No items match your filters.</p>
                                <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                                  Try adjusting your category or occasion filters.
                                </p>
                              </div>
                            ) : (
                              <div className="wardrobe-items-selection-grid">
                                {filteredItems.map((item) => {
                          const isSelected = selectedWardrobeItems.some(selected => selected._id === item._id);
                          const isFilename = item.name && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.name);
                          // Only show name if it's not a filename and exists - no category labels
                          const displayName = isFilename ? null : (item.name || null);
                          
                          return (
                            <div
                              key={item._id || item.id}
                              className="wardrobe-selection-item"
                              onClick={() => toggleWardrobeItemSelection(item)}
                              style={{
                                border: isSelected ? '2px solid #8B9DC3' : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                padding: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: isSelected ? '#e0e7ff' : '#fff',
                                position: 'relative'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#8B9DC3';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.15)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#e5e7eb';
                                  e.currentTarget.style.boxShadow = 'none';
                                }
                              }}
                            >
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  width: '24px',
                                  height: '24px',
                                  background: '#8B9DC3',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  zIndex: 10
                                }}>
                                  ✓
                                </div>
                              )}
                              <div style={{
                                width: '100%',
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
                        })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => {
                    setShowWardrobeItemsModal(false);
                    setSelectedWardrobeItems([]);
                    setSelectedCategory('');
                    setSelectedOccasion('');
                  }}>
                    Cancel
                  </button>
                  {selectedWardrobeItems.length > 0 && (
                    <button className="btn-primary" onClick={addSelectedWardrobeItems}>
                      Add {selectedWardrobeItems.length} Item{selectedWardrobeItems.length > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delete Item Confirmation Modal */}
          {showItemDeleteConfirm && (
            <div className="modal-overlay delete-confirm-overlay" onClick={() => {
              setShowItemDeleteConfirm(false);
              setItemToDelete(null);
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
                  Are you sure you want to remove this item from the outfit?
                </p>
                <div className="delete-confirm-buttons">
                  <button 
                    className="delete-confirm-cancel"
                    onClick={() => {
                      setShowItemDeleteConfirm(false);
                      setItemToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="delete-confirm-delete"
                    onClick={() => {
                      if (itemToDelete) {
                        setNewOutfit(prev => ({
                          ...prev,
                          items: prev.items.filter(i => i.id !== itemToDelete.id)
                        }));
                      }
                      setShowItemDeleteConfirm(false);
                      setItemToDelete(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clear Outfit Confirmation Modal */}
          {showClearOutfitConfirm && (
            <div className="modal-overlay delete-confirm-overlay" onClick={() => {
              setShowClearOutfitConfirm(false);
            }}>
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
                    onClick={() => {
                      setShowClearOutfitConfirm(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="delete-confirm-delete"
                    onClick={() => {
                      setNewOutfit(prev => ({ ...prev, items: [] }));
                      setShowClearOutfitConfirm(false);
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    export default Planner;
