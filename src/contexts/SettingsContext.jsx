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

  // Helper function to ensure we have a valid array for JSONB
  const ensureArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Helper function to get safe user ID as string
  const getSafeUserId = (userObj) => {
    if (!userObj) return null;
    return String(userObj.id || userObj.user_id || '');
  };

  // Load user preferences
  const loadPreferences = async () => {
    if (!user) return;

    const userId = getSafeUserId(user);
    if (!userId) {
      console.error('No valid user ID found');
      return;
    }

    try {
      setLoading(true);

      if (user.supabaseUser) {
        console.log('Loading preferences for Supabase user:', userId);
        
        const { data, error } = await supabase
          .from('user_preferences_mp2024')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading preferences:', error);
          throw error;
        }

        if (data) {
          console.log('Loaded preferences from Supabase:', data);
          
          const dietaryPreferences = ensureArray(data.dietary_preferences);
          const preferredCuisine = ensureArray(data.preferred_cuisine);

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
          await createInitialPreferences();
        }
      } else {
        // For demo/admin users, use local preferences
        console.log('Using local preferences for demo user');
        setPreferences({
          ...defaultPreferences,
          userId: userId,
          username: user.username || user.name || `user_${userId.slice(0, 8)}`,
          email: user.email,
          displayName: user.name,
          avatarUrl: user.avatar,
          lastUsernameChange: null,
          usernameChangeCount: 0
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Fallback to default preferences
      setPreferences({
        ...defaultPreferences,
        userId: userId,
        username: user.username || user.name || `user_${userId.slice(0, 8)}`,
        email: user.email,
        displayName: user.name,
        avatarUrl: user.avatar,
        lastUsernameChange: null,
        usernameChangeCount: 0
      });
      
      if (user.supabaseUser) {
        toast.error('Using default preferences - database unavailable');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create initial preferences record for Supabase users
  const createInitialPreferences = async () => {
    if (!user || !user.supabaseUser) return;

    const userId = getSafeUserId(user);
    if (!userId) {
      console.error('No valid user ID for creating preferences');
      return;
    }

    try {
      console.log('Creating initial preferences for Supabase user:', userId);

      const initialData = {
        user_id: userId,
        username: user.username || user.name || `user_${userId.slice(0, 8)}`,
        email: user.email,
        display_name: user.name,
        avatar_url: user.avatar,
        bio: '',
        dietary_preferences: [],
        cooking_skill_level: 'beginner',
        preferred_cuisine: [],
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
        if (error.code === '23505') {
          // Record already exists, try to load it
          console.log('Preferences already exist, loading existing record');
          await loadPreferences();
          return;
        }
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
        dietaryPreferences: ensureArray(data.dietary_preferences),
        cookingSkillLevel: data.cooking_skill_level || 'beginner',
        preferredCuisine: ensureArray(data.preferred_cuisine),
        notificationsEnabled: data.notifications_enabled ?? true,
        emailNotifications: data.email_notifications ?? true,
        themePreference: data.theme_preference || 'light',
        measurementSystem: data.measurement_system || 'metric',
        lastUsernameChange: data.last_username_change,
        usernameChangeCount: data.username_change_count || 0
      });
    } catch (error) {
      console.error('Error creating initial preferences:', error);
      // Fallback to local preferences
      setPreferences({
        ...defaultPreferences,
        userId: userId,
        username: user.username || user.name || `user_${userId.slice(0, 8)}`,
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
    const nextChange = new Date(lastChange.getTime() + (14 * 24 * 60 * 60 * 1000));
    const now = new Date();

    if (now >= nextChange) return 0;

    const diffTime = Math.abs(nextChange - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if user can change username
  const canChangeUsername = async () => {
    if (!user || !preferences) return false;
    return getDaysUntilUsernameChange() === 0;
  };

  // Update preferences
  const updatePreferences = async (updates) => {
    if (!user || !preferences) {
      console.error('Cannot update preferences: no user or preferences');
      return { success: false, error: 'No user or preferences loaded' };
    }

    const userId = getSafeUserId(user);
    if (!userId) {
      console.error('No valid user ID for updating preferences');
      return { success: false, error: 'Invalid user ID' };
    }

    setLoading(true);

    try {
      // Handle username change validation
      if (updates.username && updates.username !== preferences.username) {
        const canChange = await canChangeUsername();
        if (!canChange) {
          const daysLeft = getDaysUntilUsernameChange();
          const errorMsg = `You can change your username again in ${daysLeft} days`;
          toast.error(errorMsg);
          setLoading(false);
          return { success: false, error: errorMsg };
        }

        // Include username change tracking
        updates.last_username_change = new Date().toISOString();
        updates.username_change_count = (preferences.usernameChangeCount || 0) + 1;
      }

      // For Supabase users, update in database
      if (user.supabaseUser) {
        console.log('Updating Supabase preferences for user:', userId);

        const supabaseData = {
          user_id: userId,
          username: updates.username || preferences.username,
          email: updates.email || preferences.email,
          display_name: updates.displayName || preferences.displayName,
          avatar_url: updates.avatarUrl || preferences.avatarUrl,
          bio: updates.bio !== undefined ? updates.bio : preferences.bio,
          dietary_preferences: ensureArray(updates.dietaryPreferences || preferences.dietaryPreferences),
          cooking_skill_level: updates.cookingSkillLevel || preferences.cookingSkillLevel,
          preferred_cuisine: ensureArray(updates.preferredCuisine || preferences.preferredCuisine),
          notifications_enabled: updates.notificationsEnabled !== undefined ? updates.notificationsEnabled : preferences.notificationsEnabled,
          email_notifications: updates.emailNotifications !== undefined ? updates.emailNotifications : preferences.emailNotifications,
          theme_preference: updates.themePreference || preferences.themePreference,
          measurement_system: updates.measurementSystem || preferences.measurementSystem,
          updated_at: new Date().toISOString()
        };

        if (updates.last_username_change) {
          supabaseData.last_username_change = updates.last_username_change;
          supabaseData.username_change_count = updates.username_change_count;
        }

        // Try update first, then insert if needed
        const { data: updateData, error: updateError } = await supabase
          .from('user_preferences_mp2024')
          .update(supabaseData)
          .eq('user_id', userId)
          .select()
          .single();

        let data, error;
        if (updateError && updateError.code === 'PGRST116') {
          // No rows found, insert new record
          const insertResult = await supabase
            .from('user_preferences_mp2024')
            .insert(supabaseData)
            .select()
            .single();
          data = insertResult.data;
          error = insertResult.error;
        } else {
          data = updateData;
          error = updateError;
        }

        if (error) {
          throw error;
        }

        // Update local state with Supabase response
        const updatedPreferences = {
          userId: data.user_id,
          username: data.username,
          email: data.email,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          bio: data.bio || '',
          dietaryPreferences: ensureArray(data.dietary_preferences),
          cookingSkillLevel: data.cooking_skill_level || 'beginner',
          preferredCuisine: ensureArray(data.preferred_cuisine),
          notificationsEnabled: data.notifications_enabled ?? true,
          emailNotifications: data.email_notifications ?? true,
          themePreference: data.theme_preference || 'light',
          measurementSystem: data.measurement_system || 'metric',
          lastUsernameChange: data.last_username_change,
          usernameChangeCount: data.username_change_count || 0
        };

        setPreferences(updatedPreferences);

        // Update auth context
        if (updates.username || updates.displayName) {
          updateUser({
            username: data.username,
            name: data.display_name,
            avatar: data.avatar_url
          });
        }

        if (updates.username && updates.username !== preferences.username) {
          toast.success(`✅ Username updated to "${data.username}"!`);
        } else {
          toast.success('✅ Settings saved successfully!');
        }

        return { success: true, data: updatedPreferences };
      } else {
        // For demo/admin users, update locally
        console.log('Updating local preferences for demo user');
        
        const updatedPreferences = {
          ...preferences,
          ...updates,
          dietaryPreferences: ensureArray(updates.dietaryPreferences || preferences.dietaryPreferences),
          preferredCuisine: ensureArray(updates.preferredCuisine || preferences.preferredCuisine)
        };

        setPreferences(updatedPreferences);

        // Update auth context
        if (updates.username || updates.displayName) {
          updateUser({
            username: updates.username || preferences.username,
            name: updates.displayName || preferences.displayName,
            avatar: updates.avatarUrl || preferences.avatarUrl
          });
        }

        toast.success('✅ Settings saved locally!');
        return { success: true, data: updatedPreferences };
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      
      if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        // Database table issue, save locally
        const updatedPreferences = {
          ...preferences,
          ...updates,
          dietaryPreferences: ensureArray(updates.dietaryPreferences || preferences.dietaryPreferences),
          preferredCuisine: ensureArray(updates.preferredCuisine || preferences.preferredCuisine)
        };

        setPreferences(updatedPreferences);
        toast.success('Settings saved locally (database unavailable)');
        return { success: true, data: updatedPreferences };
      }

      toast.error('Failed to update preferences - please try again');
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
  }, [user?.id, user?.supabaseUser]);

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