import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookingMode } from '../contexts/CookingModeContext';
import { useGamification } from '../contexts/GamificationContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiClock, FiPlay, FiPause, FiSquare, FiChevronLeft, FiChevronRight, FiX, FiCheck, FiMinus, FiPlus, FiBell, FiMaximize2 } = FiIcons;

const CookingTimer = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [showNotificationRequest, setShowNotificationRequest] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  const {
    isActive,
    currentRecipe,
    currentStep,
    timeLeft,
    isTimerRunning,
    stopCookingMode,
    nextStep,
    prevStep,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    formatTime
  } = useCookingMode();

  const { addXP, incrementRecipesCooked } = useGamification();

  // Check notification permission on mount - but only show request once per session
  useEffect(() => {
    const hasAskedThisSession = sessionStorage.getItem('notification_asked');
    const hasDismissedPermanently = localStorage.getItem('notification_dismissed');
    
    if (
      'Notification' in window && 
      Notification.permission === 'default' && 
      !hasAskedThisSession && 
      !hasDismissedPermanently &&
      !notificationDismissed
    ) {
      // Only show after a short delay to avoid immediate popup
      const timer = setTimeout(() => {
        setShowNotificationRequest(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [notificationDismissed]);

  // Monitor timer completion for notifications
  useEffect(() => {
    if (timeLeft === 0 && !isTimerRunning && timeLeft !== null) {
      // Timer just finished
      if (Notification.permission === 'granted') {
        new Notification('🍳 Timer Finished!', {
          body: `Your cooking timer has completed for step ${currentStep + 1}.`,
          icon: '/vite.svg',
          requireInteraction: true
        });
      }
    }
  }, [timeLeft, isTimerRunning, currentStep]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setShowNotificationRequest(false);
      setNotificationDismissed(true);
      
      // Mark as asked this session
      sessionStorage.setItem('notification_asked', 'true');
      
      if (permission === 'granted') {
        new Notification('🍳 Great!', {
          body: 'You\'ll now get notifications when your cooking timers finish.',
          icon: '/vite.svg'
        });
      }
    }
  };

  const dismissNotificationRequest = (permanently = false) => {
    setShowNotificationRequest(false);
    setNotificationDismissed(true);
    
    // Mark as asked this session
    sessionStorage.setItem('notification_asked', 'true');
    
    if (permanently) {
      // Don't ask again even in future sessions
      localStorage.setItem('notification_dismissed', 'true');
    }
  };

  // ENHANCED: Show different floating widgets based on cooking mode state
  if (!isActive || !currentRecipe) {
    // Show persistent timer indicator if there's an active timer but cooking mode is closed
    if (timeLeft > 0) {
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-2xl cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiClock} className="text-white text-lg" />
              </div>
              <div>
                <div className="font-bold text-lg">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-orange-100 text-sm">
                  Background Timer
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    isTimerRunning ? pauseTimer() : resumeTimer();
                  }}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                >
                  <SafeIcon icon={isTimerRunning ? FiPause : FiPlay} className="text-sm" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    resetTimer();
                  }}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                >
                  <SafeIcon icon={FiSquare} className="text-sm" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      );
    }
    return null;
  }

  const handleCompleteRecipe = () => {
    incrementRecipesCooked();
    addXP(50, 'Recipe completed!');
    stopCookingMode();
  };

  const handleSetTimer = (minutes) => {
    startTimer(minutes);
  };

  const handleCustomTimer = () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    const totalMinutes = mins + (secs / 60);
    if (totalMinutes > 0) {
      startTimer(totalMinutes);
      setCustomMinutes('');
      setCustomSeconds('');
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleExpand = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    // Only allow closing if no timer is running
    if (timeLeft === 0 || !isTimerRunning) {
      stopCookingMode();
    }
  };

  const isLastStep = currentStep === currentRecipe.steps.length - 1;
  const progress = ((currentStep + 1) / currentRecipe.steps.length) * 100;

  // ENHANCED: Different minimized states based on timer status - NOW IN BOTTOM RIGHT
  if (isMinimized) {
    // If timer is active, show countdown-focused widget
    if (timeLeft > 0) {
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 100 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-2xl"
          >
            {/* Main Timer Display */}
            <div className="text-center mb-3">
              <div className="text-3xl font-bold mb-1">
                {formatTime(timeLeft)}
              </div>
              <div className="text-orange-100 text-sm font-medium">
                Active Timer
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center space-x-2 mb-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => isTimerRunning ? pauseTimer() : resumeTimer()}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
              >
                <SafeIcon icon={isTimerRunning ? FiPause : FiPlay} className="text-sm" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={resetTimer}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
              >
                <SafeIcon icon={FiSquare} className="text-sm" />
              </motion.button>
            </div>

            {/* Expand/Close Controls */}
            <div className="flex items-center justify-between border-t border-white/20 pt-3">
              <div className="text-xs text-orange-100">
                Step {currentStep + 1}/{currentRecipe.steps.length}
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleExpand}
                  className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                  title="Expand cooking mode"
                >
                  <SafeIcon icon={FiMaximize2} className="text-xs" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      );
    } else {
      // If no timer, show regular minimized cooking mode widget
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 100 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-4 text-white shadow-2xl cursor-pointer"
            onClick={handleExpand}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiClock} className="text-white text-lg" />
              </div>
              <div>
                <div className="font-bold text-lg">
                  No Timer
                </div>
                <div className="text-primary-100 text-sm">
                  Step {currentStep + 1}/{currentRecipe.steps.length}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                title="Close cooking mode"
              >
                <SafeIcon icon={FiX} className="text-sm" />
              </motion.button>
            </div>

            {/* Mini Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-white rounded-full h-1.5"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      );
    }
  }

  return (
    <AnimatePresence>
      {/* Notification Permission Request - Enhanced with better controls */}
      {showNotificationRequest && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-blue-500 text-white rounded-xl p-4 shadow-2xl flex items-center space-x-4 max-w-md">
            <SafeIcon icon={FiBell} className="text-xl flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Enable Timer Notifications?</p>
              <p className="text-sm text-blue-100">Get notified when your cooking timers finish</p>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => dismissNotificationRequest(false)}
                  className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
                >
                  Later
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={requestNotificationPermission}
                  className="px-3 py-1 bg-white text-blue-500 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                  Enable
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => dismissNotificationRequest(true)}
                className="text-xs text-blue-200 hover:text-white underline transition-colors"
              >
                Don't ask again
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed inset-x-4 bottom-4 z-50 max-w-6xl mx-auto"
        style={{ maxHeight: '85vh', overflow: 'hidden' }}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiClock} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{currentRecipe.title}</h3>
                  <div className="flex items-center space-x-2 text-primary-100">
                    <span>Step {currentStep + 1} of {currentRecipe.steps.length}</span>
                    <span>•</span>
                    <span>{Math.round(progress)}% complete</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMinimize}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors duration-200"
                  title="Minimize (keep timer running)"
                >
                  <SafeIcon icon={FiMinus} className="text-xl" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  disabled={timeLeft > 0 && isTimerRunning}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    timeLeft > 0 && isTimerRunning 
                      ? 'text-white/40 cursor-not-allowed' 
                      : 'text-white/80 hover:text-white hover:bg-white/20'
                  }`}
                  title={timeLeft > 0 && isTimerRunning ? "Stop timer to close" : "Close cooking mode"}
                >
                  <SafeIcon icon={FiX} className="text-xl" />
                </motion.button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-full h-2"
                />
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
            <div className="p-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Current Step */}
                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Current Step:
                    </h4>
                    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-4 rounded-xl border border-primary-200">
                      <div className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                          {currentStep + 1}
                        </span>
                        <p className="text-gray-800 leading-relaxed">
                          {currentRecipe.steps[currentStep]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SafeIcon icon={FiChevronLeft} />
                      <span>Previous</span>
                    </motion.button>

                    {isLastStep ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCompleteRecipe}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold"
                      >
                        <SafeIcon icon={FiCheck} />
                        <span>Complete Recipe</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={nextStep}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                      >
                        <span>Next</span>
                        <SafeIcon icon={FiChevronRight} />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Timer & Ingredients */}
                <div className="space-y-6">
                  {/* Timer */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Cooking Timer
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-center mb-4">
                        <div className={`text-3xl font-bold ${timeLeft > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
                          {timeLeft > 0 ? formatTime(timeLeft) : '00:00'}
                        </div>
                        {timeLeft === 0 && !isTimerRunning && (
                          <p className="text-sm text-gray-500 mt-1">Set a timer for this step</p>
                        )}
                      </div>

                      {timeLeft > 0 ? (
                        <div className="flex items-center justify-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={isTimerRunning ? pauseTimer : resumeTimer}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              isTimerRunning
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            <SafeIcon icon={isTimerRunning ? FiPause : FiPlay} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={resetTimer}
                            className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors duration-200"
                          >
                            <SafeIcon icon={FiSquare} />
                          </motion.button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Quick Timer Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            {[5, 10, 15, 30].map((minutes) => (
                              <motion.button
                                key={minutes}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSetTimer(minutes)}
                                className="py-2 px-3 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-200 text-sm font-medium"
                              >
                                {minutes}m
                              </motion.button>
                            ))}
                          </div>

                          {/* Custom Timer */}
                          <div className="border-t border-gray-200 pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">Custom Timer:</p>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={customMinutes}
                                onChange={(e) => setCustomMinutes(e.target.value)}
                                placeholder="0"
                                min="0"
                                max="999"
                                className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg text-sm font-medium focus:border-primary-500 focus:outline-none"
                              />
                              <span className="text-sm text-gray-500 font-medium">min</span>
                              <input
                                type="number"
                                value={customSeconds}
                                onChange={(e) => setCustomSeconds(e.target.value)}
                                placeholder="0"
                                min="0"
                                max="59"
                                className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg text-sm font-medium focus:border-primary-500 focus:outline-none"
                              />
                              <span className="text-sm text-gray-500 font-medium">sec</span>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCustomTimer}
                                disabled={!customMinutes && !customSeconds}
                                className="flex-1 py-1 px-3 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Start
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Ingredients
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {currentRecipe.ingredients.map((ingredient, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{ingredient.name}</span>
                            <span className="text-gray-500 font-medium">{ingredient.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookingTimer;