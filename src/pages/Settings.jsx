import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import Layout from '../components/Layout';
import UsernameInput from '../components/UsernameInput';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { 
  FiSettings, FiUser, FiBell, FiEye, FiGlobe, FiSave, FiCamera, 
  FiMail, FiLock, FiHeart, FiChef, FiMapPin, FiClock, FiShield,
  FiEdit3, FiCheck, FiX
} = FiIcons;

const Settings = () => {
  const { user } = useAuth();
  const { 
    preferences, 
    loading, 
    updatePreferences, 
    canChangeUsername,
    getDaysUntilUsernameChange 
  } = useSettings();

  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        username: preferences.username || '',
        displayName: preferences.displayName || '',
        email: preferences.email || '',
        bio: preferences.bio || '',
        avatarUrl: preferences.avatarUrl || '',
        dietaryPreferences: preferences.dietaryPreferences || [],
        cookingSkillLevel: preferences.cookingSkillLevel || 'beginner',
        preferredCuisine: preferences.preferredCuisine || [],
        notificationsEnabled: preferences.notificationsEnabled ?? true,
        emailNotifications: preferences.emailNotifications ?? true,
        themePreference: preferences.themePreference || 'light',
        measurementSystem: preferences.measurementSystem || 'metric'
      });
      setHasChanges(false);
    }
  }, [preferences]);

  // Check for changes
  useEffect(() => {
    if (!preferences) return;

    const hasFormChanges = 
      formData.username !== preferences.username ||
      formData.displayName !== preferences.displayName ||
      formData.bio !== preferences.bio ||
      formData.avatarUrl !== preferences.avatarUrl ||
      JSON.stringify(formData.dietaryPreferences) !== JSON.stringify(preferences.dietaryPreferences) ||
      formData.cookingSkillLevel !== preferences.cookingSkillLevel ||
      JSON.stringify(formData.preferredCuisine) !== JSON.stringify(preferences.preferredCuisine) ||
      formData.notificationsEnabled !== preferences.notificationsEnabled ||
      formData.emailNotifications !== preferences.emailNotifications ||
      formData.themePreference !== preferences.themePreference ||
      formData.measurementSystem !== preferences.measurementSystem;

    setHasChanges(hasFormChanges);
  }, [formData, preferences]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] || []), value]
        : (prev[field] || []).filter(item => item !== value)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const result = await updatePreferences(formData);
      if (result.success) {
        setHasChanges(false);
        toast.success('Settings saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: FiUser },
    { id: 'preferences', name: 'Preferences', icon: FiHeart },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
    { id: 'appearance', name: 'Appearance', icon: FiEye },
    { id: 'privacy', name: 'Privacy', icon: FiShield }
  ];

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 
    'Low-Carb', 'Keto', 'Paleo', 'Mediterranean', 'Halal', 'Kosher'
  ];

  const cuisineOptions = [
    'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'French',
    'Thai', 'Japanese', 'Chinese', 'American', 'Greek', 'Spanish',
    'Middle Eastern', 'Korean', 'Vietnamese', 'German'
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
    { value: 'intermediate', label: 'Intermediate', description: 'Comfortable with basics' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced cook' },
    { value: 'expert', label: 'Expert', description: 'Professional level' }
  ];

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Please sign in to access settings</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <SafeIcon icon={FiSettings} className="mr-4 text-primary-500" />
                Settings & Preferences
              </h1>
              <p className="text-gray-600 mt-2 font-medium">
                Customize your cooking experience
              </p>
            </div>
            
            {/* Save Button */}
            <AnimatePresence>
              {hasChanges && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-gradient text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center space-x-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <SafeIcon icon={FiSave} />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass rounded-2xl p-6 shadow-lg">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-500 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <SafeIcon icon={tab.icon} />
                    <span>{tab.name}</span>
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="glass rounded-2xl p-8 shadow-lg">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <SafeIcon icon={FiUser} className="mr-3 text-primary-500" />
                      Profile Information
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Username
                      </label>
                      <UsernameInput
                        value={formData.username || ''}
                        onChange={(value) => handleInputChange('username', value)}
                        showAvailability={true}
                      />
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName || ''}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                        placeholder="Your display name"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                        placeholder="your@email.com"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Avatar URL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        value={formData.avatarUrl || ''}
                        onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                        className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 input-modern rounded-xl font-medium resize-none"
                      placeholder="Tell us about yourself and your cooking journey..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(formData.bio || '').length}/500 characters
                    </p>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <SafeIcon icon={FiHeart} className="mr-3 text-primary-500" />
                      Cooking Preferences
                    </h2>
                  </div>

                  {/* Cooking Skill Level */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Cooking Skill Level
                    </label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {skillLevels.map((level) => (
                        <motion.label
                          key={level.value}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            formData.cookingSkillLevel === level.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="skillLevel"
                            value={level.value}
                            checked={formData.cookingSkillLevel === level.value}
                            onChange={(e) => handleInputChange('cookingSkillLevel', e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">{level.label}</div>
                              <div className="text-sm text-gray-600">{level.description}</div>
                            </div>
                            {formData.cookingSkillLevel === level.value && (
                              <SafeIcon icon={FiCheck} className="text-primary-500" />
                            )}
                          </div>
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Preferences */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Dietary Preferences
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {dietaryOptions.map((option) => (
                        <motion.label
                          key={option}
                          whileHover={{ scale: 1.02 }}
                          className={`p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                            (formData.dietaryPreferences || []).includes(option)
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={(formData.dietaryPreferences || []).includes(option)}
                            onChange={(e) => handleArrayChange('dietaryPreferences', option, e.target.checked)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{option}</span>
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Cuisine */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Preferred Cuisine Types
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {cuisineOptions.map((cuisine) => (
                        <motion.label
                          key={cuisine}
                          whileHover={{ scale: 1.02 }}
                          className={`p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                            (formData.preferredCuisine || []).includes(cuisine)
                              ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={(formData.preferredCuisine || []).includes(cuisine)}
                            onChange={(e) => handleArrayChange('preferredCuisine', cuisine, e.target.checked)}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{cuisine}</span>
                        </motion.label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <SafeIcon icon={FiBell} className="mr-3 text-primary-500" />
                      Notification Settings
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            <SafeIcon icon={FiBell} className="mr-2 text-primary-500" />
                            Push Notifications
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Receive notifications about cooking reminders, new recipes, and updates
                          </p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleInputChange('notificationsEnabled', !formData.notificationsEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                            formData.notificationsEnabled ? 'bg-primary-500' : 'bg-gray-300'
                          }`}
                        >
                          <motion.div
                            animate={{ x: formData.notificationsEnabled ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="w-6 h-6 bg-white rounded-full shadow-md"
                          />
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            <SafeIcon icon={FiMail} className="mr-2 text-blue-500" />
                            Email Notifications
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Receive weekly recipe recommendations and cooking tips via email
                          </p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleInputChange('emailNotifications', !formData.emailNotifications)}
                          className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                            formData.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                          }`}
                        >
                          <motion.div
                            animate={{ x: formData.emailNotifications ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="w-6 h-6 bg-white rounded-full shadow-md"
                          />
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <SafeIcon icon={FiEye} className="mr-3 text-primary-500" />
                      Appearance & Display
                    </h2>
                  </div>

                  {/* Theme Preference */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Theme Preference
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', description: 'Clean and bright' },
                        { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
                        { value: 'auto', label: 'Auto', description: 'Follow system' }
                      ].map((theme) => (
                        <motion.label
                          key={theme.value}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                            formData.themePreference === theme.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="theme"
                            value={theme.value}
                            checked={formData.themePreference === theme.value}
                            onChange={(e) => handleInputChange('themePreference', e.target.value)}
                            className="sr-only"
                          />
                          <div className="font-semibold text-gray-900">{theme.label}</div>
                          <div className="text-xs text-gray-600">{theme.description}</div>
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  {/* Measurement System */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Measurement System
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'metric', label: 'Metric', description: 'Grams, liters, Celsius' },
                        { value: 'imperial', label: 'Imperial', description: 'Ounces, cups, Fahrenheit' }
                      ].map((system) => (
                        <motion.label
                          key={system.value}
                          whileHover={{ scale: 1.02 }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            formData.measurementSystem === system.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="measurement"
                            value={system.value}
                            checked={formData.measurementSystem === system.value}
                            onChange={(e) => handleInputChange('measurementSystem', e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">{system.label}</div>
                              <div className="text-sm text-gray-600">{system.description}</div>
                            </div>
                            {formData.measurementSystem === system.value && (
                              <SafeIcon icon={FiCheck} className="text-primary-500" />
                            )}
                          </div>
                        </motion.label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <SafeIcon icon={FiShield} className="mr-3 text-primary-500" />
                      Privacy & Security
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Username Change Info */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                      <h3 className="font-semibold text-gray-900 flex items-center mb-3">
                        <SafeIcon icon={FiEdit3} className="mr-2 text-blue-500" />
                        Username Change Policy
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• You can change your username once every 14 days</p>
                        <p>• Username changes: {preferences?.usernameChangeCount || 0} time{(preferences?.usernameChangeCount || 0) !== 1 ? 's' : ''}</p>
                        {preferences?.lastUsernameChange && (
                          <p>• Last changed: {new Date(preferences.lastUsernameChange).toLocaleDateString()}</p>
                        )}
                        {getDaysUntilUsernameChange() > 0 && (
                          <p className="text-orange-600 font-medium">
                            • Next change available in: {getDaysUntilUsernameChange()} days
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Data Export */}
                    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                      <h3 className="font-semibold text-gray-900 flex items-center mb-3">
                        <SafeIcon icon={FiGlobe} className="mr-2 text-green-500" />
                        Data Management
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Export your recipe data, meal plans, and preferences
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition-colors duration-200"
                      >
                        Export My Data
                      </motion.button>
                    </div>

                    {/* Account Security */}
                    <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                      <h3 className="font-semibold text-gray-900 flex items-center mb-3">
                        <SafeIcon icon={FiLock} className="mr-2 text-red-500" />
                        Account Security
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage your account security settings
                      </p>
                      <div className="space-y-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="block bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-semibold hover:bg-orange-200 transition-colors duration-200"
                        >
                          Change Password
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="block bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors duration-200"
                        >
                          Delete Account
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;