import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import UsernameInput from './UsernameInput';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiUser, FiBell, FiSave, FiLogOut, FiStar, FiMail, FiEdit3, FiCheck, FiX, FiChevronDown } = FiIcons;

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Simple refs
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  const { user, logout } = useAuth();
  const { preferences, loading, updatePreferences } = useSettings();
  const navigate = useNavigate();

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simple click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    // Small delay to prevent immediate closing
    timeoutRef.current = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Initialize form data
  useEffect(() => {
    if (preferences) {
      setFormData({
        username: preferences.username || '',
        displayName: preferences.displayName || '',
        email: preferences.email || '',
        bio: preferences.bio || '',
        avatarUrl: preferences.avatarUrl || '',
        notificationsEnabled: preferences.notificationsEnabled ?? true,
        emailNotifications: preferences.emailNotifications ?? true,
      });
      setHasChanges(false);
    }
  }, [preferences]);

  // Check for changes
  useEffect(() => {
    if (!preferences) return;

    const hasFormChanges = 
      formData.username !== (preferences.username || '') ||
      formData.displayName !== (preferences.displayName || '') ||
      formData.bio !== (preferences.bio || '') ||
      formData.avatarUrl !== (preferences.avatarUrl || '') ||
      formData.notificationsEnabled !== (preferences.notificationsEnabled ?? true) ||
      formData.emailNotifications !== (preferences.emailNotifications ?? true);

    setHasChanges(hasFormChanges);
  }, [formData, preferences]);

  // ✅ FIX: Ensure proper navigation handling
  const handleNavigation = (path, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsOpen(false);
    
    // Add small delay to ensure dropdown closes first
    setTimeout(() => {
      navigate(path);
    }, 50);
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updatePreferences(formData);
      if (result.success) {
        setHasChanges(false);
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
    logout();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Profile Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 relative z-10"
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
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile Backdrop */}
              {isMobile && (
                <div
                  className="fixed inset-0 bg-black/50 z-[9998]"
                  onClick={handleClose}
                />
              )}

              {/* Dropdown */}
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, scale: 0.95, y: isMobile ? 20 : -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: isMobile ? 20 : -10 }}
                transition={{ duration: 0.2 }}
                className={`
                  fixed bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999]
                  ${isMobile 
                    ? 'bottom-4 left-4 right-4 max-h-[80vh]' 
                    : 'top-16 right-4 w-96 max-h-[70vh]'
                  }
                  flex flex-col overflow-hidden
                `}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full border-2 border-white/20"
                      />
                      <div>
                        <h3 className="font-bold text-lg">{user.name}</h3>
                        <p className="text-primary-100 text-sm">Level {user.level} • {user.xp} XP</p>
                      </div>
                      {user.isAdmin && (
                        <span className="bg-purple-500/20 text-purple-100 px-2 py-1 rounded-full text-xs font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <SafeIcon icon={FiX} className="text-xl" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all duration-500"
                      style={{ width: `${(user.xp % 100)}%` }}
                    />
                  </div>
                </div>

                {/* Tabs */}
                <div className="p-3 border-b border-gray-100">
                  <div className="flex space-x-1">
                    {[
                      { id: 'profile', name: 'Profile', icon: FiUser },
                      { id: 'notifications', name: 'Notifications', icon: FiBell }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs ${
                          activeTab === tab.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <SafeIcon icon={tab.icon} className="text-xs" />
                        <span>{tab.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
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
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={formData.displayName || ''}
                          onChange={(e) => handleInputChange('displayName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:outline-none"
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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:border-primary-500 focus:outline-none"
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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-500 focus:outline-none"
                          placeholder="https://example.com/avatar.jpg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Email (Read Only)
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-4">
                      <div className="p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">In-App Notifications</h4>
                            <p className="text-xs text-gray-600">Visual alerts for cooking reminders</p>
                          </div>
                          <button
                            onClick={() => handleInputChange('notificationsEnabled', !formData.notificationsEnabled)}
                            className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${
                              formData.notificationsEnabled ? 'bg-primary-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                                formData.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">Email Notifications</h4>
                            <p className="text-xs text-gray-600">Weekly recipe recommendations</p>
                          </div>
                          <button
                            onClick={() => handleInputChange('emailNotifications', !formData.emailNotifications)}
                            className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${
                              formData.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                                formData.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      {hasChanges && (
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 shadow-lg disabled:opacity-50"
                        >
                          {saving ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                          ) : (
                            <SafeIcon icon={FiSave} className="text-xs" />
                          )}
                          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                      <SafeIcon icon={FiLogOut} className="text-xs" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ProfileDropdown;