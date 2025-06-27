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
    // Convert to string to ensure compatibility with TEXT column
    return String(userObj.id || userObj.user_id || '');
  };

  // Load user preferences with better error handling
  const loadPreferences = async () => {
    if (!user) return;

    const userId = getSafeUserId(user);
    if (!userId) {
      console.error('No valid user ID found');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading preferences for user ID (as string):', userId);

      const { data, error } = await supabase
        .from('user_preferences_mp2024')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading preferences:', error);
        
        // If table doesn't exist or other DB error, use local storage
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('Database table not found, using local preferences');
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
          return;
        }
        
        throw error;
      }

      if (data) {
        console.log('Loaded preferences from DB:', data);
        
        // Handle JSONB arrays properly - they come as actual arrays from PostgreSQL
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
        console.log('No preferences found, creating initial record');
        await createInitialPreferences();
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Using local preferences - database unavailable');
      
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
    } finally {
      setLoading(false);
    }
  };

  // Create initial preferences record
  const createInitialPreferences = async () => {
    if (!user) return;

    const userId = getSafeUserId(user);
    if (!userId) {
      console.error('No valid user ID for creating preferences');
      return;
    }

    try {
      console.log('Creating initial preferences for user ID:', userId);
      
      const initialData = {
        user_id: userId, // Now sending as string
        username: user.username || user.name || `user_${userId.slice(0, 8)}`,
        email: user.email,
        display_name: user.name,
        avatar_url: user.avatar,
        bio: '',
        dietary_preferences: [], // Send as actual array for JSONB
        cooking_skill_level: 'beginner',
        preferred_cuisine: [], // Send as actual array for JSONB
        notifications_enabled: true,
        email_notifications: true,
        theme_preference: 'light',
        measurement_system: 'metric',
        username_change_count: 0
      };

      console.log('Inserting initial data:', initialData);

      const { data, error } = await supabase
        .from('user_preferences_mp2024')
        .insert(initialData)
        .select()
        .single();

      if (error) {
        console.error('Error creating initial preferences:', error);
        
        // If it's a duplicate key error, try to load existing record instead
        if (error.code === '23505') {
          console.log('Record already exists, loading existing preferences');
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
      toast.error('Failed to initialize preferences - using local storage');
      
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

  // Update preferences with enhanced error handling and proper upsert
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
      console.log('Updating preferences for user ID:', userId, 'with updates:', updates);

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
        try {
          const { data: existingUsers, error: checkError } = await supabase
            .from('user_preferences_mp2024')
            .select('username')
            .ilike('username', updates.username)
            .neq('user_id', userId);

          if (checkError) {
            console.error('Username availability check error:', checkError);
          } else if (existingUsers && existingUsers.length > 0) {
            toast.error('Username is not available');
            setLoading(false);
            return { success: false, error: 'Username not available' };
          }
        } catch (checkError) {
          console.warn('Could not check username availability:', checkError);
          // Continue anyway - might be a database issue
        }

        // Include username change tracking
        updates.last_username_change = new Date().toISOString();
        updates.username_change_count = (preferences.usernameChangeCount || 0) + 1;
      }

      // Prepare data for Supabase - send arrays directly for JSONB columns
      const supabaseData = {
        user_id: userId, // Ensure this is a string
        username: updates.username || preferences.username,
        email: updates.email || preferences.email,
        display_name: updates.displayName || preferences.displayName,
        avatar_url: updates.avatarUrl || preferences.avatarUrl,
        bio: updates.bio !== undefined ? updates.bio : preferences.bio,
        dietary_preferences: ensureArray(updates.dietaryPreferences || preferences.dietaryPreferences), // Direct array for JSONB
        cooking_skill_level: updates.cookingSkillLevel || preferences.cookingSkillLevel,
        preferred_cuisine: ensureArray(updates.preferredCuisine || preferences.preferredCuisine), // Direct array for JSONB
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

      console.log('Sending to Supabase (with TEXT user_id and direct arrays):', supabaseData);

      // First try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('user_preferences_mp2024')
        .update(supabaseData)
        .eq('user_id', userId)
        .select()
        .single();

      let data, error;

      if (updateError && updateError.code === 'PGRST116') {
        // No rows found to update, try insert
        console.log('No existing record found, inserting new one');
        const insertResult = await supabase
          .from('user_preferences_mp2024')
          .insert(supabaseData)
          .select()
          .single();
        
        data = insertResult.data;
        error = insertResult.error;
      } else {
        // Update was successful or had a different error
        data = updateData;
        error = updateError;
      }

      if (error) {
        console.error('Supabase operation error:', error);
        
        // Handle duplicate key error by trying update again
        if (error.code === '23505') {
          console.log('Duplicate key error, trying update again');
          const retryResult = await supabase
            .from('user_preferences_mp2024')
            .update(supabaseData)
            .eq('user_id', userId)
            .select()
            .single();
          
          data = retryResult.data;
          error = retryResult.error;
          
          if (error) {
            throw error;
          }
        } else if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.log('Database table issue, saving locally');
          
          // Update local state directly
          const updatedPreferences = {
            ...preferences,
            ...updates,
            dietaryPreferences: ensureArray(updates.dietaryPreferences || preferences.dietaryPreferences),
            preferredCuisine: ensureArray(updates.preferredCuisine || preferences.preferredCuisine)
          };
          
          setPreferences(updatedPreferences);
          
          // Update auth context if username/display name changed
          if (updates.username || updates.displayName) {
            updateUser({
              username: updates.username || preferences.username,
              name: updates.displayName || preferences.displayName,
              avatar: updates.avatarUrl || preferences.avatarUrl
            });
          }
          
          toast.success('Settings saved locally (database unavailable)');
          return { success: true, data: updatedPreferences };
        } else {
          throw error;
        }
      }

      console.log('Database operation successful:', data);

      // Handle the returned data - JSONB arrays come back as actual arrays
      const dietaryPreferences = ensureArray(data.dietary_preferences);
      const preferredCuisine = ensureArray(data.preferred_cuisine);

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
        toast.success('✅ Settings saved successfully!');
      }

      return { success: true, data: updatedPreferences };

    } catch (error) {
      console.error('Error updating preferences:', error);
      
      // Provide more specific error messages
      if (error.message && error.message.includes('invalid input syntax for type uuid')) {
        toast.error('User ID format error - please refresh and try again');
      } else if (error.message && error.message.includes('malformed array literal')) {
        toast.error('Database format error - please try refreshing and signing in again');
      } else if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
        toast.error('Settings conflict - please refresh and try again');
      } else if (error.message && (error.message.includes('relation') || error.message.includes('does not exist'))) {
        toast.error('Database unavailable - changes saved locally');
        
        // Save locally as fallback
        const updatedPreferences = {
          ...preferences,
          ...updates,
          dietaryPreferences: ensureArray(updates.dietaryPreferences || preferences.dietaryPreferences),
          preferredCuisine: ensureArray(updates.preferredCuisine || preferences.preferredCuisine)
        };
        setPreferences(updatedPreferences);
        
        return { success: true, data: updatedPreferences };
      } else {
        toast.error('Failed to update preferences - please try again');
      }
      
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