import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

const RecipeContext = createContext();

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};

export const RecipeProvider = ({ children }) => {
  const [recipes, setRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [sharedRecipes, setSharedRecipes] = useState([]);
  const [pendingRecipes, setPendingRecipes] = useState([]);
  const [userSharedRecipes, setUserSharedRecipes] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  // Helper function to get safe user ID as string
  const getSafeUserId = (userObj) => {
    if (!userObj) return null;
    return String(userObj.id || userObj.user_id || '');
  };

  // Enhanced duplicate detection - more thorough comparison
  const areRecipesIdentical = (recipe1, recipe2) => {
    // Normalize strings for comparison
    const normalize = (str) => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '';

    // Compare titles (most important identifier)
    if (normalize(recipe1.title) === normalize(recipe2.title)) {
      return true;
    }

    // Compare core fields that define recipe uniqueness
    const fields = ['description', 'cookTime', 'servings', 'difficulty'];
    let matchingFields = 0;
    for (const field of fields) {
      if (recipe1[field] === recipe2[field]) {
        matchingFields++;
      }
    }

    // If title is very similar and most fields match, consider duplicate
    const titleSimilarity = calculateStringSimilarity(normalize(recipe1.title), normalize(recipe2.title));
    if (titleSimilarity > 0.8 && matchingFields >= 3) {
      return true;
    }

    // Check ingredients similarity
    const ingredients1 = recipe1.ingredients || [];
    const ingredients2 = recipe2.ingredients || [];
    if (ingredients1.length === ingredients2.length && ingredients1.length > 0) {
      let matchingIngredients = 0;
      ingredients1.forEach(ing1 => {
        const found = ingredients2.some(ing2 =>
          normalize(ing1.name) === normalize(ing2.name) &&
          normalize(ing1.amount) === normalize(ing2.amount)
        );
        if (found) matchingIngredients++;
      });

      // If 90%+ ingredients match, likely duplicate
      if (matchingIngredients / ingredients1.length > 0.9) {
        return true;
      }
    }

    return false;
  };

  // Calculate string similarity using Levenshtein distance
  const calculateStringSimilarity = (str1, str2) => {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    return 1 - distance / maxLength;
  };

  // Enhanced duplicate removal with detailed reporting
  const removeDuplicates = (recipeList) => {
    const unique = [];
    const duplicates = [];

    for (const recipe of recipeList) {
      let isDuplicate = false;
      let duplicateOf = null;

      // Check against already processed unique recipes
      for (const uniqueRecipe of unique) {
        if (areRecipesIdentical(recipe, uniqueRecipe)) {
          isDuplicate = true;
          duplicateOf = uniqueRecipe;
          break;
        }
      }

      if (isDuplicate) {
        duplicates.push({
          duplicate: recipe,
          originalTitle: duplicateOf.title,
          reason: 'Similar content detected'
        });
      } else {
        unique.push(recipe);
      }
    }

    return { unique, duplicates, removed: duplicates.length };
  };

  // Load user's recipes from Supabase
  const loadUserRecipes = async () => {
    if (!user) return;

    const userId = getSafeUserId(user);
    if (!userId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_recipes_mp2024')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to app format
      const transformedRecipes = data.map(recipe => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        cookTime: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        tags: recipe.tags || [],
        image: recipe.image_url,
        isUserCreated: true,
        createdAt: recipe.created_at,
        shared: recipe.is_shared
      }));

      setRecipes(transformedRecipes);
      console.log(`Loaded ${transformedRecipes.length} recipes from Supabase`);
      
    } catch (error) {
      console.error('Error loading user recipes:', error);
      toast.error('Failed to load recipes from database');
      
      // Fallback to localStorage
      const localRecipes = JSON.parse(localStorage.getItem('user_recipes') || '[]');
      setRecipes(localRecipes);
    } finally {
      setLoading(false);
    }
  };

  // Save recipe to Supabase
  const saveRecipeToSupabase = async (recipe) => {
    if (!user) {
      throw new Error('User must be logged in to save recipes');
    }

    const userId = getSafeUserId(user);
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    try {
      const recipeData = {
        user_id: userId,
        title: recipe.title,
        description: recipe.description,
        cook_time: parseInt(recipe.cookTime) || 0,
        servings: parseInt(recipe.servings) || 1,
        difficulty: recipe.difficulty || 'Easy',
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        tags: recipe.tags || [],
        image_url: recipe.image || null,
        is_shared: recipe.shared || false
      };

      const { data, error } = await supabase
        .from('user_recipes_mp2024')
        .insert(recipeData)
        .select()
        .single();

      if (error) throw error;

      // Transform back to app format
      const transformedRecipe = {
        id: data.id,
        title: data.title,
        description: data.description,
        cookTime: data.cook_time,
        servings: data.servings,
        difficulty: data.difficulty,
        ingredients: data.ingredients || [],
        steps: data.steps || [],
        tags: data.tags || [],
        image: data.image_url,
        isUserCreated: true,
        createdAt: data.created_at,
        shared: data.is_shared
      };

      return transformedRecipe;
    } catch (error) {
      console.error('Error saving recipe to Supabase:', error);
      throw error;
    }
  };

  // Delete recipe from Supabase
  const deleteRecipeFromSupabase = async (recipeId) => {
    if (!user) {
      throw new Error('User must be logged in to delete recipes');
    }

    const userId = getSafeUserId(user);
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    try {
      const { error } = await supabase
        .from('user_recipes_mp2024')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', userId); // Ensure user can only delete their own recipes

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting recipe from Supabase:', error);
      throw error;
    }
  };

  // Complete reset function
  const completeReset = async () => {
    try {
      if (user) {
        const userId = getSafeUserId(user);
        if (userId) {
          // Delete all user recipes from Supabase
          const { error } = await supabase
            .from('user_recipes_mp2024')
            .delete()
            .eq('user_id', userId);

          if (error) {
            console.error('Error deleting recipes from Supabase:', error);
          }
        }
      }

      // Clear all localStorage
      localStorage.removeItem('saved_recipes');
      localStorage.removeItem('shared_recipes');
      localStorage.removeItem('pending_recipes');
      localStorage.removeItem('user_shared_recipes');
      localStorage.removeItem('user_recipes');

      // Reset all state to empty arrays
      setRecipes([]);
      setSavedRecipes([]);
      setSharedRecipes([]);
      setPendingRecipes([]);
      setUserSharedRecipes(new Set());

      return {
        success: true,
        message: 'All recipes have been completely removed! You now have a blank canvas to build your perfect recipe collection.',
        totalReset: true
      };
    } catch (error) {
      console.error('Error during complete reset:', error);
      return {
        success: false,
        message: 'Failed to reset recipes completely'
      };
    }
  };

  // Global cleanup function that checks all recipe sources
  const performGlobalCleanup = () => {
    let totalRemoved = 0;
    const cleanupReport = {
      savedRecipes: 0,
      userRecipes: 0,
      sharedRecipes: 0,
      details: []
    };

    // Clean up saved recipes
    const savedCleanup = removeDuplicates(savedRecipes);
    if (savedCleanup.removed > 0) {
      setSavedRecipes(savedCleanup.unique);
      localStorage.setItem('saved_recipes', JSON.stringify(savedCleanup.unique));
      cleanupReport.savedRecipes = savedCleanup.removed;
      cleanupReport.details.push(...savedCleanup.duplicates.map(d => ({ ...d, source: 'Saved Recipes' })));
      totalRemoved += savedCleanup.removed;
    }

    // Clean up user-created recipes (non-default)
    const userCreatedRecipes = recipes.filter(r => r.isUserCreated || !r.isDefault);
    const userCleanup = removeDuplicates(userCreatedRecipes);
    if (userCleanup.removed > 0) {
      const defaultRecipes = recipes.filter(r => r.isDefault);
      setRecipes([...defaultRecipes, ...userCleanup.unique]);
      cleanupReport.userRecipes = userCleanup.removed;
      cleanupReport.details.push(...userCleanup.duplicates.map(d => ({ ...d, source: 'My Recipes' })));
      totalRemoved += userCleanup.removed;
    }

    // Clean up shared recipes (non-default)
    const userSharedRecipesList = sharedRecipes.filter(r => !r.isDefault && !r.author);
    const sharedCleanup = removeDuplicates(userSharedRecipesList);
    if (sharedCleanup.removed > 0) {
      const defaultSharedRecipes = sharedRecipes.filter(r => r.isDefault || r.author);
      setSharedRecipes([...defaultSharedRecipes, ...sharedCleanup.unique]);
      localStorage.setItem('shared_recipes', JSON.stringify(sharedCleanup.unique));
      cleanupReport.sharedRecipes = sharedCleanup.removed;
      cleanupReport.details.push(...sharedCleanup.duplicates.map(d => ({ ...d, source: 'Shared Recipes' })));
      totalRemoved += sharedCleanup.removed;
    }

    return {
      success: totalRemoved > 0,
      totalRemoved,
      report: cleanupReport,
      message: totalRemoved > 0 
        ? `Cleaned up ${totalRemoved} duplicate recipes across all collections!`
        : 'No duplicates found - your recipe collection is perfectly organized!'
    };
  };

  // Load data on mount and when user changes
  useEffect(() => {
    // Check for complete reset flag
    const shouldReset = localStorage.getItem('complete_recipe_reset');
    if (shouldReset === 'true') {
      localStorage.removeItem('complete_recipe_reset');
      completeReset();
      return;
    }

    // Load user's recipes from Supabase if logged in
    if (user) {
      loadUserRecipes();
    } else {
      setRecipes([]);
    }

    // Load saved recipes from localStorage
    const savedRecipesData = JSON.parse(localStorage.getItem('saved_recipes') || '[]');
    setSavedRecipes(savedRecipesData);

    // Load shared recipes from localStorage
    const sharedRecipesData = JSON.parse(localStorage.getItem('shared_recipes') || '[]');
    setSharedRecipes(sharedRecipesData);

    // Load pending recipes from localStorage
    const pendingRecipesData = JSON.parse(localStorage.getItem('pending_recipes') || '[]');
    setPendingRecipes(pendingRecipesData);

    // Load user shared recipes set
    const userSharedData = JSON.parse(localStorage.getItem('user_shared_recipes') || '[]');
    setUserSharedRecipes(new Set(userSharedData));
  }, [user]);

  const addRecipe = async (recipe) => {
    if (!user) {
      toast.error('Please sign in to add recipes');
      return { success: false, message: 'Please sign in to add recipes' };
    }

    // Check for duplicates before adding
    const allExistingRecipes = [...recipes, ...savedRecipes];
    const isDuplicate = allExistingRecipes.some(existingRecipe =>
      areRecipesIdentical(recipe, existingRecipe)
    );

    if (isDuplicate) {
      return { success: false, message: 'This recipe already exists in your collection' };
    }

    try {
      setLoading(true);
      
      // Save to Supabase
      const savedRecipe = await saveRecipeToSupabase(recipe);
      
      // Update local state
      setRecipes(prev => [savedRecipe, ...prev]);
      
      toast.success('✅ Recipe added successfully!');
      return { success: true, recipe: savedRecipe };
      
    } catch (error) {
      console.error('Error adding recipe:', error);
      
      // Fallback to localStorage
      const newRecipe = {
        ...recipe,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        isUserCreated: true
      };
      
      setRecipes(prev => [newRecipe, ...prev]);
      
      // Also save to localStorage as backup
      const localRecipes = JSON.parse(localStorage.getItem('user_recipes') || '[]');
      localRecipes.unshift(newRecipe);
      localStorage.setItem('user_recipes', JSON.stringify(localRecipes));
      
      toast.success('✅ Recipe added successfully (saved locally)!');
      return { success: true, recipe: newRecipe };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async (recipeId) => {
    if (!user) {
      return { success: false, message: 'Please sign in to delete recipes' };
    }

    try {
      setLoading(true);
      
      // Try to delete from Supabase first
      await deleteRecipeFromSupabase(recipeId);
      
      // Update local state
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      
      // Remove from saved recipes
      const updatedSaved = savedRecipes.filter(r => r.id !== recipeId && r.originalSharedId !== recipeId);
      setSavedRecipes(updatedSaved);
      localStorage.setItem('saved_recipes', JSON.stringify(updatedSaved));

      // Remove from shared recipes (only user-shared ones)
      const updatedShared = sharedRecipes.filter(r => r.id !== recipeId || r.isDefault);
      setSharedRecipes(updatedShared);
      localStorage.setItem('shared_recipes', JSON.stringify(updatedShared.filter(r => !r.author && !r.isDefault)));

      // Remove from user shared set
      const updatedUserShared = new Set([...userSharedRecipes]);
      updatedUserShared.delete(recipeId);
      setUserSharedRecipes(updatedUserShared);
      localStorage.setItem('user_shared_recipes', JSON.stringify([...updatedUserShared]));

      return { success: true, message: 'Recipe deleted successfully!' };
      
    } catch (error) {
      console.error('Error deleting recipe:', error);
      
      // Fallback to local deletion
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      
      return { success: true, message: 'Recipe deleted successfully!' };
    } finally {
      setLoading(false);
    }
  };

  const canDeleteRecipe = (recipe) => {
    return !recipe.isDefault && (recipe.isUserCreated || recipe.savedFromShare || isRecipeSaved(recipe.id));
  };

  const saveRecipe = (recipe) => {
    // Check for duplicates before saving
    const allExistingRecipes = [...savedRecipes, ...recipes];
    const isDuplicate = allExistingRecipes.some(existingRecipe =>
      areRecipesIdentical(recipe, existingRecipe)
    );

    if (isDuplicate) {
      return { success: false, message: 'This recipe is already in your collection' };
    }

    const updatedSaved = [...savedRecipes, recipe];
    setSavedRecipes(updatedSaved);
    localStorage.setItem('saved_recipes', JSON.stringify(updatedSaved));
    return { success: true, message: 'Recipe saved successfully!' };
  };

  const unsaveRecipe = (recipeId) => {
    const updatedSaved = savedRecipes.filter(r => r.id !== recipeId);
    setSavedRecipes(updatedSaved);
    localStorage.setItem('saved_recipes', JSON.stringify(updatedSaved));
  };

  // NEW: Share recipe to community (goes to admin approval first)
  const shareRecipe = (recipe, currentUser) => {
    if (userSharedRecipes.has(recipe.id)) {
      return { success: false, message: 'You have already shared this recipe to the community' };
    }

    if (!currentUser) {
      return { success: false, message: 'You must be logged in to share recipes' };
    }

    // Create pending recipe for admin approval
    const shareId = `${recipe.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const pendingRecipe = {
      ...recipe,
      originalId: recipe.id,
      shared: true,
      sharedAt: new Date().toISOString(),
      shareId,
      sharedBy: currentUser.username || currentUser.name,
      sharedByUserId: currentUser.id,
      status: 'pending', // pending, approved, rejected
      submittedAt: new Date().toISOString()
    };

    // Add to pending recipes
    const updatedPending = [...pendingRecipes, pendingRecipe];
    setPendingRecipes(updatedPending);
    localStorage.setItem('pending_recipes', JSON.stringify(updatedPending));

    // Track that this recipe has been shared (for user reference)
    const updatedUserShared = new Set([...userSharedRecipes, recipe.id]);
    setUserSharedRecipes(updatedUserShared);
    localStorage.setItem('user_shared_recipes', JSON.stringify([...updatedUserShared]));

    return { success: true, shareId, message: 'Recipe submitted for community review! Admin will approve shortly.' };
  };

  // ADMIN: Approve pending recipe
  const approveRecipe = (recipeId, adminUser) => {
    if (!adminUser?.isAdmin) {
      return { success: false, message: 'Admin access required' };
    }

    const recipe = pendingRecipes.find(r => r.id === recipeId || r.originalId === recipeId);
    if (!recipe) {
      return { success: false, message: 'Recipe not found' };
    }

    // Move from pending to approved shared recipes
    const approvedRecipe = {
      ...recipe,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: adminUser.username
    };

    // Add to shared recipes
    const updatedShared = [...sharedRecipes, approvedRecipe];
    setSharedRecipes(updatedShared);
    localStorage.setItem('shared_recipes', JSON.stringify(updatedShared.filter(r => !r.author && !r.isDefault)));

    // Remove from pending
    const updatedPending = pendingRecipes.filter(r => r.id !== recipeId && r.originalId !== recipeId);
    setPendingRecipes(updatedPending);
    localStorage.setItem('pending_recipes', JSON.stringify(updatedPending));

    return { success: true, message: 'Recipe approved and added to community!' };
  };

  // ADMIN: Reject pending recipe
  const rejectRecipe = (recipeId, adminUser, reason = '') => {
    if (!adminUser?.isAdmin) {
      return { success: false, message: 'Admin access required' };
    }

    const recipe = pendingRecipes.find(r => r.id === recipeId || r.originalId === recipeId);
    if (!recipe) {
      return { success: false, message: 'Recipe not found' };
    }

    // Remove from pending
    const updatedPending = pendingRecipes.filter(r => r.id !== recipeId && r.originalId !== recipeId);
    setPendingRecipes(updatedPending);
    localStorage.setItem('pending_recipes', JSON.stringify(updatedPending));

    // Remove from user shared tracking
    const updatedUserShared = new Set([...userSharedRecipes]);
    updatedUserShared.delete(recipe.originalId);
    setUserSharedRecipes(updatedUserShared);
    localStorage.setItem('user_shared_recipes', JSON.stringify([...updatedUserShared]));

    return { success: true, message: `Recipe rejected${reason ? ': ' + reason : ''}` };
  };

  // ADMIN: Remove approved shared recipe
  const removeSharedRecipe = (recipeId, adminUser) => {
    if (!adminUser?.isAdmin) {
      return { success: false, message: 'Admin access required' };
    }

    const updatedShared = sharedRecipes.filter(r => r.id !== recipeId && r.originalId !== recipeId);
    setSharedRecipes(updatedShared);
    localStorage.setItem('shared_recipes', JSON.stringify(updatedShared.filter(r => !r.author && !r.isDefault)));

    return { success: true, message: 'Recipe removed from community' };
  };

  const generateShareableLink = (recipe) => {
    if (!userSharedRecipes.has(recipe.id)) {
      const result = shareRecipe(recipe);
      if (!result.success) return null;
      recipe.shareId = result.shareId;
    }

    const baseUrl = window.location.origin;
    const shareData = {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      image: recipe.image,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tags: recipe.tags,
      author: recipe.author || 'Community Chef',
      sharedVia: 'email'
    };

    const encodedData = encodeURIComponent(JSON.stringify(shareData));
    return `${baseUrl}/?recipe=${encodedData}`;
  };

  const saveSharedRecipe = (recipeData) => {
    try {
      const recipe = JSON.parse(decodeURIComponent(recipeData));
      const allExistingRecipes = [...savedRecipes, ...recipes];
      const isDuplicate = allExistingRecipes.some(existingRecipe =>
        areRecipesIdentical(recipe, existingRecipe)
      );

      if (isDuplicate) {
        return { success: false, message: 'This recipe is already in your collection' };
      }

      const newRecipe = {
        ...recipe,
        id: uuidv4(),
        savedFromShare: true,
        savedAt: new Date().toISOString(),
        originalSharedId: recipe.id
      };

      const result = saveRecipe(newRecipe);
      return result;
    } catch (error) {
      return { success: false, message: 'Invalid recipe data' };
    }
  };

  const emailShareRecipe = (recipe) => {
    const shareLink = generateShareableLink(recipe);
    const subject = `🍳 Check out this delicious recipe: ${recipe.title}`;
    const body = `Hi there! 👋

I found this amazing recipe and thought you'd love it:

🍽️ **${recipe.title}**

${recipe.description}

⏱️ Cook Time: ${recipe.cookTime} minutes
👥 Servings: ${recipe.servings}
📊 Difficulty: ${recipe.difficulty}

**Here's what makes it special:**
${recipe.tags ? recipe.tags.map(tag => `• ${tag}`).join('\n') : '• Delicious and easy to make'}

**Click here to view the full recipe and automatically save it to your collection:**
${shareLink}

When you click the link:
✅ If you're already logged in → Recipe saves automatically
✅ If you're not logged in → Just sign in and it'll save instantly

Happy cooking! 🍳✨

Shared via Meal Plan App`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      window.location.href = mailtoLink;
      return shareLink;
    } catch (error) {
      navigator.clipboard.writeText(shareLink);
      throw new Error('Email client not available, link copied to clipboard');
    }
  };

  const isRecipeSaved = (recipeId) => {
    return savedRecipes.some(r => r.id === recipeId || r.originalSharedId === recipeId);
  };

  const hasSharedRecipe = (recipeId) => {
    return userSharedRecipes.has(recipeId);
  };

  // Enhanced cleanup function with detailed reporting
  const cleanupDuplicates = () => {
    return performGlobalCleanup();
  };

  // FIXED: Get unique recipes for "All Recipes" view
  const getAllUniqueRecipes = () => {
    const userRecipes = recipes; // User's own recipes
    const communityRecipes = sharedRecipes.filter(recipe => {
      // Only include community recipes that are NOT user's own shared recipes
      return !recipe.originalId || !recipes.some(userRecipe => userRecipe.id === recipe.originalId);
    });

    return [...userRecipes, ...communityRecipes];
  };

  const value = {
    recipes,
    savedRecipes,
    sharedRecipes,
    pendingRecipes, // NEW: For admin interface
    loading,
    getAllUniqueRecipes,
    addRecipe,
    deleteRecipe,
    canDeleteRecipe,
    saveRecipe,
    unsaveRecipe,
    shareRecipe,
    emailShareRecipe,
    saveSharedRecipe,
    isRecipeSaved,
    hasSharedRecipe,
    cleanupDuplicates,
    completeReset,
    // NEW: Admin functions
    approveRecipe,
    rejectRecipe,
    removeSharedRecipe
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};