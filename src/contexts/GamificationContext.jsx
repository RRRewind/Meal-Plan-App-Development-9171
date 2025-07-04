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
  const [dailyProgress, setDailyProgress] = useState({});

  const badges = {
    new_chef: { name: 'New Chef', icon: '👨‍🍳', description: 'Welcome to Meal Plan!' },
    first_recipe: { name: 'First Recipe', icon: '📝', description: 'Added your first recipe' },
    meal_planner: { name: 'Meal Planner', icon: '📅', description: 'Scheduled 5 meals' },
    cooking_master: { name: 'Cooking Master', icon: '🔥', description: 'Cooked 10 recipes' },
    streak_warrior: { name: 'Streak Warrior', icon: '⚡', description: '7-day cooking streak' },
    recipe_collector: { name: 'Recipe Collector', icon: '📚', description: 'Saved 20 recipes' },
    social_chef: { name: 'Social Chef', icon: '🤝', description: 'Shared 5 recipes' },
    shopping_guru: { name: 'Shopping Guru', icon: '🛒', description: 'Completed 10 shopping lists' },
    daily_grinder: { name: 'Daily Grinder', icon: '⏰', description: 'Earned XP for 7 consecutive days' },
    planning_pro: { name: 'Planning Pro', icon: '🎯', description: 'Planned all meals for a day' },
    shopping_champion: { name: 'Shopping Champion', icon: '🏆', description: 'Checked off 100+ items' }
  };

  // Load XP cooldowns and daily progress from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const savedCooldowns = localStorage.getItem(`xp_cooldowns_${user.id}`);
      const savedProgress = localStorage.getItem(`daily_progress_${user.id}`);
      
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

      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          const today = new Date().toDateString();
          
          // Reset daily progress if it's a new day
          if (progress.date !== today) {
            const resetProgress = {
              date: today,
              mealsPlanned: { breakfast: false, lunch: false, dinner: false, snacks: false },
              itemsChecked: 0,
              shoppingMilestones: 0
            };
            setDailyProgress(resetProgress);
            localStorage.setItem(`daily_progress_${user.id}`, JSON.stringify(resetProgress));
          } else {
            setDailyProgress(progress);
          }
        } catch (error) {
          console.error('Error loading daily progress:', error);
          initializeDailyProgress();
        }
      } else {
        initializeDailyProgress();
      }
    }
  }, [user?.id]);

  // Initialize daily progress for new day
  const initializeDailyProgress = () => {
    const today = new Date().toDateString();
    const initialProgress = {
      date: today,
      mealsPlanned: { breakfast: false, lunch: false, dinner: false, snacks: false },
      itemsChecked: 0,
      shoppingMilestones: 0
    };
    setDailyProgress(initialProgress);
    if (user?.id) {
      localStorage.setItem(`daily_progress_${user.id}`, JSON.stringify(initialProgress));
    }
  };

  // Save daily progress to localStorage whenever it changes
  useEffect(() => {
    if (user?.id && Object.keys(dailyProgress).length > 0) {
      localStorage.setItem(`daily_progress_${user.id}`, JSON.stringify(dailyProgress));
    }
  }, [dailyProgress, user?.id]);

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
    if (!user) return false;

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

  // 🍽️ NEW: Award XP for meal planning (once per meal type per day)
  const addMealPlanningXP = (mealType) => {
    if (!user || !dailyProgress.mealsPlanned) return false;

    const today = new Date().toDateString();
    
    // Reset progress if it's a new day
    if (dailyProgress.date !== today) {
      initializeDailyProgress();
      return false;
    }

    // Check if this meal type was already planned today
    if (dailyProgress.mealsPlanned[mealType]) {
      toast.error(`Already earned XP for ${mealType} today! Try again tomorrow.`, {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }
      });
      return false;
    }

    // Award XP and mark meal as planned
    const amount = 10; // 10 XP per meal planned
    const newXP = user.xp + amount;
    const newLevel = Math.floor(newXP / 100) + 1;
    const leveledUp = newLevel > user.level;

    updateUser({
      xp: newXP,
      level: newLevel
    });

    // Update daily progress
    setDailyProgress(prev => ({
      ...prev,
      mealsPlanned: {
        ...prev.mealsPlanned,
        [mealType]: true
      }
    }));

    // Check if all meals are planned for bonus
    const updatedMeals = { ...dailyProgress.mealsPlanned, [mealType]: true };
    const allMealsPlanned = Object.values(updatedMeals).every(planned => planned);
    
    if (allMealsPlanned) {
      // Bonus XP for planning all meals
      const bonusXP = 20;
      updateUser(prev => ({ ...prev, xp: prev.xp + bonusXP }));
      toast.success(`🎯 Daily Planning Complete! +${amount + bonusXP} XP total!`, {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      });
      addBadge('planning_pro', 'badge_planning_pro');
    } else {
      // Regular meal planning XP
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
        toast.success(`+${amount} XP - ${mealType} planned!`, {
          duration: 2000,
          style: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          }
        });
      }
    }

    checkAchievements();
    return true;
  };

  // 🛒 NEW: Award XP for shopping progress (every 10 items checked)
  const addShoppingProgressXP = () => {
    // ✅ FIXED: Properly check if dailyProgress.itemsChecked exists
    if (!user || typeof dailyProgress.itemsChecked === 'undefined') return false;

    const today = new Date().toDateString();
    
    // Reset progress if it's a new day
    if (dailyProgress.date !== today) {
      initializeDailyProgress();
      return false;
    }

    // Increment items checked
    const newItemsChecked = (dailyProgress.itemsChecked || 0) + 1;
    const newMilestone = Math.floor(newItemsChecked / 10);
    const currentMilestone = dailyProgress.shoppingMilestones || 0;

    // Update daily progress
    setDailyProgress(prev => ({
      ...prev,
      itemsChecked: newItemsChecked,
      shoppingMilestones: newMilestone
    }));

    // Award XP if we hit a new milestone (every 10 items)
    if (newMilestone > currentMilestone) {
      const amount = 15; // 15 XP per 10 items checked
      const newXP = user.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      const leveledUp = newLevel > user.level;

      updateUser({
        xp: newXP,
        level: newLevel
      });

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
        toast.success(`🛒 Shopping Streak! +${amount} XP for ${newItemsChecked} items checked!`, {
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold'
          }
        });
      }

      // Special milestone badges
      if (newItemsChecked >= 100) {
        addBadge('shopping_champion', 'badge_shopping_champion');
      }

      checkAchievements();
      return true;
    }

    return false; // No milestone reached
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
    if (!user?.id) return { 
      totalActions: 0, 
      todayActions: 0, 
      availableActions: 0,
      dailyProgress: {}
    };
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentActions = Object.values(xpCooldowns).filter(timestamp => timestamp > oneDayAgo);
    const totalCooldowns = Object.keys(xpCooldowns).length;
    
    return {
      totalActions: totalCooldowns,
      todayActions: recentActions.length,
      activeCooldowns: Object.keys(xpCooldowns).filter(action => isActionOnCooldown(action)).length,
      xpCooldowns: xpCooldowns,
      dailyProgress: dailyProgress
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
    getXPStats,
    // NEW: Generous XP functions
    addMealPlanningXP,
    addShoppingProgressXP,
    dailyProgress
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};