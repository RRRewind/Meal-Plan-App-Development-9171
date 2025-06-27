import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiCalendar, FiBook, FiShoppingCart, FiUser, FiLogOut, FiStar, FiTrendingUp, FiShield } = FiIcons;

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Scheduler', href: '/scheduler', icon: FiCalendar },
    { name: 'Recipes', href: '/recipes', icon: FiBook },
    { name: 'Shopping List', href: '/shopping-list', icon: FiShoppingCart },
  ];

  // Add admin panel for admin users
  if (user?.isAdmin) {
    navigation.push({
      name: 'Admin Panel',
      href: '/admin',
      icon: FiShield
    });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiBook} className="text-white text-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900">Meal Plan</span>
              {user?.isAdmin && (
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                  <SafeIcon icon={FiShield} className="text-xs" />
                  <span>ADMIN</span>
                </span>
              )}
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
                    onClick={() => navigate(item.href)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isActive
                        ? item.name === 'Admin Panel'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                  {/* Level & XP */}
                  <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-primary-100 to-secondary-100 px-3 py-1 rounded-full">
                    <SafeIcon icon={FiStar} className="text-primary-600 text-sm" />
                    <span className="text-sm font-medium text-gray-700">
                      Level {user.level}
                    </span>
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(user.xp % 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* User Avatar */}
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-primary-200"
                    />
                    <span className="hidden sm:block text-sm font-medium text-gray-700">
                      {user.name}
                      {user.isAdmin && (
                        <span className="ml-1 text-purple-600">👑</span>
                      )}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <SafeIcon icon={FiLogOut} className="text-sm" />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
        <div className={`grid ${user?.isAdmin ? 'grid-cols-5' : 'grid-cols-4'} gap-1 p-2`}>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <motion.button
                key={item.name}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.href)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 ${
                  isActive
                    ? item.name === 'Admin Panel'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-primary-100 text-primary-700'
                    : 'text-gray-600'
                }`}
              >
                <SafeIcon icon={item.icon} className="text-lg mb-1" />
                <span className="text-xs font-medium">
                  {item.name === 'Admin Panel' ? 'Admin' : item.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;