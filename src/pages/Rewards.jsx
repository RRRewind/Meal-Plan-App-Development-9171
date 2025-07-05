import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useRewards } from '../contexts/RewardsContext';
import { useGamification } from '../contexts/GamificationContext';
import Layout from '../components/Layout';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const { FiGift, FiStar, FiTrendingUp, FiPlus, FiEdit3, FiTrash2, FiDownload, FiLock, FiUnlock, FiAward, FiZap, FiTarget, FiBookOpen, FiX, FiSave, FiExternalLink } = FiIcons;

const Rewards = () => {
  const { user } = useAuth();
  const { rewards, userRewards, loading, addReward, updateReward, deleteReward, claimReward, canClaimReward, hasClaimedReward, getNextReward, getProgressToNextReward } = useRewards();
  const { addXP } = useGamification();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [newReward, setNewReward] = useState({
    title: '',
    description: '',
    pdfUrl: '',
    requiredXp: '',
    icon: '📖',
    category: 'cookbook'
  });

  const { progress, remaining, nextReward } = getProgressToNextReward();

  // Celebration effect for claiming rewards
  const triggerRewardCelebration = () => {
    // 🎉 CONFETTI CELEBRATION
    confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF', '#9370DB']
    });

    // Second burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6347']
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#32CD32', '#1E90FF', '#9370DB']
      });
    }, 200);
  };

  const handleClaimReward = async (reward) => {
    const result = await claimReward(reward.id);
    if (result.success) {
      triggerRewardCelebration();
      addXP(10, 'Reward claimed!');
      toast.success(`🎉 ${reward.title} claimed!`, { duration: 5000 });
    } else {
      toast.error(result.error);
    }
  };

  const handleAddReward = async (e) => {
    e.preventDefault();
    const result = await addReward({
      ...newReward,
      requiredXp: parseInt(newReward.requiredXp)
    });

    if (result.success) {
      toast.success('✅ Reward added successfully!');
      setShowAddModal(false);
      setNewReward({
        title: '',
        description: '',
        pdfUrl: '',
        requiredXp: '',
        icon: '📖',
        category: 'cookbook'
      });
    } else {
      toast.error(result.error);
    }
  };

  const handleEditReward = async (e) => {
    e.preventDefault();
    const result = await updateReward(editingReward.id, {
      title: editingReward.title,
      description: editingReward.description,
      pdf_url: editingReward.pdf_url,
      required_xp: parseInt(editingReward.required_xp),
      icon: editingReward.icon,
      category: editingReward.category
    });

    if (result.success) {
      toast.success('✅ Reward updated successfully!');
      setShowEditModal(false);
      setEditingReward(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteReward = async (rewardId) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      const result = await deleteReward(rewardId);
      if (result.success) {
        toast.success('🗑️ Reward deleted successfully!');
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleDownloadPDF = (url, title) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addXP(5, 'Cookbook downloaded');
    }
  };

  const rewardIcons = ['📖', '🍳', '👨‍🍳', '🏆', '⭐', '🎯', '🔥', '💎', '🌟', '🎊'];
  const categories = ['cookbook', 'guide', 'bonus', 'special'];

  // Filter and sort rewards
  const sortedRewards = [...rewards].sort((a, b) => a.required_xp - b.required_xp);
  const claimedRewards = sortedRewards.filter(reward => hasClaimedReward(reward.id));
  const availableRewards = sortedRewards.filter(reward => canClaimReward(reward) && !hasClaimedReward(reward.id));
  const lockedRewards = sortedRewards.filter(reward => !canClaimReward(reward) && !hasClaimedReward(reward.id));

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="glass rounded-3xl p-16 shadow-lg">
            <SafeIcon icon={FiLock} className="text-6xl text-gray-400 mb-6 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 font-medium">Please sign in to view and claim rewards.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-3xl p-8 text-white shadow-2xl glow-effect relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.5, 1]
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

            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-3 flex items-center">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mr-4"
                    >
                      <SafeIcon icon={FiGift} className="text-3xl" />
                    </motion.div>
                    Culinary Rewards
                  </h1>
                  <p className="text-purple-100 text-lg font-medium">
                    Unlock amazing recipe cookbooks and cooking guides as you level up!
                  </p>
                </div>
                
                {user.isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddModal(true)}
                    className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
                  >
                    <SafeIcon icon={FiPlus} />
                    <span>Add Reward</span>
                  </motion.button>
                )}
              </div>

              {/* Progress to Next Reward */}
              {nextReward && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-bold text-lg">Next Reward: {nextReward.title}</p>
                      <p className="text-purple-100">{remaining} XP remaining</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">{user.xp}</p>
                      <p className="text-purple-100 text-sm">/ {nextReward.required_xp} XP</p>
                    </div>
                  </div>
                  
                  {/* Animated Progress Bar */}
                  <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 rounded-full relative overflow-hidden"
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12"
                      />
                    </motion.div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-purple-100">{Math.round(progress)}% Complete</span>
                    <span className="text-white font-semibold">{nextReward.icon} {nextReward.title}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="glass rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total XP</p>
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl font-bold text-purple-600"
                >
                  {user.xp}
                </motion.p>
              </div>
              <SafeIcon icon={FiZap} className="text-purple-500 text-2xl" />
            </div>
          </div>

          <div className="glass rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Claimed Rewards</p>
                <p className="text-3xl font-bold text-green-600">{claimedRewards.length}</p>
              </div>
              <SafeIcon icon={FiAward} className="text-green-500 text-2xl" />
            </div>
          </div>

          <div className="glass rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Available Now</p>
                <p className="text-3xl font-bold text-blue-600">{availableRewards.length}</p>
              </div>
              <SafeIcon icon={FiUnlock} className="text-blue-500 text-2xl" />
            </div>
          </div>

          <div className="glass rounded-xl p-6 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Coming Soon</p>
                <p className="text-3xl font-bold text-orange-600">{lockedRewards.length}</p>
              </div>
              <SafeIcon icon={FiTarget} className="text-orange-500 text-2xl" />
            </div>
          </div>
        </motion.div>

        {/* Available Rewards */}
        {availableRewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <SafeIcon icon={FiUnlock} className="mr-3 text-green-500" />
              Ready to Claim! 🎉
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRewards.map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="glass rounded-2xl overflow-hidden shadow-lg relative"
                >
                  {/* Glow Effect */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(34, 197, 94, 0.3)',
                        '0 0 40px rgba(34, 197, 94, 0.5)',
                        '0 0 20px rgba(34, 197, 94, 0.3)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                  />

                  <div className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-4xl"
                      >
                        {reward.icon}
                      </motion.span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        READY!
                      </span>
                    </div>

                    <h3 className="font-bold text-xl text-gray-900 mb-2">{reward.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{reward.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiStar} className="text-yellow-500" />
                        <span className="font-bold text-gray-900">{reward.required_xp} XP</span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold capitalize">
                        {reward.category}
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClaimReward(reward)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <SafeIcon icon={FiGift} />
                      <span>CLAIM REWARD</span>
                    </motion.button>

                    {user.isAdmin && (
                      <div className="flex items-center space-x-2 mt-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setEditingReward(reward);
                            setShowEditModal(true);
                          }}
                          className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <SafeIcon icon={FiEdit3} className="text-sm" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteReward(reward.id)}
                          className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <SafeIcon icon={FiTrash2} className="text-sm" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Claimed Rewards */}
        {claimedRewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <SafeIcon icon={FiAward} className="mr-3 text-green-500" />
              Your Collection 📚
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {claimedRewards.map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="glass rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">{reward.icon}</span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                        <SafeIcon icon={FiAward} className="text-xs" />
                        <span>CLAIMED</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-xl text-gray-900 mb-2">{reward.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{reward.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiStar} className="text-yellow-500" />
                        <span className="font-bold text-gray-900">{reward.required_xp} XP</span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold capitalize">
                        {reward.category}
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDownloadPDF(reward.pdf_url, reward.title)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <SafeIcon icon={FiDownload} />
                      <span>DOWNLOAD PDF</span>
                    </motion.button>

                    {user.isAdmin && (
                      <div className="flex items-center space-x-2 mt-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setEditingReward(reward);
                            setShowEditModal(true);
                          }}
                          className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        >
                          <SafeIcon icon={FiEdit3} className="text-sm" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteReward(reward.id)}
                          className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <SafeIcon icon={FiTrash2} className="text-sm" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Locked Rewards */}
        {lockedRewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <SafeIcon icon={FiLock} className="mr-3 text-orange-500" />
              Coming Soon 🔒
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedRewards.map((reward, index) => {
                const xpNeeded = reward.required_xp - user.xp;
                return (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -3 }}
                    className="glass rounded-2xl overflow-hidden shadow-lg opacity-75"
                  >
                    <div className="p-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-gray-100/50 rounded-2xl" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-4xl opacity-50">{reward.icon}</span>
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                            <SafeIcon icon={FiLock} className="text-xs" />
                            <span>{xpNeeded} XP</span>
                          </span>
                        </div>

                        <h3 className="font-bold text-xl text-gray-700 mb-2">{reward.title}</h3>
                        <p className="text-gray-500 text-sm mb-4">{reward.description}</p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <SafeIcon icon={FiStar} className="text-gray-400" />
                            <span className="font-bold text-gray-700">{reward.required_xp} XP</span>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold capitalize">
                            {reward.category}
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-xl py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2 text-gray-600 font-semibold">
                            <SafeIcon icon={FiLock} />
                            <span>{xpNeeded} more XP needed</span>
                          </div>
                        </div>

                        {user.isAdmin && (
                          <div className="flex items-center space-x-2 mt-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setEditingReward(reward);
                                setShowEditModal(true);
                              }}
                              className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            >
                              <SafeIcon icon={FiEdit3} className="text-sm" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteReward(reward.id)}
                              className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            >
                              <SafeIcon icon={FiTrash2} className="text-sm" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {rewards.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-16 text-center shadow-lg"
          >
            <SafeIcon icon={FiGift} className="text-6xl text-gray-300 mb-6 mx-auto" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Rewards Yet</h3>
            <p className="text-gray-600 font-medium">
              {user.isAdmin 
                ? 'Add the first reward to get started!' 
                : 'Check back later for amazing rewards!'}
            </p>
            {user.isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="mt-6 btn-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center space-x-2 mx-auto"
              >
                <SafeIcon icon={FiPlus} />
                <span>Add First Reward</span>
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Add Reward Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Add New Reward</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    <SafeIcon icon={FiX} className="text-2xl" />
                  </motion.button>
                </div>

                <form onSubmit={handleAddReward} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Reward Title
                      </label>
                      <input
                        type="text"
                        value={newReward.title}
                        onChange={(e) => setNewReward(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none"
                        required
                        placeholder="e.g., Italian Cookbook Collection"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Required XP
                      </label>
                      <input
                        type="number"
                        value={newReward.requiredXp}
                        onChange={(e) => setNewReward(prev => ({ ...prev, requiredXp: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none"
                        required
                        min="1"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newReward.description}
                      onChange={(e) => setNewReward(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none resize-none"
                      required
                      placeholder="A comprehensive collection of authentic Italian recipes..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      PDF URL
                    </label>
                    <input
                      type="url"
                      value={newReward.pdfUrl}
                      onChange={(e) => setNewReward(prev => ({ ...prev, pdfUrl: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none"
                      required
                      placeholder="https://example.com/cookbook.pdf"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Icon
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {rewardIcons.map((icon) => (
                          <motion.button
                            key={icon}
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setNewReward(prev => ({ ...prev, icon }))}
                            className={`p-3 rounded-xl text-2xl transition-all duration-200 ${
                              newReward.icon === icon
                                ? 'bg-purple-100 border-2 border-purple-500'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                            }`}
                          >
                            {icon}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={newReward.category}
                        onChange={(e) => setNewReward(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-6">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2"
                    >
                      <SafeIcon icon={FiSave} />
                      <span>Add Reward</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Reward Modal */}
        <AnimatePresence>
          {showEditModal && editingReward && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Edit Reward</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEditModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    <SafeIcon icon={FiX} className="text-2xl" />
                  </motion.button>
                </div>

                <form onSubmit={handleEditReward} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Reward Title
                      </label>
                      <input
                        type="text"
                        value={editingReward.title}
                        onChange={(e) => setEditingReward(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Required XP
                      </label>
                      <input
                        type="number"
                        value={editingReward.required_xp}
                        onChange={(e) => setEditingReward(prev => ({ ...prev, required_xp: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none"
                        required
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editingReward.description}
                      onChange={(e) => setEditingReward(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      PDF URL
                    </label>
                    <input
                      type="url"
                      value={editingReward.pdf_url}
                      onChange={(e) => setEditingReward(prev => ({ ...prev, pdf_url: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Icon
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {rewardIcons.map((icon) => (
                          <motion.button
                            key={icon}
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingReward(prev => ({ ...prev, icon }))}
                            className={`p-3 rounded-xl text-2xl transition-all duration-200 ${
                              editingReward.icon === icon
                                ? 'bg-purple-100 border-2 border-purple-500'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200'
                            }`}
                          >
                            {icon}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={editingReward.category}
                        onChange={(e) => setEditingReward(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-purple-500 focus:outline-none"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-6">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2"
                    >
                      <SafeIcon icon={FiSave} />
                      <span>Save Changes</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Rewards;