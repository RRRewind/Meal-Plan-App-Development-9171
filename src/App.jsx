import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { RecipeProvider } from './contexts/RecipeContext';
import { MealPlanProvider } from './contexts/MealPlanContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { CookingModeProvider } from './contexts/CookingModeContext';
import { RatingProvider } from './contexts/RatingContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Scheduler from './pages/Scheduler';
import Recipes from './pages/Recipes';
import ShoppingList from './pages/ShoppingList';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import CookingTimer from './components/CookingTimer';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              Please refresh the page to try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
            >
              Refresh Page
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-gray-500 text-sm">Error Details</summary>
              <pre className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Loading Meal Plan...</p>
    </div>
  </div>
);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState(null);

  useEffect(() => {
    // Debug logging for mobile
    console.log('App mounting...');
    
    // Check for critical dependencies
    try {
      if (typeof React === 'undefined') {
        throw new Error('React is not loaded');
      }
      
      // Simulate loading time and check for errors
      const timer = setTimeout(() => {
        console.log('App loaded successfully');
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('App initialization error:', error);
      setAppError(error);
      setIsLoading(false);
    }
  }, []);

  // Handle app-level errors
  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            App Error
          </h1>
          <p className="text-gray-600 mb-4">
            {appError.message}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <GamificationProvider>
            <RecipeProvider>
              <RatingProvider>
                <MealPlanProvider>
                  <CookingModeProvider>
                    <Router>
                      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
                        <Routes>
                          <Route path="/" element={<Landing />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/scheduler" element={<Scheduler />} />
                          <Route path="/recipes" element={<Recipes />} />
                          <Route path="/shopping-list" element={<ShoppingList />} />
                          <Route path="/admin" element={<AdminPanel />} />
                          <Route path="/settings" element={<Settings />} />
                        </Routes>
                        <CookingTimer />
                        <Toaster
                          position="top-right"
                          toastOptions={{
                            duration: 3000,
                            style: {
                              background: '#363636',
                              color: '#fff',
                            },
                          }}
                        />
                      </div>
                    </Router>
                  </CookingModeProvider>
                </MealPlanProvider>
              </RatingProvider>
            </RecipeProvider>
          </GamificationProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;