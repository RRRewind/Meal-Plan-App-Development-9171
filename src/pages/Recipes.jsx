import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecipes } from '../contexts/RecipeContext';
import { useCookingMode } from '../contexts/CookingModeContext';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useRating } from '../contexts/RatingContext';
import Layout from '../components/Layout';
import SafeIcon from '../common/SafeIcon';
import RatingDisplay from '../components/RatingDisplay';
import InlineRating from '../components/InlineRating';
import * as FiIcons from 'react-icons/fi';
import toast from 'react-hot-toast';

const { FiSearch, FiHeart, FiClock, FiUsers, FiPlay, FiShare2, FiPlus, FiX, FiStar, FiMail, FiCheck, FiRefreshCw, FiTrash2, FiAlertTriangle, FiZap, FiBookOpen, FiChef, FiTrendingUp, FiExternalLink, FiLink, FiEdit3, FiSave } = FiIcons;

const Recipes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('saved');
  const [sortBy, setSortBy] = useState('recent');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    cookTime: '',
    servings: '',
    difficulty: 'Easy',
    ingredients: [{ name: '', amount: '' }],
    steps: [''],
    tags: [],
    image: '',
    url: ''
  });

  const {
    recipes,
    sharedRecipes,
    savedRecipes,
    getAllUniqueRecipes,
    saveRecipe,
    unsaveRecipe,
    deleteRecipe,
    canDeleteRecipe,
    isRecipeSaved,
    shareRecipe,
    emailShareRecipe,
    hasSharedRecipe,
    addRecipe,
    updateRecipe,
    cleanupDuplicates
  } = useRecipes();

  const { startCookingMode } = useCookingMode();
  const { addXP } = useGamification();
  const { user } = useAuth();
  const { loadRatings, getRatingStats, sortRecipesByRating } = useRating();

  // Get all unique recipes for empty state check only
  const allRecipes = getAllUniqueRecipes();

  // Get user's own created recipes (not default/shared)
  const userCreatedRecipes = recipes.filter(recipe =>
    recipe.isUserCreated || (!recipe.isDefault && !recipe.shared)
  );

  // Get community recipes (shared but not created by current user)
  const communityRecipes = sharedRecipes.filter(recipe =>
    recipe.shared && recipe.sharedByUserId !== user?.id
  );

  // Load ratings when community recipes change
  useEffect(() => {
    if (communityRecipes.length > 0) {
      const recipeIds = communityRecipes.map(recipe => recipe.id);
      loadRatings(recipeIds);
    }
  }, [communityRecipes.length, loadRatings]);

  const filters = [
    { id: 'saved', name: 'Saved', count: savedRecipes.length },
    { id: 'community', name: 'Community', count: communityRecipes.length },
    { id: 'my-recipes', name: 'My Recipes', count: userCreatedRecipes.length }
  ];

  const sortOptions = [
    { id: 'recent', name: 'Most Recent' },
    { id: 'rating', name: 'Highest Rated', onlyFor: 'community' }
  ];

  // ✅ FIXED: Stable canRateRecipe function with useCallback
  const canRateRecipe = useCallback((recipe) => {
    if (!user || !recipe) return false;
    // Only allow rating community recipes (shared recipes)
    if (!recipe.shared) return false;
    // Users cannot rate their own recipes
    const userId = String(user.id || user.user_id || '');
    if (!userId) return false;
    // Check if this is the user's own recipe
    if (String(recipe.sharedByUserId) === userId) return false;
    return true;
  }, [user]);

  // Helper function to get username by user ID
  const getUsernameById = (userId) => {
    if (userId === user?.id) {
      return user?.username || user?.name || 'You';
    }
    const sharedRecipe = sharedRecipes.find(recipe => recipe.sharedByUserId === userId);
    if (sharedRecipe && sharedRecipe.sharedBy) {
      return sharedRecipe.sharedBy;
    }
    return 'Unknown User';
  };

  // Filter and sort recipes based on selected filter, search term, and sort option
  const getFilteredAndSortedRecipes = () => {
    let recipesToFilter = [];
    switch (selectedFilter) {
      case 'saved':
        recipesToFilter = savedRecipes;
        break;
      case 'community':
        recipesToFilter = communityRecipes;
        break;
      case 'my-recipes':
        recipesToFilter = userCreatedRecipes;
        break;
      default:
        recipesToFilter = savedRecipes;
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      recipesToFilter = recipesToFilter.filter(recipe =>
        recipe.title?.toLowerCase().includes(searchLower) ||
        recipe.description?.toLowerCase().includes(searchLower) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        recipe.ingredients?.some(ing => ing.name?.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    if (sortBy === 'rating' && selectedFilter === 'community') {
      return sortRecipesByRating(recipesToFilter);
    }

    // Default: most recent (by creation/share date)
    return recipesToFilter.sort((a, b) => {
      const dateA = new Date(a.sharedAt || a.createdAt || 0);
      const dateB = new Date(b.sharedAt || b.createdAt || 0);
      return dateB - dateA;
    });
  };

  const filteredRecipes = getFilteredAndSortedRecipes();

  const handleSaveRecipe = (recipe) => {
    if (isRecipeSaved(recipe.id)) {
      unsaveRecipe(recipe.id);
      toast.success('Recipe removed from saved');
    } else {
      const result = saveRecipe(recipe);
      if (result.success) {
        addXP(5, 'Recipe saved');
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    }
  };

  // ✅ NEW: Edit recipe functionality
  const handleEditRecipe = (recipe) => {
    // Check if user can edit this recipe
    if (!canUserEditRecipe(recipe)) {
      toast.error('You can only edit your own recipes');
      return;
    }

    setEditingRecipe({
      ...recipe,
      ingredients: recipe.ingredients || [{ name: '', amount: '' }],
      steps: recipe.steps || [''],
      tags: recipe.tags || []
    });
    setShowEditModal(true);
  };

  // ✅ NEW: Save edited recipe
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecipe) return;

    try {
      const result = await updateRecipe(editingRecipe.id, editingRecipe);
      if (result.success) {
        toast.success('✅ Recipe updated successfully!');
        addXP(15, 'Recipe updated');
        setShowEditModal(false);
        setEditingRecipe(null);
      } else {
        toast.error(result.message || 'Failed to update recipe');
      }
    } catch (error) {
      toast.error('Failed to update recipe');
      console.error('Edit recipe error:', error);
    }
  };

  const handleDeleteRecipe = (recipe) => {
    // Enhanced delete permission check - only allow deleting own recipes
    if (recipe.isUserCreated || (recipe.sharedByUserId === user?.id)) {
      setRecipeToDelete(recipe);
      setShowDeleteModal(true);
    } else {
      toast.error('You can only delete your own recipes');
    }
  };

  const confirmDeleteRecipe = () => {
    if (recipeToDelete) {
      const result = deleteRecipe(recipeToDelete.id);
      if (result.success) {
        toast.success('🗑️ Recipe deleted successfully!');
        addXP(5, 'Recipe deleted');
        setShowDeleteModal(false);
        setRecipeToDelete(null);
      } else {
        toast.error('Failed to delete recipe');
      }
    }
  };

  // ✅ COMMUNITY SHARING: Only creators can share to community (or admins)
  const canShareRecipeToCommuity = (recipe) => {
    if (!user) return false;
    // Admins can share any recipe
    if (user.isAdmin) return true;
    // Regular users can only share recipes they created
    const isOwnRecipe = recipe.isUserCreated || (recipe.sharedByUserId === user.id) || (!recipe.shared && !recipe.isDefault);
    return isOwnRecipe;
  };

  // ✅ NEW: Check if user can edit recipe
  const canUserEditRecipe = (recipe) => {
    if (!user) return false;
    // Users can only edit their own created recipes
    return recipe.isUserCreated || recipe.sharedByUserId === user.id;
  };

  const handleShareRecipe = (recipe) => {
    if (!user) {
      toast.error('Please sign in to share recipes');
      return;
    }

    // Check sharing permissions for community sharing
    if (!canShareRecipeToCommuity(recipe)) {
      toast.error('You can only share recipes that you created');
      return;
    }

    const result = shareRecipe(recipe, user);
    if (result.success) {
      addXP(15, 'Recipe shared');
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  // ✅ EMAIL SHARING: Anyone can email ANY recipe (no restrictions)
  const handleEmailShareRecipe = (recipe) => {
    if (!user) {
      toast.error('Please sign in to share recipes');
      return;
    }

    try {
      emailShareRecipe(recipe);
      addXP(10, 'Recipe shared via email');
      toast.success('Email client opened! Recipe link included.');
    } catch (error) {
      toast.error('Failed to open email client');
    }
  };

  const handleCleanupDuplicates = () => {
    const result = cleanupDuplicates();
    setCleanupResult(result);
    if (result.success) {
      toast.success(`🧹 ${result.message}`);
      addXP(20, 'Cleaned up duplicates');
      setShowCleanupModal(true);
    } else {
      toast.success('✨ No duplicates found - your collection is perfectly organized!');
    }
  };

  const handleAddIngredient = (isEdit = false) => {
    const targetRecipe = isEdit ? editingRecipe : newRecipe;
    const setTargetRecipe = isEdit ? setEditingRecipe : setNewRecipe;

    setTargetRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '' }]
    }));
  };

  const handleAddStep = (isEdit = false) => {
    const targetRecipe = isEdit ? editingRecipe : newRecipe;
    const setTargetRecipe = isEdit ? setEditingRecipe : setNewRecipe;

    setTargetRecipe(prev => ({
      ...prev,
      steps: [...prev.steps, '']
    }));
  };

  const handleSubmitRecipe = (e) => {
    e.preventDefault();
    const result = addRecipe(newRecipe);
    if (result.success) {
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
        image: '',
        url: ''
      });
    } else {
      toast.error(result.message);
    }
  };

  // Check if user can delete a recipe (enhanced permissions)
  const canUserDeleteRecipe = (recipe) => {
    if (!user) return false;
    // Users can only delete their own created recipes or recipes they shared
    return recipe.isUserCreated || recipe.sharedByUserId === user.id;
  };

  // Handle recipe URL click - ✅ ENHANCED: Always visible and functional
  const handleRecipeUrlClick = (url) => {
    if (url) {
      // Ensure URL has protocol
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      addXP(2, 'Recipe details viewed');
    }
  };

  // 🎨 NEW: Shimmer Effect Component for Cook Buttons
  const ShimmerButton = ({ children, onClick, className = "", disabled = false }) => (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Shimmer overlay */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{
            x: ['-100%', '200%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
          style={{
            transform: 'skewX(-20deg)',
          }}
        />
      )}
      {children}
    </motion.button>
  );

  // ✅ NEW: Recipe form component for both add and edit
  const RecipeForm = ({ recipe, setRecipe, onSubmit, isEdit = false, onCancel }) => (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Recipe Title
          </label>
          <input
            type="text"
            value={recipe.title}
            onChange={(e) => setRecipe(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={recipe.image}
            onChange={(e) => setRecipe(prev => ({ ...prev, image: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <SafeIcon icon={FiLink} className="mr-2 text-primary-500" />
          Recipe URL (Optional)
        </label>
        <input
          type="url"
          value={recipe.url}
          onChange={(e) => setRecipe(prev => ({ ...prev, url: e.target.value }))}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200"
          placeholder="https://example.com/full-recipe"
        />
        <p className="text-xs text-gray-500 mt-1">
          Link to the full recipe page, video, or detailed instructions
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={recipe.description}
          onChange={(e) => setRecipe(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200 resize-none"
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
            value={recipe.cookTime}
            onChange={(e) => setRecipe(prev => ({ ...prev, cookTime: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Servings
          </label>
          <input
            type="number"
            value={recipe.servings}
            onChange={(e) => setRecipe(prev => ({ ...prev, servings: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Difficulty
          </label>
          <select
            value={recipe.difficulty}
            onChange={(e) => setRecipe(prev => ({ ...prev, difficulty: e.target.value }))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-gray-700">
            Ingredients
          </label>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAddIngredient(isEdit)}
            className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center space-x-1"
          >
            <SafeIcon icon={FiPlus} />
            <span>Add Ingredient</span>
          </motion.button>
        </div>
        <div className="space-y-3">
          {recipe.ingredients.map((ingredient, index) => (
            <div key={index} className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) => {
                  const updated = [...recipe.ingredients];
                  updated[index].name = e.target.value;
                  setRecipe(prev => ({ ...prev, ingredients: updated }));
                }}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200"
              />
              <input
                type="text"
                placeholder="Amount (e.g., 2 cups, 500g)"
                value={ingredient.amount}
                onChange={(e) => {
                  const updated = [...recipe.ingredients];
                  updated[index].amount = e.target.value;
                  setRecipe(prev => ({ ...prev, ingredients: updated }));
                }}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-gray-700">
            Cooking Steps
          </label>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAddStep(isEdit)}
            className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center space-x-1"
          >
            <SafeIcon icon={FiPlus} />
            <span>Add Step</span>
          </motion.button>
        </div>
        <div className="space-y-3">
          {recipe.steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold mt-2">
                {index + 1}
              </span>
              <textarea
                placeholder={`Step ${index + 1} instructions...`}
                value={step}
                onChange={(e) => {
                  const updated = [...recipe.steps];
                  updated[index] = e.target.value;
                  setRecipe(prev => ({ ...prev, steps: updated }));
                }}
                rows={2}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium bg-white focus:border-primary-500 focus:outline-none transition-colors duration-200 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4 pt-6">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 px-6 py-4 btn-gradient text-white rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2"
        >
          <SafeIcon icon={isEdit ? FiSave : FiPlus} />
          <span>{isEdit ? 'Save Changes' : 'Add Recipe'}</span>
        </motion.button>
      </div>
    </form>
  );

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
              {selectedFilter === 'saved' && 'Your personally saved recipe favorites'}
              {selectedFilter === 'community' && 'Recipes shared by the community - rate and discover!'}
              {selectedFilter === 'my-recipes' && 'Recipes you\'ve created'}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCleanupDuplicates}
              className="bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-700 px-4 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2 hover:from-secondary-200 hover:to-secondary-300 transition-all duration-200 glow-effect"
            >
              <SafeIcon icon={FiZap} />
              <span>Smart Cleanup</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="btn-gradient text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2"
            >
              <SafeIcon icon={FiPlus} />
              <span>Add Recipe</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Search, Filters, and Sort */}
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

            {/* Filters and Sort */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Filter Buttons */}
              {filters.map((filter) => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedFilter(filter.id);
                    // Reset sort when changing filters
                    if (filter.id !== 'community' && sortBy === 'rating') {
                      setSortBy('recent');
                    }
                  }}
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

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-white transition-colors duration-200"
              >
                {sortOptions
                  .filter(option => !option.onlyFor || option.onlyFor === selectedFilter)
                  .map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
              </select>

              {/* Sort indicator for community recipes */}
              {selectedFilter === 'community' && sortBy === 'rating' && (
                <div className="flex items-center space-x-2 text-sm text-primary-600 font-semibold">
                  <SafeIcon icon={FiTrendingUp} />
                  <span>Smart Ranked</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recipe Grid or Empty State */}
        {allRecipes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-16 text-center shadow-lg"
          >
            <div className="max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <SafeIcon icon={FiChef} className="text-4xl text-primary-500" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your Recipe Journey Starts Here! 🍳
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                You have a completely clean slate! Start building your perfect recipe collection by adding your first recipe.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="btn-gradient text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center space-x-3 mx-auto"
              >
                <SafeIcon icon={FiPlus} className="text-xl" />
                <span>Add Your First Recipe</span>
              </motion.button>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="glass p-6 rounded-xl">
                  <SafeIcon icon={FiBookOpen} className="text-2xl text-primary-500 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Create Recipes</h3>
                  <p className="text-sm text-gray-600">Add your favorite recipes with ingredients, steps, and cooking tips.</p>
                </div>
                <div className="glass p-6 rounded-xl">
                  <SafeIcon icon={FiHeart} className="text-2xl text-red-500 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Save & Share</h3>
                  <p className="text-sm text-gray-600">Save recipes you love and share them with friends via email.</p>
                </div>
                <div className="glass p-6 rounded-xl">
                  <SafeIcon icon={FiPlay} className="text-2xl text-green-500 mb-3" />
                  <h3 className="font-bold text-gray-900 mb-2">Cook Mode</h3>
                  <p className="text-sm text-gray-600">Follow step-by-step instructions with built-in timers.</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Filter Results Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <p className="text-sm text-gray-600 font-medium">
                {searchTerm ? (
                  <>Showing {filteredRecipes.length} result{filteredRecipes.length !== 1 ? 's' : ''} for "{searchTerm}" in {filters.find(f => f.id === selectedFilter)?.name}</>
                ) : (
                  <>Showing {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} in {filters.find(f => f.id === selectedFilter)?.name}</>
                )}
                {selectedFilter === 'community' && sortBy === 'rating' && (
                  <span className="ml-2 text-primary-600 font-semibold">• Sorted by smart rating</span>
                )}
              </p>
            </motion.div>

            {filteredRecipes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <SafeIcon icon={FiSearch} className="text-6xl text-gray-300 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No recipes found
                </h3>
                <p className="text-gray-600 font-medium mb-4">
                  {searchTerm
                    ? `No recipes match "${searchTerm}" in ${filters.find(f => f.id === selectedFilter)?.name}`
                    : `No recipes in ${filters.find(f => f.id === selectedFilter)?.name} yet`
                  }
                </p>
                {selectedFilter === 'my-recipes' && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddModal(true)}
                    className="btn-gradient text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2 mx-auto"
                  >
                    <SafeIcon icon={FiPlus} />
                    <span>Add Recipe</span>
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredRecipes.map((recipe, index) => {
                  const ratingStats = getRatingStats(recipe.id);
                  const canRate = canRateRecipe(recipe);
                  const canShareToCommunity = canShareRecipeToCommuity(recipe);
                  const canEdit = canUserEditRecipe(recipe);

                  return (
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
                              {/* ✅ NEW: EDIT BUTTON: Show for recipe owners */}
                              {canEdit && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEditRecipe(recipe)}
                                  className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full backdrop-blur-sm transition-colors duration-200 shadow-lg"
                                  title="Edit your recipe"
                                >
                                  <SafeIcon icon={FiEdit3} className="text-sm" />
                                </motion.button>
                              )}

                              {/* ✅ EMAIL BUTTON: Available for ALL recipes */}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEmailShareRecipe(recipe)}
                                className="p-2 bg-white/90 text-gray-600 hover:bg-white hover:text-blue-500 rounded-full backdrop-blur-sm transition-colors duration-200 shadow-lg"
                                title="Share via email - works for any recipe"
                              >
                                <SafeIcon icon={FiMail} className="text-sm" />
                              </motion.button>

                              {/* ✅ COMMUNITY SHARE BUTTON: Only for recipe creators */}
                              {canShareToCommunity && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleShareRecipe(recipe)}
                                  className={`p-2 rounded-full backdrop-blur-sm transition-colors duration-200 shadow-lg ${
                                    hasSharedRecipe(recipe.id)
                                      ? 'bg-green-500 text-white'
                                      : 'bg-white/90 text-gray-600 hover:bg-white hover:text-primary-500'
                                  }`}
                                  title={user.isAdmin ? 'Share to community (Admin)' : 'Share your recipe to community'}
                                >
                                  <SafeIcon icon={hasSharedRecipe(recipe.id) ? FiCheck : FiShare2} className="text-sm" />
                                </motion.button>
                              )}

                              {canUserDeleteRecipe(recipe) && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteRecipe(recipe)}
                                  className="p-2 bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 rounded-full backdrop-blur-sm transition-colors duration-200 shadow-lg"
                                >
                                  <SafeIcon icon={FiTrash2} className="text-sm" />
                                </motion.button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Recipe Type Badge */}
                        <div className="absolute bottom-3 left-3 flex space-x-2">
                          <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                            {recipe.difficulty}
                          </span>
                          {recipe.isUserCreated && (
                            <span className="bg-secondary-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                              My Recipe
                            </span>
                          )}
                          {recipe.shared && !recipe.isUserCreated && (
                            <span className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                              Community
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recipe Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-xl text-gray-900 flex-1">
                            {recipe.title}
                          </h3>
                          {/* ✅ ENHANCED: Recipe URL link - ALWAYS VISIBLE when URL exists */}
                          {recipe.url && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRecipeUrlClick(recipe.url)}
                              className="ml-2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                              title="View full recipe details"
                            >
                              <SafeIcon icon={FiExternalLink} className="text-sm" />
                            </motion.button>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 font-medium">
                          {recipe.description}
                        </p>

                        {/* ✅ RATING DISPLAY: Show community rating stats */}
                        {recipe.shared && (
                          <div className="mb-4">
                            <RatingDisplay stats={ratingStats} size="sm" />
                          </div>
                        )}

                        {/* ✅ NEW: INLINE RATING SYSTEM for community recipes */}
                        {recipe.shared && (
                          <InlineRating
                            recipe={recipe}
                            canRate={canRate}
                            className="mb-4"
                          />
                        )}

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
                          {recipe.shared && recipe.sharedByUserId && (
                            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                              @{getUsernameById(recipe.sharedByUserId)}
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

                        {/* Cook Button with Shimmer Effect */}
                        <ShimmerButton
                          onClick={() => startCookingMode(recipe)}
                          className="w-full btn-gradient text-white py-3 px-4 rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2"
                        >
                          <SafeIcon icon={FiPlay} />
                          <span>Start Cooking</span>
                        </ShimmerButton>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}

        {/* ✅ NEW: Edit Recipe Modal */}
        <AnimatePresence>
          {showEditModal && editingRecipe && (
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
                className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                    <SafeIcon icon={FiEdit3} className="mr-3 text-primary-500" />
                    Edit Recipe
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEditModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    <SafeIcon icon={FiX} className="text-2xl" />
                  </motion.button>
                </div>
                <RecipeForm
                  recipe={editingRecipe}
                  setRecipe={setEditingRecipe}
                  onSubmit={handleSaveEdit}
                  isEdit={true}
                  onCancel={() => setShowEditModal(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cleanup Results Modal */}
        <AnimatePresence>
          {showCleanupModal && cleanupResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCleanupModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="glass rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SafeIcon icon={FiZap} className="text-3xl text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🧹 Cleanup Complete!
                  </h2>
                  <p className="text-lg text-gray-600 font-medium">
                    Removed {cleanupResult.totalRemoved} duplicate recipes
                  </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-gray-900 mb-4">Cleanup Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="glass p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{cleanupResult.report.savedRecipes}</div>
                      <div className="text-sm text-gray-600">Saved Recipes</div>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{cleanupResult.report.userRecipes}</div>
                      <div className="text-sm text-gray-600">My Recipes</div>
                    </div>
                    <div className="glass p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{cleanupResult.report.sharedRecipes}</div>
                      <div className="text-sm text-gray-600">Shared Recipes</div>
                    </div>
                  </div>
                </div>

                {cleanupResult.report.details.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3">Removed Duplicates:</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {cleanupResult.report.details.map((detail, index) => (
                        <div key={index} className="bg-red-50 p-3 rounded-lg border-l-4 border-red-200">
                          <div className="font-medium text-red-800">"{detail.duplicate.title}"</div>
                          <div className="text-sm text-red-600">
                            From: {detail.source} • {detail.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCleanupModal(false)}
                    className="px-8 py-3 btn-gradient text-white rounded-xl font-bold shadow-lg"
                  >
                    Awesome! 🎉
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteModal(false)}
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
                    <SafeIcon icon={FiAlertTriangle} className="text-3xl text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Delete Recipe?
                  </h2>
                  <p className="text-gray-600 mb-2 font-medium">
                    Are you sure you want to delete "{recipeToDelete?.title}"?
                  </p>
                  <p className="text-sm text-gray-500 mb-8">
                    This action cannot be undone.
                  </p>
                  <div className="flex space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={confirmDeleteRecipe}
                      className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors duration-200 shadow-lg"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
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
                <RecipeForm
                  recipe={newRecipe}
                  setRecipe={setNewRecipe}
                  onSubmit={handleSubmitRecipe}
                  isEdit={false}
                  onCancel={() => setShowAddModal(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Recipes;