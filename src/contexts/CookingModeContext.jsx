import React, { createContext, useContext, useState, useEffect } from 'react';

const CookingModeContext = createContext();

export const useCookingMode = () => {
  const context = useContext(CookingModeContext);
  if (!context) {
    throw new Error('useCookingMode must be used within a CookingModeProvider');
  }
  return context;
};

export const CookingModeProvider = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('cooking_mode_state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.isActive && state.currentRecipe) {
          setIsActive(state.isActive);
          setCurrentRecipe(state.currentRecipe);
          setCurrentStep(state.currentStep || 0);

          // Restore timer if it exists
          if (state.timer && state.timer.endTime) {
            const now = Date.now();
            const timeRemaining = Math.max(0, Math.floor((state.timer.endTime - now) / 1000));
            
            if (timeRemaining > 0) {
              setTimeLeft(timeRemaining);
              setIsTimerRunning(state.isTimerRunning);
              setTimer(state.timer);
            } else {
              // Timer has expired
              setTimeLeft(0);
              setIsTimerRunning(false);
              setTimer(null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading cooking mode state:', error);
        localStorage.removeItem('cooking_mode_state');
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isActive && currentRecipe) {
      const state = {
        isActive,
        currentRecipe,
        currentStep,
        timer,
        timeLeft,
        isTimerRunning
      };
      localStorage.setItem('cooking_mode_state', JSON.stringify(state));
    } else {
      localStorage.removeItem('cooking_mode_state');
    }
  }, [isActive, currentRecipe, currentStep, timer, timeLeft, isTimerRunning]);

  // Timer countdown effect
  useEffect(() => {
    let interval;
    
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Timer finished - no browser notification, just return 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const startCookingMode = (recipe) => {
    setCurrentRecipe(recipe);
    setCurrentStep(0);
    setIsActive(true);
  };

  const stopCookingMode = () => {
    setIsActive(false);
    setCurrentRecipe(null);
    setCurrentStep(0);
    setTimer(null);
    setTimeLeft(0);
    setIsTimerRunning(false);
    localStorage.removeItem('cooking_mode_state');
  };

  const nextStep = () => {
    if (currentRecipe && currentStep < currentRecipe.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const startTimer = (minutes) => {
    const duration = minutes * 60;
    const endTime = Date.now() + (duration * 1000);
    
    setTimeLeft(duration);
    setIsTimerRunning(true);
    setTimer({
      duration,
      startTime: Date.now(),
      endTime
    });
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    // Update timer with remaining time
    if (timer && timeLeft > 0) {
      const newEndTime = Date.now() + (timeLeft * 1000);
      setTimer(prev => ({ ...prev, endTime: newEndTime }));
    }
  };

  const resumeTimer = () => {
    if (timeLeft > 0) {
      setIsTimerRunning(true);
      // Update end time based on current time left
      const newEndTime = Date.now() + (timeLeft * 1000);
      setTimer(prev => ({ ...prev, endTime: newEndTime }));
    }
  };

  const resetTimer = () => {
    setTimeLeft(0);
    setIsTimerRunning(false);
    setTimer(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const value = {
    isActive,
    currentRecipe,
    currentStep,
    timer,
    timeLeft,
    isTimerRunning,
    startCookingMode,
    stopCookingMode,
    nextStep,
    prevStep,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    formatTime
  };

  return (
    <CookingModeContext.Provider value={value}>
      {children}
    </CookingModeContext.Provider>
  );
};