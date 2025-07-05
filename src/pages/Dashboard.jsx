import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRecipes } from '../contexts/RecipeContext';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useCookingMode } from '../contexts/CookingModeContext';
import { useGamification } from '../contexts/GamificationContext';
import Layout from '../components/Layout';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, addDays } from 'date-fns';

const { FiChef, FiCalendar, FiTrendingUp, FiStar, FiClock, FiPlay, FiAward, FiTarget, FiShoppingCart, FiBook, FiCookie, FiExternalLink, FiZap } = FiIcons;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recipes, savedRecipes } = useRecipes();
  const { mealPlan, getMealsForDay } = useMealPlan();
  const { startCookingMode } = useCookingMode();
  const { addXP, badges } = useGamification();

  const today = new Date();
  const todayMeals = getMealsForDay(today);
  const upcomingDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const stats = [
    { title: 'Recipes Cooked', value: user?.recipesCooked || 0, icon: FiChef, color: 'from-primary-500/90 to-primary-600/90' },
    { title: 'Current Level', value: user?.level || 1, icon: FiStar, color: 'from-secondary-500/90 to-secondary-600/90' },
    { title: 'Cooking Streak', value: `${user?.streakDays || 0} days`, icon: FiTrendingUp, color: 'from-purple-500/90 to-purple-600/90' },
    { title: 'Saved Recipes', value: savedRecipes.length, icon: FiTarget, color: 'from-blue-500/90 to-blue-600/90' }
  ];

  const recentBadges = user?.badges?.slice(-3).map(badgeId => badges[badgeId]).filter(Boolean) || [];

  // Quick action handlers
  const handlePlanWeek = () => {
    navigate('/scheduler');
  };

  const handleDiscoverRecipes = () => {
    navigate('/recipes');
  };

  const handleViewShoppingList = () => {
    navigate('/shopping-list');
  };

  // Helper function to get meal icon
  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🍽️';
      case 'snacks': return '🍪';
      default: return '🍴';
    }
  };

  // ✅ ENHANCED: Handle recipe URL click
  const handleRecipeUrlClick = (url) => {
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      addXP(2, 'Recipe details viewed');
    }
  };

  // 🌟 NEW: Floating Animation Component
  const FloatingElement = ({ children, delay = 0, className = "" }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        rotateX: [0, 2, 0, -2, 0],
        rotateY: [0, 1, 0, -1, 0]
      }}
      transition={{ 
        opacity: { duration: 0.6, delay },
        y: { duration: 0.6, delay },
        rotateX: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );

  // 🌟 NEW: Sparkle Animation Component
  const SparkleEffect = ({ children, className = "" }) => (
    <div className={`relative group ${className}`}>
      {children}
      {/* Sparkle particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full"
            style={{
              left: `${20 + i * 12}%`,
              top: `${15 + (i % 2) * 70}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );

  // 🎨 NEW: Shimmer Effect Component for Cook Buttons
  const ShimmerButton = ({ children, onClick, className = "", disabled = false }) => (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Shimmer overlay */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
          style={{
            transform: 'skewX(-20deg)',
          }}
        />
      )}
      {children}
    </motion.button>
  );

  // 🎯 NEW: Pulsing Badge Component
  const PulsingBadge = ({ badge, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-secondary-50/60 to-primary-50/60 rounded-lg relative overflow-hidden"
    >
      {/* Background glow effect */}
      <motion.div
        animate={{ 
          boxShadow: [
            '0 0 10px rgba(234, 179, 8, 0.2)',
            '0 0 20px rgba(234, 179, 8, 0.4)',
            '0 0 10px rgba(234, 179, 8, 0.2)'
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-lg"
      />
      
      <motion.span 
        animate={{ rotate: [0, 10, 0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-2xl relative z-10"
      >
        {badge.icon}
      </motion.span>
      <div className="relative z-10">
        <p className="font-medium text-gray-900">{badge.name}</p>
        <p className="text-xs text-gray-600">{badge.description}</p>
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-primary-200/10 to-secondary-200/10 rounded-full"
          />
          <motion.div
            animate={{ 
              rotate: [360, 0],
              x: [0, -30, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-accent-200/10 to-primary-200/10 rounded-full"
          />
          <motion.div
            animate={{ 
              rotate: [0, 180, 360],
              x: [0, 40, 0],
              y: [0, -40, 0]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-r from-secondary-200/10 to-accent-200/10 rounded-full"
          />
        </div>

        {/* Welcome Section */}
        <FloatingElement className="mb-8">
          <div className="bg-gradient-to-r from-primary-500/95 to-secondary-500/95 rounded-2xl p-8 text-white relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-bold mb-2"
                >
                  Welcome back, {user?.name}! 👋
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-primary-100 text-lg"
                >
                  Ready to cook something amazing today?
                </motion.p>
              </div>
              <div className="hidden md:block">
                {/* 🌟 ENHANCED: Sparkling XP Display */}
                <SparkleEffect>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-4 relative cursor-pointer"
                    onClick={() => navigate('/rewards')}
                  >
                    <div className="text-center">
                      <motion.div
                        animate={{
                          textShadow: [
                            '0 0 5px rgba(255,255,255,0.5)',
                            '0 0 10px rgba(255,255,255,0.8)',
                            '0 0 5px rgba(255,255,255,0.5)'
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="text-2xl font-bold"
                      >
                        {user?.xp || 0}
                      </motion.div>
                      <div className="text-sm text-primary-100">Total XP</div>
                    </div>
                    {/* Extra sparkle ring */}
                    <motion.div
                      className="absolute inset-0 border-2 border-yellow-300/30 rounded-xl"
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                </SparkleEffect>
              </div>
            </div>
          </div>
        </FloatingElement>

        {/* Stats Grid */}
        <FloatingElement delay={0.1} className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              whileHover={{ 
                scale: 1.05, 
                y: -5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
              }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100/50 relative overflow-hidden"
            >
              {/* Animated background gradient */}
              <motion.div
                animate={{ 
                  background: [
                    'linear-gradient(45deg, transparent, rgba(255,255,255,0.1))',
                    'linear-gradient(225deg, transparent, rgba(255,255,255,0.1))',
                    'linear-gradient(45deg, transparent, rgba(255,255,255,0.1))'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0"
              />
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="text-sm font-medium text-gray-600 mb-1"
                  >
                    {stat.title}
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <motion.div 
                  animate={{ 
                    rotate: [0, 5, 0, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}
                >
                  <SafeIcon icon={stat.icon} className="text-white text-xl" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </FloatingElement>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Today's Meals */}
          <FloatingElement delay={0.2} className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100/50 relative overflow-hidden">
              {/* Subtle background animation */}
              <motion.div
                animate={{ 
                  background: [
                    'radial-gradient(circle at 20% 50%, rgba(239, 68, 48, 0.03) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 50%, rgba(239, 68, 48, 0.03) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 50%, rgba(239, 68, 48, 0.03) 0%, transparent 50%)'
                  ]
                }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute inset-0"
              />

              <div className="flex items-center justify-between mb-6 relative z-10">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xl font-bold text-gray-900 flex items-center"
                >
                  <SafeIcon icon={FiCalendar} className="mr-2 text-primary-500" />
                  Today's Meals
                </motion.h2>
                <motion.span 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-gray-500"
                >
                  {format(today, 'EEEE, MMMM d')}
                </motion.span>
              </div>

              <div className="space-y-4 relative z-10">
                {/* Main Meals */}
                {['breakfast', 'lunch', 'dinner'].map((mealType, index) => {
                  const meal = todayMeals[mealType];
                  return (
                    <motion.div
                      key={mealType}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg relative overflow-hidden group"
                    >
                      {/* Hover glow effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary-50/0 to-primary-50/50 opacity-0 group-hover:opacity-100"
                        transition={{ duration: 0.3 }}
                      />

                      <div className="flex items-center space-x-3 relative z-10">
                        <motion.div 
                          animate={{ 
                            rotateY: [0, 20, 0, -20, 0] 
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="w-10 h-10 bg-gradient-to-br from-primary-100/60 to-secondary-100/60 rounded-lg flex items-center justify-center"
                        >
                          <span className="text-lg">{getMealIcon(mealType)}</span>
                        </motion.div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {mealType}
                          </p>
                          {meal ? (
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-gray-600">{meal.title}</p>
                              {/* ✅ ENHANCED: Recipe URL link for meals */}
                              {meal.url && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRecipeUrlClick(meal.url)}
                                  className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200"
                                  title="View recipe details"
                                >
                                  <SafeIcon icon={FiExternalLink} className="text-xs" />
                                </motion.button>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">No meal planned</p>
                          )}
                        </div>
                      </div>
                      {meal && (
                        <ShimmerButton
                          onClick={() => startCookingMode(meal)}
                          className="bg-primary-500/90 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600/90 transition-colors duration-200 flex items-center space-x-2"
                        >
                          <SafeIcon icon={FiPlay} className="text-sm" />
                          <span>Cook</span>
                        </ShimmerButton>
                      )}
                    </motion.div>
                  );
                })}

                {/* Snacks Section */}
                <AnimatePresence>
                  {todayMeals.snacks && todayMeals.snacks.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-gradient-to-r from-amber-50/60 to-orange-50/60 rounded-lg border border-amber-200/50 relative overflow-hidden"
                    >
                      {/* Animated background pattern */}
                      <motion.div
                        animate={{ 
                          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                        className="absolute inset-0 opacity-5"
                        style={{
                          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23f59e0b" fill-opacity="0.4"%3E%3Cpath d="M20 20c0-11.046-8.954-20-20-20v20h20z"/%3E%3C/g%3E%3C/svg%3E")',
                          backgroundSize: '40px 40px'
                        }}
                      />

                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <div className="flex items-center space-x-3">
                          <motion.div 
                            animate={{ 
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, 0, -5, 0]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="w-10 h-10 bg-gradient-to-br from-amber-100/60 to-orange-100/60 rounded-lg flex items-center justify-center"
                          >
                            <SafeIcon icon={FiCookie} className="text-lg text-amber-600" />
                          </motion.div>
                          <div>
                            <p className="font-medium text-gray-900">Snacks</p>
                            <p className="text-sm text-gray-600">
                              {todayMeals.snacks.length} snack{todayMeals.snacks.length !== 1 ? 's' : ''} planned
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Snack List */}
                      <div className="space-y-2 relative z-10">
                        {todayMeals.snacks.map((snack, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, x: 5 }}
                            className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-amber-200/30 group"
                          >
                            <div className="flex items-center space-x-3">
                              <motion.span 
                                animate={{ 
                                  backgroundColor: [
                                    'rgba(245, 158, 11, 0.2)',
                                    'rgba(245, 158, 11, 0.4)',
                                    'rgba(245, 158, 11, 0.2)'
                                  ]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-6 h-6 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold"
                              >
                                {index + 1}
                              </motion.span>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-gray-900 text-sm">{snack.title}</p>
                                  {/* ✅ ENHANCED: Recipe URL link for snacks */}
                                  {snack.url && (
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => handleRecipeUrlClick(snack.url)}
                                      className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors duration-200"
                                      title="View recipe details"
                                    >
                                      <SafeIcon icon={FiExternalLink} className="text-xs" />
                                    </motion.button>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <SafeIcon icon={FiClock} className="text-xs" />
                                  <span>{snack.cookTime}m</span>
                                  <span>•</span>
                                  <span>{snack.difficulty}</span>
                                </div>
                              </div>
                            </div>
                            <ShimmerButton
                              onClick={() => startCookingMode(snack)}
                              className="bg-amber-500/90 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-600/90 transition-colors duration-200 flex items-center space-x-1 text-sm"
                            >
                              <SafeIcon icon={FiPlay} className="text-xs" />
                              <span>Cook</span>
                            </ShimmerButton>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Weekly Overview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100/50 mt-6 relative overflow-hidden"
            >
              {/* Subtle animated background */}
              <motion.div
                animate={{ 
                  background: [
                    'linear-gradient(45deg, rgba(59, 130, 246, 0.02) 0%, transparent 50%)',
                    'linear-gradient(225deg, rgba(59, 130, 246, 0.02) 0%, transparent 50%)',
                    'linear-gradient(45deg, rgba(59, 130, 246, 0.02) 0%, transparent 50%)'
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute inset-0"
              />

              <h3 className="text-lg font-bold text-gray-900 mb-4 relative z-10">
                This Week's Plan
              </h3>
              <div className="grid grid-cols-7 gap-2 relative z-10">
                {upcomingDays.map((day, index) => {
                  const dayMeals = getMealsForDay(day);
                  const mealCount = Object.keys(dayMeals).reduce((count, key) => {
                    if (key === 'snacks' && Array.isArray(dayMeals[key])) {
                      return count + dayMeals[key].length;
                    }
                    return dayMeals[key] ? count + 1 : count;
                  }, 0);
                  const isToday = index === 0;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className={`p-3 rounded-lg text-center transition-all duration-200 cursor-pointer ${
                        isToday
                          ? 'bg-primary-100/60 border-2 border-primary-300/50'
                          : 'bg-gray-50/50 hover:bg-gray-100/50'
                      }`}
                      onClick={() => navigate('/scheduler')}
                    >
                      <motion.p 
                        animate={isToday ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`text-xs font-medium mb-1 ${
                          isToday ? 'text-primary-700' : 'text-gray-600'
                        }`}
                      >
                        {format(day, 'EEE')}
                      </motion.p>
                      <p className={`text-sm font-bold ${
                        isToday ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {format(day, 'd')}
                      </p>
                      <motion.div 
                        animate={{ 
                          backgroundColor: isToday ? [
                            'rgba(239, 68, 48, 0.1)',
                            'rgba(239, 68, 48, 0.2)',
                            'rgba(239, 68, 48, 0.1)'
                          ] : []
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className={`mt-1 text-xs ${
                          isToday ? 'text-primary-600' : 'text-gray-500'
                        } rounded-full px-1`}
                      >
                        {mealCount} meal{mealCount !== 1 ? 's' : ''}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </FloatingElement>

          {/* Sidebar */}
          <FloatingElement delay={0.3} className="space-y-6">
            {/* Recent Achievements */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100/50 relative overflow-hidden"
            >
              {/* Animated background glow */}
              <motion.div
                animate={{ 
                  background: [
                    'radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.05) 0%, transparent 70%)',
                    'radial-gradient(circle at 30% 70%, rgba(234, 179, 8, 0.05) 0%, transparent 70%)',
                    'radial-gradient(circle at 70% 30%, rgba(234, 179, 8, 0.05) 0%, transparent 70%)',
                    'radial-gradient(circle at 50% 50%, rgba(234, 179, 8, 0.05) 0%, transparent 70%)'
                  ]
                }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute inset-0"
              />

              <motion.h3 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold text-gray-900 mb-4 flex items-center relative z-10"
              >
                <motion.div
                  animate={{ rotate: [0, 10, 0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <SafeIcon icon={FiAward} className="mr-2 text-secondary-500" />
                </motion.div>
                Recent Badges
              </motion.h3>
              
              <div className="relative z-10">
                {recentBadges.length > 0 ? (
                  <div className="space-y-3">
                    {recentBadges.map((badge, index) => (
                      <PulsingBadge key={index} badge={badge} index={index} />
                    ))}
                  </div>
                ) : (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-500 text-sm"
                  >
                    Complete recipes to earn your first badges!
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100/50 relative overflow-hidden"
            >
              {/* Animated background pattern */}
              <motion.div
                animate={{ 
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239333ea" fill-opacity="0.4"%3E%3Cpath d="M15 15c0-8.284-6.716-15-15-15v15h15z"/%3E%3C/g%3E%3C/svg%3E")',
                  backgroundSize: '30px 30px'
                }}
              />

              <h3 className="text-lg font-bold text-gray-900 mb-4 relative z-10">
                Quick Actions
              </h3>
              <div className="space-y-3 relative z-10">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePlanWeek}
                  className="w-full bg-gradient-to-r from-primary-500/90 to-primary-600/90 text-white p-3 rounded-lg font-medium hover:from-primary-600/90 hover:to-primary-700/90 transition-all duration-200 flex items-center justify-center space-x-2 relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"
                  />
                  <SafeIcon icon={FiCalendar} />
                  <span>Plan This Week</span>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDiscoverRecipes}
                  className="w-full bg-gradient-to-r from-secondary-500/90 to-secondary-600/90 text-white p-3 rounded-lg font-medium hover:from-secondary-600/90 hover:to-secondary-700/90 transition-all duration-200 flex items-center justify-center space-x-2 relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"
                  />
                  <SafeIcon icon={FiBook} />
                  <span>Discover Recipes</span>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewShoppingList}
                  className="w-full border-2 border-primary-200/50 text-primary-700 p-3 rounded-lg font-medium hover:bg-primary-50/50 transition-all duration-200 flex items-center justify-center space-x-2 relative overflow-hidden"
                >
                  <motion.div
                    animate={{ 
                      background: [
                        'linear-gradient(90deg, transparent, rgba(239, 68, 48, 0.1), transparent)',
                        'linear-gradient(90deg, transparent, rgba(239, 68, 48, 0.1), transparent)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0"
                  />
                  <SafeIcon icon={FiShoppingCart} />
                  <span>View Shopping List</span>
                </motion.button>
              </div>
            </motion.div>
          </FloatingElement>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;