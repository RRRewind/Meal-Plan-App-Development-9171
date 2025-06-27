import React from 'react';
import { motion } from 'framer-motion';
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

const {
  FiChef, FiCalendar, FiTrendingUp, FiStar, FiClock, FiPlay, FiAward, FiTarget,
  FiShoppingCart, FiBook
} = FiIcons;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recipes, savedRecipes } = useRecipes();
  const { mealPlan, getMealsForDay } = useMealPlan();
  const { startCookingMode } = useCookingMode();
  const { badges } = useGamification();

  const today = new Date();
  const todayMeals = getMealsForDay(today);
  const upcomingDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const stats = [
    {
      title: 'Recipes Cooked',
      value: user?.recipesCooked || 0,
      icon: FiChef,
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Current Level',
      value: user?.level || 1,
      icon: FiStar,
      color: 'from-secondary-500 to-secondary-600'
    },
    {
      title: 'Cooking Streak',
      value: `${user?.streakDays || 0} days`,
      icon: FiTrendingUp,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Saved Recipes',
      value: savedRecipes.length,
      icon: FiTarget,
      color: 'from-blue-500 to-blue-600'
    }
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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-primary-100 text-lg">
                  Ready to cook something amazing today?
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user?.xp || 0}</div>
                    <div className="text-sm text-primary-100">Total XP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <SafeIcon icon={stat.icon} className="text-white text-xl" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Today's Meals */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <SafeIcon icon={FiCalendar} className="mr-2 text-primary-500" />
                  Today's Meals
                </h2>
                <span className="text-sm text-gray-500">
                  {format(today, 'EEEE, MMMM d')}
                </span>
              </div>

              <div className="space-y-4">
                {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                  const meal = todayMeals[mealType];
                  return (
                    <div
                      key={mealType}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-700 capitalize">
                            {mealType[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {mealType}
                          </p>
                          {meal ? (
                            <p className="text-sm text-gray-600">{meal.title}</p>
                          ) : (
                            <p className="text-sm text-gray-400">No meal planned</p>
                          )}
                        </div>
                      </div>
                      {meal && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startCookingMode(meal)}
                          className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors duration-200 flex items-center space-x-2"
                        >
                          <SafeIcon icon={FiPlay} className="text-sm" />
                          <span>Cook</span>
                        </motion.button>
                      )}
                    </div>
                  );
                })}

                {/* Show snacks if any */}
                {todayMeals.snacks && todayMeals.snacks.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-semibold text-amber-700">S</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Snacks</p>
                        <p className="text-sm text-gray-600">
                          {todayMeals.snacks.length} snack{todayMeals.snacks.length !== 1 ? 's' : ''} planned
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Overview */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                This Week's Plan
              </h3>
              <div className="grid grid-cols-7 gap-2">
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
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-center ${
                        isToday
                          ? 'bg-primary-100 border-2 border-primary-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      } transition-colors duration-200`}
                    >
                      <p className={`text-xs font-medium mb-1 ${
                        isToday ? 'text-primary-700' : 'text-gray-600'
                      }`}>
                        {format(day, 'EEE')}
                      </p>
                      <p className={`text-sm font-bold ${
                        isToday ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {format(day, 'd')}
                      </p>
                      <div className={`mt-1 text-xs ${
                        isToday ? 'text-primary-600' : 'text-gray-500'
                      }`}>
                        {mealCount} meal{mealCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Recent Achievements */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <SafeIcon icon={FiAward} className="mr-2 text-secondary-500" />
                Recent Badges
              </h3>
              {recentBadges.length > 0 ? (
                <div className="space-y-3">
                  {recentBadges.map((badge, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-gradient-to-r from-secondary-50 to-primary-50 rounded-lg"
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Complete recipes to earn your first badges!
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePlanWeek}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white p-3 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiCalendar} />
                  <span>Plan This Week</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDiscoverRecipes}
                  className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-white p-3 rounded-lg font-medium hover:from-secondary-600 hover:to-secondary-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiBook} />
                  <span>Discover Recipes</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleViewShoppingList}
                  className="w-full border-2 border-primary-200 text-primary-700 p-3 rounded-lg font-medium hover:bg-primary-50 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiShoppingCart} />
                  <span>View Shopping List</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;