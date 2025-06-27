import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRecipes } from '../contexts/RecipeContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiChef, FiCalendar, FiShoppingCart, FiClock, FiUsers, FiStar, FiArrowRight, FiMail, FiLock, FiUser, FiHeart } = FiIcons;

const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const { saveSharedRecipe } = useRecipes();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check for shared recipe in URL
    const urlParams = new URLSearchParams(location.search);
    const sharedRecipe = urlParams.get('recipe');
    
    if (sharedRecipe && user) {
      const result = saveSharedRecipe(sharedRecipe);
      if (result.success) {
        toast.success(result.message);
        navigate('/recipes');
      } else {
        toast.error(result.message);
      }
    }
  }, [location.search, user, saveSharedRecipe, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.email, formData.password);
      }

      if (result.success) {
        // Check for shared recipe after login/register
        const urlParams = new URLSearchParams(location.search);
        const sharedRecipe = urlParams.get('recipe');
        
        if (sharedRecipe) {
          setTimeout(() => {
            const result = saveSharedRecipe(sharedRecipe);
            if (result.success) {
              toast.success(result.message);
              navigate('/recipes');
            } else {
              toast.error(result.message);
              navigate('/dashboard');
            }
          }, 500);
        } else {
          navigate('/dashboard');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: FiChef,
      title: 'Recipe Collection',
      description: 'Discover and save thousands of delicious recipes with intelligent ingredient management'
    },
    {
      icon: FiCalendar,
      title: 'Smart Planning',
      description: 'Plan your meals for the week with our intelligent scheduler and auto-cleanup'
    },
    {
      icon: FiShoppingCart,
      title: 'Smart Shopping Lists',
      description: 'Auto-generated lists with intelligent ingredient combining and totaling'
    },
    {
      icon: FiClock,
      title: 'Cooking Mode',
      description: 'Step-by-step cooking with floating timers that follow you everywhere'
    },
    {
      icon: FiMail,
      title: 'Recipe Sharing',
      description: 'Share recipes via email and save them instantly to your collection'
    },
    {
      icon: FiStar,
      title: 'Gamification',
      description: 'Earn XP, unlock achievements, and level up your culinary skills'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 mesh-bg">
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-accent-200 to-primary-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-r from-secondary-200 to-accent-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center px-6 py-3 glass rounded-full text-primary-700 font-semibold text-lg glow-effect"
                >
                  <SafeIcon icon={FiStar} className="mr-2 text-xl" />
                  Smart Meal Planning Made Easy
                </motion.div>
                
                <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Plan, Cook & 
                  <span className="gradient-text block mt-2"> Level Up</span>
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed font-medium">
                  Transform your cooking experience with AI-powered meal planning, 
                  intelligent ingredient management, and a gamified culinary journey.
                </p>
              </div>

              <div className="flex flex-wrap gap-6">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center space-x-3 glass px-6 py-4 rounded-xl card-hover"
                >
                  <SafeIcon icon={FiUsers} className="text-primary-500 text-xl" />
                  <div>
                    <div className="font-bold text-gray-900">10K+</div>
                    <div className="text-sm text-gray-600 font-medium">Active Cooks</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center space-x-3 glass px-6 py-4 rounded-xl card-hover"
                >
                  <SafeIcon icon={FiChef} className="text-secondary-500 text-xl" />
                  <div>
                    <div className="font-bold text-gray-900">5K+</div>
                    <div className="text-sm text-gray-600 font-medium">Recipes</div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center space-x-3 glass px-6 py-4 rounded-xl card-hover"
                >
                  <SafeIcon icon={FiHeart} className="text-accent-500 text-xl" />
                  <div>
                    <div className="font-bold text-gray-900">50K+</div>
                    <div className="text-sm text-gray-600 font-medium">Meals Planned</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Side - Auth Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="glass rounded-3xl p-8 shadow-2xl glow-effect"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  {isLogin ? 'Welcome Back!' : 'Join Meal Plan'}
                </h2>
                <p className="text-gray-600 font-medium">
                  {isLogin ? 'Sign in to continue your culinary journey' : 'Start your cooking adventure today'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Full Name
                    </label>
                    <div className="relative">
                      <SafeIcon icon={FiUser} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 input-modern rounded-xl text-lg font-medium placeholder-gray-400"
                        placeholder="Enter your name"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiMail} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 input-modern rounded-xl text-lg font-medium placeholder-gray-400"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiLock} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-12 pr-4 py-4 input-modern rounded-xl text-lg font-medium placeholder-gray-400"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full btn-gradient text-white py-4 px-6 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                      <SafeIcon icon={FiArrowRight} className="text-lg" />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary-600 hover:text-primary-700 font-semibold text-lg transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Master Cooking
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto font-medium leading-relaxed">
              From intelligent meal planning to smart ingredient management, we've got all the tools 
              to make your culinary journey extraordinary.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="glass p-8 rounded-2xl card-hover glow-effect"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <SafeIcon icon={feature.icon} className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 font-medium leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-5xl font-bold text-white leading-tight">
              Ready to Level Up Your Cooking?
            </h2>
            <p className="text-xl text-primary-100 font-medium leading-relaxed">
              Join thousands of home cooks who are already mastering their kitchens with intelligent 
              meal planning and smart recipe management.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLogin(false)}
              className="bg-white text-primary-600 px-10 py-5 rounded-xl font-bold text-xl hover:bg-gray-50 transition-all duration-200 inline-flex items-center space-x-3 shadow-2xl"
            >
              <span>Get Started Free</span>
              <SafeIcon icon={FiArrowRight} className="text-xl" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;