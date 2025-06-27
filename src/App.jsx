import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { RecipeProvider } from './contexts/RecipeContext';
import { MealPlanProvider } from './contexts/MealPlanContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { CookingModeProvider } from './contexts/CookingModeContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Scheduler from './pages/Scheduler';
import Recipes from './pages/Recipes';
import ShoppingList from './pages/ShoppingList';
import CookingTimer from './components/CookingTimer';

function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <RecipeProvider>
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
        </RecipeProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}

export default App;