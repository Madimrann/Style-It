import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload as UploadIcon, X, Check, AlertCircle } from 'lucide-react';
import { apiService } from '../services/ApiService';
import './Upload.css';

import { getBackendBaseUrl } from '../utils/getBackendUrl';

// Auto-detect backend URL based on current hostname
const BACKEND_BASE_URL = getBackendBaseUrl();

const Upload = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  
  // Confirmation popup states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editOccasionTags, setEditOccasionTags] = useState([]);
  
  // Load categories and occasions from database
  const [categories, setCategories] = useState([]);
  const [occasions, setOccasions] = useState([]);
  
  useEffect(() => {
    const loadCategoriesAndOccasions = async () => {
      try {
        const [categoriesData, occasionsData] = await Promise.all([
          apiService.getCategories(),
          apiService.getOccasions()
        ]);
        setCategories(categoriesData);
        setOccasions(occasionsData);
      } catch (error) {
        console.error('Error loading categories/occasions:', error);
      }
    };
    loadCategoriesAndOccasions();
  }, []);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files (wrong type or too large)
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors) {
        const error = rejection.errors[0];
        if (error.code === 'file-too-large') {
          alert('File is too large. Maximum size is 10MB.');
        } else if (error.code === 'file-invalid-type') {
          alert('Invalid file type. Please upload an image (JPEG, PNG, or WebP).');
        } else {
          alert('Error uploading file: ' + error.message);
        }
      }
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      // Additional file size validation (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert('File is too large. Maximum size is 10MB.');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Please upload an image (JPEG, PNG, or WebP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const originalPreview = e.target.result; // Always show original as preview
        let processedImageUrl = null;

        try {
          // Attempt background removal in the background
          processedImageUrl = await apiService.removeBackground(file);
          console.log('🖼️ Background removal successful.');
        } catch (error) {
          console.error('Error removing background:', error);
          // If background removal fails, processedImageUrl remains null
        }

        setSelectedImage({
          file: file,
          preview: originalPreview, // Always show original as preview
          name: file.name,
          processedUrl: processedImageUrl // Store processed URL if successful
        });
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  // Detect if we're on mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Separate file input for camera capture (more reliable on iOS Safari - mobile only)

  const handleCameraCapture = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset the input so the same file can be selected again
      e.target.value = '';
      onDrop([file]);
    }
  }, [onDrop]);

  // Request camera permission directly from user interaction
  const requestCameraAccess = useCallback(async () => {
    try {
      setCameraError(null);
      setStream(null);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera is not supported in this browser. Please use a modern browser or upload a file instead.');
        return false;
      }
      
      // Check current permission status first (if available)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'camera' });
          if (permissionStatus.state === 'denied') {
            setCameraError('Camera permission is permanently denied. Please enable it in your browser settings.');
            return false;
          }
        } catch (permError) {
          // Permission query not supported, continue anyway
          console.log('Permission query not supported, proceeding...');
        }
      }
      
      // Detect if we're on mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Try with minimal constraints first (more likely to work)
      let videoConstraints = { video: true };
      
      // If that works, try to upgrade to better quality
      try {
        videoConstraints = {
        video: { 
            facingMode: isMobile ? 'environment' : 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
        } 
        };
      } catch (e) {
        // Fallback to simple constraint
        videoConstraints = { video: true };
      }
      
      // Request camera access - this must be called directly from user interaction
      const mediaStream = await navigator.mediaDevices.getUserMedia(videoConstraints);
      
      // Small delay to ensure stream is ready
      setTimeout(() => {
        setStream(mediaStream);
      }, 100);
      
      return true;
      
    } catch (error) {
      console.error('Camera access denied:', error);
      
      // Provide more specific error messages
      let errorMessage = '';
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        if (isIOS) {
          errorMessage = 'Camera permission denied.\n\nTo enable:\n1. Open Settings app\n2. Scroll to Safari\n3. Tap Camera\n4. Select "Allow" for this website\n\nOR from Safari:\n1. Tap the "aA" icon in address bar\n2. Tap "Website Settings"\n3. Set Camera to "Allow"\n4. Refresh page and try again';
        } else if (isMobile) {
          errorMessage = 'Camera permission denied. Please:\n1. Tap the camera icon in your browser\'s address bar\n2. Allow camera permissions\n3. Refresh the page and try again';
        } else {
          errorMessage = 'Camera permission denied. Please:\n1. Click the camera icon in your browser\'s address bar\n2. Allow camera permissions\n3. Refresh the page and try again';
        }
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found. Please check your device has a camera.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is being used by another application. Please close other apps using the camera and try again.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        // Try again with absolute minimal constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
          });
          setTimeout(() => {
            setStream(fallbackStream);
          }, 100);
          return true;
        } catch (fallbackError) {
          errorMessage = 'Camera access failed. Please try uploading a file instead.';
        }
      } else if (error.name === 'SecurityError' || error.name === 'NotSupportedError') {
        errorMessage = 'Camera is not available. This may require HTTPS connection. Please try uploading a file instead.';
      } else {
        errorMessage = `Camera access failed: ${error.message || error.name}. Please try uploading a file instead.`;
      }
      
      setCameraError(errorMessage);
      return false;
    }
  }, []);

  // Start camera after modal is open (for compatibility)
  const startCamera = useCallback(async () => {
    await requestCameraAccess();
  }, [requestCameraAccess]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = async () => {
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const reader = new FileReader();
      reader.onload = async (e) => {
        const originalPreview = e.target.result; // Always show original as preview
        let processedImageUrl = null;

        try {
          // Attempt background removal in the background (same as file upload)
          processedImageUrl = await apiService.removeBackground(file);
          console.log('🖼️ Background removal successful for camera capture.');
        } catch (error) {
          console.error('Error removing background from camera capture:', error);
          // If background removal fails, processedImageUrl remains null
        }

        setSelectedImage({
          file: file,
          preview: originalPreview, // Always show original as preview
          name: file.name,
          processedUrl: processedImageUrl // Store processed URL if successful
        });
        setIsCameraOpen(false);
        stopCamera();
        console.log('📸 Photo captured and ready for upload');
      };
      reader.readAsDataURL(file);
    }, 'image/jpeg', 0.8);
  };

  // Stop camera when modal closes
  useEffect(() => {
    if (!isCameraOpen) {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraOpen, stopCamera]);

  // Handle video element when stream changes
  useEffect(() => {
    const video = document.getElementById('camera-video');
    if (video && stream) {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().catch(console.error);
      };
    }
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  const handleUpload = async () => {
    if (!selectedImage) return;

    setUploadStatus('uploading');
    
    try {
      console.log('📁 Upload file details:', {
        fileName: selectedImage.file.name,
        fileType: selectedImage.file.type,
        fileSize: selectedImage.file.size,
        previewType: typeof selectedImage.preview,
        previewStart: selectedImage.preview.substring(0, 50)
      });

      try {
        console.log('🤖 Starting AI apparel detection...');
        
        // Use Google Vision API analysis via backend API
        const analysisResult = await apiService.analyzeImage(selectedImage.file);
        console.log('📊 Analysis result:', analysisResult);
        
        // Use background-removed image if available, otherwise use original file
        let imageFile = selectedImage.file;
        
        // If background removal was successful, convert the processed URL back to a File
        if (selectedImage.processedUrl) {
          try {
            const response = await fetch(selectedImage.processedUrl);
            const blob = await response.blob();
            imageFile = new File([blob], selectedImage.name, { type: blob.type });
            console.log('🖼️ Using background-removed image for saving');
          } catch (error) {
            console.error('Error converting processed image to file:', error);
            console.log('🔄 Falling back to original image');
          }
        }
        
        // Match AI-detected category to database categories
        let matchedCategory = analysisResult.category || 'CLOTHING';
        if (categories.length > 0) {
          // Try to find a matching category in the database
          const aiCategoryUpper = matchedCategory.toUpperCase();
          const foundCategory = categories.find(cat => 
            cat.id.toUpperCase() === aiCategoryUpper ||
            cat.label.toUpperCase() === aiCategoryUpper
          );
          
          if (foundCategory) {
            matchedCategory = foundCategory.id.toUpperCase();
            console.log(`✅ Matched AI category "${analysisResult.category}" to database category: ${foundCategory.id}`);
          } else {
            // If no match, use first category as fallback
            matchedCategory = categories[0].id.toUpperCase();
            console.log(`⚠️ AI category "${analysisResult.category}" not found in database, using: ${matchedCategory}`);
          }
        }
        
        // Create item data with AI analysis results
        const itemData = {
          name: selectedImage.name,
          image: imageFile, // Pass the processed File object if available
          category: matchedCategory,
          confidence: analysisResult.confidence || 0.8,
          tags: analysisResult.tags ? analysisResult.tags.join(',') : 'uploaded,clothing',
          occasionTags: analysisResult.occasionTags || [],
          color: analysisResult.colors ? analysisResult.colors[0] : 'unknown',
          description: analysisResult.description || 'Clothing item',
          colors: analysisResult.colors ? analysisResult.colors.join(',') : 'unknown',
          style: analysisResult.style || 'unknown'
        };
        
        // Show confirmation popup instead of directly saving
        setPendingItem(itemData);
        setEditCategory(itemData.category);
        setEditTags(itemData.tags);
        setEditOccasionTags(itemData.occasionTags || []);
        setShowConfirmation(true);
        setUploadStatus('idle');
        
      } catch (apiError) {
        console.error('❌ Error with AI analysis:', apiError);
        console.log('📱 Falling back to simple upload...');
        
        // Fallback to simple upload without AI
        // Use background-removed image if available, otherwise use original file
        let fallbackImageFile = selectedImage.file;
        
        if (selectedImage.processedUrl) {
          try {
            const response = await fetch(selectedImage.processedUrl);
            const blob = await response.blob();
            fallbackImageFile = new File([blob], selectedImage.name, { type: blob.type });
            console.log('🖼️ Using background-removed image for fallback saving');
          } catch (error) {
            console.error('Error converting processed image to file in fallback:', error);
            console.log('🔄 Falling back to original image');
          }
        }
        
        // Use first database category as fallback, or 'CLOTHING' if no categories
        const fallbackCategory = categories.length > 0 
          ? categories[0].id.toUpperCase() 
          : 'CLOTHING';
        
        const fallbackItem = {
          name: selectedImage.name,
          image: fallbackImageFile, // Use processed image if available
          category: fallbackCategory,
          confidence: 1.0,
          tags: 'uploaded,manual,clothing'
        };
        
        // Show confirmation popup for fallback item too
        setPendingItem(fallbackItem);
        setEditCategory(fallbackItem.category);
        setEditTags(fallbackItem.tags);
        // Use first occasion from database, or 'casual' as default
        setEditOccasionTags(occasions.length > 0 ? [occasions[0].id] : ['casual']);
        setShowConfirmation(true);
        setUploadStatus('idle');
      }
      
      // Reset status after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploadStatus('error');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  // Confirmation popup functions
  const handleConfirmSave = async () => {
    if (!pendingItem) return;
    
    // Validation
    if (!editCategory || !editCategory.trim()) {
      alert('Please select a category');
      return;
    }

    if (!editOccasionTags || editOccasionTags.length === 0) {
      alert('Please select at least one occasion');
      return;
    }
    
    try {
      setUploadStatus('uploading');
      
      // Update the pending item with edited values
      const finalItem = {
        ...pendingItem,
        category: editCategory,
        tags: editTags,
        occasionTags: editOccasionTags
      };
      
      console.log('🔄 Saving confirmed item to MongoDB:', finalItem);
      const savedItem = await apiService.addWardrobeItem(finalItem);
      console.log('✅ Item saved to MongoDB:', savedItem);
      
      setUploadStatus('success');
      
      // Close popup and reset
      setShowConfirmation(false);
      setPendingItem(null);
      setSelectedImage(null);
      setEditCategory('');
      setEditTags('');
      setEditOccasionTags([]);
      
    } catch (error) {
      console.error('❌ Error saving item:', error);
      setUploadStatus('error');
    }
  };

  const handleCancelUpload = () => {
    // Close popup and reset without saving
    setShowConfirmation(false);
    setPendingItem(null);
    setSelectedImage(null);
    setEditCategory('');
    setEditTags('');
    setEditOccasionTags([]);
    setUploadStatus('idle');
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };


  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Upload Your Clothes</h1>
        <p>Take a photo or upload an image to add to your wardrobe</p>
      </div>

      <div className="upload-requirements">
        <button 
          className="requirements-button"
          onClick={() => setShowRequirementsModal(true)}
        >
          <span>📋</span>
          <span>View Photo Requirements</span>
        </button>
      </div>

      {/* Photo Requirements Modal */}
      {showRequirementsModal && (
        <div className="requirements-modal-overlay" onClick={() => setShowRequirementsModal(false)}>
          <div className="requirements-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="requirements-modal-header">
              <h3>Photo Requirements</h3>
              <button 
                className="requirements-modal-close"
                onClick={() => setShowRequirementsModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="requirements-list">
              <div className="requirement-item">
                <span className="requirement-dot"></span>
                <span>Use good lighting</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-dot"></span>
                <span>Ensure the entire outfit is visible</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-dot"></span>
                <span>Avoid blurry images</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-dot"></span>
                <span>Use a clean background</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="upload-actions">
        {/* Upload File button - opens file picker (no capture attribute) */}
        <button 
          className="action-btn upload-btn"
          onClick={() => {
            // Find the upload file input (without capture)
            const uploadInput = document.getElementById('upload-file-input');
            if (uploadInput) {
              uploadInput.click();
            } else {
              // Fallback: use dropzone input
              const fileInput = document.querySelector('input[type="file"]:not([capture])');
            if (fileInput) fileInput.click();
            }
          }}
        >
          <UploadIcon size={20} />
          Upload File
        </button>
        
        {/* Hidden file input for upload (no capture) */}
        <input
          id="upload-file-input"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              e.target.value = ''; // Reset
              onDrop([file]);
            }
          }}
          style={{ display: 'none' }}
        />
        
        {/* Take Photo button - different behavior for mobile vs desktop */}
        {isMobile ? (
          // Mobile: Use native file input with capture (opens camera directly)
          <label className="action-btn camera-btn" style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              style={{ display: 'none' }}
            />
            <Camera size={20} />
            Take Photo
          </label>
        ) : (
          // Desktop: Use getUserMedia modal (opens camera preview)
        <button 
          className="action-btn camera-btn"
            onClick={async () => {
              // Request camera permission directly from button click (user interaction)
              const granted = await requestCameraAccess();
              setIsCameraOpen(true);
              // If permission was granted, stream will be set automatically
            }}
        >
          <Camera size={20} />
          Take Photo
        </button>
        )}
      </div>

      <div className="upload-area">
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''} ${selectedImage ? 'has-image' : ''}`}
        >
          <input {...getInputProps()} />
          
          {selectedImage ? (
            <div className="selected-image">
              <img src={selectedImage.preview} alt="Selected" />
              <button 
                className="remove-btn" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeSelectedImage();
                }}
              >
                <X size={20} />
              </button>
              <div className="image-info">
                <button 
                  className="upload-selected-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUpload();
                  }}
                      disabled={uploadStatus === 'uploading'}
                    >
                        {uploadStatus === 'uploading' ? 'Analyzing...' : 'Upload & Analyze'}
                </button>
              </div>
            </div>
          ) : (
            <div className="dropzone-content">
              <Camera size={48} className="dropzone-icon" />
              <p>Click to select an image</p>
              <p className="dropzone-formats">Supports JPG, PNG, WEBP</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Status */}
          {uploadStatus === 'success' && (
            <div className="status-message success">
              <Check size={24} />
              <span>Image uploaded successfully! Check your wardrobe.</span>
            </div>
          )}

      {uploadStatus === 'error' && (
        <div className="status-message error">
          <X size={20} />
          Failed to upload. Please try again.
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="camera-modal">
          <div className="camera-modal-content">
            <div className="camera-header">
              <h3>Take a Photo</h3>
              <button 
                className="close-btn"
                onClick={() => setIsCameraOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="camera-container">
              {cameraError ? (
                <div className="camera-error">
                  <Camera size={64} />
                  <p style={{ whiteSpace: 'pre-line', textAlign: 'center', marginBottom: '20px' }}>{cameraError}</p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="action-btn camera-btn"
                    onClick={startCamera}
                  >
                    <Camera size={20} />
                    Try Again
                  </button>
                    <button 
                      className="action-btn upload-btn"
                      onClick={() => {
                        setIsCameraOpen(false);
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) fileInput.click();
                      }}
                    >
                      <UploadIcon size={20} />
                      Upload Instead
                    </button>
                  </div>
                </div>
              ) : stream ? (
                <div className="camera-preview">
                  <video
                    id="camera-video"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="camera-controls">
                    <button 
                      className="capture-btn"
                      onClick={capturePhoto}
                    >
                      <Camera size={24} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="camera-loading">
                  <Camera size={64} />
                  <p>Starting camera...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      {showConfirmation && pendingItem && (
        <div className="confirmation-overlay">
          <div className="confirmation-popup">
            <div className="popup-header">
              <h3>Confirm Item Details</h3>
              <button className="close-btn" onClick={handleCancelUpload}>
                ×
              </button>
            </div>
            
            <div className="popup-content">
              <div className="item-preview">
                <img 
                  src={pendingItem.image instanceof File ? URL.createObjectURL(pendingItem.image) : pendingItem.image} 
                  alt="Uploaded item" 
                />
              </div>
              
              <div className="edit-form">
                <div className="form-group">
                  <label>Category:</label>
                  <select 
                    value={editCategory} 
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="edit-select"
                  >
                    {categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat.id} value={cat.id.toUpperCase()}>
                          {cat.label}
                        </option>
                      ))
                    ) : (
                      // Fallback to default categories if database categories aren't loaded yet
                      <>
                    <option value="TOPS">Tops</option>
                    <option value="BOTTOMS">Bottoms</option>
                    <option value="SHOES">Shoes</option>
                    <option value="ACCESSORIES">Accessories</option>
                    <option value="CLOTHING">Clothing</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Occasion Tags:</label>
                  <div className="occasion-tags-container">
                    {(occasions.length > 0 ? occasions : [
                      { id: 'casual', label: 'Casual' },
                      { id: 'formal', label: 'Formal' },
                      { id: 'work', label: 'Work' },
                      { id: 'sporty', label: 'Sporty' }
                    ]).map(occasion => (
                      <label key={occasion.id} className="occasion-tag-label">
                        <input
                          type="checkbox"
                          checked={editOccasionTags.includes(occasion.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditOccasionTags([...editOccasionTags, occasion.id]);
                            } else {
                              setEditOccasionTags(editOccasionTags.filter(tag => tag !== occasion.id));
                            }
                          }}
                        />
                        <span className="occasion-tag-text">{occasion.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="popup-actions">
              <button 
                className="cancel-btn"
                onClick={handleCancelUpload}
              >
                <X size={16} />
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleConfirmSave}
                disabled={uploadStatus === 'uploading'}
              >
                <Check size={16} />
                {uploadStatus === 'uploading' ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
