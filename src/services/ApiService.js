// API service for communicating with MongoDB backend
import axios from 'axios';

// Auto-detect API URL based on environment
// Automatically uses the same hostname/IP as the current page
// This way it works on localhost AND on mobile without manual IP changes
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If accessing from localhost, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
    const apiUrl = 'http://localhost:5000/api';
    console.log('🔗 Using localhost API URL:', apiUrl);
    return apiUrl;
  }
  
  // If accessing from mobile/network IP, use the same IP for API
  // This overrides the .env file to work correctly on mobile
  const apiUrl = `${protocol}//${hostname}:5000/api`;
  console.log('🔗 Auto-detected API URL from hostname:', apiUrl);
  console.log('🌐 Current hostname:', hostname);
  console.log('🔒 Protocol:', protocol);
  
  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Debug: Log the API URL being used
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌐 Current hostname:', window.location.hostname);
console.log('🔒 Protocol:', window.location.protocol);

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });
    
    // Add request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
        console.log('📤 Full URL:', config.baseURL + config.url);
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );
    
      // Add response interceptor for debugging
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        // Check if it's an offline/network error
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !navigator.onLine) {
          console.error('📴 Network/Offline Error:', {
            message: error.message,
            code: error.code,
            url: error.config?.url,
            offline: !navigator.onLine
          });
          // Add offline flag to error for easier detection
          error.isOffline = true;
        } else {
          console.error('❌ API Error:', {
            message: error.message,
            code: error.code,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            fullURL: error.config?.baseURL + error.config?.url
          });
        }
        return Promise.reject(error);
      }
    );
  }

  // Set authentication token
  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Authentication methods
  async login(email, password) {
    try {
      const fullUrl = this.client.defaults.baseURL + '/auth/login';
      console.log('📤 Sending login request to:', fullUrl);
      console.log('📤 Request payload:', { email, password: '***' });
      
      const response = await this.client.post('/auth/login', { 
        email, 
        password 
      }, {
        timeout: 15000, // 15 second timeout for login
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Don't throw for 4xx errors
        }
      });
      
      console.log('✅ Login response received:', {
        status: response.status,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user,
        data: response.data
      });
      
      // Check if response indicates an error
      if (response.status >= 400) {
        throw new Error(response.data?.error || 'Login failed');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Login request failed:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        isNetworkError: !error.response
      });
      
      // Provide more helpful error messages
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        const baseURL = this.client.defaults.baseURL;
        throw new Error(`Cannot connect to server at ${baseURL}. Please check:\n1. Backend server is running\n2. Both devices are on the same network\n3. Firewall allows connections on port 5000`);
      }
      
      throw error;
    }
  }

  async signup(email, password, name) {
    try {
      const response = await this.client.post('/auth/signup', { email, password, name });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.client.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Admin methods
  async getUsers() {
    try {
      const response = await this.client.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const response = await this.client.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  async updateUserRole(userId, role) {
    try {
      const response = await this.client.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Update user role error:', error);
      throw error;
    }
  }

  async updateProfile(userId, profileData) {
    try {
      const response = await this.client.put(`/auth/profile/${userId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async deleteAccount() {
    try {
      const response = await this.client.delete('/auth/account');
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }

  async getAdminStats() {
    try {
      const response = await this.client.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Get admin stats error:', error);
      throw error;
    }
  }

  // Get user-specific data (admin only)
  async getUserWardrobeItems(userId) {
    try {
      const response = await this.client.get(`/admin/users/${userId}/wardrobe`);
      return response.data;
    } catch (error) {
      console.error('Get user wardrobe items error:', error);
      throw error;
    }
  }

  async getUserSavedOutfits(userId) {
    try {
      const response = await this.client.get(`/admin/users/${userId}/outfits`);
      return response.data;
    } catch (error) {
      console.error('Get user saved outfits error:', error);
      throw error;
    }
  }

  async getUserPlannedOutfits(userId) {
    try {
      const response = await this.client.get(`/admin/users/${userId}/planned-outfits`);
      return response.data;
    } catch (error) {
      console.error('Get user planned outfits error:', error);
      throw error;
    }
  }

  // Admin delete user's content
  async adminDeleteUserWardrobeItem(userId, itemId) {
    try {
      const response = await this.client.delete(`/admin/users/${userId}/wardrobe/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Admin delete user wardrobe item error:', error);
      throw error;
    }
  }

  async adminDeleteUserOutfit(userId, outfitId) {
    try {
      const response = await this.client.delete(`/admin/users/${userId}/outfits/${outfitId}`);
      return response.data;
    } catch (error) {
      console.error('Admin delete user outfit error:', error);
      throw error;
    }
  }

  async adminDeleteUserPlannedOutfit(userId, outfitId) {
    try {
      const response = await this.client.delete(`/admin/users/${userId}/planned-outfits/${outfitId}`);
      return response.data;
    } catch (error) {
      console.error('Admin delete user planned outfit error:', error);
      throw error;
    }
  }

  // Categories (public - for all users)
  async getCategories() {
    try {
      const response = await this.client.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  }

  // Occasions (public - for all users)
  async getOccasions() {
    try {
      const response = await this.client.get('/occasions');
      return response.data;
    } catch (error) {
      console.error('Get occasions error:', error);
      throw error;
    }
  }

  // Admin Category Management
  async createCategory(categoryData) {
    try {
      const response = await this.client.post('/admin/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  }

  async updateCategory(id, categoryData) {
    try {
      const response = await this.client.put(`/admin/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Update category error:', error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      const response = await this.client.delete(`/admin/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete category error:', error);
      throw error;
    }
  }

  // Admin Occasion Management
  async createOccasion(occasionData) {
    try {
      const response = await this.client.post('/admin/occasions', occasionData);
      return response.data;
    } catch (error) {
      console.error('Create occasion error:', error);
      throw error;
    }
  }

  async updateOccasion(id, occasionData) {
    try {
      const response = await this.client.put(`/admin/occasions/${id}`, occasionData);
      return response.data;
    } catch (error) {
      console.error('Update occasion error:', error);
      throw error;
    }
  }

  async deleteOccasion(id) {
    try {
      const response = await this.client.delete(`/admin/occasions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete occasion error:', error);
      throw error;
    }
  }

  // Wardrobe Items
  async getWardrobeItems() {
    try {
      // Add cache-busting parameter to force fresh data
      const timestamp = Date.now();
      const response = await this.client.get(`/wardrobe?t=${timestamp}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wardrobe items:', error);
      throw error;
    }
  }

  async addWardrobeItem(itemData) {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all item data fields
      for (const key of Object.keys(itemData)) {
        if (key === 'image' && itemData[key] instanceof File) {
          // If image is a File object, append it directly
          formData.append('image', itemData[key]);
        } else if (key === 'image' && typeof itemData[key] === 'string' && itemData[key].startsWith('data:')) {
          // If image is base64, convert to File object
          const base64Data = itemData[key];
          const response = await fetch(base64Data);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: blob.type });
          formData.append('image', file);
        } else {
          // Add other fields as strings
          formData.append(key, itemData[key]);
        }
      }
      
      const response = await this.client.post('/wardrobe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error adding wardrobe item:', error);
      throw error;
    }
  }

  async updateWardrobeItem(id, updateData) {
    try {
      const response = await this.client.put(`/wardrobe/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating wardrobe item:', error);
      throw error;
    }
  }

  async deleteWardrobeItem(id) {
    try {
      const response = await this.client.delete(`/wardrobe/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting wardrobe item:', error);
      throw error;
    }
  }

  // Outfits
  async getSavedOutfits() {
    try {
      const response = await this.client.get('/outfits');
      return response.data;
    } catch (error) {
      console.error('Error fetching saved outfits:', error);
      throw error;
    }
  }

  async saveOutfit(outfitData) {
    try {
      const response = await this.client.post('/outfits', outfitData);
      return response.data;
    } catch (error) {
      console.error('Error saving outfit:', error);
      throw error;
    }
  }

  async deleteSavedOutfit(id) {
    try {
      const response = await this.client.delete(`/outfits/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting saved outfit:', error);
      throw error;
    }
  }

  // Planned Outfits
  async getPlannedOutfits() {
    try {
      const response = await this.client.get('/planned-outfits');
      return response.data;
    } catch (error) {
      console.error('Error fetching planned outfits:', error);
      throw error;
    }
  }

  async planOutfit(plannedOutfitData) {
    try {
      const response = await this.client.post('/planned-outfits', plannedOutfitData);
      return response.data;
    } catch (error) {
      console.error('Error planning outfit:', error);
      throw error;
    }
  }

  async removePlannedOutfit(id) {
    try {
      const response = await this.client.delete(`/planned-outfits/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error removing planned outfit:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // AI Image Analysis with Google Vision API
  async analyzeImage(imageFile) {
    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      const response = await this.client.post('/analyze-image', {
        imageData: base64Image
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Image analysis failed:', error);
      throw error;
    }
  }

  // Convert file to base64 (ensuring JPEG format for Google Vision API)
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      // Create a canvas to convert any image format to JPEG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Resize image if too large (max 1920px on longest side for better API detection)
        // Google Vision API works better with normalized image sizes
        const MAX_DIMENSION = 1920;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }
        
        // Set canvas dimensions (resized if needed)
        canvas.width = width;
        canvas.height = height;
        
        // Draw image to canvas (this converts to JPEG and resizes)
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to JPEG base64
        const jpegBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        
        console.log('📸 Base64 conversion:', {
          originalFileSize: file.size,
          originalFileType: file.type,
          originalDimensions: `${img.width}x${img.height}`,
          resizedDimensions: `${width}x${height}`,
          convertedTo: 'image/jpeg',
          base64Length: jpegBase64.length,
          base64Start: jpegBase64.substring(0, 50)
        });
        
        resolve(jpegBase64);
      };
      
      img.onerror = (error) => {
        console.error('❌ Image load error:', error);
        reject(error);
      };
      
      // Load the file as image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }

  // Remove background using rembg service (via backend proxy)
  async removeBackground(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await this.client.post('/remove-background', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob'
      });
      
      const processedImageUrl = URL.createObjectURL(response.data);
      return processedImageUrl;
    } catch (error) {
      // Return original image if background removal fails
      return URL.createObjectURL(imageFile);
    }
  }

  // Category-based Outfit Recommendation
  async getOutfitRecommendation(occasion) {
    try {
      console.log('🤖 Requesting outfit recommendation for:', occasion);
      
      const response = await this.client.get(`/recommend-outfit/${occasion}`);
      
      console.log('✅ Outfit recommendation received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Outfit recommendation failed:', error);
      throw error;
    }
  }

  // Legacy Gemini-based recommendation (kept for fallback)
  async getGeminiOutfitRecommendation(occasion, wardrobeItems) {
    try {
      console.log('🤖 Requesting Gemini outfit recommendation for:', occasion);
      
      const response = await this.client.post('/recommend-outfit-gemini', {
        occasion,
        wardrobeItems
      });
      
      console.log('✅ Gemini outfit recommendation received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Gemini outfit recommendation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();