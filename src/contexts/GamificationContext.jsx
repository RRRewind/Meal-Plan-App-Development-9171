import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const GamificationContext = createContext();

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [achievements, setAchievements] = useState([]);

  const badges = {
    new_chef: { name: 'New Chef', icon: '👨‍🍳', description: 'Welcome to Meal Plan!' },
    first_recipe: { name: 'First Recipe', icon: '📝', description: 'Added your first recipe' },
    meal_planner: { name: 'Meal Planner', icon: '📅', description: 'Scheduled 5 meals' },
    cooking_master: { name: 'Cooking Master', icon: '🔥', description: 'Cooked 10 recipes' },
    streak_warrior: { name: 'Streak Warrior', icon: '⚡', description: '7-day cooking streak' },
    recipe_collector: { name: 'Recipe Collector', icon: '📚', description: 'Saved 20 recipes' },
    social_chef: { name: 'Social Chef', icon: '🤝', description: 'Shared 5 recipes' }
  };

  const addXP = (amount, reason) => {
    if (!user) return;
    
    const newXP = user.xp + amount;
    const newLevel = Math.floor(newXP / 100) + 1;
    const leveledUp = newLevel > user.level;
    
    updateUser({ 
      xp: newXP, 
      level: newLevel 
    });

    if (leveledUp) {
      toast.success(`🎉 Level Up! You're now level ${newLevel}!`);
    } else {
      toast.success(`+${amount} XP - ${reason}`);
    }

    checkAchievements();
  };

  const addBadge = (badgeId) => {
    if (!user || user.badges.includes(badgeId)) return;
    
    const newBadges = [...user.badges, badgeId];
    updateUser({ badges: newBadges });
    
    const badge = badges[badgeId];
    if (badge) {
      toast.success(`🏆 New Badge: ${badge.name} ${badge.icon}`);
    }
  };

  const incrementStreak = () => {
    if (!user) return;
    
    const newStreak = user.streakDays + 1;
    updateUser({ streakDays: newStreak });
    
    if (newStreak === 7) {
      addBadge('streak_warrior');
    }
  };

  const incrementRecipesCooked = () => {
    if (!user) return;
    
    const newCount = user.recipesCooked + 1;
    updateUser({ recipesCooked: newCount });
    
    if (newCount === 1) {
      addBadge('first_recipe');
    } else if (newCount === 10) {
      addBadge('cooking_master');
    }
  };

  const checkAchievements = () => {
    if (!user) return;
    
    // Check for various achievements based on user stats
    const savedRecipes = JSON.parse(localStorage.getItem('saved_recipes') || '[]');
    if (savedRecipes.length >= 20 && !user.badges.includes('recipe_collector')) {
      addBadge('recipe_collector');
    }
  };

  const value = {
    badges,
    addXP,
    addBadge,
    incrementStreak,
    incrementRecipesCooked,
    checkAchievements
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};