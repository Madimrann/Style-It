import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import Outfits from './pages/Outfits';
import Planner from './pages/Planner';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isPlannerPage = location.pathname === '/planner';
  const isWardrobePage = location.pathname === '/wardrobe';
  const isOutfitsPage = location.pathname === '/outfits';
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';
  const isUploadPage = location.pathname === '/upload';

  return (
    <div className="App">
      <Navbar />
      <main className={`main-content ${isHomePage ? 'home-page' : ''} ${isPlannerPage ? 'planner-page' : ''} ${isWardrobePage ? 'wardrobe-page' : ''} ${isOutfitsPage ? 'outfits-page' : ''} ${isUploadPage ? 'upload-page' : ''} ${isLoginPage ? 'login-page' : ''} ${isSignupPage ? 'signup-page' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/wardrobe" 
            element={
              <ProtectedRoute>
                <Wardrobe />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/outfits" 
            element={
              <ProtectedRoute>
                <Outfits />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/planner" 
            element={
              <ProtectedRoute>
                <Planner />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
