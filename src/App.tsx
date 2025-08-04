import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Index from './pages/Index';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import LeadCreation from './components/LeadCreation';
import LeadsList from './components/LeadsList';
import OrderCreation from './components/OrderCreation';
import apiClient from './lib/api-client';
import './i18n'; // Initialize i18n
import './App.css';

// API Connection Test Component
const ApiConnectionTest: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    const testApiConnection = async () => {
      try {
        console.log('🔍 App: Testing API connection...');
        await apiClient.healthCheck();
        console.log('✅ App: API connection successful');
        setApiStatus('available');
      } catch (error) {
        console.error('❌ App: API connection test exception:', error);
        setApiStatus('unavailable');
      }
    };

    testApiConnection();
  }, []);

  if (apiStatus === 'checking') {
    return (
      <div className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
        🔍 Checking API connection...
      </div>
    );
  }

  if (apiStatus === 'unavailable') {
    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
        ⚠️ API not available, but continuing with app...
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
      ✅ API connected
    </div>
  );
};

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, apiAvailable } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!apiAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">API Unavailable</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The backend API is not available. Please check if the server is running.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main App Component
const AppContent: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <ApiConnectionTest />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-lead"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                  <div className="max-w-4xl mx-auto">
                    <LeadCreation />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                  <div className="max-w-7xl mx-auto">
                    <LeadsList />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-order"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                  <div className="max-w-7xl mx-auto">
                    <OrderCreation />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

// Root App Component with Providers
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;
