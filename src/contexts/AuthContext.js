import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiService } from '../services/ApiService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set default authorization header for axios
  useEffect(() => {
    if (token) {
      apiService.setAuthToken(token);
      // Verify token and get user info
      apiService.getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
          apiService.setAuthToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await apiService.login(email, password);
      console.log('✅ Login response received:', response);
      
      const { token: newToken, user: userData } = response;
      
      if (!newToken || !userData) {
        console.error('❌ Missing token or user data in response:', response);
        return { 
          success: false, 
          error: 'Invalid response from server. Please try again.' 
        };
      }
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      apiService.setAuthToken(newToken);
      setUser(userData);
      
      console.log('✅ Login successful, user set:', userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Login failed. Please check your credentials.';
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const signup = async (email, password, name) => {
    try {
      const response = await apiService.signup(email, password, name);
      const { token: newToken, user: userData } = response;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      apiService.setAuthToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Signup failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    apiService.setAuthToken(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    signup,
    logout,
    isAdmin,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

