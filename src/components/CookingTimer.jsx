import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookingMode } from '../contexts/CookingModeContext';
import { useGamification } from '../contexts/GamificationContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiClock, FiPlay, FiPause, FiSquare, FiChevronLeft, FiChevronRight, FiX, FiCheck, FiMinus, FiPlus, FiBell, FiMaximize2, FiExternalLink, FiLink, FiAlertCircle, FiCheckCircle } = FiIcons;

const CookingTimer = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const [showAlarmEffect, setShowAlarmEffect] = useState(false);
  const [alarmDismissed, setAlarmDismissed] = useState(false);

  const {
    isActive,
    currentRecipe,
    currentStep,
    timeLeft,
    isTimerRunning,
    timer,
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

  // ✅ FIXED: Enhanced timer completion detection with better state management
  useEffect(() => {
    console.log('Timer state:', { timeLeft, timer, isTimerRunning, isTimerComplete, showAlarmEffect });

    // Timer just finished - check for completion
    if (timer && timeLeft === 0 && !isTimerRunning && !alarmDismissed) {
      console.log('🚨 TIMER COMPLETED!');
      setIsTimerComplete(true);
      setShowAlarmEffect(true);

      // ✅ FIXED: Enhanced notification sound with multiple attempts
      try {
        // Method 1: Web Audio API with multiple tones
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const playTone = (frequency, duration, delay = 0) => {
          setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
          }, delay);
        };

        // Play sequence of alarm tones
        playTone(800, 0.3, 0);     // First tone
        playTone(1000, 0.3, 400);  // Second tone (higher)
        playTone(1200, 0.3, 800);  // Third tone (even higher)
        playTone(800, 0.5, 1200);  // Final long tone
        
        // ✅ BACKUP: Try HTML5 Audio as fallback
        setTimeout(() => {
          try {
            // Create a simple beep sound using data URI
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMFKnjI8N2QQAoUXrTp66hVFApGn+DyvmwhBTmS2vDFeiMF');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio backup failed:', e));
          } catch (audioError) {
            console.log('HTML5 Audio backup failed:', audioError);
          }
        }, 100);

      } catch (error) {
        console.log('Audio notification not supported:', error);
        
        // ✅ FINAL FALLBACK: Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Timer Complete!', {
            body: 'Your cooking timer has finished.',
            icon: '/favicon.ico'
          });
        }
      }
    } 
    // Timer is running or reset
    else if (timeLeft > 0 || !timer) {
      if (isTimerComplete || showAlarmEffect) {
        console.log('⏰ Timer reset - clearing completion state');
        setIsTimerComplete(false);
        setShowAlarmEffect(false);
        setAlarmDismissed(false);
      }
    }
  }, [timeLeft, isTimerRunning, timer, isTimerComplete, showAlarmEffect, alarmDismissed]);

  // ✅ FIXED: Handle timer reset
  const handleResetTimer = () => {
    console.log('🔄 Resetting timer');
    resetTimer();
    setIsTimerComplete(false);
    setShowAlarmEffect(false);
    setAlarmDismissed(false);
  };

  // ✅ FIXED: Handle starting new timer
  const handleStartTimer = (minutes) => {
    console.log('▶️ Starting timer:', minutes);
    startTimer(minutes);
    setIsTimerComplete(false);
    setShowAlarmEffect(false);
    setAlarmDismissed(false);
  };

  // ✅ FIXED: Dismiss alarm
  const handleDismissAlarm = () => {
    console.log('✅ Dismissing alarm');
    setShowAlarmEffect(false);
    setAlarmDismissed(true);
    // Keep isTimerComplete true but remove the urgent alarm effect
  };

  // Handle recipe URL click
  const handleRecipeUrlClick = (url) => {
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      addXP(2, 'Recipe details viewed');
    }
  };

  // ✅ ENHANCED: Timer Completion Display with Better Pulsing
  const TimerCompletionDisplay = ({ isMinimizedView = false, className = "" }) => {
    if (!isTimerComplete) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${className} relative`}
      >
        {/* 🎯 ENHANCED PULSING EFFECT */}
        <motion.div
          animate={{
            scale: showAlarmEffect ? [1, 1.15, 1, 1.15, 1] : [1, 1.08, 1],
            opacity: showAlarmEffect ? [0.7, 1, 0.7, 1, 0.7] : [0.8, 1, 0.8],
          }}
          transition={{
            duration: showAlarmEffect ? 1 : 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`${isMinimizedView ? 'absolute -inset-3 rounded-xl' : 'absolute -inset-5 rounded-2xl'} ${
            showAlarmEffect 
              ? 'bg-red-400/30 border-2 border-red-400/50' 
              : 'bg-green-400/30 border-2 border-green-400/50'
          } pointer-events-none shadow-lg`}
        />

        {/* 🎉 COMPLETION MESSAGE */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${
            showAlarmEffect 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : 'bg-gradient-to-r from-green-500 to-green-600'
          } text-white p-4 rounded-xl shadow-xl relative z-10 border-2 ${
            showAlarmEffect ? 'border-red-300' : 'border-green-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{
                  rotate: showAlarmEffect ? [0, -15, 15, -15, 0] : [0, 360],
                  scale: showAlarmEffect ? [1, 1.3, 1, 1.3, 1] : [1, 1.2, 1]
                }}
                transition={{
                  duration: showAlarmEffect ? 0.6 : 2,
                  repeat: Infinity,
                  ease: showAlarmEffect ? "easeInOut" : "linear"
                }}
                className={`w-12 h-12 ${
                  showAlarmEffect ? 'bg-white/40' : 'bg-white/30'
                } rounded-full flex items-center justify-center shadow-lg`}
              >
                <SafeIcon 
                  icon={showAlarmEffect ? FiAlertCircle : FiCheckCircle} 
                  className="text-white text-xl" 
                />
              </motion.div>
              <div>
                <motion.p
                  animate={{
                    scale: showAlarmEffect ? [1, 1.08, 1, 1.08, 1] : [1, 1.03, 1]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity
                  }}
                  className={`font-black ${isMinimizedView ? 'text-lg' : 'text-2xl'} tracking-wide`}
                >
                  {showAlarmEffect ? '🚨 TIME\'S UP!' : '🎉 TIMER COMPLETE!'}
                </motion.p>
                <p className={`${
                  showAlarmEffect ? 'text-red-100' : 'text-green-100'
                } ${isMinimizedView ? 'text-sm' : 'text-base'} font-semibold`}>
                  {showAlarmEffect 
                    ? 'Your cooking timer has finished!' 
                    : 'Great job! Your timer is done!'
                  }
                </p>
              </div>
            </div>

            {/* ✅ ENHANCED: Super Prominent Dismiss Button */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                boxShadow: showAlarmEffect 
                  ? [
                      '0 0 0 0 rgba(255,255,255,0.4)',
                      '0 0 0 8px rgba(255,255,255,0)',
                      '0 0 0 0 rgba(255,255,255,0.4)'
                    ] 
                  : [
                      '0 0 0 0 rgba(255,255,255,0.3)',
                      '0 0 0 6px rgba(255,255,255,0)',
                      '0 0 0 0 rgba(255,255,255,0.3)'
                    ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
              onClick={handleDismissAlarm}
              className={`${
                showAlarmEffect 
                  ? 'bg-white/40 hover:bg-white/60 border-3 border-white/70' 
                  : 'bg-white/30 hover:bg-white/50 border-3 border-white/50'
              } text-white rounded-xl transition-all duration-200 ${
                isMinimizedView ? 'p-3' : 'p-4'
              } font-black flex items-center space-x-2 text-lg shadow-xl`}
              title="Dismiss timer notification"
            >
              <SafeIcon icon={FiCheck} className={isMinimizedView ? 'text-lg' : 'text-xl'} />
              {!isMinimizedView && <span>DISMISS</span>}
            </motion.button>
          </div>

          {/* 🎊 ENHANCED CELEBRATION PARTICLES */}
          {!showAlarmEffect && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 bg-yellow-300 rounded-full opacity-80"
                  style={{
                    left: `${15 + i * 10}%`,
                    top: `${25 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [-25, -50, -25],
                    x: [0, (i % 2 ? 10 : -10), 0],
                    opacity: [0.8, 1, 0.8],
                    scale: [1, 1.8, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  // Show persistent timer widget when there's an active timer
  if (!isActive || !currentRecipe) {
    if (timer && (timeLeft > 0 || isTimerComplete)) {
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-4 right-4 z-50"
        >
          {isTimerComplete ? (
            <TimerCompletionDisplay isMinimizedView={true} />
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-2xl cursor-pointer relative overflow-hidden"
              onClick={() => setIsMinimized(false)}
            >
              <div className="flex items-center space-x-3 relative z-10">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiClock} className="text-white text-lg" />
                </div>
                <div>
                  <div className="font-bold text-lg">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-orange-100">
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
                      handleResetTimer();
                    }}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                  >
                    <SafeIcon icon={FiSquare} className="text-sm" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
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
    if (timeLeft === 0 || !isTimerRunning) {
      stopCookingMode();
    }
  };

  const isLastStep = currentStep === currentRecipe.steps.length - 1;
  const progress = ((currentStep + 1) / currentRecipe.steps.length) * 100;

  // Minimized view
  if (isMinimized) {
    if (timer && (timeLeft > 0 || isTimerComplete)) {
      return (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 100 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 100 }}
          className="fixed bottom-4 right-4 z-50"
        >
          {isTimerComplete ? (
            <div className="space-y-3">
              <TimerCompletionDisplay isMinimizedView={true} />
              <div className="flex items-center justify-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleExpand}
                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                  title="Expand cooking mode"
                >
                  <SafeIcon icon={FiMaximize2} className="text-sm" />
                </motion.button>
              </div>
            </div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="text-center mb-3 relative z-10">
                <div className="text-3xl font-bold mb-1">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm font-medium text-orange-100">
                  Active Timer
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 mb-3 relative z-10">
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
                  onClick={handleResetTimer}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                >
                  <SafeIcon icon={FiSquare} className="text-sm" />
                </motion.button>
              </div>

              <div className="flex items-center justify-between border-t border-white/20 pt-3 relative z-10">
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
          )}
        </motion.div>
      );
    } else {
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
                <div className="font-bold text-lg">No Timer</div>
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
        {/* ✅ ENHANCED: Full-screen alarm overlay */}
        <AnimatePresence>
          {showAlarmEffect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-40"
            >
              <motion.div
                animate={{
                  opacity: [0, 0.4, 0, 0.4, 0],
                  backgroundColor: [
                    'rgba(239, 68, 68, 0)',
                    'rgba(239, 68, 68, 0.15)',
                    'rgba(239, 68, 68, 0)',
                    'rgba(239, 68, 68, 0.2)',
                    'rgba(239, 68, 68, 0)'
                  ]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-full relative">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <SafeIcon icon={FiClock} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-lg">{currentRecipe.title}</h3>
                    {currentRecipe.url && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRecipeUrlClick(currentRecipe.url)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                        title="View full recipe details"
                      >
                        <SafeIcon icon={FiExternalLink} className="text-white text-sm" />
                      </motion.button>
                    )}
                  </div>
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
                    <h4 className="font-semibold text-gray-900 mb-3">Current Step:</h4>
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

                  {currentRecipe.url && (
                    <div className="mb-4">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRecipeUrlClick(currentRecipe.url)}
                        className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 flex items-center justify-center space-x-3 group"
                      >
                        <SafeIcon icon={FiLink} className="text-blue-600 text-lg" />
                        <div className="text-center">
                          <p className="font-semibold text-blue-900">View Full Recipe Details</p>
                          <p className="text-sm text-blue-600">Open complete recipe instructions</p>
                        </div>
                        <SafeIcon icon={FiExternalLink} className="text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                      </motion.button>
                    </div>
                  )}

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
                    <h4 className="font-semibold text-gray-900 mb-3">Cooking Timer</h4>
                    {isTimerComplete ? (
                      <TimerCompletionDisplay className="mb-4" />
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 relative overflow-hidden">
                        <div className="text-center mb-4 relative z-10">
                          <div className={`text-3xl font-bold ${timeLeft > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
                            {timeLeft > 0 ? formatTime(timeLeft) : '00:00'}
                          </div>
                          {timeLeft === 0 && (
                            <p className="text-sm text-gray-500 mt-1">Set a timer for this step</p>
                          )}
                        </div>

                        {timeLeft > 0 && timer ? (
                          <div className="flex items-center justify-center space-x-2 relative z-10">
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
                              onClick={handleResetTimer}
                              className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors duration-200"
                            >
                              <SafeIcon icon={FiSquare} />
                            </motion.button>
                          </div>
                        ) : (
                          <div className="space-y-4">
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
                    )}
                  </div>

                  {/* Ingredients */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Ingredients</h4>
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