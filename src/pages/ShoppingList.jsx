import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useGamification } from '../contexts/GamificationContext';
import Layout from '../components/Layout';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const { FiShoppingCart, FiCheck, FiPlus, FiTrash2, FiDownload, FiShare2, FiZap, FiStar, FiAward } = FiIcons;

const ShoppingList = () => {
  const [customItems, setCustomItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [wasCompleted, setWasCompleted] = useState(false); // Track completion state
  const { getAllIngredients } = useMealPlan();
  const { addXP } = useGamification();

  const mealIngredients = getAllIngredients();
  const allItems = [...mealIngredients, ...customItems];
  const checkedCount = Array.from(checkedItems).length;
  const totalCount = allItems.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const isCompleted = totalCount > 0 && checkedCount === totalCount;

  // 🎉 CONFETTI CELEBRATION: Trigger when shopping is completed
  useEffect(() => {
    if (isCompleted && !wasCompleted && totalCount > 0) {
      triggerConfettiCelebration();
      setWasCompleted(true);
      
      // Special completion rewards
      addXP(50, '🎉 Shopping list completed!');
      toast.success('🎉 Shopping complete! All items checked off!', { 
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      });
    } else if (!isCompleted && wasCompleted) {
      // Reset completion state if items are added after completion
      setWasCompleted(false);
    }
  }, [isCompleted, wasCompleted, totalCount, addXP]);

  // 🎊 CONFETTI FUNCTION: Multiple bursts with different effects
  const triggerConfettiCelebration = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    // 🎆 BURST 1: Center explosion
    confetti({
      ...defaults,
      particleCount: 150,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#f59e0b']
    });

    // 🎆 BURST 2: Left side
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 100,
        origin: { x: 0.2, y: 0.6 },
        colors: ['#8b5cf6', '#7c3aed', '#a78bfa', '#c4b5fd', '#e0e7ff']
      });
    }, 300);

    // 🎆 BURST 3: Right side
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 100,
        origin: { x: 0.8, y: 0.6 },
        colors: ['#ef4444', '#dc2626', '#f87171', '#fca5a5', '#fecaca']
      });
    }, 600);

    // 🎆 BURST 4: Top shower effect
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.3 },
        colors: ['#06b6d4', '#0891b2', '#67e8f9', '#a5f3fc', '#cffafe']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.3 },
        colors: ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#fed7aa']
      });
    }, 900);

    // 🎆 BURST 5: Continuous smaller bursts
    const interval = setInterval(() => {
      if (Date.now() > animationEnd) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: randomInRange(10, 30),
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: {
          x: randomInRange(0.1, 0.9),
          y: randomInRange(0.3, 0.7)
        },
        colors: ['#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#fbbf24']
      });
    }, 200);

    // 🎆 FINAL BURST: Grand finale
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 200,
        origin: { x: 0.5, y: 0.3 },
        spread: 100,
        startVelocity: 45,
        colors: ['#10b981', '#059669', '#34d399', '#fbbf24', '#f59e0b', '#8b5cf6', '#ef4444']
      });
    }, 1200);
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      const item = {
        name: newItem.trim(),
        amount: '1 piece',
        isCustom: true,
        id: Date.now().toString()
      };
      setCustomItems(prev => [...prev, item]);
      setNewItem('');
      addXP(2, 'Item added to shopping list');
      toast.success('Item added to shopping list!');
    }
  };

  const handleRemoveCustomItem = (itemId) => {
    setCustomItems(prev => prev.filter(item => item.id !== itemId));
    setCheckedItems(prev => {
      const updated = new Set(prev);
      updated.delete(itemId);
      return updated;
    });
  };

  const handleToggleItem = (itemKey) => {
    setCheckedItems(prev => {
      const updated = new Set(prev);
      if (updated.has(itemKey)) {
        updated.delete(itemKey);
      } else {
        updated.add(itemKey);
        addXP(1, 'Item checked off');
        
        // 🎉 MINI CELEBRATION: Small confetti for individual items
        if (Math.random() > 0.7) { // 30% chance for mini celebration
          confetti({
            particleCount: 20,
            spread: 30,
            origin: { x: 0.5, y: 0.7 },
            colors: ['#10b981', '#34d399', '#6ee7b7'],
            zIndex: 9999
          });
        }
      }
      return updated;
    });
  };

  const handleClearCompleted = () => {
    const completedCustomItems = customItems.filter(item => checkedItems.has(item.id));
    setCustomItems(prev => prev.filter(item => !checkedItems.has(item.id)));
    setCheckedItems(new Set());
    
    if (completedCustomItems.length > 0) {
      toast.success(`🎉 Cleared ${completedCustomItems.length} completed items`);
      addXP(5, 'Cleared completed items');
      
      // 🎊 SMALL CELEBRATION: For clearing items
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#6b7280', '#9ca3af', '#d1d5db'],
        zIndex: 9999
      });
    }
  };

  const handleExportList = () => {
    const listText = allItems
      .map(item => `• ${item.name} - ${item.amount}`)
      .join('\n');
    
    navigator.clipboard.writeText(listText).then(() => {
      toast.success('📋 Shopping list copied to clipboard!');
      addXP(5, 'Shopping list exported');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const handleShareList = () => {
    if (navigator.share) {
      const listText = allItems
        .map(item => `• ${item.name} - ${item.amount}`)
        .join('\n');
      
      navigator.share({
        title: 'My Smart Shopping List',
        text: `Shopping List (${allItems.length} items):\n\n${listText}\n\nGenerated by Meal Plan App 🍳`
      }).then(() => {
        addXP(10, 'Shopping list shared');
        toast.success('Shopping list shared successfully!');
      });
    } else {
      handleExportList();
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Completion Celebration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={`${
            isCompleted 
              ? 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-500' 
              : 'bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500'
          } rounded-3xl p-8 text-white shadow-2xl glow-effect transition-all duration-1000`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3 flex items-center">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                      className="mr-4"
                    >
                      <SafeIcon icon={FiAward} className="text-3xl" />
                    </motion.div>
                  ) : (
                    <SafeIcon icon={FiShoppingCart} className="mr-4 text-3xl" />
                  )}
                  {isCompleted ? 'Shopping Complete! 🎉' : 'Smart Shopping List'}
                </h1>
                <p className={`text-lg font-medium ${
                  isCompleted 
                    ? 'text-green-100' 
                    : 'text-primary-100'
                }`}>
                  {isCompleted 
                    ? 'Congratulations! All items have been checked off!' 
                    : 'Intelligently combined ingredients from your meal plans'
                  }
                </p>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-4xl font-bold mb-1">
                  {checkedCount}/{totalCount}
                </div>
                <div className={`text-sm font-semibold ${
                  isCompleted ? 'text-green-100' : 'text-primary-100'
                }`}>
                  Items completed
                </div>
                {isCompleted ? (
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mt-2"
                  >
                    <SafeIcon icon={FiStar} className="text-xl text-yellow-300" />
                  </motion.div>
                ) : (
                  <SafeIcon icon={FiZap} className="text-xl text-yellow-300 mt-2" />
                )}
              </div>
            </div>

            {/* Enhanced Progress Bar with Celebration */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${
                  isCompleted ? 'text-green-100' : 'text-primary-100'
                }`}>
                  Shopping Progress
                </span>
                <span className={`text-sm font-bold ${
                  isCompleted ? 'text-green-100' : 'text-primary-100'
                }`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className={`w-full rounded-full h-3 shadow-inner ${
                isCompleted 
                  ? 'bg-green-400/30' 
                  : 'bg-primary-400/30'
              }`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`rounded-full h-3 shadow-lg ${
                    isCompleted
                      ? 'bg-gradient-to-r from-yellow-300 via-green-300 to-emerald-300'
                      : 'bg-gradient-to-r from-yellow-300 to-white'
                  }`}
                />
              </div>
              {isCompleted && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-green-100 font-bold mt-2"
                >
                  🏆 Perfect Score! You're a shopping champion! 🏆
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Add Custom Item */}
            <form onSubmit={handleAddCustomItem} className="flex-1 flex gap-3">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add custom item..."
                className="flex-1 px-4 py-3 input-modern rounded-xl font-medium text-lg"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors duration-200 flex items-center space-x-2 font-semibold shadow-lg"
              >
                <SafeIcon icon={FiPlus} />
                <span>Add</span>
              </motion.button>
            </form>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearCompleted}
                disabled={checkedItems.size === 0}
                className="px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg"
              >
                <SafeIcon icon={FiTrash2} />
                <span>Clear</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportList}
                className="px-4 py-3 bg-secondary-100 text-secondary-700 rounded-xl hover:bg-secondary-200 transition-colors duration-200 flex items-center space-x-2 font-semibold shadow-lg"
              >
                <SafeIcon icon={FiDownload} />
                <span>Export</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShareList}
                className="px-4 py-3 bg-accent-100 text-accent-700 rounded-xl hover:bg-accent-200 transition-colors duration-200 flex items-center space-x-2 font-semibold shadow-lg"
              >
                <SafeIcon icon={FiShare2} />
                <span>Share</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Shopping List Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl shadow-lg overflow-hidden"
        >
          {allItems.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {/* Meal Ingredients Section */}
              {mealIngredients.length > 0 && (
                <>
                  <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-secondary-50">
                    <h3 className="font-bold text-gray-900 flex items-center text-lg">
                      <span className="w-3 h-3 bg-primary-500 rounded-full mr-3 animate-pulse"></span>
                      From Meal Plans ({mealIngredients.length} items)
                      <SafeIcon icon={FiZap} className="ml-2 text-primary-500" />
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 font-medium">Intelligently combined and totaled</p>
                  </div>
                  {mealIngredients.map((ingredient, index) => {
                    const itemKey = `meal-${ingredient.name}-${index}`;
                    const isChecked = checkedItems.has(itemKey);
                    return (
                      <motion.div
                        key={itemKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-all duration-200 ${
                          isChecked ? 'bg-green-50/80' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleItem(itemKey)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                              isChecked
                                ? 'bg-green-500 border-green-500 text-white shadow-lg'
                                : 'border-gray-300 hover:border-primary-500 hover:shadow-md'
                            }`}
                          >
                            {isChecked && <SafeIcon icon={FiCheck} className="text-sm" />}
                          </motion.button>
                          <div className={`${
                            isChecked ? 'line-through text-gray-500' : 'text-gray-900'
                          } transition-all duration-200`}>
                            <p className="font-semibold text-lg">{ingredient.name}</p>
                            <p className="text-sm text-gray-600 font-medium">{ingredient.amount}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              )}

              {/* Custom Items Section */}
              {customItems.length > 0 && (
                <>
                  <div className="px-6 py-4 bg-gradient-to-r from-secondary-50 to-accent-50">
                    <h3 className="font-bold text-gray-900 flex items-center text-lg">
                      <span className="w-3 h-3 bg-secondary-500 rounded-full mr-3 animate-pulse"></span>
                      Custom Items ({customItems.length} items)
                    </h3>
                  </div>
                  {customItems.map((item, index) => {
                    const isChecked = checkedItems.has(item.id);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (mealIngredients.length + index) * 0.03 }}
                        className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-all duration-200 ${
                          isChecked ? 'bg-green-50/80' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleItem(item.id)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                              isChecked
                                ? 'bg-green-500 border-green-500 text-white shadow-lg'
                                : 'border-gray-300 hover:border-primary-500 hover:shadow-md'
                            }`}
                          >
                            {isChecked && <SafeIcon icon={FiCheck} className="text-sm" />}
                          </motion.button>
                          <div className={`${
                            isChecked ? 'line-through text-gray-500' : 'text-gray-900'
                          } transition-all duration-200`}>
                            <p className="font-semibold text-lg">{item.name}</p>
                            <p className="text-sm text-gray-600 font-medium">{item.amount}</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveCustomItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <SafeIcon icon={FiTrash2} className="text-sm" />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <SafeIcon icon={FiShoppingCart} className="text-6xl text-gray-300 mb-6 mx-auto" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Your shopping list is empty
              </h3>
              <p className="text-gray-600 mb-6 font-medium">
                Plan some meals or add custom items to get started
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNewItem('Add your first item')}
                className="btn-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg"
              >
                Add First Item
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Enhanced Stats with Completion Celebration */}
        {allItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            <div className={`glass rounded-xl p-6 text-center shadow-lg card-hover ${
              isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''
            }`}>
              <div className={`text-3xl font-bold mb-1 ${
                isCompleted ? 'text-green-600' : 'text-primary-600'
              }`}>{totalCount}</div>
              <div className="text-sm text-gray-600 font-semibold">Total Items</div>
            </div>

            <div className={`glass rounded-xl p-6 text-center shadow-lg card-hover ${
              isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''
            }`}>
              <div className="text-3xl font-bold text-green-600 mb-1 flex items-center justify-center">
                {checkedCount}
                {isCompleted && (
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                    className="ml-1"
                  >
                    🎉
                  </motion.span>
                )}
              </div>
              <div className="text-sm text-gray-600 font-semibold">Completed</div>
            </div>

            <div className={`glass rounded-xl p-6 text-center shadow-lg card-hover ${
              isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''
            }`}>
              <div className={`text-3xl font-bold mb-1 ${
                isCompleted ? 'text-green-600' : 'text-secondary-600'
              }`}>{mealIngredients.length}</div>
              <div className="text-sm text-gray-600 font-semibold">From Meals</div>
            </div>

            <div className={`glass rounded-xl p-6 text-center shadow-lg card-hover ${
              isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''
            }`}>
              <div className={`text-3xl font-bold mb-1 ${
                isCompleted ? 'text-green-600' : 'text-accent-600'
              }`}>{customItems.length}</div>
              <div className="text-sm text-gray-600 font-semibold">Custom Items</div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default ShoppingList;