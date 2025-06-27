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

  // Load user preferences
  const loadPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
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
          userId: data.user_id,
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
    } finally {
      setLoading(false);
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
      const { data, error } = await supabase
        .rpc('can_change_username_mp2024', {
          user_id_param: user.id
        });

      if (error) {
        console.error('RPC Error:', error);
        // Fallback to local calculation
        return getDaysUntilUsernameChange() === 0;
      }
      
      return data === true;

    } catch (error) {
      console.error('Error checking username change cooldown:', error);
      // Fallback to local calculation
      return getDaysUntilUsernameChange() === 0;
    }
  };

  // Update preferences with enhanced username handling
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
        const { data: availabilityData, error: availabilityError } = await supabase
          .rpc('check_username_available_mp2024', {
            check_username: updates.username,
            current_user_id: user.id
          });

        if (availabilityError) {
          console.error('Username availability check error:', availabilityError);
          toast.error('Failed to check username availability');
          setLoading(false);
          return { success: false, error: 'Unable to verify username availability' };
        }

        if (!availabilityData) {
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
        userId: data.user_id,
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