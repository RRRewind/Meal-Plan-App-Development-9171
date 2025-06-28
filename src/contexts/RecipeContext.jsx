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
      setLoading(true);
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
        url: recipe.recipe_url,
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
      console.log(`✅ Loaded ${transformedRecipes.length} community recipes from Supabase`);
    } catch (error) {
      console.error('❌ Error loading community recipes:', error);
      // Clear shared recipes on error instead of falling back to localStorage
      setSharedRecipes([]);
      toast.error('Failed to load community recipes from database');
    } finally {
      setLoading(false);
    }
  };

  // Load pending recipes from Supabase (admin only)
  const loadPendingRecipes = async () => {
    if (!user?.isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('pending_recipes_mp2024')
        .select('*')
        .order('submitted_at', { ascending: false });

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
        url: recipe.recipe_url,
        sharedByUserId: recipe.shared_by_user_id,
        sharedBy: recipe.shared_by_username,
        submittedAt: recipe.submitted_at,
        status: 'pending'
      }));

      setPendingRecipes(transformedRecipes);
      console.log(`✅ Loaded ${transformedRecipes.length} pending recipes from Supabase`);
    } catch (error) {
      console.error('❌ Error loading pending recipes:', error);
      setPendingRecipes([]);
      toast.error('Failed to load pending recipes from database');
    }
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

    return {
      unique,
      duplicates,
      removed: duplicates.length
    };
  };

  // Load user's recipes from Supabase - UPDATED: Always use Supabase
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
        url: recipe.recipe_url,
        isUserCreated: true,
        createdAt: recipe.created_at,
        shared: recipe.is_shared
      }));

      setRecipes(transformedRecipes);
      console.log(`✅ Loaded ${transformedRecipes.length} user recipes from Supabase`);

      // Clear localStorage backup if it exists
      localStorage.removeItem('user_recipes');
    } catch (error) {
      console.error('❌ Error loading user recipes from Supabase:', error);
      toast.error('Failed to load your recipes from database');

      // Only use localStorage as emergency fallback for existing data
      const localRecipes = JSON.parse(localStorage.getItem('user_recipes') || '[]');
      if (localRecipes.length > 0) {
        console.log(`⚠️ Using ${localRecipes.length} recipes from localStorage as fallback`);
        setRecipes(localRecipes);
        toast.warning('Using local recipes - database connection failed');
      } else {
        setRecipes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save recipe to Supabase - ENHANCED: Better error handling
  const saveRecipeToSupabase = async (recipe) => {
    if (!user) {
      throw new Error('User must be logged in to save recipes');
    }

    const userId = getSafeUserId(user);
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    try {
      console.log(`🔄 Saving recipe to Supabase for user: ${userId}`);

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
        recipe_url: recipe.url || null,
        is_shared: recipe.shared || false
      };

      const { data, error } = await supabase
        .from('user_recipes_mp2024')
        .insert(recipeData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
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
        url: data.recipe_url,
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

  // ✅ NEW: Update recipe in Supabase
  const updateRecipeInSupabase = async (recipeId, updatedRecipe) => {
    if (!user) {
      throw new Error('User must be logged in to update recipes');
    }

    const userId = getSafeUserId(user);
    if (!userId) {
      throw new Error('Invalid user ID');
    }

    try {
      console.log(`🔄 Updating recipe ${recipeId} in Supabase`);

      const recipeData = {
        title: updatedRecipe.title,
        description: updatedRecipe.description,
        cook_time: parseInt(updatedRecipe.cookTime) || 0,
        servings: parseInt(updatedRecipe.servings) || 1,
        difficulty: updatedRecipe.difficulty || 'Easy',
        ingredients: updatedRecipe.ingredients || [],
        steps: updatedRecipe.steps || [],
        tags: updatedRecipe.tags || [],
        image_url: updatedRecipe.image || null,
        recipe_url: updatedRecipe.url || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_recipes_mp2024')
        .update(recipeData)
        .eq('id', recipeId)
        .eq('user_id', userId) // Ensure user can only update their own recipes
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Recipe updated in Supabase successfully');

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
        url: data.recipe_url,
        isUserCreated: true,
        createdAt: data.created_at,
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
        .eq('id', recipeId)
        .eq('user_id', userId); // Ensure user can only delete their own recipes

      if (error) throw error;

      console.log('✅ Recipe deleted from Supabase successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting recipe from Supabase:', error);
      throw error;
    }
  };

  // Share recipe to community (Supabase)
  const shareRecipeToSupabase = async (recipe, currentUser) => {
    if (!currentUser) {
      throw new Error('User must be logged in to share recipes');
    }

    try {
      console.log(`🔄 Sharing recipe to community via Supabase`);

      const recipeData = {
        original_recipe_id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        cook_time: parseInt(recipe.cookTime) || 0,
        servings: parseInt(recipe.servings) || 1,
        difficulty: recipe.difficulty || 'Easy',
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        tags: recipe.tags || [],
        image_url: recipe.image || null,
        recipe_url: recipe.url || null,
        shared_by_user_id: getSafeUserId(currentUser),
        shared_by_username: currentUser.username || currentUser.name || 'Unknown',
        status: currentUser.isAdmin ? 'approved' : 'pending'
      };

      if (currentUser.isAdmin) {
        // Admin can directly add to community
        const { data, error } = await supabase
          .from('community_recipes_mp2024')
          .insert({
            ...recipeData,
            approved_by: currentUser.username || 'admin',
            approved_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        console.log('✅ Admin recipe added directly to community');

        // Reload community recipes
        await loadCommunityRecipes();

        return {
          success: true,
          message: 'Recipe added to community!',
          recipeId: data.id
        };
      } else {
        // Regular users submit for approval
        const { data, error } = await supabase
          .from('pending_recipes_mp2024')
          .insert(recipeData)
          .select()
          .single();

        if (error) throw error;

        console.log('✅ Recipe submitted for approval');

        // Reload pending recipes if admin
        if (currentUser.isAdmin) {
          await loadPendingRecipes();
        }

        return {
          success: true,
          message: 'Recipe submitted for community review! Admin will approve shortly.',
          recipeId: data.id
        };
      }
    } catch (error) {
      console.error('❌ Error sharing recipe to Supabase:', error);
      throw error;
    }
  };

  // Admin: Approve pending recipe
  const approveRecipeInSupabase = async (pendingRecipeId, adminUser) => {
    if (!adminUser?.isAdmin) {
      throw new Error('Admin access required');
    }

    try {
      const { data, error } = await supabase.rpc('approve_recipe_mp2024', {
        pending_recipe_id: pendingRecipeId,
        admin_username: adminUser.username || 'admin'
      });

      if (error) throw error;

      // Reload both lists
      await Promise.all([
        loadCommunityRecipes(),
        loadPendingRecipes()
      ]);

      return {
        success: true,
        message: 'Recipe approved and added to community!',
        recipeId: data
      };
    } catch (error) {
      console.error('Error approving recipe:', error);
      throw error;
    }
  };

  // Admin: Reject pending recipe
  const rejectRecipeInSupabase = async (pendingRecipeId, adminUser, reason = '') => {
    if (!adminUser?.isAdmin) {
      throw new Error('Admin access required');
    }

    try {
      const { error } = await supabase
        .from('pending_recipes_mp2024')
        .delete()
        .eq('id', pendingRecipeId);

      if (error) throw error;

      // Reload pending recipes
      await loadPendingRecipes();

      return {
        success: true,
        message: `Recipe rejected${reason ? ': ' + reason : ''}`
      };
    } catch (error) {
      console.error('Error rejecting recipe:', error);
      throw error;
    }
  };

  // Admin: Remove community recipe
  const removeSharedRecipeFromSupabase = async (recipeId, adminUser) => {
    if (!adminUser?.isAdmin) {
      throw new Error('Admin access required');
    }

    try {
      const { error } = await supabase
        .from('community_recipes_mp2024')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      // Reload community recipes
      await loadCommunityRecipes();

      return {
        success: true,
        message: 'Recipe removed from community'
      };
    } catch (error) {
      console.error('Error removing community recipe:', error);
      throw error;
    }
  };

  // Complete reset function - UPDATED: Database-first
  const completeReset = async () => {
    try {
      if (user) {
        const userId = getSafeUserId(user);
        if (userId) {
          console.log(`🔄 Performing complete reset for user: ${userId}`);

          // Delete all user recipes from Supabase
          const { error } = await supabase
            .from('user_recipes_mp2024')
            .delete()
            .eq('user_id', userId);

          if (error) {
            console.error('❌ Error deleting recipes from Supabase:', error);
            throw error;
          }

          console.log('✅ All user recipes deleted from Supabase');
        }
      }

      // Clear all localStorage as cleanup
      localStorage.removeItem('saved_recipes');
      localStorage.removeItem('shared_recipes');
      localStorage.removeItem('pending_recipes');
      localStorage.removeItem('user_shared_recipes');
      localStorage.removeItem('user_recipes');

      // Reset all state to empty arrays
      setRecipes([]);
      setSavedRecipes([]);
      setPendingRecipes([]);
      setUserSharedRecipes(new Set());

      return {
        success: true,
        message: 'All recipes have been completely removed from the database! You now have a clean slate to build your perfect recipe collection.',
        totalReset: true
      };
    } catch (error) {
      console.error('❌ Error during complete reset:', error);
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

    // Clean up saved recipes (still localStorage-based)
    const savedCleanup = removeDuplicates(savedRecipes);
    if (savedCleanup.removed > 0) {
      setSavedRecipes(savedCleanup.unique);
      localStorage.setItem('saved_recipes', JSON.stringify(savedCleanup.unique));
      cleanupReport.savedRecipes = savedCleanup.removed;
      cleanupReport.details.push(...savedCleanup.duplicates.map(d => ({ ...d, source: 'Saved Recipes' })));
      totalRemoved += savedCleanup.removed;
    }

    // Note: User recipes cleanup would need to be done at database level
    // For now, just report what would be cleaned
    const userCreatedRecipes = recipes.filter(r => r.isUserCreated);
    const userCleanup = removeDuplicates(userCreatedRecipes);
    if (userCleanup.removed > 0) {
      cleanupReport.userRecipes = userCleanup.removed;
      cleanupReport.details.push(...userCleanup.duplicates.map(d => ({ ...d, source: 'My Recipes (Database)' })));
      totalRemoved += userCleanup.removed;
    }

    return {
      success: totalRemoved > 0,
      totalRemoved,
      report: cleanupReport,
      message: totalRemoved > 0
        ? `Found ${totalRemoved} potential duplicates. Database recipes require manual cleanup.`
        : 'No duplicates found in saved recipes!'
    };
  };

  // Load data on mount and when user changes
  useEffect(() => {
    console.log('🔄 RecipeContext: Loading data...');

    // Load community recipes for all users
    loadCommunityRecipes();

    // Load user-specific data if logged in
    if (user) {
      loadUserRecipes();
      if (user.isAdmin) {
        loadPendingRecipes();
      }
    } else {
      setRecipes([]);
      setPendingRecipes([]);
    }

    // Load saved recipes from localStorage (still local for now)
    const savedRecipesData = JSON.parse(localStorage.getItem('saved_recipes') || '[]');
    setSavedRecipes(savedRecipesData);

    // Load user shared recipes set
    const userSharedData = JSON.parse(localStorage.getItem('user_shared_recipes') || '[]');
    setUserSharedRecipes(new Set(userSharedData));
  }, [user]);

  // UPDATED: Add recipe - Always save to Supabase
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
      console.log('🔄 Adding recipe to Supabase...');

      // ALWAYS save to Supabase (no localStorage fallback)
      const savedRecipe = await saveRecipeToSupabase(recipe);

      // Update local state
      setRecipes(prev => [savedRecipe, ...prev]);

      toast.success('✅ Recipe added to database successfully!');
      return { success: true, recipe: savedRecipe };
    } catch (error) {
      console.error('❌ Error adding recipe:', error);
      toast.error('Failed to save recipe to database. Please try again.');
      return { success: false, message: 'Failed to save recipe to database. Please check your connection and try again.' };
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Update recipe - Always update in Supabase
  const updateRecipe = async (recipeId, updatedRecipe) => {
    if (!user) {
      return { success: false, message: 'Please sign in to update recipes' };
    }

    try {
      setLoading(true);
      console.log('🔄 Updating recipe in Supabase...');

      // ALWAYS update in Supabase (no localStorage fallback)
      const savedRecipe = await updateRecipeInSupabase(recipeId, updatedRecipe);

      // Update local state
      setRecipes(prev => prev.map(r => r.id === recipeId ? savedRecipe : r));

      // Also update in saved recipes if it exists there
      const updatedSaved = savedRecipes.map(r => r.id === recipeId ? { ...r, ...updatedRecipe } : r);
      setSavedRecipes(updatedSaved);
      localStorage.setItem('saved_recipes', JSON.stringify(updatedSaved));

      toast.success('✅ Recipe updated successfully!');
      return { success: true, recipe: savedRecipe };
    } catch (error) {
      console.error('❌ Error updating recipe:', error);
      toast.error('Failed to update recipe in database. Please try again.');
      return { success: false, message: 'Failed to update recipe in database. Please check your connection and try again.' };
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Delete recipe - Always delete from Supabase
  const deleteRecipe = async (recipeId) => {
    if (!user) {
      return { success: false, message: 'Please sign in to delete recipes' };
    }

    try {
      setLoading(true);
      console.log('🔄 Deleting recipe from Supabase...');

      // ALWAYS delete from Supabase (no localStorage fallback)
      await deleteRecipeFromSupabase(recipeId);

      // Update local state
      setRecipes(prev => prev.filter(r => r.id !== recipeId));

      // Remove from saved recipes
      const updatedSaved = savedRecipes.filter(r => r.id !== recipeId && r.originalSharedId !== recipeId);
      setSavedRecipes(updatedSaved);
      localStorage.setItem('saved_recipes', JSON.stringify(updatedSaved));

      // Remove from user shared set
      const updatedUserShared = new Set([...userSharedRecipes]);
      updatedUserShared.delete(recipeId);
      setUserSharedRecipes(updatedUserShared);
      localStorage.setItem('user_shared_recipes', JSON.stringify([...updatedUserShared]));

      toast.success('✅ Recipe deleted from database successfully!');
      return { success: true, message: 'Recipe deleted successfully!' };
    } catch (error) {
      console.error('❌ Error deleting recipe:', error);
      toast.error('Failed to delete recipe from database. Please try again.');
      return { success: false, message: 'Failed to delete recipe from database. Please check your connection and try again.' };
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

  // Share recipe to community (with Supabase sync)
  const shareRecipe = async (recipe, currentUser) => {
    if (userSharedRecipes.has(recipe.id)) {
      return { success: false, message: 'You have already shared this recipe to the community' };
    }

    if (!currentUser) {
      return { success: false, message: 'You must be logged in to share recipes' };
    }

    try {
      // Use Supabase for recipe sharing
      const result = await shareRecipeToSupabase(recipe, currentUser);

      // Track that this recipe has been shared (for user reference)
      const updatedUserShared = new Set([...userSharedRecipes, recipe.id]);
      setUserSharedRecipes(updatedUserShared);
      localStorage.setItem('user_shared_recipes', JSON.stringify([...updatedUserShared]));

      return result;
    } catch (error) {
      console.error('❌ Error sharing recipe:', error);
      toast.error('Failed to share recipe to community. Please try again.');
      return { success: false, message: 'Failed to share recipe to community. Please check your connection and try again.' };
    }
  };

  // ADMIN: Approve pending recipe (with Supabase)
  const approveRecipe = async (recipeId, adminUser) => {
    if (!adminUser?.isAdmin) {
      return { success: false, message: 'Admin access required' };
    }

    try {
      // Find the recipe to approve
      const recipe = pendingRecipes.find(r => r.id === recipeId || r.originalId === recipeId);
      if (!recipe) {
        return { success: false, message: 'Recipe not found' };
      }

      // Use Supabase for approval
      const result = await approveRecipeInSupabase(recipe.id, adminUser);
      return result;
    } catch (error) {
      console.error('❌ Error approving recipe:', error);
      toast.error('Failed to approve recipe. Please try again.');
      return { success: false, message: 'Failed to approve recipe. Please check your connection and try again.' };
    }
  };

  // ADMIN: Reject pending recipe (with Supabase)
  const rejectRecipe = async (recipeId, adminUser, reason = '') => {
    if (!adminUser?.isAdmin) {
      return { success: false, message: 'Admin access required' };
    }

    try {
      // Find the recipe to reject
      const recipe = pendingRecipes.find(r => r.id === recipeId || r.originalId === recipeId);
      if (!recipe) {
        return { success: false, message: 'Recipe not found' };
      }

      // Use Supabase for rejection
      const result = await rejectRecipeInSupabase(recipe.id, adminUser, reason);

      // Remove from user shared tracking
      const updatedUserShared = new Set([...userSharedRecipes]);
      updatedUserShared.delete(recipe.originalId);
      setUserSharedRecipes(updatedUserShared);
      localStorage.setItem('user_shared_recipes', JSON.stringify([...updatedUserShared]));

      return result;
    } catch (error) {
      console.error('❌ Error rejecting recipe:', error);
      toast.error('Failed to reject recipe. Please try again.');
      return { success: false, message: 'Failed to reject recipe. Please check your connection and try again.' };
    }
  };

  // ADMIN: Remove approved shared recipe (with Supabase)
  const removeSharedRecipe = async (recipeId, adminUser) => {
    if (!adminUser?.isAdmin) {
      return { success: false, message: 'Admin access required' };
    }

    try {
      // Use Supabase for removal
      const result = await removeSharedRecipeFromSupabase(recipeId, adminUser);
      return result;
    } catch (error) {
      console.error('❌ Error removing shared recipe:', error);
      toast.error('Failed to remove recipe. Please try again.');
      return { success: false, message: 'Failed to remove recipe. Please check your connection and try again.' };
    }
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

${recipe.url ? `**Full Recipe Details:**\n${recipe.url}\n\n` : ''}**Click here to view the full recipe and automatically save it to your collection:**
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

  // Get unique recipes for "All Recipes" view
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
    pendingRecipes,
    loading,
    getAllUniqueRecipes,
    addRecipe,
    updateRecipe, // ✅ NEW: Export update function
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
    // Admin functions
    approveRecipe,
    rejectRecipe,
    removeSharedRecipe,
    // Supabase sync functions
    loadCommunityRecipes,
    loadPendingRecipes
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};