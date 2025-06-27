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
  const [isTimerComplete, setIsTimerComplete] = useState(false);

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

  // Monitor timer completion for completion state
  useEffect(() => {
    if (timeLeft === 0 && !isTimerRunning && timeLeft !== null) {
      // Timer just finished
      setIsTimerComplete(true);
    } else if (timeLeft > 0) {
      // Timer is running or paused, not complete
      setIsTimerComplete(false);
    }
  }, [timeLeft, isTimerRunning, currentStep]);

  // Handle timer reset - also reset completion state
  const handleResetTimer = () => {
    resetTimer();
    setIsTimerComplete(false);
  };

  // Handle starting new timer - reset completion state
  const handleStartTimer = (minutes) => {
    startTimer(minutes);
    setIsTimerComplete(false);
  };

  // ENHANCED: Show different floating widgets based on cooking mode state
  if (!isActive || !currentRecipe) {
    // Show persistent timer indicator if there's an active timer but cooking mode is closed
    if (timeLeft > 0 || isTimerComplete) {
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            animate={isTimerComplete ? {
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 10px 25px rgba(239, 68, 68, 0.3)',
                '0 15px 35px rgba(239, 68, 68, 0.5)',
                '0 10px 25px rgba(239, 68, 68, 0.3)'
              ]
            } : {}}
            transition={isTimerComplete ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
            className={`rounded-2xl p-4 text-white shadow-2xl cursor-pointer ${
              isTimerComplete 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : 'bg-gradient-to-r from-orange-500 to-red-500'
            }`}
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <SafeIcon 
                  icon={isTimerComplete ? FiBell : FiClock} 
                  className={`text-white text-lg ${isTimerComplete ? 'animate-pulse' : ''}`} 
                />
              </div>
              <div>
                <div className="font-bold text-lg">
                  {isTimerComplete ? '00:00' : formatTime(timeLeft)}
                </div>
                <div className={`text-sm ${
                  isTimerComplete 
                    ? 'text-red-100 font-bold animate-pulse' 
                    : 'text-orange-100'
                }`}>
                  {isTimerComplete ? 'Check Cooking!' : 'Background Timer'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!isTimerComplete && (
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
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetTimer();
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
    handleStartTimer(minutes);
  };

  const handleCustomTimer = () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    const totalMinutes = mins + (secs / 60);
    
    if (totalMinutes > 0) {
      handleStartTimer(totalMinutes);
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
    if (timeLeft > 0 || isTimerComplete) {
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 100 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            animate={isTimerComplete ? {
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 10px 25px rgba(239, 68, 68, 0.3)',
                '0 15px 35px rgba(239, 68, 68, 0.5)',
                '0 10px 25px rgba(239, 68, 68, 0.3)'
              ]
            } : {}}
            transition={isTimerComplete ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
            className={`rounded-2xl p-4 text-white shadow-2xl ${
              isTimerComplete 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : 'bg-gradient-to-r from-orange-500 to-red-500'
            }`}
          >
            {/* Main Timer Display */}
            <div className="text-center mb-3">
              <div className={`text-3xl font-bold mb-1 ${isTimerComplete ? 'animate-pulse' : ''}`}>
                {isTimerComplete ? '00:00' : formatTime(timeLeft)}
              </div>
              <div className={`text-sm font-medium ${
                isTimerComplete 
                  ? 'text-red-100 animate-pulse font-bold' 
                  : 'text-orange-100'
              }`}>
                {isTimerComplete ? 'Check Cooking!' : 'Active Timer'}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center space-x-2 mb-3">
              {!isTimerComplete && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => isTimerRunning ? pauseTimer() : resumeTimer()}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                >
                  <SafeIcon icon={isTimerRunning ? FiPause : FiPlay} className="text-sm" />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleResetTimer}
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
                        <div className={`text-3xl font-bold ${
                          isTimerComplete 
                            ? 'text-red-600 animate-pulse' 
                            : timeLeft > 0 
                              ? 'text-primary-600' 
                              : 'text-gray-400'
                        }`}>
                          {timeLeft > 0 || isTimerComplete ? formatTime(timeLeft) : '00:00'}
                        </div>
                        {isTimerComplete && (
                          <motion.p
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="text-sm text-red-600 mt-1 font-bold"
                          >
                            ⏰ Check your cooking!
                          </motion.p>
                        )}
                        {timeLeft === 0 && !isTimerComplete && (
                          <p className="text-sm text-gray-500 mt-1">Set a timer for this step</p>
                        )}
                      </div>

                      {timeLeft > 0 || isTimerComplete ? (
                        <div className="flex items-center justify-center space-x-2">
                          {!isTimerComplete && (
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
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleResetTimer}
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