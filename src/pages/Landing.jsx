import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRecipes } from '../contexts/RecipeContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiChef, FiCalendar, FiShoppingCart, FiClock, FiUsers, FiStar, FiArrowRight, FiMail, FiLock, FiHeart, FiZap } = FiIcons;

const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.username, formData.email, formData.password);
      }

      if (result.success) {
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: FiChef,
      title: 'Recipe Collection',
      description: 'Discover and save delicious recipes'
    },
    {
      icon: FiCalendar,
      title: 'Smart Planning',
      description: 'Plan your meals for the week'
    },
    {
      icon: FiShoppingCart,
      title: 'Shopping Lists',
      description: 'Auto-generated ingredient lists'
    },
    {
      icon: FiClock,
      title: 'Cooking Mode',
      description: 'Step-by-step cooking guidance'
    },
    {
      icon: FiStar,
      title: 'Gamification',
      description: 'Earn XP and unlock achievements'
    },
    {
      icon: FiHeart,
      title: 'Recipe Sharing',
      description: 'Share recipes with friends'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-white/80 rounded-full text-primary-700 font-semibold text-sm border border-primary-200">
                  <SafeIcon icon={FiStar} className="mr-2 text-lg" />
                  Smart Meal Planning Made Easy
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Plan, Cook & Level Up
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed">
                  Transform your cooking experience with intelligent meal planning, smart ingredient management, and gamified culinary adventures.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 bg-white/80 px-4 py-3 rounded-xl border border-gray-200">
                  <SafeIcon icon={FiUsers} className="text-primary-500 text-lg" />
                  <div>
                    <div className="font-bold text-gray-900">10K+</div>
                    <div className="text-xs text-gray-600">Active Users</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-white/80 px-4 py-3 rounded-xl border border-gray-200">
                  <SafeIcon icon={FiChef} className="text-secondary-500 text-lg" />
                  <div>
                    <div className="font-bold text-gray-900">5K+</div>
                    <div className="text-xs text-gray-600">Recipes</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-white/80 px-4 py-3 rounded-xl border border-gray-200 col-span-2 md:col-span-1">
                  <SafeIcon icon={FiHeart} className="text-accent-500 text-lg" />
                  <div>
                    <div className="font-bold text-gray-900">50K+</div>
                    <div className="text-xs text-gray-600">Meals Planned</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isLogin ? 'Welcome Back!' : 'Join Meal Plan'}
                </h2>
                <p className="text-gray-600">
                  {isLogin ? 'Sign in to continue your culinary journey' : 'Start your cooking adventure today'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors"
                      placeholder="Enter username"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiMail} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-6 rounded-xl font-bold text-lg disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>Please wait...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                      <SafeIcon icon={FiArrowRight} />
                    </div>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Master Cooking
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From intelligent meal planning to smart ingredient management, we've got all the tools to make your culinary journey extraordinary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4">
                  <SafeIcon icon={feature.icon} className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Level Up Your Cooking?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Join thousands of home cooks who are already mastering their kitchens.
          </p>
          <button
            onClick={() => setIsLogin(false)}
            className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
          >
            Get Started Free
          </button>
        </div>
      </section>
    </div>
  );
};

export default Landing;