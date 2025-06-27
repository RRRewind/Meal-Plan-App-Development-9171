import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();

  // Default preferences
  const defaultPreferences = {
    dietaryPreferences: [],
    cookingSkillLevel: 'beginner',
    preferredCuisine: [],
    notificationsEnabled: true,
    emailNotifications: true,
    themePreference: 'light',
    measurementSystem: 'metric',
    bio: ''
  };

  // Load user preferences with better error handling
  const loadPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading preferences for user:', user.id);

      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from('user_preferences_mp2024')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Supabase connection test failed:', testError);
        // Fallback to local preferences
        setPreferences({
          ...defaultPreferences,
          userId: user.id,
          username: user.username || user.name || `user_${user.id.slice(0, 8)}`,
          email: user.email,
          displayName: user.name,
          avatarUrl: user.avatar,
          lastUsernameChange: null,
          usernameChangeCount: 0
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences_mp2024')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading preferences:', error);
        throw error;
      }

      if (data) {
        console.log('Loaded preferences:', data);
        
        // Parse JSON fields safely
        let dietaryPreferences = [];
        let preferredCuisine = [];
        
        try {
          dietaryPreferences = typeof data.dietary_preferences === 'string' 
            ? JSON.parse(data.dietary_preferences) 
            : (data.dietary_preferences || []);
        } catch (e) {
          console.warn('Failed to parse dietary preferences:', e);
          dietaryPreferences = [];
        }

        try {
          preferredCuisine = typeof data.preferred_cuisine === 'string' 
            ? JSON.parse(data.preferred_cuisine) 
            : (data.preferred_cuisine || []);
        } catch (e) {
          console.warn('Failed to parse preferred cuisine:', e);
          preferredCuisine = [];
        }

        setPreferences({
          ...defaultPreferences,
          userId: data.user_id,
          username: data.username,
          email: data.email,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          bio: data.bio || '',
          dietaryPreferences,
          cookingSkillLevel: data.cooking_skill_level || 'beginner',
          preferredCuisine,
          notificationsEnabled: data.notifications_enabled ?? true,
          emailNotifications: data.email_notifications ?? true,
          themePreference: data.theme_preference || 'light',
          measurementSystem: data.measurement_system || 'metric',
          lastUsernameChange: data.last_username_change,
          usernameChangeCount: data.username_change_count || 0
        });
      } else {
        // Create initial preferences record
        console.log('No preferences found, creating initial record');
        await createInitialPreferences();
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load preferences - using defaults');
      
      // Fallback to default preferences
      setPreferences({
        ...defaultPreferences,
        userId: user.id,
        username: user.username || user.name || `user_${user.id.slice(0, 8)}`,
        email: user.email,
        displayName: user.name,
        avatarUrl: user.avatar,
        lastUsernameChange: null,
        usernameChangeCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Create initial preferences record
  const createInitialPreferences = async () => {
    if (!user) return;

    try {
      console.log('Creating initial preferences for user:', user.id);
      
      const initialData = {
        user_id: user.id,
        username: user.username || user.name || `user_${user.id.slice(0, 8)}`,
        email: user.email,
        display_name: user.name,
        avatar_url: user.avatar,
        bio: '',
        dietary_preferences: JSON.stringify([]),
        cooking_skill_level: 'beginner',
        preferred_cuisine: JSON.stringify([]),
        notifications_enabled: true,
        email_notifications: true,
        theme_preference: 'light',
        measurement_system: 'metric',
        username_change_count: 0
      };

      const { data, error } = await supabase
        .from('user_preferences_mp2024')
        .insert(initialData)
        .select()
        .single();

      if (error) {
        console.error('Error creating initial preferences:', error);
        throw error;
      }

      console.log('Created initial preferences:', data);

      setPreferences({
        ...defaultPreferences,
        userId: data.user_id,
        username: data.username,
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        bio: data.bio || '',
        lastUsernameChange: data.last_username_change,
        usernameChangeCount: data.username_change_count || 0
      });
    } catch (error) {
      console.error('Error creating initial preferences:', error);
      toast.error('Failed to initialize preferences');
      
      // Fallback to local preferences
      setPreferences({
        ...defaultPreferences,
        userId: user.id,
        username: user.username || user.name || `user_${user.id.slice(0, 8)}`,
        email: user.email,
        displayName: user.name,
        avatarUrl: user.avatar,
        lastUsernameChange: null,
        usernameChangeCount: 0
      });
    }
  };

  // Get days until next username change
  const getDaysUntilUsernameChange = () => {
    if (!preferences?.lastUsernameChange) return 0;
    
    const lastChange = new Date(preferences.lastUsernameChange);
    const nextChange = new Date(lastChange.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days
    const now = new Date();
    
    if (now >= nextChange) return 0;
    
    const diffTime = Math.abs(nextChange - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if user can change username
  const canChangeUsername = async () => {
    if (!user || !preferences) return false;
    
    try {
      // Simple check - allow if no previous change or 14 days have passed
      return getDaysUntilUsernameChange() === 0;
    } catch (error) {
      console.error('Error checking username change cooldown:', error);
      return getDaysUntilUsernameChange() === 0;
    }
  };

  // Update preferences with enhanced error handling
  const updatePreferences = async (updates) => {
    if (!user || !preferences) {
      console.error('Cannot update preferences: no user or preferences');
      return { success: false, error: 'No user or preferences loaded' };
    }

    setLoading(true);

    try {
      console.log('Updating preferences:', updates);

      // Handle username change separately due to cooldown
      if (updates.username && updates.username !== preferences.username) {
        const canChange = await canChangeUsername();
        if (!canChange) {
          const daysLeft = getDaysUntilUsernameChange();
          const errorMsg = `You can change your username again in ${daysLeft} days`;
          toast.error(errorMsg);
          setLoading(false);
          return { success: false, error: errorMsg };
        }

        // Check if username is available (simple check)
        const { data: existingUsers, error: checkError } = await supabase
          .from('user_preferences_mp2024')
          .select('username')
          .ilike('username', updates.username)
          .neq('user_id', user.id);

        if (checkError) {
          console.error('Username availability check error:', checkError);
        } else if (existingUsers && existingUsers.length > 0) {
          toast.error('Username is not available');
          setLoading(false);
          return { success: false, error: 'Username not available' };
        }

        // Include username change tracking
        updates.last_username_change = new Date().toISOString();
        updates.username_change_count = (preferences.usernameChangeCount || 0) + 1;
      }

      // Prepare data for Supabase
      const supabaseData = {
        user_id: user.id,
        username: updates.username || preferences.username,
        email: updates.email || preferences.email,
        display_name: updates.displayName || preferences.displayName,
        avatar_url: updates.avatarUrl || preferences.avatarUrl,
        bio: updates.bio !== undefined ? updates.bio : preferences.bio,
        dietary_preferences: JSON.stringify(updates.dietaryPreferences || preferences.dietaryPreferences),
        cooking_skill_level: updates.cookingSkillLevel || preferences.cookingSkillLevel,
        preferred_cuisine: JSON.stringify(updates.preferredCuisine || preferences.preferredCuisine),
        notifications_enabled: updates.notificationsEnabled !== undefined ? updates.notificationsEnabled : preferences.notificationsEnabled,
        email_notifications: updates.emailNotifications !== undefined ? updates.emailNotifications : preferences.emailNotifications,
        theme_preference: updates.themePreference || preferences.themePreference,
        measurement_system: updates.measurementSystem || preferences.measurementSystem,
        updated_at: new Date().toISOString()
      };

      // Include username change tracking if applicable
      if (updates.last_username_change) {
        supabaseData.last_username_change = updates.last_username_change;
        supabaseData.username_change_count = updates.username_change_count;
      }

      console.log('Sending to Supabase:', supabaseData);

      const { data, error } = await supabase
        .from('user_preferences_mp2024')
        .upsert(supabaseData)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      // Parse the returned data
      let dietaryPreferences = [];
      let preferredCuisine = [];
      
      try {
        dietaryPreferences = typeof data.dietary_preferences === 'string' 
          ? JSON.parse(data.dietary_preferences) 
          : (data.dietary_preferences || []);
      } catch (e) {
        console.warn('Failed to parse returned dietary preferences:', e);
        dietaryPreferences = updates.dietaryPreferences || preferences.dietaryPreferences;
      }

      try {
        preferredCuisine = typeof data.preferred_cuisine === 'string' 
          ? JSON.parse(data.preferred_cuisine) 
          : (data.preferred_cuisine || []);
      } catch (e) {
        console.warn('Failed to parse returned preferred cuisine:', e);
        preferredCuisine = updates.preferredCuisine || preferences.preferredCuisine;
      }

      // Update local state
      const updatedPreferences = {
        userId: data.user_id,
        username: data.username,
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        bio: data.bio || '',
        dietaryPreferences,
        cookingSkillLevel: data.cooking_skill_level || 'beginner',
        preferredCuisine,
        notificationsEnabled: data.notifications_enabled ?? true,
        emailNotifications: data.email_notifications ?? true,
        themePreference: data.theme_preference || 'light',
        measurementSystem: data.measurement_system || 'metric',
        lastUsernameChange: data.last_username_change,
        usernameChangeCount: data.username_change_count || 0
      };

      setPreferences(updatedPreferences);

      // Update auth context if username/display name changed
      if (updates.username || updates.displayName) {
        updateUser({
          username: data.username,
          name: data.display_name,
          avatar: data.avatar_url
        });
      }

      // Show specific success message for username changes
      if (updates.username && updates.username !== preferences.username) {
        toast.success(`✅ Username updated to "${data.username}"!`);
      } else {
        toast.success('Settings saved successfully!');
      }

      return { success: true, data: updatedPreferences };

    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Load preferences when user changes
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(null);
    }
  }, [user]);

  const value = {
    preferences,
    loading,
    updatePreferences,
    canChangeUsername,
    getDaysUntilUsernameChange,
    loadPreferences
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};