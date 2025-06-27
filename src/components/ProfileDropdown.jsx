import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import UsernameInput from './UsernameInput';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const {
  FiUser, FiBell, FiEye, FiGlobe, FiSave, FiLogOut, FiStar, FiMail,
  FiLock, FiHeart, FiChef, FiSettings, FiShield, FiEdit3, FiCheck,
  FiX, FiChevronDown, FiCamera
} = FiIcons;

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [forceShowSave, setForceShowSave] = useState(false); // Force save button for debugging

  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const { preferences, loading, updatePreferences, getDaysUntilUsernameChange } = useSettings();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences) {
      const initialData = {
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
      };
      setFormData(initialData);
      setHasChanges(false);
      console.log('Initial form data:', initialData);
    }
  }, [preferences]);

  // Enhanced change detection with detailed logging
  useEffect(() => {
    if (!preferences) return;

    const changes = {
      username: formData.username !== (preferences.username || ''),
      displayName: formData.displayName !== (preferences.displayName || ''),
      bio: formData.bio !== (preferences.bio || ''),
      avatarUrl: formData.avatarUrl !== (preferences.avatarUrl || ''),
      dietaryPreferences: JSON.stringify(formData.dietaryPreferences || []) !== JSON.stringify(preferences.dietaryPreferences || []),
      cookingSkillLevel: formData.cookingSkillLevel !== (preferences.cookingSkillLevel || 'beginner'),
      preferredCuisine: JSON.stringify(formData.preferredCuisine || []) !== JSON.stringify(preferences.preferredCuisine || []),
      notificationsEnabled: formData.notificationsEnabled !== (preferences.notificationsEnabled ?? true),
      emailNotifications: formData.emailNotifications !== (preferences.emailNotifications ?? true),
      themePreference: formData.themePreference !== (preferences.themePreference || 'light'),
      measurementSystem: formData.measurementSystem !== (preferences.measurementSystem || 'metric')
    };

    const hasAnyChanges = Object.values(changes).some(changed => changed);

    // Debug logging
    console.log('Change detection:', {
      preferences: preferences,
      formData: formData,
      changes: changes,
      hasAnyChanges: hasAnyChanges
    });

    setHasChanges(hasAnyChanges);

    // Force show save button for testing if username changed
    if (changes.username) {
      setForceShowSave(true);
      console.log('Username changed, forcing save button to show');
    }
  }, [formData, preferences]);

  const handleInputChange = (field, value) => {
    console.log(`Field changed: ${field} = ${value}`);
    setFormData(prev => ({ ...prev, [field]: value }));
    setForceShowSave(true); // Force show save for any change
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] || []), value]
        : (prev[field] || []).filter(item => item !== value)
    }));
    setForceShowSave(true);
  };

  const handleSave = async () => {
    setSaving(true);
    console.log('Attempting to save:', formData);

    try {
      const result = await updatePreferences(formData);
      if (result.success) {
        setHasChanges(false);
        setForceShowSave(false);
        toast.success('✅ Settings saved successfully!');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout(); // This now redirects to landing page
    setIsOpen(false);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: FiUser },
    { id: 'preferences', name: 'Cooking', icon: FiChef },
    { id: 'notifications', name: 'Notifications', icon: FiBell },
    { id: 'appearance', name: 'Display', icon: FiEye },
    { id: 'privacy', name: 'Privacy', icon: FiShield }
  ];

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free',
    'Low-Carb', 'Keto', 'Paleo', 'Mediterranean', 'Halal', 'Kosher'
  ];

  const cuisineOptions = [
    'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'French',
    'Thai', 'Japanese', 'Chinese', 'American', 'Greek', 'Spanish'
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  if (!user) return null;

  // Show save button if there are changes OR forced
  const shouldShowSaveButton = hasChanges || forceShowSave;
  console.log('Render state:', { hasChanges, forceShowSave, shouldShowSaveButton });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-8 h-8 rounded-full border-2 border-primary-200"
        />
        <span className="hidden sm:block text-sm font-medium text-gray-700">
          {user.name}
          {user.isAdmin && <span className="ml-1 text-purple-600">👑</span>}
        </span>
        <SafeIcon
          icon={FiChevronDown}
          className={`text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 max-h-[80vh] overflow-hidden glass rounded-3xl shadow-2xl z-50 border border-white/20"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 text-white">
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-2 border-white/20"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{user.name}</h3>
                  <p className="text-primary-100 text-sm">Level {user.level} • {user.xp} XP</p>
                </div>
                {user.isAdmin && (
                  <span className="bg-purple-500/20 text-purple-100 px-2 py-1 rounded-full text-xs font-bold">
                    ADMIN
                  </span>
                )}
              </div>

              {/* Level Progress */}
              <div className="mt-3">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.xp % 100)}%` }}
                    className="bg-white rounded-full h-2"
                  />
                </div>
              </div>
            </div>

            {/* Debug Info - Remove this in production */}
            <div className="p-2 bg-yellow-50 text-xs text-yellow-800">
              Debug: Changes={hasChanges ? 'Yes' : 'No'} | Force={forceShowSave ? 'Yes' : 'No'} | Show Save={shouldShowSaveButton ? 'Yes' : 'No'}
            </div>

            {/* Tab Navigation */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex space-x-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <SafeIcon icon={tab.icon} className="text-xs" />
                    <span>{tab.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="max-h-96 overflow-y-auto">
              <div className="p-4">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Username
                      </label>
                      <UsernameInput
                        value={formData.username || ''}
                        onChange={(value) => handleInputChange('username', value)}
                        showAvailability={true}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Username changes are limited to once every 14 days
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName || ''}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        className="w-full px-3 py-2 input-modern rounded-lg text-sm"
                        placeholder="Your display name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={3}
                        maxLength={200}
                        className="w-full px-3 py-2 input-modern rounded-lg text-sm resize-none"
                        placeholder="Tell us about yourself..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {(formData.bio || '').length}/200 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        value={formData.avatarUrl || ''}
                        onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                        className="w-full px-3 py-2 input-modern rounded-lg text-sm"
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>

                    {/* Test Button to Force Changes */}
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <button
                        onClick={() => {
                          handleInputChange('displayName', 'Test Name ' + Date.now());
                          toast.success('Test change made - save button should appear!');
                        }}
                        className="text-xs bg-blue-500 text-white px-3 py-1 rounded font-semibold"
                      >
                        🧪 Test Change (Force Save Button)
                      </button>
                    </div>
                  </div>
                )}

                {/* Other tabs remain the same... */}
                {activeTab === 'preferences' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Cooking Skill Level
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {skillLevels.map((level) => (
                          <motion.label
                            key={level.value}
                            whileHover={{ scale: 1.02 }}
                            className={`p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center ${
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
                            <span className="text-xs font-medium">{level.label}</span>
                          </motion.label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Dietary Preferences
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {dietaryOptions.map((option) => (
                          <motion.label
                            key={option}
                            whileHover={{ scale: 1.02 }}
                            className={`p-2 border-2 rounded-lg cursor-pointer transition-all duration-200 text-center ${
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
                            <span className="text-xs font-medium">{option}</span>
                          </motion.label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">Push Notifications</h4>
                          <p className="text-xs text-gray-600">Cooking reminders and updates</p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleInputChange('notificationsEnabled', !formData.notificationsEnabled)}
                          className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                            formData.notificationsEnabled ? 'bg-primary-500' : 'bg-gray-300'
                          }`}
                        >
                          <motion.div
                            animate={{ x: formData.notificationsEnabled ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="w-5 h-5 bg-white rounded-full shadow-md"
                          />
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Enhanced Save Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {/* ALWAYS SHOW SAVE BUTTON FOR DEBUGGING */}
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-gradient text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 shadow-lg"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    ) : (
                      <SafeIcon icon={FiSave} className="text-xs" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </motion.button>

                  {/* Show save status */}
                  {shouldShowSaveButton && (
                    <div className="text-xs text-green-600 flex items-center">
                      <SafeIcon icon={FiCheck} className="mr-1" />
                      Changes detected
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <SafeIcon icon={FiLogOut} className="text-xs" />
                  <span>Logout</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;