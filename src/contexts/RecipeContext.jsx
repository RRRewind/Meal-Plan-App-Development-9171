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

  // Load community recipes from Supabase
  const loadCommunityRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('community_recipes_mp2024')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to app format
      const transformedRecipes = data.map(recipe => ({
        id: recipe.id,
        originalId: recipe.original_recipe_id,
        title: recipe.title,
        description: recipe.description,
        cookTime: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        tags: recipe.tags || [],
        image: recipe.image_url,
        url: recipe.recipe_url || null,
        shared: true,
        sharedByUserId: recipe.shared_by_user_id,
        sharedBy: recipe.shared_by_username,
        sharedAt: recipe.created_at,
        approvedAt: recipe.approved_at,
        approvedBy: recipe.approved_by,
        shareCount: recipe.share_count || 0,
        viewCount: recipe.view_count || 0
      }));

      setSharedRecipes(transformedRecipes);
      console.log(`✅ Loaded ${transformedRecipes.length} community recipes`);
    } catch (error) {
      console.error('❌ Error loading community recipes:', error);
      setSharedRecipes([]);
    }
  };

  // Load user's recipes from Supabase
  const loadUserRecipes = async () => {
    if (!user) return;

    const userId = getSafeUserId(user);
    if (!userId) return;

    try {
      setLoading(true);
      console.log(`🔄 Loading recipes for user: ${userId}`);

      const { data, error } = await supabase
        .from('user_recipes_mp2024')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading user recipes:', error);
        throw error;
      }

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
        url: recipe.recipe_url || null,
        isUserCreated: true,
        createdAt: recipe.created_at,
        shared: recipe.is_shared
      }));

      setRecipes(transformedRecipes);
      console.log(`✅ Loaded ${transformedRecipes.length} user recipes`);
    } catch (error) {
      console.error('❌ Error loading user recipes:', error);
      setRecipes([]);
      toast.error('Failed to load your recipes');
    } finally {
      setLoading(false);
    }
  };

  // Load saved recipes from Supabase
  const loadSavedRecipes = async () => {
    if (!user) return;

    const userId = getSafeUserId(user);
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('saved_recipes_mp2024')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) {
        console.error('Error loading saved recipes:', error);
        throw error;
      }

      // Transform saved recipes data
      const transformedSaved = data.map(saved => ({
        ...saved.recipe_data,
        savedAt: saved.saved_at
      }));

      setSavedRecipes(transformedSaved);
      console.log(`✅ Loaded ${transformedSaved.length} saved recipes`);
    } catch (error) {
      console.error('❌ Error loading saved recipes:', error);
      setSavedRecipes([]);
    }
  };

  // Enhanced duplicate detection
  const areRecipesIdentical = (recipe1, recipe2) => {
    const normalize = (str) => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '';
    return normalize(recipe1.title) === normalize(recipe2.title);
  };

  // Validate recipe data
  const validateRecipeData = (recipe) => {
    const errors = [];

    if (!recipe.title || !recipe.title.trim()) {
      errors.push('Recipe title is required');
    }

    if (!recipe.description || !recipe.description.trim()) {
      errors.push('Recipe description is required');
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    } else {
      const validIngredients = recipe.ingredients.filter(ing => ing.name && ing.name.trim());
      if (validIngredients.length === 0) {
        errors.push('At least one valid ingredient is required');
      }
    }

    if (!recipe.steps || recipe.steps.length === 0) {
      errors.push('At least one cooking step is required');
    } else {
      const validSteps = recipe.steps.filter(step => step && step.trim());
      if (validSteps.length === 0) {
        errors.push('At least one valid cooking step is required');
      }
    }

    if (!recipe.cookTime || parseInt(recipe.cookTime) <= 0) {
      errors.push('Cook time must be greater than 0');
    }

    if (!recipe.servings || parseInt(recipe.servings) <= 0) {
      errors.push('Servings must be greater than 0');
    }

    return errors;
  };

  // Clean recipe data for database
  const cleanRecipeData = (recipe) => {
    return {
      title: String(recipe.title || '').trim(),
      description: String(recipe.description || '').trim(),
      cookTime: parseInt(recipe.cookTime) || 0,
      servings: parseInt(recipe.servings) || 1,
      difficulty: recipe.difficulty || 'Easy',
      ingredients: Array.isArray(recipe.ingredients) 
        ? recipe.ingredients.filter(ing => ing.name && ing.name.trim()) 
        : [],
      steps: Array.isArray(recipe.steps) 
        ? recipe.steps.filter(step => step && step.trim()) 
        : [],
      tags: Array.isArray(recipe.tags) ? recipe.tags : [],
      image: recipe.image || null,
      url: recipe.url || null
    };
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

    // Validate and clean data
    const cleanedRecipe = cleanRecipeData(recipe);
    const validationErrors = validateRecipeData(cleanedRecipe);
    
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    try {
      console.log(`🔄 Saving recipe to Supabase for user: ${userId}`);

      const recipeData = {
        user_id: userId,
        title: cleanedRecipe.title,
        description: cleanedRecipe.description,
        cook_time: cleanedRecipe.cookTime,
        servings: cleanedRecipe.servings,
        difficulty: cleanedRecipe.difficulty,
        ingredients: cleanedRecipe.ingredients,
        steps: cleanedRecipe.steps,
        tags: cleanedRecipe.tags,
        image_url: cleanedRecipe.image,
        is_shared: recipe.shared || false
      };

      // Only add recipe_url if it's provided and the column exists
      if (cleanedRecipe.url) {
        recipeData.recipe_url = cleanedRecipe.url;
      }

      const { data, error } = await supabase
        .from('user_recipes_mp2024')
        .insert(recipeData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Recipe saved to Supabase successfully');

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
        url: data.recipe_url || null,
        isUserCreated: true,
        createdAt: data.created_at,
        shared: data.is_shared
      };

      return transformedRecipe;
    } catch (error) {
      console.error('❌ Error saving recipe to Supabase:', error);
      throw error;
    }
  };

  // Update recipe in Supabase
  const updateRecipeInSupabase = async (recipeId, updatedRecipe) => {
    if (!user) {
      throw new Error('User must be logged in to update recipes');
    }

    const userId = getSafeUserId(user);
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    // Validate and clean data
    const cleanedRecipe = cleanRecipeData(updatedRecipe);
    const validationErrors = validateRecipeData(cleanedRecipe);
    
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    try {
      console.log(`🔄 Updating recipe ${recipeId} in Supabase for user ${userId}`);

      const recipeData = {
        title: cleanedRecipe.title,
        description: cleanedRecipe.description,
        cook_time: cleanedRecipe.cookTime,
        servings: cleanedRecipe.servings,
        difficulty: cleanedRecipe.difficulty,
        ingredients: cleanedRecipe.ingredients,
        steps: cleanedRecipe.steps,
        tags: cleanedRecipe.tags,
        image_url: cleanedRecipe.image
      };

      // Only add recipe_url if it's provided
      if (cleanedRecipe.url) {
        recipeData.recipe_url = cleanedRecipe.url;
      }

      console.log('Recipe data being sent:', recipeData);

      // Update the recipe
      const { data, error } = await supabase
        .from('user_recipes_mp2024')
        .update(recipeData)
        .eq('id', recipeId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Recipe not found or you do not have permission to edit it');
        }
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Recipe not found or you do not have permission to edit it');
      }

      console.log('✅ Recipe updated in Supabase successfully:', data);

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
        url: data.recipe_url || null,
        isUserCreated: true,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        shared: data.is_shared
      };

      return transformedRecipe;
    } catch (error) {
      console.error('❌ Error updating recipe in Supabase:', error);
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
      console.log(`🔄 Deleting recipe ${recipeId} from Supabase`);

      const { error } = await supabase
        .from('user_recipes_mp2024')
        .delete()
        .eq('id', recipeId);

      if (error) {
        console.error('❌ Supabase delete error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Recipe deleted from Supabase successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting recipe from Supabase:', error);
      throw error;
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    console.log('🔄 RecipeContext: Loading data...');
    
    // Load community recipes for all users
    loadCommunityRecipes();
    
    // Load user-specific data if logged in
    if (user) {
      loadUserRecipes();
      loadSavedRecipes();
    } else {
      setRecipes([]);
      setSavedRecipes([]);
      setPendingRecipes([]);
    }
  }, [user?.id]);

  // Add recipe
  const addRecipe = async (recipe) => {
    if (!user) {
      toast.error('Please sign in to add recipes');
      return { success: false, message: 'Please sign in to add recipes' };
    }

    try {
      setLoading(true);
      console.log('🔄 Adding recipe...', recipe);

      const savedRecipe = await saveRecipeToSupabase(recipe);

      // Update local state
      setRecipes(prev => [savedRecipe, ...prev]);

      toast.success('✅ Recipe added successfully!');
      return { success: true, recipe: savedRecipe };
    } catch (error) {
      console.error('❌ Error adding recipe:', error);
      const errorMessage = error.message || 'Failed to save recipe. Please try again.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update recipe
  const updateRecipe = async (recipeId, updatedRecipe) => {
    if (!user) {
      toast.error('Please sign in to update recipes');
      return { success: false, message: 'Please sign in to update recipes' };
    }

    try {
      setLoading(true);
      console.log('🔄 Updating recipe...', { recipeId, updatedRecipe });

      const savedRecipe = await updateRecipeInSupabase(recipeId, updatedRecipe);

      // Update local state
      setRecipes(prev => prev.map(r => r.id === recipeId ? savedRecipe : r));
      
      // Also update in saved recipes if it exists there
      setSavedRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, ...savedRecipe } : r));

      toast.success('✅ Recipe updated successfully!');
      return { success: true, recipe: savedRecipe };
    } catch (error) {
      console.error('❌ Error updating recipe:', error);
      const errorMessage = error.message || 'Failed to update recipe. Please try again.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete recipe
  const deleteRecipe = async (recipeId) => {
    if (!user) {
      toast.error('Please sign in to delete recipes');
      return { success: false, message: 'Please sign in to delete recipes' };
    }

    try {
      setLoading(true);
      console.log('🔄 Deleting recipe...', recipeId);

      await deleteRecipeFromSupabase(recipeId);

      // Update local state
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId && r.originalSharedId !== recipeId));

      // Remove from user shared set
      const updatedUserShared = new Set([...userSharedRecipes]);
      updatedUserShared.delete(recipeId);
      setUserSharedRecipes(updatedUserShared);

      toast.success('✅ Recipe deleted successfully!');
      return { success: true, message: 'Recipe deleted successfully!' };
    } catch (error) {
      console.error('❌ Error deleting recipe:', error);
      const errorMessage = error.message || 'Failed to delete recipe. Please try again.';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Save recipe to saved recipes
  const saveRecipe = async (recipe) => {
    if (!user) {
      toast.error('Please sign in to save recipes');
      return { success: false, message: 'Please sign in to save recipes' };
    }

    const userId = getSafeUserId(user);
    if (!userId) {
      return { success: false, message: 'Invalid user ID' };
    }

    // Check for duplicates before saving
    const isDuplicate = savedRecipes.some(existingRecipe =>
      areRecipesIdentical(recipe, existingRecipe)
    );

    if (isDuplicate) {
      return { success: false, message: 'This recipe is already in your collection' };
    }

    try {
      const { data, error } = await supabase
        .from('saved_recipes_mp2024')
        .insert({
          user_id: userId,
          recipe_id: recipe.id,
          recipe_data: recipe
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving recipe:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Update local state
      setSavedRecipes(prev => [recipe, ...prev]);

      return { success: true, message: 'Recipe saved successfully!' };
    } catch (error) {
      console.error('❌ Error saving recipe:', error);
      const errorMessage = error.message || 'Failed to save recipe';
      return { success: false, message: errorMessage };
    }
  };

  // Unsave recipe
  const unsaveRecipe = async (recipeId) => {
    if (!user) return;

    const userId = getSafeUserId(user);
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('saved_recipes_mp2024')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) {
        console.error('❌ Error unsaving recipe:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Update local state
      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
    } catch (error) {
      console.error('❌ Error unsaving recipe:', error);
      toast.error('Failed to remove recipe from saved list');
    }
  };

  const canDeleteRecipe = (recipe) => {
    return !recipe.isDefault && (recipe.isUserCreated || recipe.savedFromShare || isRecipeSaved(recipe.id));
  };

  // Share recipe functionality (simplified for demo)
  const shareRecipe = async (recipe, currentUser) => {
    if (!currentUser) {
      return { success: false, message: 'You must be logged in to share recipes' };
    }

    const updatedUserShared = new Set([...userSharedRecipes, recipe.id]);
    setUserSharedRecipes(updatedUserShared);

    return { success: true, message: 'Recipe shared to community!' };
  };

  // ✅ ENHANCED: Email sharing with app link
  const emailShareRecipe = (recipe) => {
    const shareLink = generateShareableLink(recipe);
    const appLink = 'https://mealplan.supertasty.recipes';
    
    const subject = `🍳 Check out this delicious recipe: ${recipe.title}`;
    const body = `Hi there! 👋

I found this amazing recipe and thought you'd love it:

🍽️ **${recipe.title}**
${recipe.description}

⏱️ Cook Time: ${recipe.cookTime} minutes
👥 Servings: ${recipe.servings}
📊 Difficulty: ${recipe.difficulty}

🔗 **Get this recipe in the Meal Plan app:**
${appLink}

📧 **Or use this direct link:**
${shareLink}

The Meal Plan app helps you organize recipes, plan meals, create smart shopping lists, and earn XP for cooking! It's completely free to use.

Happy cooking! 🍳✨

---
Shared from Meal Plan App
${appLink}`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      window.location.href = mailtoLink;
      return shareLink;
    } catch (error) {
      throw new Error('Email client not available');
    }
  };

  const generateShareableLink = (recipe) => {
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
      url: recipe.url,
      author: recipe.author || 'Community Chef',
      sharedVia: 'email'
    };

    const encodedData = encodeURIComponent(JSON.stringify(shareData));
    return `${baseUrl}/?recipe=${encodedData}`;
  };

  const saveSharedRecipe = (recipeData) => {
    try {
      const recipe = JSON.parse(decodeURIComponent(recipeData));
      const newRecipe = {
        ...recipe,
        id: uuidv4(),
        savedFromShare: true,
        savedAt: new Date().toISOString(),
        originalSharedId: recipe.id
      };

      return saveRecipe(newRecipe);
    } catch (error) {
      return { success: false, message: 'Invalid recipe data' };
    }
  };

  const isRecipeSaved = (recipeId) => {
    return savedRecipes.some(r => r.id === recipeId || r.originalSharedId === recipeId);
  };

  const hasSharedRecipe = (recipeId) => {
    return userSharedRecipes.has(recipeId);
  };

  // Stub functions for admin operations
  const approveRecipe = async () => {
    return { success: false, message: 'Admin features not implemented yet' };
  };

  const rejectRecipe = async () => {
    return { success: false, message: 'Admin features not implemented yet' };
  };

  const removeSharedRecipe = async () => {
    return { success: false, message: 'Admin features not implemented yet' };
  };

  // Cleanup duplicates (simplified)
  const cleanupDuplicates = () => {
    return {
      success: true,
      totalRemoved: 0,
      report: {
        savedRecipes: 0,
        userRecipes: 0,
        sharedRecipes: 0,
        details: []
      },
      message: 'No duplicates found in your collection!'
    };
  };

  // Get unique recipes for "All Recipes" view
  const getAllUniqueRecipes = () => {
    const userRecipes = recipes;
    const communityRecipes = sharedRecipes.filter(recipe => {
      return !recipe.originalId || !recipes.some(userRecipe => userRecipe.id === recipe.originalId);
    });
    
    return [...userRecipes, ...communityRecipes];
  };

  const value = {
    recipes,
    savedRecipes,
    sharedRecipes,
    pendingRecipes,
    loading,
    isSupabaseAvailable: true,
    getAllUniqueRecipes,
    addRecipe,
    updateRecipe,
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
    // Admin functions
    approveRecipe,
    rejectRecipe,
    removeSharedRecipe,
    // Supabase sync functions
    loadCommunityRecipes,
    loadPendingRecipes: () => {}
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};