import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
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

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Fallback to localStorage for demo users
          const savedUser = localStorage.getItem('mealplan_user');
          if (savedUser && mounted) {
            setUser(JSON.parse(savedUser));
          }
        } else if (session?.user && mounted) {
          // User is authenticated via Supabase
          const supabaseUser = await createUserFromSupabaseAuth(session.user);
          setUser(supabaseUser);
          localStorage.setItem('mealplan_user', JSON.stringify(supabaseUser));
        } else {
          // No Supabase session, check localStorage for demo users
          const savedUser = localStorage.getItem('mealplan_user');
          if (savedUser && mounted) {
            const parsedUser = JSON.parse(savedUser);
            // Verify this isn't a Supabase user by checking email format
            if (!parsedUser.email?.includes('@') || parsedUser.email === ADMIN_EMAIL) {
              setUser(parsedUser);
            } else {
              // This looks like a Supabase user but no session - clear it
              localStorage.removeItem('mealplan_user');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Fallback to localStorage
        const savedUser = localStorage.getItem('mealplan_user');
        if (savedUser && mounted) {
          setUser(JSON.parse(savedUser));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          const supabaseUser = await createUserFromSupabaseAuth(session.user);
          setUser(supabaseUser);
          localStorage.setItem('mealplan_user', JSON.stringify(supabaseUser));
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('mealplan_user');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update user data on token refresh
          const supabaseUser = await createUserFromSupabaseAuth(session.user);
          setUser(supabaseUser);
          localStorage.setItem('mealplan_user', JSON.stringify(supabaseUser));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Create user object from Supabase auth user
  const createUserFromSupabaseAuth = async (authUser) => {
    const baseUser = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.display_name || authUser.email.split('@')[0],
      username: authUser.user_metadata?.username || authUser.email.split('@')[0],
      avatar: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.email}`,
      joinDate: authUser.created_at,
      level: 1,
      xp: 0,
      streakDays: 0,
      recipesCooked: 0,
      badges: ['new_chef'],
      isAdmin: authUser.email === ADMIN_EMAIL,
      emailVerified: authUser.email_confirmed_at !== null,
      supabaseUser: true // Flag to identify Supabase users
    };

    // Try to load additional user data from preferences
    try {
      const { data: preferences } = await supabase
        .from('user_preferences_mp2024')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (preferences) {
        return {
          ...baseUser,
          name: preferences.display_name || baseUser.name,
          username: preferences.username || baseUser.username,
          avatar: preferences.avatar_url || baseUser.avatar,
          level: preferences.level || baseUser.level,
          xp: preferences.xp || baseUser.xp,
          streakDays: preferences.streak_days || baseUser.streakDays,
          recipesCooked: preferences.recipes_cooked || baseUser.recipesCooked,
        };
      }
    } catch (error) {
      console.log('No preferences found for user, using defaults');
    }

    return baseUser;
  };

  const login = async (email, password) => {
    try {
      setLoading(true);

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
          emailVerified: true,
          supabaseUser: false // Admin is not a Supabase user
        };
        
        localStorage.setItem('mealplan_user', JSON.stringify(adminUser));
        setUser(adminUser);
        toast.success('🛡️ Admin access granted!');
        return { success: true };
      }

      // Try Supabase authentication first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If Supabase login fails, fall back to localStorage for demo users
        console.log('Supabase login failed, checking localStorage:', error.message);
        
        const savedUsers = JSON.parse(localStorage.getItem('mealplan_users') || '[]');
        const existingUser = savedUsers.find(u => u.email === email);
        
        if (!existingUser) {
          return { success: false, error: 'Account not found' };
        }

        if (!existingUser.emailVerified) {
          return { success: false, error: 'Please verify your email first' };
        }

        if (existingUser.password !== password) {
          return { success: false, error: 'Invalid password' };
        }

        // Mark as non-Supabase user
        existingUser.supabaseUser = false;
        localStorage.setItem('mealplan_user', JSON.stringify(existingUser));
        setUser(existingUser);
        toast.success('Welcome back! (Demo mode)');
        return { success: true };
      }

      // Supabase login successful - user will be set via onAuthStateChange
      return { success: true };

    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);

      // Try Supabase registration first
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          }
        }
      });

      if (error) {
        // If Supabase registration fails, fall back to localStorage
        console.log('Supabase registration failed, using localStorage:', error.message);
        
        const savedUsers = JSON.parse(localStorage.getItem('mealplan_users') || '[]');
        const existingUser = savedUsers.find(u => u.email === email);
        
        if (existingUser) {
          return { success: false, error: 'Account already exists' };
        }

        const existingUsername = savedUsers.find(u => u.username === username);
        if (existingUsername) {
          return { success: false, error: 'Username already taken' };
        }

        // Create demo user
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const pendingUser = {
          id: Date.now().toString(),
          email,
          name: username,
          username,
          password,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          joinDate: new Date().toISOString(),
          level: 1,
          xp: 0,
          streakDays: 0,
          recipesCooked: 0,
          badges: ['new_chef'],
          isAdmin: false,
          emailVerified: false,
          verificationCode,
          supabaseUser: false
        };

        setPendingVerification(pendingUser);
        
        // Show verification code for demo
        toast.success(`Demo Mode: Your verification code is ${verificationCode}`, {
          duration: 10000,
          style: {
            background: '#10b981',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        });

        return {
          success: true,
          requiresVerification: true,
          verificationCode,
          message: 'Account created! Check the green notification above for your verification code.'
        };
      }

      // Supabase registration successful
      if (data.user && !data.user.email_confirmed_at) {
        // Email confirmation required
        toast.success('Registration successful! Please check your email to verify your account.', {
          duration: 8000
        });
        
        return {
          success: true,
          requiresVerification: true,
          message: 'Please check your email to verify your account.'
        };
      }

      // Auto-confirmed (shouldn't happen with email confirmation enabled)
      return { success: true };

    } catch (error) {
      console.error('Registration error:', error);
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

      // For demo users (localStorage)
      if (!pendingVerification.supabaseUser) {
        if (pendingVerification.verificationCode !== verificationCode) {
          return { success: false, error: 'Invalid verification code' };
        }

        const verifiedUser = { ...pendingVerification, emailVerified: true };
        delete verifiedUser.verificationCode;

        const savedUsers = JSON.parse(localStorage.getItem('mealplan_users') || '[]');
        savedUsers.push(verifiedUser);
        localStorage.setItem('mealplan_users', JSON.stringify(savedUsers));

        localStorage.setItem('mealplan_user', JSON.stringify(verifiedUser));
        setUser(verifiedUser);
        setPendingVerification(null);

        toast.success('✅ Email verified! Account created successfully!');
        return { success: true };
      }

      // For Supabase users, verification is handled automatically
      return { success: false, error: 'Supabase email verification is handled automatically' };

    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed');
      return { success: false, error: error.message };
    }
  };

  const resendVerificationCode = async () => {
    if (!pendingVerification) return { success: false };

    if (!pendingVerification.supabaseUser) {
      // For demo users
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const updatedPending = { ...pendingVerification, verificationCode: newCode };
      setPendingVerification(updatedPending);

      toast.success(`Demo Mode: Your new verification code is ${newCode}`, {
        duration: 10000,
        style: {
          background: '#10b981',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      });

      return { success: true };
    }

    // For Supabase users
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: pendingVerification.email
      });

      if (error) throw error;

      toast.success('Verification email resent! Please check your inbox.');
      return { success: true };
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend verification email');
      return { success: false };
    }
  };

  const logout = async () => {
    try {
      // Sign out from Supabase if user is a Supabase user
      if (user?.supabaseUser) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase logout error:', error);
        }
      }

      // Clear local storage and state
      localStorage.removeItem('mealplan_user');
      setUser(null);
      setPendingVerification(null);
      
      toast.success('Logged out successfully');
      
      // Force redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if Supabase logout fails
      localStorage.removeItem('mealplan_user');
      setUser(null);
      setPendingVerification(null);
      window.location.href = '/';
    }
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('mealplan_user', JSON.stringify(updatedUser));

    // Also update in users list for demo users
    if (!updatedUser.supabaseUser) {
      const savedUsers = JSON.parse(localStorage.getItem('mealplan_users') || '[]');
      const userIndex = savedUsers.findIndex(u => u.id === updatedUser.id);
      if (userIndex >= 0) {
        savedUsers[userIndex] = updatedUser;
        localStorage.setItem('mealplan_users', JSON.stringify(savedUsers));
      }
    }
  };

  const skipEmailVerification = () => {
    if (pendingVerification && !pendingVerification.supabaseUser) {
      const verifiedUser = { ...pendingVerification, emailVerified: true };
      delete verifiedUser.verificationCode;

      const savedUsers = JSON.parse(localStorage.getItem('mealplan_users') || '[]');
      savedUsers.push(verifiedUser);
      localStorage.setItem('mealplan_users', JSON.stringify(savedUsers));

      localStorage.setItem('mealplan_user', JSON.stringify(verifiedUser));
      setUser(verifiedUser);
      setPendingVerification(null);

      toast.success('✅ Demo mode: Account verified automatically!');
      return { success: true };
    }
    return { success: false };
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
    resendVerificationCode,
    skipEmailVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};