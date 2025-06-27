import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useRecipes } from '../contexts/RecipeContext';
import { useGamification } from '../contexts/GamificationContext';
import Layout from '../components/Layout';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiShield, FiUsers, FiCheck, FiX, FiEye, FiTrash2, FiClock, FiStar, FiChef, FiAlertTriangle, FiRefreshCw } = FiIcons;

const AdminPanel = () => {
  const { user } = useAuth();
  const { pendingRecipes, sharedRecipes, approveRecipe, rejectRecipe, removeSharedRecipe } = useRecipes();
  const { addXP } = useGamification();
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="glass rounded-3xl p-16 shadow-lg">
            <SafeIcon icon={FiAlertTriangle} className="text-6xl text-red-500 mb-6 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 font-medium">You need admin privileges to access this panel.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleApprove = (recipe) => {
    const result = approveRecipe(recipe.originalId, user);
    if (result.success) {
      toast.success('✅ Recipe approved and added to community!');
      addXP(10, 'Recipe approved');
    } else {
      toast.error(result.message);
    }
  };

  const handleReject = (recipe) => {
    setSelectedRecipe(recipe);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (selectedRecipe) {
      const result = rejectRecipe(selectedRecipe.originalId, user, rejectReason);
      if (result.success) {
        toast.success('❌ Recipe rejected');
        addXP(5, 'Recipe reviewed');
        setShowRejectModal(false);
        setSelectedRecipe(null);
        setRejectReason('');
      } else {
        toast.error(result.message);
      }
    }
  };

  const handleRemoveShared = (recipe) => {
    setSelectedRecipe(recipe);
    setShowRemoveModal(true);
  };

  const confirmRemove = () => {
    if (selectedRecipe) {
      const result = removeSharedRecipe(selectedRecipe.id || selectedRecipe.originalId, user);
      if (result.success) {
        toast.success('🗑️ Recipe removed from community');
        addXP(5, 'Recipe moderated');
        setShowRemoveModal(false);
        setSelectedRecipe(null);
      } else {
        toast.error(result.message);
      }
    }
  };

  const tabs = [
    { id: 'pending', name: 'Pending Approval', count: pendingRecipes.length, icon: FiClock },
    { id: 'approved', name: 'Community Recipes', count: sharedRecipes.length, icon: FiCheck }
  ];

  const currentRecipes = selectedTab === 'pending' ? pendingRecipes : sharedRecipes;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-blue-500 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3 flex items-center">
                  <SafeIcon icon={FiShield} className="mr-4 text-3xl" />
                  Admin Panel
                </h1>
                <p className="text-purple-100 text-lg font-medium">
                  Manage community recipes and moderate content
                </p>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-3xl font-bold mb-1">🛡️</div>
                <div className="text-purple-100 text-sm font-semibold">Administrator</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="glass rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-orange-600">{pendingRecipes.length}</p>
              </div>
              <SafeIcon icon={FiClock} className="text-orange-500 text-2xl" />
            </div>
          </div>

          <div className="glass rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Community Recipes</p>
                <p className="text-3xl font-bold text-green-600">{sharedRecipes.length}</p>
              </div>
              <SafeIcon icon={FiCheck} className="text-green-500 text-2xl" />
            </div>
          </div>

          <div className="glass rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Contributors</p>
                <p className="text-3xl font-bold text-blue-600">
                  {new Set([...pendingRecipes, ...sharedRecipes].map(r => r.sharedByUserId)).size}
                </p>
              </div>
              <SafeIcon icon={FiUsers} className="text-blue-500 text-2xl" />
            </div>
          </div>

          <div className="glass rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Admin Level</p>
                <p className="text-3xl font-bold text-purple-600">{user.level}</p>
              </div>
              <SafeIcon icon={FiStar} className="text-purple-500 text-2xl" />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  selectedTab === tab.id
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <SafeIcon icon={tab.icon} />
                <span>{tab.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {tab.count}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recipe List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {currentRecipes.length === 0 ? (
            <div className="glass rounded-3xl p-16 text-center shadow-lg">
              <SafeIcon icon={selectedTab === 'pending' ? FiClock : FiChef} className="text-6xl text-gray-300 mb-6 mx-auto" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {selectedTab === 'pending' ? 'No pending recipes' : 'No community recipes'}
              </h3>
              <p className="text-gray-600 font-medium">
                {selectedTab === 'pending' 
                  ? 'All caught up! No recipes waiting for approval.'
                  : 'No recipes in the community yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id || recipe.originalId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200"
                >
                  <div className="flex items-start space-x-6">
                    {/* Recipe Image */}
                    <div className="w-32 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex-shrink-0 overflow-hidden">
                      {recipe.image ? (
                        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <SafeIcon icon={FiChef} className="text-2xl text-primary-400" />
                        </div>
                      )}
                    </div>

                    {/* Recipe Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{recipe.title}</h3>
                          <p className="text-sm text-gray-600 font-medium">
                            Shared by <span className="font-bold text-primary-600">@{recipe.sharedBy}</span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectedTab === 'pending' && (
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Pending Review
                            </span>
                          )}
                          {selectedTab === 'approved' && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                              Community Recipe
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">{recipe.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>🕐 {recipe.cookTime}m</span>
                          <span>👥 {recipe.servings} servings</span>
                          <span>📊 {recipe.difficulty}</span>
                          <span>📅 {new Date(recipe.sharedAt).toLocaleDateString()}</span>
                        </div>

                        {/* Admin Actions */}
                        <div className="flex items-center space-x-3">
                          {selectedTab === 'pending' ? (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApprove(recipe)}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2 font-semibold"
                              >
                                <SafeIcon icon={FiCheck} />
                                <span>Approve</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleReject(recipe)}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2 font-semibold"
                              >
                                <SafeIcon icon={FiX} />
                                <span>Reject</span>
                              </motion.button>
                            </>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleRemoveShared(recipe)}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2 font-semibold"
                            >
                              <SafeIcon icon={FiTrash2} />
                              <span>Remove</span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowRejectModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="glass rounded-3xl p-8 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SafeIcon icon={FiX} className="text-3xl text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Reject Recipe</h2>
                  <p className="text-gray-600 font-medium">
                    Are you sure you want to reject "{selectedRecipe?.title}"?
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason (optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                  />
                </div>

                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmReject}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors duration-200 shadow-lg"
                  >
                    Reject
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Remove Modal */}
        <AnimatePresence>
          {showRemoveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowRemoveModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="glass rounded-3xl p-8 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <SafeIcon icon={FiTrash2} className="text-3xl text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Remove Recipe</h2>
                  <p className="text-gray-600 mb-2 font-medium">
                    Are you sure you want to remove "{selectedRecipe?.title}" from the community?
                  </p>
                  <p className="text-sm text-gray-500 mb-8">
                    This action cannot be undone.
                  </p>
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowRemoveModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmRemove}
                      className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors duration-200 shadow-lg"
                    >
                      Remove
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default AdminPanel;