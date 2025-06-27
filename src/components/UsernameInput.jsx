import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheck, FiX, FiLoader, FiClock, FiAlertCircle } = FiIcons;

const UsernameInput = ({ 
  value, 
  onChange, 
  showAvailability = true, 
  disabled = false,
  className = "" 
}) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isCheckingLocal, setIsCheckingLocal] = useState(false);
  const { 
    usernameAvailability, 
    checkingUsername, 
    checkUsernameAvailability,
    preferences,
    getDaysUntilUsernameChange,
    canChangeUsername
  } = useSettings();
  
  const [canChange, setCanChange] = useState(true);
  const [cooldownDays, setCooldownDays] = useState(0);

  // Debounce username input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Check availability when debounced value changes
  useEffect(() => {
    if (debouncedValue && debouncedValue.length >= 3 && showAvailability) {
      const checkAvailability = async () => {
        setIsCheckingLocal(true);
        try {
          await checkUsernameAvailability(debouncedValue);
        } finally {
          setIsCheckingLocal(false);
        }
      };
      checkAvailability();
    }
  }, [debouncedValue, checkUsernameAvailability, showAvailability]);

  // Check username change permissions
  const checkChangePermissions = useCallback(async () => {
    try {
      const canChangeResult = await canChangeUsername();
      setCanChange(canChangeResult);
      
      if (!canChangeResult) {
        const days = getDaysUntilUsernameChange();
        setCooldownDays(days);
      }
    } catch (error) {
      console.error('Error checking change permissions:', error);
    }
  }, [canChangeUsername, getDaysUntilUsernameChange]);

  useEffect(() => {
    if (preferences) {
      checkChangePermissions();
    }
  }, [preferences, checkChangePermissions]);

  const availability = usernameAvailability[debouncedValue];
  const isCurrentUsername = preferences?.username === debouncedValue;
  const showCooldownWarning = !canChange && value !== preferences?.username;
  const isLoading = checkingUsername || isCheckingLocal;

  const getStatusIcon = () => {
    if (isLoading) {
      return <SafeIcon icon={FiLoader} className="text-gray-400 animate-spin" />;
    }

    if (!debouncedValue || debouncedValue.length < 3) {
      return null;
    }

    if (isCurrentUsername) {
      return <SafeIcon icon={FiClock} className="text-blue-500" />;
    }

    if (availability?.available) {
      return <SafeIcon icon={FiCheck} className="text-green-500" />;
    } else if (availability && !availability.available) {
      return <SafeIcon icon={FiX} className="text-red-500" />;
    }

    return null;
  };

  const getStatusMessage = () => {
    if (showCooldownWarning) {
      return {
        message: `You can change your username again in ${cooldownDays} days`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }

    if (!debouncedValue || debouncedValue.length < 3) {
      return {
        message: 'Username must be at least 3 characters',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }

    if (isLoading) {
      return {
        message: 'Checking availability...',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }

    if (isCurrentUsername) {
      return {
        message: 'This is your current username',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }

    if (availability?.available) {
      return {
        message: '✅ Username is available!',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (availability && !availability.available) {
      return {
        message: availability.reason || 'Username is not available',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
            onChange(newValue);
          }}
          disabled={disabled}
          placeholder="Enter username"
          className={`w-full px-3 py-2 pr-10 input-modern rounded-lg font-medium ${className} ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          maxLength={30}
          minLength={3}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Status Message */}
      {showAvailability && statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-2 rounded-lg border text-xs ${statusMessage.bgColor} ${statusMessage.borderColor}`}
        >
          <div className="flex items-center space-x-1">
            {showCooldownWarning && (
              <SafeIcon icon={FiAlertCircle} className={`${statusMessage.color} text-xs`} />
            )}
            <p className={`font-medium ${statusMessage.color}`}>
              {statusMessage.message}
            </p>
          </div>
          
          {showCooldownWarning && (
            <p className="text-xs text-gray-600 mt-1">
              Changed {preferences?.usernameChangeCount || 0} time{(preferences?.usernameChangeCount || 0) !== 1 ? 's' : ''}.
              Limited to once every 14 days.
            </p>
          )}
        </motion.div>
      )}

      {/* Username Rules - Only show in full settings */}
      {className.includes('text-lg') && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 3-30 characters long</p>
          <p>• Letters, numbers, and underscores only</p>
          <p>• Must be unique across all users</p>
          <p>• Can be changed once every 14 days</p>
        </div>
      )}
    </div>
  );
};

export default UsernameInput;