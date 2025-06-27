import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, startOfWeek, isToday, isBefore, startOfDay } from 'date-fns';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useRecipes } from '../contexts/RecipeContext';
import { useCookingMode } from '../contexts/CookingModeContext';
import { useGamification } from '../contexts/GamificationContext';
import Layout from '../components/Layout';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiCalendar, FiPlus, FiX, FiClock, FiUsers, FiPlay, FiChevronLeft, FiChevronRight, FiCoffee, FiSun, FiMoon, FiCookie } = FiIcons;

const Scheduler = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));

  const { mealPlan, addMealToDay, removeMealFromDay, getMealsForDay } = useMealPlan();
  const { recipes, sharedRecipes } = useRecipes();
  const { startCookingMode } = useCookingMode();
  const { addXP } = useGamification();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const mealTypes = [
    {
      id: 'breakfast',
      name: 'Breakfast',
      icon: '🍳', // Using emoji instead of icon
      bgColor: 'bg-gradient-to-br from-primary-100/60 to-secondary-100/60',
      lightBg: 'from-primary-50/60 to-secondary-50/60',
      borderColor: 'border-primary-300/50',
      textColor: 'text-primary-700',
      hoverBg: 'hover:bg-primary-50/50'
    },
    {
      id: 'lunch',
      name: 'Lunch',
      icon: '🥗', // Using emoji instead of icon
      bgColor: 'bg-gradient-to-br from-secondary-100/60 to-accent-100/60',
      lightBg: 'from-secondary-50/60 to-accent-50/60',
      borderColor: 'border-secondary-300/50',
      textColor: 'text-secondary-700',
      hoverBg: 'hover:bg-secondary-50/50'
    },
    {
      id: 'dinner',
      name: 'Dinner',
      icon: '🍽️', // Using emoji instead of icon
      bgColor: 'bg-gradient-to-br from-purple-100/60 to-blue-100/60',
      lightBg: 'from-purple-50/60 to-blue-50/60',
      borderColor: 'border-purple-300/50',
      textColor: 'text-purple-700',
      hoverBg: 'hover:bg-purple-50/50'
    },
    {
      id: 'snacks',
      name: 'Snacks',
      icon: '🍪', // Using emoji instead of icon
      bgColor: 'bg-gradient-to-br from-amber-100/60 to-orange-100/60',
      lightBg: 'from-amber-50/60 to-orange-50/60',
      borderColor: 'border-amber-300/50',
      textColor: 'text-amber-700',
      hoverBg: 'hover:bg-amber-50/50',
      limit: 5
    }
  ];

  const today = startOfDay(new Date());
  const availableDays = weekDays.filter(day => !isBefore(day, today));

  const handleAddMeal = (recipe) => {
    if (selectedDate && selectedMealType) {
      const dayMeals = getMealsForDay(selectedDate);
      const mealTypeConfig = mealTypes.find(mt => mt.id === selectedMealType);

      // Check meal limits
      if (selectedMealType === 'snacks') {
        const currentSnacks = dayMeals.snacks || [];
        if (currentSnacks.length >= 5) {
          toast.error('Maximum 5 snacks per day allowed!');
          return;
        }
      } else {
        // For breakfast, lunch, dinner - only 1 meal allowed
        if (dayMeals[selectedMealType]) {
          toast.error(`Only one ${selectedMealType} meal allowed per day!`);
          return;
        }
      }

      addMealToDay(selectedDate, selectedMealType, recipe);
      addXP(10, 'Meal planned');
      toast.success(`${recipe.title} added to ${selectedMealType}!`);
      setShowRecipeModal(false);
      setSelectedMealType(null);
    }
  };

  const handleRemoveMeal = (date, mealType, snackIndex = null) => {
    removeMealFromDay(date, mealType, snackIndex);
    toast.success('Meal removed from schedule');
  };

  const openRecipeModal = (date, mealType) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setShowRecipeModal(true);
  };

  const nextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const prevWeek = () => {
    const newWeek = addDays(currentWeek, -7);
    if (!isBefore(newWeek, startOfWeek(today))) {
      setCurrentWeek(newWeek);
    }
  };

  const allRecipes = [...recipes, ...sharedRecipes];

  const getMealDisplay = (dayMeals, mealType) => {
    if (mealType === 'snacks') {
      return dayMeals.snacks || [];
    }
    return dayMeals[mealType] ? [dayMeals[mealType]] : [];
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Meal Scheduler
            </h1>
            <p className="text-gray-600">
              Plan your meals for the week ahead
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevWeek}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <SafeIcon icon={FiChevronLeft} />
            </motion.button>
            <div className="text-center">
              <p className="font-semibold text-gray-900">
                {format(currentWeek, 'MMMM yyyy')}
              </p>
              <p className="text-sm text-gray-600">
                Week of {format(currentWeek, 'MMM d')}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextWeek}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <SafeIcon icon={FiChevronRight} />
            </motion.button>
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Days Header */}
          <div className="grid grid-cols-8 bg-gray-50 border-b border-gray-200">
            {/* Empty cell for meal type labels */}
            <div className="p-4 border-r border-gray-200">
              <p className="text-sm font-semibold text-gray-600">Meal Type</p>
            </div>
            {availableDays.map((day, index) => (
              <div key={index} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                <p className="font-semibold text-gray-900">
                  {format(day, 'EEE')}
                </p>
                <p className={`text-sm ${isToday(day) ? 'text-primary-600 font-bold' : 'text-gray-600'}`}>
                  {format(day, 'MMM d')}
                </p>
              </div>
            ))}
          </div>

          {/* Meals Grid */}
          <div className="divide-y divide-gray-200">
            {mealTypes.map((mealType) => (
              <div key={mealType.id} className="grid grid-cols-8 min-h-24">
                {/* Meal Type Label */}
                <div className="p-4 border-r border-gray-200 bg-gray-50 flex items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${mealType.bgColor} rounded-lg flex items-center justify-center shadow-sm border border-gray-200/50`}>
                      <span className="text-lg">{mealType.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {mealType.name}
                      </p>
                      {mealType.limit && (
                        <p className="text-xs text-gray-500">Max {mealType.limit}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Days */}
                {availableDays.map((day, dayIndex) => {
                  const dayMeals = getMealsForDay(day);
                  const meals = getMealDisplay(dayMeals, mealType.id);
                  const isPastDay = isBefore(day, today);
                  const canAddMore = mealType.id === 'snacks' 
                    ? meals.length < (mealType.limit || 1) 
                    : meals.length === 0;

                  return (
                    <div
                      key={`${mealType.id}-${dayIndex}`}
                      className={`p-3 border-r border-gray-200 last:border-r-0 min-h-24 ${
                        isPastDay ? 'bg-gray-50 opacity-50' : 'hover:bg-gray-50'
                      } transition-colors duration-200`}
                    >
                      <div className="space-y-2">
                        {/* Existing Meals */}
                        {meals.map((meal, mealIndex) => (
                          <motion.div
                            key={mealIndex}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative group"
                          >
                            <div className={`bg-gradient-to-br ${mealType.lightBg} border ${mealType.borderColor} p-2 rounded-lg`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-xs truncate">
                                    {meal.title}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <div className="flex items-center text-xs text-gray-600">
                                      <SafeIcon icon={FiClock} className="mr-1" />
                                      {meal.cookTime}m
                                    </div>
                                    <div className="flex items-center text-xs text-gray-600">
                                      <SafeIcon icon={FiUsers} className="mr-1" />
                                      {meal.servings}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => startCookingMode(meal)}
                                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded"
                                  >
                                    <SafeIcon icon={FiPlay} className="text-xs" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleRemoveMeal(day, mealType.id, mealType.id === 'snacks' ? mealIndex : null)}
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded"
                                  >
                                    <SafeIcon icon={FiX} className="text-xs" />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {/* Add Meal Button */}
                        {!isPastDay && canAddMore && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openRecipeModal(day, mealType.id)}
                            className={`w-full h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 ${mealType.hoverBg} hover:${mealType.borderColor.replace('/50', '/70')} hover:${mealType.textColor} transition-colors duration-200`}
                          >
                            <SafeIcon icon={FiPlus} className="text-sm" />
                          </motion.button>
                        )}

                        {/* Max reached indicator */}
                        {!isPastDay && !canAddMore && mealType.id === 'snacks' && (
                          <div className="text-xs text-gray-500 text-center py-2">
                            Max snacks reached
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recipe Selection Modal */}
        <AnimatePresence>
          {showRecipeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowRecipeModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Choose a Recipe
                    </h2>
                    <p className="text-gray-600">
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d')} • {mealTypes.find(mt => mt.id === selectedMealType)?.name}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowRecipeModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <SafeIcon icon={FiX} className="text-xl" />
                  </motion.button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allRecipes.map((recipe) => (
                    <motion.div
                      key={recipe.id}
                      whileHover={{ y: -2 }}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => handleAddMeal(recipe)}
                    >
                      <div className="aspect-video bg-gradient-to-br from-primary-50/60 to-secondary-50/60 relative overflow-hidden">
                        {recipe.image ? (
                          <img
                            src={recipe.image}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <SafeIcon icon={FiCalendar} className="text-4xl text-primary-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {recipe.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {recipe.description}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <SafeIcon icon={FiClock} className="mr-1" />
                              {recipe.cookTime}m
                            </div>
                            <div className="flex items-center">
                              <SafeIcon icon={FiUsers} className="mr-1" />
                              {recipe.servings}
                            </div>
                          </div>
                          <span className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-full">
                            {recipe.difficulty}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Scheduler;