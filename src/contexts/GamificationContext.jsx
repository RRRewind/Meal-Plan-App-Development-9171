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
  const [xpCooldowns, setXpCooldowns] = useState({});

  const badges = {
    new_chef: { name: 'New Chef', icon: '👨‍🍳', description: 'Welcome to Meal Plan!' },
    first_recipe: { name: 'First Recipe', icon: '📝', description: 'Added your first recipe' },
    meal_planner: { name: 'Meal Planner', icon: '📅', description: 'Scheduled 5 meals' },
    cooking_master: { name: 'Cooking Master', icon: '🔥', description: 'Cooked 10 recipes' },
    streak_warrior: { name: 'Streak Warrior', icon: '⚡', description: '7-day cooking streak' },
    recipe_collector: { name: 'Recipe Collector', icon: '📚', description: 'Saved 20 recipes' },
    social_chef: { name: 'Social Chef', icon: '🤝', description: 'Shared 5 recipes' },
    shopping_guru: { name: 'Shopping Guru', icon: '🛒', description: 'Completed 10 shopping lists' },
    daily_grinder: { name: 'Daily Grinder', icon: '⏰', description: 'Earned XP for 7 consecutive days' }
  };

  // Load XP cooldowns from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const savedCooldowns = localStorage.getItem(`xp_cooldowns_${user.id}`);
      if (savedCooldowns) {
        try {
          const cooldowns = JSON.parse(savedCooldowns);
          // Clean up expired cooldowns
          const now = Date.now();
          const validCooldowns = {};
          
          Object.entries(cooldowns).forEach(([action, timestamp]) => {
            if (now - timestamp < 24 * 60 * 60 * 1000) { // 24 hours
              validCooldowns[action] = timestamp;
            }
          });
          
          setXpCooldowns(validCooldowns);
          
          // Save cleaned cooldowns back
          if (Object.keys(validCooldowns).length !== Object.keys(cooldowns).length) {
            localStorage.setItem(`xp_cooldowns_${user.id}`, JSON.stringify(validCooldowns));
          }
        } catch (error) {
          console.error('Error loading XP cooldowns:', error);
          setXpCooldowns({});
        }
      }
    }
  }, [user?.id]);

  // Save XP cooldowns to localStorage whenever they change
  useEffect(() => {
    if (user?.id && Object.keys(xpCooldowns).length > 0) {
      localStorage.setItem(`xp_cooldowns_${user.id}`, JSON.stringify(xpCooldowns));
    }
  }, [xpCooldowns, user?.id]);

  // 🚫 XP RATE LIMITING: Check if action is on cooldown
  const isActionOnCooldown = (action) => {
    if (!user?.id) return false;
    
    const lastUsed = xpCooldowns[action];
    if (!lastUsed) return false;
    
    const now = Date.now();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const timeSinceLastUse = now - lastUsed;
    
    return timeSinceLastUse < cooldownPeriod;
  };

  // 🕐 Get remaining cooldown time for an action
  const getCooldownTimeRemaining = (action) => {
    if (!user?.id) return 0;
    
    const lastUsed = xpCooldowns[action];
    if (!lastUsed) return 0;
    
    const now = Date.now();
    const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
    const timeSinceLastUse = now - lastUsed;
    const remaining = cooldownPeriod - timeSinceLastUse;
    
    return remaining > 0 ? remaining : 0;
  };

  // 📝 Format cooldown time for display
  const formatCooldownTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // 🎯 ENHANCED XP SYSTEM: Add XP with rate limiting
  const addXP = (amount, reason, actionKey = null) => {
    if (!user) return;

    // Create action key for rate limiting
    const rateLimitKey = actionKey || reason.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if this action is on cooldown
    if (isActionOnCooldown(rateLimitKey)) {
      const remainingTime = getCooldownTimeRemaining(rateLimitKey);
      const formattedTime = formatCooldownTime(remainingTime);
      
      toast.error(`⏰ XP cooldown active! Try again in ${formattedTime}`, {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      });
      return false; // Indicate XP was not awarded
    }

    // Award XP and set cooldown
    const newXP = user.xp + amount;
    const newLevel = Math.floor(newXP / 100) + 1;
    const leveledUp = newLevel > user.level;

    updateUser({
      xp: newXP,
      level: newLevel
    });

    // Set cooldown for this action
    const now = Date.now();
    setXpCooldowns(prev => ({
      ...prev,
      [rateLimitKey]: now
    }));

    // Show appropriate toast
    if (leveledUp) {
      toast.success(`🎉 Level Up! You're now level ${newLevel}!`, {
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      });
    } else {
      toast.success(`+${amount} XP - ${reason}`, {
        duration: 2000,
        style: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      });
    }

    checkAchievements();
    return true; // Indicate XP was successfully awarded
  };

  // 🏆 ENHANCED: Add badge with cooldown check
  const addBadge = (badgeId, actionKey = null) => {
    if (!user || user.badges.includes(badgeId)) return;

    const rateLimitKey = actionKey || `badge_${badgeId}`;
    
    // Badges have shorter cooldown (1 hour) to prevent spam but allow legitimate progress
    const badgeCooldownPeriod = 1 * 60 * 60 * 1000; // 1 hour
    const lastUsed = xpCooldowns[rateLimitKey];
    
    if (lastUsed && (Date.now() - lastUsed) < badgeCooldownPeriod) {
      return false;
    }

    const newBadges = [...user.badges, badgeId];
    updateUser({ badges: newBadges });

    // Set cooldown
    setXpCooldowns(prev => ({
      ...prev,
      [rateLimitKey]: Date.now()
    }));

    const badge = badges[badgeId];
    if (badge) {
      toast.success(`🏆 New Badge: ${badge.name} ${badge.icon}`, {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      });
    }
    
    return true;
  };

  const incrementStreak = () => {
    if (!user) return;
    
    const actionKey = 'daily_streak';
    if (isActionOnCooldown(actionKey)) return false;

    const newStreak = user.streakDays + 1;
    updateUser({ streakDays: newStreak });

    // Set cooldown
    setXpCooldowns(prev => ({
      ...prev,
      [actionKey]: Date.now()
    }));

    if (newStreak === 7) {
      addBadge('streak_warrior', 'badge_streak_warrior');
    }
    
    return true;
  };

  const incrementRecipesCooked = () => {
    if (!user) return;
    
    const actionKey = 'recipe_cooked';
    if (isActionOnCooldown(actionKey)) return false;

    const newCount = user.recipesCooked + 1;
    updateUser({ recipesCooked: newCount });

    // Set cooldown
    setXpCooldowns(prev => ({
      ...prev,
      [actionKey]: Date.now()
    }));

    if (newCount === 1) {
      addBadge('first_recipe', 'badge_first_recipe');
    } else if (newCount === 10) {
      addBadge('cooking_master', 'badge_cooking_master');
    }
    
    return true;
  };

  const checkAchievements = () => {
    if (!user) return;

    // Check for various achievements based on user stats
    const savedRecipes = JSON.parse(localStorage.getItem('saved_recipes') || '[]');
    if (savedRecipes.length >= 20 && !user.badges.includes('recipe_collector')) {
      addBadge('recipe_collector', 'badge_recipe_collector');
    }
  };

  // 📊 Get XP statistics and cooldown info
  const getXPStats = () => {
    if (!user?.id) return { totalActions: 0, todayActions: 0, availableActions: 0 };
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentActions = Object.values(xpCooldowns).filter(timestamp => timestamp > oneDayAgo);
    const totalCooldowns = Object.keys(xpCooldowns).length;
    
    return {
      totalActions: totalCooldowns,
      todayActions: recentActions.length,
      activeCooldowns: Object.keys(xpCooldowns).filter(action => isActionOnCooldown(action)).length,
      xpCooldowns: xpCooldowns
    };
  };

  const value = {
    badges,
    addXP,
    addBadge,
    incrementStreak,
    incrementRecipesCooked,
    checkAchievements,
    isActionOnCooldown,
    getCooldownTimeRemaining,
    formatCooldownTime,
    getXPStats
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};