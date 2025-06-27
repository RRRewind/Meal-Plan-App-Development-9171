import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import Layout from '../components/Layout';
import UsernameInput from '../components/UsernameInput';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiSettings, FiUser, FiSave } = FiIcons;

const Settings = () => {
  const { user } = useAuth();
  const { preferences, loading, updatePreferences } = useSettings();
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
        avatarUrl: preferences.avatarUrl || ''
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
      formData.avatarUrl !== preferences.avatarUrl;

    setHasChanges(hasFormChanges);
  }, [formData, preferences]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    { id: 'profile', name: 'Profile', icon: FiUser }
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
                Settings
              </h1>
              <p className="text-gray-600 mt-2 font-medium">
                Manage your profile and preferences
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
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;