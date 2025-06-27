import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useGamification } from '../contexts/GamificationContext';
import Layout from '../components/Layout';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiShoppingCart, FiCheck, FiPlus, FiTrash2, FiDownload, FiShare2 } = FiIcons;

const ShoppingList = () => {
  const [customItems, setCustomItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [checkedItems, setCheckedItems] = useState(new Set());
  
  const { getAllIngredients } = useMealPlan();
  const { addXP } = useGamification();

  const mealIngredients = getAllIngredients();
  const allItems = [...mealIngredients, ...customItems];

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      const item = {
        name: newItem.trim(),
        amount: '1x',
        isCustom: true,
        id: Date.now().toString()
      };
      setCustomItems(prev => [...prev, item]);
      setNewItem('');
      addXP(2, 'Item added to shopping list');
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
      }
      return updated;
    });
  };

  const handleClearCompleted = () => {
    const completedCustomItems = customItems.filter(item => checkedItems.has(item.id));
    setCustomItems(prev => prev.filter(item => !checkedItems.has(item.id)));
    setCheckedItems(new Set());
    
    if (completedCustomItems.length > 0) {
      toast.success(`Cleared ${completedCustomItems.length} completed items`);
    }
  };

  const handleExportList = () => {
    const listText = allItems
      .map(item => `• ${item.name} - ${item.amount}`)
      .join('\n');
    
    navigator.clipboard.writeText(listText).then(() => {
      toast.success('Shopping list copied to clipboard!');
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
        title: 'My Shopping List',
        text: `Shopping List:\n\n${listText}`
      }).then(() => {
        addXP(10, 'Shopping list shared');
      });
    } else {
      handleExportList();
    }
  };

  const checkedCount = Array.from(checkedItems).length;
  const totalCount = allItems.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <SafeIcon icon={FiShoppingCart} className="mr-3" />
                  Shopping List
                </h1>
                <p className="text-primary-100 text-lg">
                  Your ingredients from planned meals plus custom items
                </p>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-3xl font-bold">
                  {checkedCount}/{totalCount}
                </div>
                <div className="text-primary-100 text-sm">
                  Items completed
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-primary-100">Progress</span>
                <span className="text-sm text-primary-100">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-primary-400/30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-full h-2"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Add Custom Item */}
            <form onSubmit={handleAddCustomItem} className="flex-1 flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add custom item..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-200 flex items-center space-x-2"
              >
                <SafeIcon icon={FiPlus} />
                <span>Add</span>
              </motion.button>
            </form>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearCompleted}
                disabled={checkedItems.size === 0}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <SafeIcon icon={FiTrash2} />
                <span>Clear</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportList}
                className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 transition-colors duration-200 flex items-center space-x-2"
              >
                <SafeIcon icon={FiDownload} />
                <span>Export</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShareList}
                className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors duration-200 flex items-center space-x-2"
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
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {allItems.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {/* Meal Ingredients Section */}
              {mealIngredients.length > 0 && (
                <>
                  <div className="px-6 py-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                      From Meal Plans ({mealIngredients.length} items)
                    </h3>
                  </div>
                  {mealIngredients.map((ingredient, index) => {
                    const itemKey = `meal-${ingredient.name}-${index}`;
                    const isChecked = checkedItems.has(itemKey);
                    
                    return (
                      <motion.div
                        key={itemKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 ${
                          isChecked ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleItem(itemKey)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                              isChecked
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-primary-500'
                            }`}
                          >
                            {isChecked && <SafeIcon icon={FiCheck} className="text-xs" />}
                          </motion.button>
                          
                          <div className={`${isChecked ? 'line-through text-gray-500' : 'text-gray-900'} transition-colors duration-200`}>
                            <p className="font-medium">{ingredient.name}</p>
                            <p className="text-sm text-gray-600">{ingredient.amount}</p>
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
                  <div className="px-6 py-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <span className="w-2 h-2 bg-secondary-500 rounded-full mr-2"></span>
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
                        transition={{ delay: (mealIngredients.length + index) * 0.05 }}
                        className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 ${
                          isChecked ? 'bg-green-50' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleItem(item.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                              isChecked
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-primary-500'
                            }`}
                          >
                            {isChecked && <SafeIcon icon={FiCheck} className="text-xs" />}
                          </motion.button>
                          
                          <div className={`${isChecked ? 'line-through text-gray-500' : 'text-gray-900'} transition-colors duration-200`}>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">{item.amount}</p>
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveCustomItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
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
            <div className="px-6 py-12 text-center">
              <SafeIcon icon={FiShoppingCart} className="text-6xl text-gray-300 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Your shopping list is empty
              </h3>
              <p className="text-gray-600 mb-4">
                Plan some meals or add custom items to get started
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNewItem('Add your first item')}
                className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-200"
              >
                Add First Item
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        {allItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-primary-600">{totalCount}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-green-600">{checkedCount}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-secondary-600">{mealIngredients.length}</div>
              <div className="text-sm text-gray-600">From Meals</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-purple-600">{customItems.length}</div>
              <div className="text-sm text-gray-600">Custom Items</div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default ShoppingList;