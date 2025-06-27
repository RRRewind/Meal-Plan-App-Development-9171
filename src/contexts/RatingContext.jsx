import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

const RatingContext = createContext();

export const useRating = () => {
  const context = useContext(RatingContext);
  if (!context) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
};

export const RatingProvider = ({ children }) => {
  const [ratings, setRatings] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load ratings from Supabase
  const loadRatings = async (recipeIds = []) => {
    try {
      if (recipeIds.length === 0) return;

      const { data, error } = await supabase
        .from('recipe_ratings_mp2024')
        .select('*')
        .in('recipe_id', recipeIds);

      if (error) throw error;

      // Group ratings by recipe_id
      const ratingsByRecipe = {};
      const userRatingsByRecipe = {};

      data.forEach(rating => {
        if (!ratingsByRecipe[rating.recipe_id]) {
          ratingsByRecipe[rating.recipe_id] = [];
        }
        ratingsByRecipe[rating.recipe_id].push(rating);

        // Track user's own ratings
        if (user && rating.user_id === user.id) {
          userRatingsByRecipe[rating.recipe_id] = rating;
        }
      });

      setRatings(prev => ({ ...prev, ...ratingsByRecipe }));
      setUserRatings(prev => ({ ...prev, ...userRatingsByRecipe }));

    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  // Submit or update rating
  const submitRating = async (recipeId, rating, review = '') => {
    if (!user) {
      toast.error('Please sign in to rate recipes');
      return { success: false };
    }

    if (rating < 1 || rating > 5) {
      toast.error('Rating must be between 1 and 5 stars');
      return { success: false };
    }

    setLoading(true);

    try {
      const ratingData = {
        recipe_id: recipeId,
        user_id: user.id,
        username: user.username || user.name,
        rating,
        review: review.trim(),
        updated_at: new Date().toISOString()
      };

      // Check if user already rated this recipe
      const existingRating = userRatings[recipeId];

      let result;
      if (existingRating) {
        // Update existing rating
        result = await supabase
          .from('recipe_ratings_mp2024')
          .update(ratingData)
          .eq('recipe_id', recipeId)
          .eq('user_id', user.id);
      } else {
        // Insert new rating
        result = await supabase
          .from('recipe_ratings_mp2024')
          .insert(ratingData);
      }

      if (result.error) throw result.error;

      // Update local state
      setUserRatings(prev => ({
        ...prev,
        [recipeId]: { ...ratingData, id: existingRating?.id || Date.now() }
      }));

      // Reload ratings for this recipe
      await loadRatings([recipeId]);

      toast.success(existingRating ? '⭐ Rating updated!' : '⭐ Rating submitted!');
      return { success: true };

    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Get rating statistics for a recipe
  const getRatingStats = (recipeId) => {
    const recipeRatings = ratings[recipeId] || [];
    
    if (recipeRatings.length === 0) {
      return {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        smartScore: 0
      };
    }

    const total = recipeRatings.reduce((sum, r) => sum + r.rating, 0);
    const average = total / recipeRatings.length;
    const count = recipeRatings.length;

    // Distribution of ratings
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    recipeRatings.forEach(r => {
      distribution[r.rating]++;
    });

    // Smart score calculation (Bayesian average with confidence weighting)
    // Formula: (v × R + m × C) / (v + m)
    // Where: v = number of votes, R = average rating, m = minimum votes needed, C = mean rating across all recipes
    const minVotes = 10; // Minimum votes for confidence
    const globalMean = 3.5; // Assume global mean rating
    const smartScore = (count * average + minVotes * globalMean) / (count + minVotes);

    return {
      average: Number(average.toFixed(1)),
      count,
      distribution,
      smartScore: Number(smartScore.toFixed(2))
    };
  };

  // Get user's rating for a recipe
  const getUserRating = (recipeId) => {
    return userRatings[recipeId] || null;
  };

  // Check if user can rate a recipe (only community recipes)
  const canRateRecipe = (recipe) => {
    if (!user || !recipe) return false;
    
    // Only allow rating community recipes (shared recipes)
    return recipe.shared && recipe.sharedByUserId !== user.id;
  };

  // Sort recipes by smart score (intelligent combination of rating and review count)
  const sortRecipesByRating = (recipes) => {
    return [...recipes].sort((a, b) => {
      const statsA = getRatingStats(a.id);
      const statsB = getRatingStats(b.id);
      
      // Primary sort: Smart score (higher is better)
      if (statsB.smartScore !== statsA.smartScore) {
        return statsB.smartScore - statsA.smartScore;
      }
      
      // Secondary sort: Review count (more reviews = higher)
      if (statsB.count !== statsA.count) {
        return statsB.count - statsA.count;
      }
      
      // Tertiary sort: Average rating (higher is better)
      return statsB.average - statsA.average;
    });
  };

  const value = {
    ratings,
    userRatings,
    loading,
    loadRatings,
    submitRating,
    getRatingStats,
    getUserRating,
    canRateRecipe,
    sortRecipesByRating
  };

  return (
    <RatingContext.Provider value={value}>
      {children}
    </RatingContext.Provider>
  );
};