import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipes } from '../contexts/RecipeContext';
import { useCookingMode } from '../contexts/CookingModeContext';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiSearch, FiHeart, FiClock, FiUsers, FiPlay, FiShare2, FiPlus, FiX, FiStar, FiMail, FiCheck } = FiIcons;

const Recipes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    cookTime: '',
    servings: '',
    difficulty: 'Easy',
    ingredients: [{ name: '', amount: '' }],
    steps: [''],
    tags: [],
    image: ''
  });

  const { 
    recipes, 
    sharedRecipes, 
    savedRecipes, 
    saveRecipe, 
    unsaveRecipe, 
    isRecipeSaved, 
    shareRecipe, 
    emailShareRecipe, 
    hasSharedRecipe 
  } = useRecipes();
  const { startCookingMode } = useCookingMode();
  const { addXP } = useGamification();
  const { user } = useAuth();

  const allRecipes = [...recipes, ...sharedRecipes];
  const filters = [
    { id: 'all', name: 'All Recipes', count: allRecipes.length },
    { id: 'saved', name: 'Saved', count: savedRecipes.length },
    { id: 'shared', name: 'Community', count: sharedRecipes.length }
  ];

  const filteredRecipes = allRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'saved' && isRecipeSaved(recipe.id)) ||
                         (selectedFilter === 'shared' && recipe.shared);
    
    return matchesSearch && matchesFilter;
  });

  const handleSaveRecipe = (recipe) => {
    if (isRecipeSaved(recipe.id)) {
      unsaveRecipe(recipe.id);
      toast.success('Recipe removed from saved');
    } else {
      saveRecipe(recipe);
      addXP(5, 'Recipe saved');
      toast.success('Recipe saved!');
    }
  };

  const handleShareRecipe = (recipe) => {
    const result = shareRecipe(recipe);
    if (result.success) {
      addXP(15, 'Recipe shared');
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleEmailShareRecipe = (recipe) => {
    try {
      emailShareRecipe(recipe);
      addXP(10, 'Recipe shared via email');
      toast.success('Email client opened! Recipe link included.');
    } catch (error) {
      toast.error('Failed to open email client');
    }
  };

  const handleAddIngredient = () => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '' }]
    }));
  };

  const handleAddStep = () => {
    setNewRecipe(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const handleSubmitRecipe = (e) => {
    e.preventDefault();
    toast.success('Recipe added successfully!');
    addXP(20, 'Recipe created');
    setShowAddModal(false);
    setNewRecipe({
      title: '',
      description: '',
      cookTime: '',
      servings: '',
      difficulty: 'Easy',
      ingredients: [{ name: '', amount: '' }],
      steps: [''],
      tags: [],
      image: ''
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Recipe Collection
            </h1>
            <p className="text-gray-600 font-medium">
              Discover, save, and share amazing recipes with intelligent management
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 btn-gradient text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2"
          >
            <SafeIcon icon={FiPlus} />
            <span>Add Recipe</span>
          </motion.button>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <SafeIcon icon={FiSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search recipes, ingredients, or tags..."
                className="w-full pl-12 pr-4 py-4 input-modern rounded-xl text-lg font-medium"
              />
            </div>

            {/* Filters */}
            <div className="flex space-x-3">
              {filters.map((filter) => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    selectedFilter === filter.id
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <span>{filter.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedFilter === filter.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {filter.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recipe Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8 }}
              className="glass rounded-2xl overflow-hidden shadow-lg card-hover glow-effect"
            >
              {/* Recipe Image */}
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 relative overflow-hidden">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <SafeIcon icon={FiStar} className="text-4xl text-primary-400" />
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSaveRecipe(recipe)}
                    className={`p-2 rounded-full backdrop-blur-sm transition-colors duration-200 shadow-lg ${
                      isRecipeSaved(recipe.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                    }`}
                  >
                    <SafeIcon icon={FiHeart} className="text-sm" />
                  </motion.button>
                  
                  {user && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEmailShareRecipe(recipe)}
                        className="p-2 bg-white/90 text-gray-600 hover:bg-white hover:text-blue-500 rounded-full backdrop-blur-sm transition-colors duration-200 shadow-lg"
                      >
                        <SafeIcon icon={FiMail} className="text-sm" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleShareRecipe(recipe)}
                        className={`p-2 rounded-full backdrop-blur-sm transition-colors duration-200 shadow-lg ${
                          hasSharedRecipe(recipe.id)
                            ? 'bg-green-500 text-white'
                            : 'bg-white/90 text-gray-600 hover:bg-white hover:text-primary-500'
                        }`}
                      >
                        <SafeIcon icon={hasSharedRecipe(recipe.id) ? FiCheck : FiShare2} className="text-sm" />
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Difficulty Badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                    {recipe.difficulty}
                  </span>
                </div>
              </div>

              {/* Recipe Content */}
              <div className="p-6">
                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  {recipe.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 font-medium">
                  {recipe.description}
                </p>

                {/* Recipe Stats */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 font-medium">
                    <div className="flex items-center">
                      <SafeIcon icon={FiClock} className="mr-1" />
                      {recipe.cookTime}m
                    </div>
                    <div className="flex items-center">
                      <SafeIcon icon={FiUsers} className="mr-1" />
                      {recipe.servings}
                    </div>
                  </div>
                  
                  {recipe.shared && (
                    <span className="text-xs bg-secondary-100 text-secondary-700 px-3 py-1 rounded-full font-semibold">
                      Community
                    </span>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="text-xs bg-primary-50 text-primary-600 px-3 py-1 rounded-full font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Cook Button */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startCookingMode(recipe)}
                  className="w-full btn-gradient text-white py-3 px-4 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2"
                >
                  <SafeIcon icon={FiPlay} />
                  <span>Start Cooking</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredRecipes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <SafeIcon icon={FiSearch} className="text-6xl text-gray-300 mb-4 mx-auto" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600 font-medium">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}

        {/* Add Recipe Modal */}
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
                className="glass rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Add New Recipe
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    <SafeIcon icon={FiX} className="text-2xl" />
                  </motion.button>
                </div>

                <form onSubmit={handleSubmitRecipe} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Recipe Title
                      </label>
                      <input
                        type="text"
                        value={newRecipe.title}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={newRecipe.image}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, image: e.target.value }))}
                        className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newRecipe.description}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cook Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={newRecipe.cookTime}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, cookTime: e.target.value }))}
                        className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Servings
                      </label>
                      <input
                        type="number"
                        value={newRecipe.servings}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, servings: e.target.value }))}
                        className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={newRecipe.difficulty}
                        onChange={(e) => setNewRecipe(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full px-4 py-3 input-modern rounded-xl font-medium"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-700">
                        Ingredients
                      </label>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddIngredient}
                        className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center space-x-1"
                      >
                        <SafeIcon icon={FiPlus} />
                        <span>Add Ingredient</span>
                      </motion.button>
                    </div>
                    <div className="space-y-3">
                      {newRecipe.ingredients.map((ingredient, index) => (
                        <div key={index} className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Ingredient name"
                            value={ingredient.name}
                            onChange={(e) => {
                              const updated = [...newRecipe.ingredients];
                              updated[index].name = e.target.value;
                              setNewRecipe(prev => ({ ...prev, ingredients: updated }));
                            }}
                            className="px-4 py-3 input-modern rounded-xl font-medium"
                          />
                          <input
                            type="text"
                            placeholder="Amount (e.g., 2 cups, 500g)"
                            value={ingredient.amount}
                            onChange={(e) => {
                              const updated = [...newRecipe.ingredients];
                              updated[index].amount = e.target.value;
                              setNewRecipe(prev => ({ ...prev, ingredients: updated }));
                            }}
                            className="px-4 py-3 input-modern rounded-xl font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Steps */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-700">
                        Cooking Steps
                      </label>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddStep}
                        className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center space-x-1"
                      >
                        <SafeIcon icon={FiPlus} />
                        <span>Add Step</span>
                      </motion.button>
                    </div>
                    <div className="space-y-3">
                      {newRecipe.steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold mt-2">
                            {index + 1}
                          </span>
                          <textarea
                            placeholder={`Step ${index + 1} instructions...`}
                            value={step}
                            onChange={(e) => {
                              const updated = [...newRecipe.steps];
                              updated[index] = e.target.value;
                              setNewRecipe(prev => ({ ...prev, steps: updated }));
                            }}
                            rows={2}
                            className="flex-1 px-4 py-3 input-modern rounded-xl font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
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
                      className="flex-1 px-6 py-4 btn-gradient text-white rounded-xl font-bold shadow-lg"
                    >
                      Add Recipe
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

export default Recipes;