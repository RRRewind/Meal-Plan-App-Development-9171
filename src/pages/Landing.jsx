import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRecipes } from '../contexts/RecipeContext';
import { useSettings } from '../contexts/SettingsContext';
import UsernameInput from '../components/UsernameInput';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiChef, FiCalendar, FiShoppingCart, FiClock, FiUsers, FiStar, FiArrowRight, FiMail, FiLock, FiUser, FiHeart, FiRefreshCw, FiZap } = FiIcons;

const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [sharedRecipeData, setSharedRecipeData] = useState(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const { login, register, user, pendingVerification, verifyEmail, resendVerificationCode, skipEmailVerification } = useAuth();
  const { saveSharedRecipe } = useRecipes();
  const navigate = useNavigate();
  const location = useLocation();

  // Animated phrases that will cycle through
  const animatedPhrases = [
    "Level Up",
    "Master Cooking",
    "Build Skills", 
    "Earn XP",
    "Unlock Badges",
    "Cook Smart",
    "Plan Better",
    "Save Time",
    "Get Organized",
    "Become Chef"
  ];

  // Cycle through phrases every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % animatedPhrases.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [animatedPhrases.length]);

  useEffect(() => {
    // Check for shared recipe in URL
    const urlParams = new URLSearchParams(location.search);
    const sharedRecipe = urlParams.get('recipe');
    if (sharedRecipe) {
      try {
        const recipeData = JSON.parse(decodeURIComponent(sharedRecipe));
        setSharedRecipeData(recipeData);
        if (user) {
          // User is already logged in, save immediately
          handleSaveSharedRecipe(sharedRecipe);
        }
      } catch (error) {
        toast.error('Invalid recipe link');
        navigate('/', { replace: true });
      }
    }
  }, [location.search, user]);

  useEffect(() => {
    if (user && !sharedRecipeData) {
      navigate('/dashboard');
    }
  }, [user, navigate, sharedRecipeData]);

  useEffect(() => {
    if (pendingVerification && !showVerification) {
      setShowVerification(true);
    }
  }, [pendingVerification]);

  const handleSaveSharedRecipe = (recipeData) => {
    const result = saveSharedRecipe(recipeData);
    if (result.success) {
      toast.success(`🎉 ${result.message}`);
      setTimeout(() => navigate('/recipes'), 1500);
    } else {
      toast.error(result.message);
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  };

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
        if (result.requiresVerification) {
          setShowVerification(true);
          // Show the verification code in the input for demo purposes
          if (result.verificationCode) {
            setVerificationCode(result.verificationCode);
          }
        } else {
          // Check for shared recipe after login
          const urlParams = new URLSearchParams(location.search);
          const sharedRecipe = urlParams.get('recipe');
          if (sharedRecipe) {
            setTimeout(() => {
              handleSaveSharedRecipe(sharedRecipe);
            }, 500);
          } else {
            navigate('/dashboard');
          }
        }
      } else {
        toast.error(result.error || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await verifyEmail(verificationCode);
      if (result.success) {
        // Check for shared recipe after verification
        const urlParams = new URLSearchParams(location.search);
        const sharedRecipe = urlParams.get('recipe');
        if (sharedRecipe) {
          setTimeout(() => {
            handleSaveSharedRecipe(sharedRecipe);
          }, 500);
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error(result.error || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const result = await resendVerificationCode();
    if (result.success) {
      toast.success('📧 New verification code sent!');
    }
  };

  const handleSkipVerification = async () => {
    const result = skipEmailVerification();
    if (result.success) {
      // Check for shared recipe after verification
      const urlParams = new URLSearchParams(location.search);
      const sharedRecipe = urlParams.get('recipe');
      if (sharedRecipe) {
        setTimeout(() => {
          handleSaveSharedRecipe(sharedRecipe);
        }, 500);
      } else {
        navigate('/dashboard');
      }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-orange-50/20 mesh-bg">
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-primary-200/20 to-secondary-200/20 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-accent-200/20 to-primary-200/20 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-gradient-to-r from-secondary-200/20 to-accent-200/20 rounded-full opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Shared Recipe Banner */}
      {sharedRecipeData && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500/95 to-secondary-500/95 text-white p-4 shadow-lg"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="font-bold text-lg mb-1">
              🍳 Someone shared a delicious recipe with you!
            </h3>
            <p className="text-primary-100">
              "{sharedRecipeData.title}" - {user ? 'Saving to your collection...' : 'Sign in to save it instantly!'}
            </p>
          </div>
        </motion.div>
      )}

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

                {/* UPDATED: Reduced spacing and bigger animated text */}
                <div className="space-y-1">
                  <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 leading-none">
                    Plan, Cook &
                  </h1>
                  
                  {/* Animated Title - BIGGER TEXT & REDUCED SPACING */}
                  <div className="w-full min-h-[140px] lg:min-h-[180px] relative -mt-2">
                    <AnimatePresence mode="wait">
                      <motion.h1
                        key={currentPhraseIndex}
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{
                          duration: 0.6,
                          ease: "easeInOut"
                        }}
                        className="absolute top-0 left-0 w-full text-7xl lg:text-8xl font-black leading-none"
                        style={{
                          background: 'linear-gradient(135deg, #ff4757 0%, #ff6b35 25%, #ffa726 50%, #ffcc02 75%, #ff6b9d 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          backgroundSize: '200% 200%',
                          animation: 'gradientShift 3s ease infinite'
                        }}
                      >
                        {animatedPhrases[currentPhraseIndex]}
                      </motion.h1>
                    </AnimatePresence>
                  </div>
                </div>

                <p className="text-xl text-gray-600 leading-relaxed font-medium">
                  Transform your cooking experience with AI-powered meal planning, intelligent ingredient management, and a gamified culinary journey.
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
              <AnimatePresence mode="wait">
                {showVerification ? (
                  <motion.div
                    key="verification"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500/90 to-secondary-500/90 rounded-full flex items-center justify-center mx-auto mb-4">
                        <SafeIcon icon={FiMail} className="text-white text-2xl" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Verify Your Email
                      </h2>
                      <div className="bg-blue-50/80 border border-blue-200/50 rounded-xl p-4 mb-4">
                        <p className="text-blue-800 font-semibold text-sm mb-2">
                          🚀 Demo Mode Active
                        </p>
                        <p className="text-blue-700 text-sm">
                          Since this is a demo, your verification code is shown above in the notification. In a real app, this would be sent to your email.
                        </p>
                      </div>
                      <p className="text-gray-600 font-medium mb-2">
                        Enter the 6-digit code or use the skip option below
                      </p>
                      <p className="text-primary-600 font-bold">
                        {pendingVerification?.email}
                      </p>
                    </div>

                    <form onSubmit={handleVerification} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-4 py-4 input-modern rounded-xl text-2xl font-bold text-center tracking-widest placeholder-gray-400"
                          placeholder="000000"
                          maxLength={6}
                          required
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading || verificationCode.length !== 6}
                        className="w-full btn-gradient text-white py-4 px-6 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                        ) : (
                          <>
                            <span>Verify Email</span>
                            <SafeIcon icon={FiArrowRight} className="text-lg" />
                          </>
                        )}
                      </motion.button>

                      {/* Demo Skip Option */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSkipVerification}
                        className="w-full bg-gradient-to-r from-secondary-500/90 to-secondary-600/90 text-white py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center space-x-3 shadow-lg"
                      >
                        <SafeIcon icon={FiZap} className="text-lg" />
                        <span>Skip Verification (Demo)</span>
                      </motion.button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResendCode}
                          className="text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors flex items-center space-x-2 mx-auto"
                        >
                          <SafeIcon icon={FiRefreshCw} />
                          <span>Resend Code</span>
                        </button>
                      </div>
                    </form>

                    <div className="mt-6 text-center">
                      <button
                        onClick={() => {
                          setShowVerification(false);
                          setVerificationCode('');
                        }}
                        className="text-gray-600 hover:text-gray-700 font-semibold text-sm transition-colors"
                      >
                        ← Back to login
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        {sharedRecipeData
                          ? (isLogin ? 'Sign in to save recipe!' : 'Join to save recipe!')
                          : (isLogin ? 'Welcome Back!' : 'Join Meal Plan')
                        }
                      </h2>
                      <p className="text-gray-600 font-medium">
                        {sharedRecipeData
                          ? `Save "${sharedRecipeData.title}" to your collection`
                          : (isLogin ? 'Sign in to continue your culinary journey' : 'Start your cooking adventure today')
                        }
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {!isLogin && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Username
                          </label>
                          <UsernameInput
                            value={formData.username}
                            onChange={(value) => setFormData(prev => ({ ...prev, username: value }))}
                            showAvailability={true}
                            className="text-lg"
                          />
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

                      {/* Demo Mode Info */}
                      {!isLogin && (
                        <div className="bg-gradient-to-r from-blue-50/60 to-secondary-50/60 p-4 rounded-xl border border-blue-200/50">
                          <div className="flex items-center space-x-2 mb-2">
                            <SafeIcon icon={FiZap} className="text-blue-600" />
                            <span className="text-sm font-semibold text-blue-800">Demo Mode</span>
                          </div>
                          <p className="text-xs text-blue-600">
                            Email verification code will be shown on screen since this is a demo app
                          </p>
                        </div>
                      )}

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
                            <span>
                              {sharedRecipeData
                                ? (isLogin ? 'Sign In & Save Recipe' : 'Create Account & Save Recipe')
                                : (isLogin ? 'Sign In' : 'Create Account')
                              }
                            </span>
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
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/30 backdrop-blur-sm">
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
              From intelligent meal planning to smart ingredient management, we've got all the tools to make your culinary journey extraordinary.
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
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500/90 to-primary-600/90 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
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
      <section className="py-24 bg-gradient-to-r from-primary-500/95 via-primary-600/95 to-secondary-500/95 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
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
              Join thousands of home cooks who are already mastering their kitchens with intelligent meal planning and smart recipe management.
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

      {/* Add CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;