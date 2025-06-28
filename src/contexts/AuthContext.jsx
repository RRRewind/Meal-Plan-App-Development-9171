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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (session?.user && mounted) {
          const supabaseUser = await createUserFromSupabaseAuth(session.user);
          setUser(supabaseUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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
          setPendingVerification(null);
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setPendingVerification(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const supabaseUser = await createUserFromSupabaseAuth(session.user);
          setUser(supabaseUser);
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
      supabaseUser: true
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
          supabaseUser: false
        };

        setUser(adminUser);
        toast.success('🛡️ Admin access granted!');
        return { success: true };
      }

      // Try Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

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

      // ✅ ALWAYS CREATE REAL SUPABASE ACCOUNT
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
        return { success: false, error: error.message };
      }

      // ✅ Account is NOW PERSISTED in Supabase auth.users table
      console.log('✅ Account created in Supabase:', data.user.id);

      if (data.user && !data.user.email_confirmed_at) {
        // Set pending verification with demo code
        const demoVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        setPendingVerification({
          email: email,
          userId: data.user.id, // ✅ Real Supabase user ID
          demoCode: demoVerificationCode,
          supabaseUser: data.user // ✅ Store the actual Supabase user object
        });

        toast.success(`📧 Demo verification code: ${demoVerificationCode}`, {
          duration: 8000
        });

        return {
          success: true,
          requiresVerification: true,
          verificationCode: demoVerificationCode,
          message: 'Account created in Supabase! Please verify your email.'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (user?.supabaseUser) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase logout error:', error);
        }
      }

      setUser(null);
      setPendingVerification(null);
      toast.success('Logged out successfully');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setPendingVerification(null);
      window.location.href = '/';
    }
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
  };

  // ✅ Email verification with REAL Supabase account
  const verifyEmail = async (code) => {
    if (!pendingVerification) {
      return { success: false, error: 'No pending verification found' };
    }

    try {
      setLoading(true);

      // In demo mode, check against the demo code
      if (code === pendingVerification.demoCode) {
        // ✅ IMPORTANT: Use the REAL Supabase user that was created during registration
        if (pendingVerification.supabaseUser) {
          // Create user from the actual Supabase user object
          const supabaseUser = await createUserFromSupabaseAuth(pendingVerification.supabaseUser);
          setUser(supabaseUser);
          setPendingVerification(null);
          
          console.log('✅ Using REAL Supabase account:', pendingVerification.supabaseUser.id);
          toast.success('✅ Email verified! Account is persisted in Supabase.');
          return { success: true };
        } else {
          // Fallback: clear pending verification
          setPendingVerification(null);
          toast.success('✅ Email verified successfully!');
          return { success: true };
        }
      } else {
        return { success: false, error: 'Invalid verification code' };
      }
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend verification code
  const resendVerificationCode = async () => {
    if (!pendingVerification) {
      return { success: false, error: 'No pending verification found' };
    }

    try {
      // Generate new demo code
      const newDemoCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      setPendingVerification(prev => ({
        ...prev,
        demoCode: newDemoCode
      }));

      toast.success(`📧 New demo verification code: ${newDemoCode}`, {
        duration: 8000
      });

      return { success: true };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: error.message };
    }
  };

  // ✅ UPDATED: Skip verification but KEEP Supabase account
  const skipEmailVerification = async () => {
    if (!pendingVerification) {
      return { success: false, error: 'No pending verification found' };
    }

    try {
      setLoading(true);

      // ✅ IMPORTANT: Use the REAL Supabase account that was created during registration
      if (pendingVerification.supabaseUser) {
        // Create user from the actual Supabase user object
        const supabaseUser = await createUserFromSupabaseAuth(pendingVerification.supabaseUser);
        
        // Mark as unverified but still a real Supabase user
        supabaseUser.emailVerified = false;
        
        setUser(supabaseUser);
        setPendingVerification(null);
        
        console.log('✅ Using REAL Supabase account (unverified):', pendingVerification.supabaseUser.id);
        toast.success('🚀 Demo mode activated! Your account is saved in Supabase.', {
          duration: 4000
        });

        return { success: true };
      } else {
        // Fallback to demo user (shouldn't happen with new flow)
        const demoUser = {
          id: pendingVerification.userId || `demo_${Date.now()}`,
          email: pendingVerification.email,
          name: pendingVerification.email.split('@')[0],
          username: pendingVerification.email.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pendingVerification.email}`,
          joinDate: new Date().toISOString(),
          level: 1,
          xp: 0,
          streakDays: 0,
          recipesCooked: 0,
          badges: ['new_chef'],
          isAdmin: false,
          emailVerified: false,
          supabaseUser: false
        };

        setUser(demoUser);
        setPendingVerification(null);

        toast.success('🚀 Demo mode activated! Welcome to Meal Plan!', {
          duration: 4000
        });

        return { success: true };
      }
    } catch (error) {
      console.error('Skip verification error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
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
    resendVerificationCode,
    skipEmailVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};