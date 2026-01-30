// Utility to get the backend base URL (for images, uploads, etc.)
// Automatically detects the correct URL based on how the app is accessed
export const getBackendBaseUrl = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If accessing from localhost, use localhost for backend
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
    return 'http://localhost:5000';
  }
  
  // If accessing from mobile/network IP, use the same IP for backend
  return `${protocol}//${hostname}:5000`;
};

// Get API URL (for API calls)
export const getApiBaseUrl = () => {
  return getBackendBaseUrl() + '/api';
};

