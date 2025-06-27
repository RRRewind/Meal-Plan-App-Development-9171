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

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Timer finished - could play sound or show notification
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
    setTimeLeft(minutes * 60);
    setIsTimerRunning(true);
    setTimer({ duration: minutes * 60, started: Date.now() });
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resumeTimer = () => {
    setIsTimerRunning(true);
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