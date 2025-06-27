import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();

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

  useEffect(() => {
    const savedUser = localStorage.getItem('mealplan_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        joinDate: new Date().toISOString(),
        level: 1,
        xp: 0,
        streakDays: 0,
        recipesCooked: 0,
        badges: []
      };
      
      localStorage.setItem('mealplan_user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Welcome back!');
      return { success: true };
    } catch (error) {
      toast.error('Login failed');
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        id: Date.now().toString(),
        email,
        name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        joinDate: new Date().toISOString(),
        level: 1,
        xp: 0,
        streakDays: 0,
        recipesCooked: 0,
        badges: ['new_chef']
      };
      
      localStorage.setItem('mealplan_user', JSON.stringify(userData));
      setUser(userData);
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      toast.error('Registration failed');
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('mealplan_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('mealplan_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};