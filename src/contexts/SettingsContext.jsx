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
  const [usernameAvailability, setUsernameAvailability] = useState({});
  const [checkingUsername, setCheckingUsername] = useState(false);
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

  // Load user preferences
  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences_mp2024')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setPreferences({
          ...defaultPreferences,
          username: data.username,
          email: data.email,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          bio: data.bio || '',
          dietaryPreferences: data.dietary_preferences || [],
          cookingSkillLevel: data.cooking_skill_level || 'beginner',
          preferredCuisine: data.preferred_cuisine || [],
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
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load preferences');
    }
  };

  // Create initial preferences record
  const createInitialPreferences = async () => {
    if (!user) return;

    try {
      const initialData = {
        user_id: user.id,
        username: user.username || user.name || `user_${user.id.slice(0, 8)}`,
        email: user.email,
        display_name: user.name,
        avatar_url: user.avatar,
        ...defaultPreferences
      };

      const { data, error } = await supabase
        .from('user_preferences_mp2024')
        .insert(initialData)
        .select()
        .single();

      if (error) throw error;

      setPreferences({
        ...defaultPreferences,
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
    }
  };

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailability(prev => ({
        ...prev,
        [username]: { available: false, reason: 'Username must be at least 3 characters' }
      }));
      return false;
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameAvailability(prev => ({
        ...prev,
        [username]: { available: false, reason: 'Username can only contain letters, numbers, and underscores' }
      }));
      return false;
    }

    // Check if it's the current user's username
    if (preferences?.username === username) {
      setUsernameAvailability(prev => ({
        ...prev,
        [username]: { available: true, reason: 'Current username' }
      }));
      return true;
    }

    setCheckingUsername(true);

    try {
      const { data, error } = await supabase
        .rpc('check_username_available_mp2024', {
          check_username: username,
          current_user_id: user?.id
        });

      if (error) throw error;

      const isAvailable = data === true;
      const result = {
        available: isAvailable,
        reason: isAvailable ? 'Username is available' : 'Username is already taken'
      };

      setUsernameAvailability(prev => ({
        ...prev,
        [username]: result
      }));

      return isAvailable;

    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameAvailability(prev => ({
        ...prev,
        [username]: { available: false, reason: 'Error checking availability' }
      }));
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  // Check if user can change username
  const canChangeUsername = async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('can_change_username_mp2024', {
          user_id_param: user.id
        });

      if (error) throw error;
      return data === true;

    } catch (error) {
      console.error('Error checking username change cooldown:', error);
      return false;
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

  // Update preferences
  const updatePreferences = async (updates) => {
    if (!user || !preferences) return { success: false };

    setLoading(true);

    try {
      // Handle username change separately due to cooldown
      if (updates.username && updates.username !== preferences.username) {
        const canChange = await canChangeUsername();
        if (!canChange) {
          const daysLeft = getDaysUntilUsernameChange();
          toast.error(`You can change your username again in ${daysLeft} days`);
          setLoading(false);
          return { success: false, error: 'Username change cooldown active' };
        }

        // Check if username is available
        const isAvailable = await checkUsernameAvailability(updates.username);
        if (!isAvailable) {
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
        dietary_preferences: updates.dietaryPreferences || preferences.dietaryPreferences,
        cooking_skill_level: updates.cookingSkillLevel || preferences.cookingSkillLevel,
        preferred_cuisine: updates.preferredCuisine || preferences.preferredCuisine,
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

      const { data, error } = await supabase
        .from('user_preferences_mp2024')
        .upsert(supabaseData)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const updatedPreferences = {
        username: data.username,
        email: data.email,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        bio: data.bio || '',
        dietaryPreferences: data.dietary_preferences || [],
        cookingSkillLevel: data.cooking_skill_level || 'beginner',
        preferredCuisine: data.preferred_cuisine || [],
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

      toast.success('Preferences updated successfully!');
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
    usernameAvailability,
    checkingUsername,
    updatePreferences,
    checkUsernameAvailability,
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