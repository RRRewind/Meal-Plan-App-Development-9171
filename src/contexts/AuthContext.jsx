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
  const [pendingVerification, setPendingVerification] = useState(null);

  // Admin credentials
  const ADMIN_EMAIL = 'admin@supertasty.recipes';
  const ADMIN_PASSWORD = 'admin123';

  useEffect(() => {
    const savedUser = localStorage.getItem('mealplan_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendVerificationEmail = async (email, code, name) => {
    // Simulate sending email
    console.log(`📧 Verification email sent to ${email}`);
    console.log(`Verification Code: ${code}`);
    
    // In a real app, you would send this via your email service
    toast.success(`📧 Verification code sent to ${email}!`, { duration: 5000 });
    return true;
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check for admin login
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const adminUser = {
          id: 'admin',
          email: ADMIN_EMAIL,
          name: 'Admin',
          username: 'admin',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
          joinDate: new Date().toISOString(),
          level: 99,
          xp: 9999,
          streakDays: 365,
          recipesCooked: 999,
          badges: ['admin', 'master_chef', 'recipe_guardian'],
          isAdmin: true,
          emailVerified: true
        };
        
        localStorage.setItem('mealplan_user', JSON.stringify(adminUser));
        setUser(adminUser);
        toast.success('🛡️ Admin access granted!');
        return { success: true };
      }

      // Check if user exists and is verified
      const savedUsers = JSON.parse(localStorage.getItem('mealplan_users') || '[]');
      const existingUser = savedUsers.find(u => u.email === email);
      
      if (!existingUser) {
        return { success: false, error: 'Account not found' };
      }

      if (!existingUser.emailVerified) {
        return { success: false, error: 'Please verify your email first' };
      }

      // Simple password check (in real app, use proper authentication)
      if (existingUser.password !== password) {
        return { success: false, error: 'Invalid password' };
      }

      localStorage.setItem('mealplan_user', JSON.stringify(existingUser));
      setUser(existingUser);
      toast.success('Welcome back!');
      return { success: true };
    } catch (error) {
      toast.error('Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user already exists
      const savedUsers = JSON.parse(localStorage.getItem('mealplan_users') || '[]');
      const existingUser = savedUsers.find(u => u.email === email);
      
      if (existingUser) {
        return { success: false, error: 'Account already exists' };
      }

      // Generate username from name (make it unique)
      const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;
      
      while (savedUsers.some(u => u.username === username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Generate verification code
      const verificationCode = generateVerificationCode();
      
      // Create pending user
      const pendingUser = {
        id: Date.now().toString(),
        email,
        name,
        username,
        password, // In real app, hash this
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        joinDate: new Date().toISOString(),
        level: 1,
        xp: 0,
        streakDays: 0,
        recipesCooked: 0,
        badges: ['new_chef'],
        isAdmin: false,
        emailVerified: false,
        verificationCode
      };

      // Store pending verification
      setPendingVerification(pendingUser);
      
      // Send verification email
      await sendVerificationEmail(email, verificationCode, name);
      
      return { 
        success: true, 
        requiresVerification: true,
        message: 'Verification code sent to your email'
      };
    } catch (error) {
      toast.error('Registration failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (verificationCode) => {
    try {
      if (!pendingVerification) {
        return { success: false, error: 'No pending verification' };
      }

      if (pendingVerification.verificationCode !== verificationCode) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Mark as verified and save to users list
      const verifiedUser = {
        ...pendingVerification,
        emailVerified: true
      };
      delete verifiedUser.verificationCode;

      const savedUsers = JSON.parse(localStorage.getItem('mealplan_users') || '[]');
      savedUsers.push(verifiedUser);
      localStorage.setItem('mealplan_users', JSON.stringify(savedUsers));

      // Set as current user
      localStorage.setItem('mealplan_user', JSON.stringify(verifiedUser));
      setUser(verifiedUser);
      setPendingVerification(null);

      toast.success('✅ Email verified! Account created successfully!');
      return { success: true };
    } catch (error) {
      toast.error('Verification failed');
      return { success: false, error: error.message };
    }
  };

  const resendVerificationCode = async () => {
    if (!pendingVerification) return { success: false };

    const newCode = generateVerificationCode();
    const updatedPending = {
      ...pendingVerification,
      verificationCode: newCode
    };
    
    setPendingVerification(updatedPending);
    await sendVerificationEmail(updatedPending.email, newCode, updatedPending.name);
    
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('mealplan_user');
    setUser(null);
    setPendingVerification(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('mealplan_user', JSON.stringify(updatedUser));
    
    // Also update in users list
    const savedUsers = JSON.parse(localStorage.getItem('mealplan_users') || '[]');
    const userIndex = savedUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex >= 0) {
      savedUsers[userIndex] = updatedUser;
      localStorage.setItem('mealplan_users', JSON.stringify(savedUsers));
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    pendingVerification,
    verifyEmail,
    resendVerificationCode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};