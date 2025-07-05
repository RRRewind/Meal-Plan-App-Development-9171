import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

const RewardsContext = createContext();

export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
};

export const RewardsProvider = ({ children }) => {
  const [rewards, setRewards] = useState([]);
  const [userRewards, setUserRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Helper function to get safe user ID as string
  const getSafeUserId = (userObj) => {
    if (!userObj) return null;
    return String(userObj.id || userObj.user_id || '');
  };

  // Load all rewards from Supabase
  const loadRewards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rewards_mp2024')
        .select('*')
        .order('required_xp', { ascending: true });

      if (error) throw error;

      setRewards(data || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  // Load user's claimed rewards
  const loadUserRewards = async () => {
    if (!user) return;

    const userId = getSafeUserId(user);
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_rewards_mp2024')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setUserRewards(data || []);
    } catch (error) {
      console.error('Error loading user rewards:', error);
      setUserRewards([]);
    }
  };

  // Add new reward (Admin only)
  const addReward = async (rewardData) => {
    if (!user?.isAdmin) {
      return { success: false, error: 'Admin access required' };
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rewards_mp2024')
        .insert({
          title: rewardData.title,
          description: rewardData.description,
          pdf_url: rewardData.pdfUrl,
          required_xp: rewardData.requiredXp,
          icon: rewardData.icon || '🏆',
          category: rewardData.category || 'cookbook',
          is_active: true,
          created_by: getSafeUserId(user)
        })
        .select()
        .single();

      if (error) throw error;

      setRewards(prev => [...prev, data].sort((a, b) => a.required_xp - b.required_xp));
      return { success: true, reward: data };
    } catch (error) {
      console.error('Error adding reward:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update reward (Admin only)
  const updateReward = async (rewardId, updates) => {
    if (!user?.isAdmin) {
      return { success: false, error: 'Admin access required' };
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rewards_mp2024')
        .update(updates)
        .eq('id', rewardId)
        .select()
        .single();

      if (error) throw error;

      setRewards(prev => prev.map(r => r.id === rewardId ? data : r));
      return { success: true, reward: data };
    } catch (error) {
      console.error('Error updating reward:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete reward (Admin only)
  const deleteReward = async (rewardId) => {
    if (!user?.isAdmin) {
      return { success: false, error: 'Admin access required' };
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('rewards_mp2024')
        .delete()
        .eq('id', rewardId);

      if (error) throw error;

      setRewards(prev => prev.filter(r => r.id !== rewardId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting reward:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Claim reward
  const claimReward = async (rewardId) => {
    if (!user) {
      return { success: false, error: 'Please sign in to claim rewards' };
    }

    const userId = getSafeUserId(user);
    if (!userId) {
      return { success: false, error: 'Invalid user ID' };
    }

    // Check if already claimed
    const alreadyClaimed = userRewards.some(ur => ur.reward_id === rewardId);
    if (alreadyClaimed) {
      return { success: false, error: 'Reward already claimed' };
    }

    // Check XP requirement
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    if (user.xp < reward.required_xp) {
      return { success: false, error: `Need ${reward.required_xp - user.xp} more XP to claim this reward` };
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_rewards_mp2024')
        .insert({
          user_id: userId,
          reward_id: rewardId,
          claimed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setUserRewards(prev => [...prev, data]);
      return { success: true, reward: data };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Check if user can claim reward
  const canClaimReward = (reward) => {
    if (!user || !reward) return false;
    
    const alreadyClaimed = userRewards.some(ur => ur.reward_id === reward.id);
    if (alreadyClaimed) return false;

    return user.xp >= reward.required_xp;
  };

  // Check if user has claimed reward
  const hasClaimedReward = (rewardId) => {
    return userRewards.some(ur => ur.reward_id === rewardId);
  };

  // Get next reward
  const getNextReward = () => {
    if (!user) return null;
    
    const unclaimedRewards = rewards.filter(reward => !hasClaimedReward(reward.id));
    const nextReward = unclaimedRewards.find(reward => user.xp < reward.required_xp);
    
    return nextReward || null;
  };

  // Get progress to next reward
  const getProgressToNextReward = () => {
    const nextReward = getNextReward();
    if (!nextReward || !user) return { progress: 100, remaining: 0, nextReward: null };

    const progress = (user.xp / nextReward.required_xp) * 100;
    const remaining = nextReward.required_xp - user.xp;

    return { progress: Math.min(progress, 100), remaining: Math.max(remaining, 0), nextReward };
  };

  // Load data on mount and when user changes
  useEffect(() => {
    loadRewards();
    if (user) {
      loadUserRewards();
    } else {
      setUserRewards([]);
    }
  }, [user?.id]);

  const value = {
    rewards,
    userRewards,
    loading,
    addReward,
    updateReward,
    deleteReward,
    claimReward,
    canClaimReward,
    hasClaimedReward,
    getNextReward,
    getProgressToNextReward,
    loadRewards,
    loadUserRewards
  };

  return (
    <RewardsContext.Provider value={value}>
      {children}
    </RewardsContext.Provider>
  );
};