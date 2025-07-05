import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiCalendar, FiBook, FiShoppingCart, FiStar, FiShield, FiGift } = FiIcons;

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Recipes', href: '/recipes', icon: FiBook },
    { name: 'Scheduler', href: '/scheduler', icon: FiCalendar },
    { name: 'Shopping List', href: '/shopping-list', icon: FiShoppingCart },
    { name: 'Rewards', href: '/rewards', icon: FiGift },
  ];

  // Add admin panel for admin users
  if (user?.isAdmin) {
    navigation.push({
      name: 'Admin Panel',
      href: '/admin',
      icon: FiShield
    });
  }

  // ✅ FIX: Ensure navigation handler works properly
  const handleNavigation = (href, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Add small delay to ensure any ongoing animations complete
    setTimeout(() => {
      navigate(href);
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/20 to-orange-50/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500/90 to-primary-600/90 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiBook} className="text-white text-sm" />
              </div>
              <button 
                onClick={(e) => handleNavigation('/dashboard', e)}
                className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors duration-200"
              >
                Meal Plan
              </button>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <motion.button
                    key={item.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleNavigation(item.href, e)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 relative z-10 ${
                      isActive
                        ? item.name === 'Admin Panel'
                          ? 'bg-purple-100/60 text-purple-700'
                          : item.name === 'Rewards'
                          ? 'bg-pink-100/60 text-pink-700'
                          : 'bg-primary-100/60 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                    }`}
                  >
                    <SafeIcon icon={item.icon} className="text-sm" />
                    <span>{item.name}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  {/* Level & XP - Clickable to navigate to rewards */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleNavigation('/rewards', e)}
                    className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-primary-100/60 to-secondary-100/60 hover:from-primary-200/60 hover:to-secondary-200/60 px-3 py-1 rounded-full transition-all duration-200 cursor-pointer relative z-10"
                  >
                    <SafeIcon icon={FiStar} className="text-primary-600 text-sm" />
                    <span className="text-sm font-medium text-gray-700">
                      Level {user.level}
                    </span>
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-primary-500/90 to-secondary-500/90 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(user.xp % 100)}%` }}
                      />
                    </div>
                  </motion.button>

                  {/* Profile Dropdown */}
                  <ProfileDropdown />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white/90 backdrop-blur-sm border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
        <div className={`grid ${user?.isAdmin ? 'grid-cols-6' : 'grid-cols-5'} gap-1 p-2`}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <motion.button
                key={item.name}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleNavigation(item.href, e)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 relative z-10 ${
                  isActive
                    ? item.name === 'Admin Panel'
                      ? 'bg-purple-100/60 text-purple-700'
                      : item.name === 'Rewards'
                      ? 'bg-pink-100/60 text-pink-700'
                      : 'bg-primary-100/60 text-primary-700'
                    : 'text-gray-600'
                }`}
              >
                <SafeIcon icon={item.icon} className="text-lg mb-1" />
                <span className="text-xs font-medium">
                  {item.name === 'Admin Panel' 
                    ? 'Admin' 
                    : item.name === 'Shopping List' 
                    ? 'Shopping' 
                    : item.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">{children}</main>
    </div>
  );
};

export default Layout;