import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMealPlan } from '../contexts/MealPlanContext';
import { useGamification } from '../contexts/GamificationContext';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const { FiShoppingCart, FiCheck, FiPlus, FiTrash2, FiDownload, FiShare2, FiZap, FiStar, FiAward, FiGrid, FiList } = FiIcons;

const ShoppingList = () => {
  const [customItems, setCustomItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [wasCompleted, setWasCompleted] = useState(false);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'list'
  
  // ✅ FIX: Add refs to prevent duplicate notifications
  const lastXPAwardRef = useRef(null);
  const completionProcessedRef = useRef(false);
  const previousIngredientsRef = useRef(new Set()); // Track previous ingredients
  const confettiTimeoutRef = useRef(null); // Track confetti cleanup

  const { getAllIngredients } = useMealPlan();
  const { addXP, addShoppingProgressXP, isActionOnCooldown, getCooldownTimeRemaining, formatCooldownTime } = useGamification();
  const { user } = useAuth();

  // ✅ CLEANUP: Clear confetti timeouts on unmount
  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  // ✅ PERSISTENCE: Load saved data on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      // Load user-specific data
      const savedCustomItems = localStorage.getItem(`shopping_custom_items_${user.id}`);
      const savedCheckedItems = localStorage.getItem(`shopping_checked_items_${user.id}`);
      const savedViewMode = localStorage.getItem(`shopping_view_mode_${user.id}`);
      const savedWasCompleted = localStorage.getItem(`shopping_was_completed_${user.id}`);

      if (savedCustomItems) {
        try {
          const parsedCustomItems = JSON.parse(savedCustomItems);
          setCustomItems(parsedCustomItems.filter(item => 
            item && item.name && typeof item.name === 'string' && item.name.trim()
          ));
        } catch (error) {
          console.error('Error loading custom items:', error);
          setCustomItems([]);
        }
      }

      if (savedCheckedItems) {
        try {
          const parsedCheckedItems = JSON.parse(savedCheckedItems);
          setCheckedItems(new Set(parsedCheckedItems));
        } catch (error) {
          console.error('Error loading checked items:', error);
          setCheckedItems(new Set());
        }
      }

      if (savedViewMode) {
        setViewMode(savedViewMode);
      }

      if (savedWasCompleted) {
        setWasCompleted(savedWasCompleted === 'true');
      }
    } else {
      // Guest user - use non-user-specific storage
      const savedCustomItems = localStorage.getItem('shopping_custom_items_guest');
      const savedCheckedItems = localStorage.getItem('shopping_checked_items_guest');
      const savedViewMode = localStorage.getItem('shopping_view_mode_guest');

      if (savedCustomItems) {
        try {
          const parsedCustomItems = JSON.parse(savedCustomItems);
          setCustomItems(parsedCustomItems.filter(item => 
            item && item.name && typeof item.name === 'string' && item.name.trim()
          ));
        } catch (error) {
          console.error('Error loading guest custom items:', error);
          setCustomItems([]);
        }
      }

      if (savedCheckedItems) {
        try {
          const parsedCheckedItems = JSON.parse(savedCheckedItems);
          setCheckedItems(new Set(parsedCheckedItems));
        } catch (error) {
          console.error('Error loading guest checked items:', error);
          setCheckedItems(new Set());
        }
      }

      if (savedViewMode) {
        setViewMode(savedViewMode);
      }
    }
  }, [user?.id]);

  // ✅ PERSISTENCE: Save custom items whenever they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`shopping_custom_items_${user.id}`, JSON.stringify(customItems));
    } else {
      localStorage.setItem('shopping_custom_items_guest', JSON.stringify(customItems));
    }
  }, [customItems, user?.id]);

  // ✅ PERSISTENCE: Save checked items whenever they change
  useEffect(() => {
    const checkedArray = Array.from(checkedItems);
    if (user?.id) {
      localStorage.setItem(`shopping_checked_items_${user.id}`, JSON.stringify(checkedArray));
    } else {
      localStorage.setItem('shopping_checked_items_guest', JSON.stringify(checkedArray));
    }
  }, [checkedItems, user?.id]);

  // ✅ PERSISTENCE: Save view mode whenever it changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`shopping_view_mode_${user.id}`, viewMode);
    } else {
      localStorage.setItem('shopping_view_mode_guest', viewMode);
    }
  }, [viewMode, user?.id]);

  // ✅ PERSISTENCE: Save completion status
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`shopping_was_completed_${user.id}`, wasCompleted.toString());
    }
  }, [wasCompleted, user?.id]);

  // ✅ ENHANCED: Additional filtering at component level for extra safety
  const mealIngredients = getAllIngredients().filter(ingredient => {
    if (!ingredient) return false;
    if (!ingredient.name || typeof ingredient.name !== 'string') return false;
    if (!ingredient.name.trim()) return false;
    if (ingredient.name.trim().length === 0) return false;
    // Skip obviously invalid entries
    const name = ingredient.name.trim().toLowerCase();
    if (name === '' || name === ' ' || name === 'undefined' || name === 'null') {
      return false;
    }
    return true;
  });

  // ✅ ENHANCED: Filter custom items as well
  const validCustomItems = customItems.filter(item => {
    if (!item) return false;
    if (!item.name || typeof item.name !== 'string') return false;
    if (!item.name.trim()) return false;
    if (item.name.trim().length === 0) return false;
    return true;
  });

  const allItems = [...mealIngredients, ...validCustomItems];

  // ✅ NEW: Sync checked items when meal ingredients change
  useEffect(() => {
    // Create a set of current meal ingredient keys
    const currentMealIngredientKeys = new Set(
      mealIngredients.map((ingredient, index) => `meal-${ingredient.name}-${index}`)
    );

    // Create a set of current custom item keys
    const currentCustomItemKeys = new Set(validCustomItems.map(item => item.id));

    // Combine all current valid keys
    const allCurrentKeys = new Set([...currentMealIngredientKeys, ...currentCustomItemKeys]);

    // Clean up checked items - only keep items that still exist
    setCheckedItems(prevChecked => {
      const cleanedChecked = new Set();
      for (const checkedKey of prevChecked) {
        if (allCurrentKeys.has(checkedKey)) {
          cleanedChecked.add(checkedKey);
        }
      }

      // Log the cleanup for debugging
      const removedCount = prevChecked.size - cleanedChecked.size;
      if (removedCount > 0) {
        console.log(`🧹 Cleaned up ${removedCount} orphaned checked items from shopping list`);
      }

      return cleanedChecked;
    });

    // Update the previous ingredients ref
    previousIngredientsRef.current = currentMealIngredientKeys;
  }, [mealIngredients, validCustomItems]);

  const checkedCount = Array.from(checkedItems).length;
  const totalCount = allItems.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const isCompleted = totalCount > 0 && checkedCount === totalCount;

  // 🛒 GROCERY STORE CATEGORIES: Organized by typical store layout
  const groceryCategories = {
    produce: {
      name: '🥕 Produce',
      description: 'Fresh fruits and vegetables',
      icon: '🥬',
      color: 'from-green-100 to-emerald-100',
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      keywords: [
        // Vegetables
        'tomato', 'onion', 'garlic', 'potato', 'carrot', 'celery', 'bell pepper', 'pepper',
        'broccoli', 'cauliflower', 'spinach', 'lettuce', 'cabbage', 'cucumber', 'zucchini',
        'mushroom', 'corn', 'peas', 'green bean', 'asparagus', 'kale', 'arugula', 'basil',
        'cilantro', 'parsley', 'dill', 'mint', 'rosemary', 'thyme', 'oregano', 'sage',
        'ginger', 'jalapeño', 'serrano', 'habanero', 'chili', 'avocado', 'lime', 'lemon',
        // Fruits
        'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry',
        'blackberry', 'pineapple', 'mango', 'papaya', 'kiwi', 'peach', 'pear', 'plum',
        'cherry', 'watermelon', 'cantaloupe', 'honeydew', 'coconut'
      ]
    },
    meat: {
      name: '🥩 Meat & Seafood',
      description: 'Fresh meats, poultry, and seafood',
      icon: '🍖',
      color: 'from-red-100 to-pink-100',
      borderColor: 'border-red-300',
      textColor: 'text-red-700',
      keywords: [
        'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'bacon', 'ham', 'sausage',
        'ground beef', 'ground turkey', 'ground chicken', 'steak', 'roast', 'chop',
        'breast', 'thigh', 'wing', 'drumstick', 'salmon', 'tuna', 'cod', 'halibut',
        'tilapia', 'shrimp', 'crab', 'lobster', 'scallop', 'mussel', 'clam', 'oyster',
        'fish', 'seafood', 'meat'
      ]
    },
    dairy: {
      name: '🥛 Dairy & Eggs',
      description: 'Milk, cheese, yogurt, and eggs',
      icon: '🧀',
      color: 'from-blue-100 to-cyan-100',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-700',
      keywords: [
        'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese',
        'ricotta', 'mozzarella', 'cheddar', 'parmesan', 'swiss', 'goat cheese', 'feta',
        'brie', 'camembert', 'blue cheese', 'cream cheese', 'egg', 'heavy cream',
        'half and half', 'buttermilk', 'ice cream', 'frozen yogurt'
      ]
    },
    pantry: {
      name: '🥫 Pantry & Canned',
      description: 'Canned goods, condiments, and shelf-stable items',
      icon: '🥫',
      color: 'from-amber-100 to-yellow-100',
      borderColor: 'border-amber-300',
      textColor: 'text-amber-700',
      keywords: [
        'rice', 'pasta', 'noodle', 'quinoa', 'oats', 'flour', 'sugar', 'salt', 'pepper',
        'olive oil', 'vegetable oil', 'coconut oil', 'vinegar', 'soy sauce', 'hot sauce',
        'ketchup', 'mustard', 'mayonnaise', 'ranch', 'italian dressing', 'balsamic',
        'honey', 'maple syrup', 'vanilla', 'cinnamon', 'paprika', 'cumin', 'chili powder',
        'garlic powder', 'onion powder', 'black pepper', 'red pepper', 'bay leaf',
        'canned tomato', 'tomato sauce', 'tomato paste', 'chicken broth', 'beef broth',
        'vegetable broth', 'coconut milk', 'canned beans', 'black beans', 'kidney beans',
        'chickpeas', 'lentils', 'peanut butter', 'jelly', 'jam', 'cereal', 'crackers',
        'bread', 'tortilla', 'pita', 'bagel', 'english muffin'
      ]
    },
    frozen: {
      name: '🧊 Frozen Foods',
      description: 'Frozen vegetables, meals, and desserts',
      icon: '❄️',
      color: 'from-cyan-100 to-blue-100',
      borderColor: 'border-cyan-300',
      textColor: 'text-cyan-700',
      keywords: [
        'frozen', 'ice cream', 'frozen yogurt', 'frozen vegetable', 'frozen fruit',
        'frozen meal', 'frozen pizza', 'frozen chicken', 'frozen fish', 'frozen shrimp',
        'frozen berries', 'frozen peas', 'frozen corn', 'frozen broccoli', 'frozen spinach',
        'ice', 'popsicle', 'frozen waffle', 'frozen bagel', 'frozen bread'
      ]
    },
    beverages: {
      name: '🥤 Beverages',
      description: 'Drinks, juices, and beverages',
      icon: '🍹',
      color: 'from-purple-100 to-pink-100',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-700',
      keywords: [
        'water', 'juice', 'soda', 'coffee', 'tea', 'beer', 'wine', 'energy drink',
        'sports drink', 'coconut water', 'almond milk', 'soy milk', 'oat milk',
        'orange juice', 'apple juice', 'cranberry juice', 'grape juice', 'lemonade',
        'sparkling water', 'tonic water', 'club soda', 'kombucha'
      ]
    },
    snacks: {
      name: '🍿 Snacks & Sweets',
      description: 'Chips, cookies, candy, and treats',
      icon: '🍪',
      color: 'from-orange-100 to-red-100',
      borderColor: 'border-orange-300',
      textColor: 'text-orange-700',
      keywords: [
        'chips', 'cookie', 'candy', 'chocolate', 'nuts', 'almonds', 'peanuts', 'cashews',
        'walnuts', 'pecans', 'pistachios', 'trail mix', 'granola', 'granola bar',
        'protein bar', 'crackers', 'pretzels', 'popcorn', 'gum', 'mints'
      ]
    },
    other: {
      name: '🛍️ Other Items',
      description: 'Household and miscellaneous items',
      icon: '📦',
      color: 'from-gray-100 to-slate-100',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-700',
      keywords: []
    }
  };

  // 🏷️ CATEGORIZE ITEMS: Smart categorization based on keywords
  const categorizeItem = (itemName) => {
    if (!itemName || typeof itemName !== 'string') return 'other';
    
    const name = itemName.toLowerCase().trim();
    
    for (const [categoryId, category] of Object.entries(groceryCategories)) {
      if (categoryId === 'other') continue; // Skip 'other' category for now
      
      const matchesKeyword = category.keywords.some(keyword => 
        name.includes(keyword) || keyword.includes(name)
      );
      
      if (matchesKeyword) {
        return categoryId;
      }
    }
    
    return 'other'; // Default category
  };

  // 📊 GROUP ITEMS BY CATEGORY - ✅ TRIPLE FILTERED: Only valid items
  const categorizedItems = () => {
    const categories = {};

    // ✅ Process meal ingredients with triple validation
    mealIngredients.forEach((ingredient, index) => {
      // Final validation check
      if (!ingredient || !ingredient.name || typeof ingredient.name !== 'string' || !ingredient.name.trim()) {
        return; // Skip invalid ingredients
      }

      const category = categorizeItem(ingredient.name);
      const itemKey = `meal-${ingredient.name}-${index}`;

      // Initialize category if it doesn't exist
      if (!categories[category]) {
        categories[category] = {
          ...groceryCategories[category],
          items: []
        };
      }

      categories[category].items.push({
        ...ingredient,
        key: itemKey,
        isCustom: false,
        isChecked: checkedItems.has(itemKey)
      });
    });

    // ✅ Process custom items with validation
    validCustomItems.forEach(item => {
      const category = categorizeItem(item.name);

      // Initialize category if it doesn't exist
      if (!categories[category]) {
        categories[category] = {
          ...groceryCategories[category],
          items: []
        };
      }

      categories[category].items.push({
        ...item,
        key: item.id,
        isCustom: true,
        isChecked: checkedItems.has(item.id)
      });
    });

    // ✅ Only return categories that have valid items
    const validCategories = {};
    Object.entries(categories).forEach(([categoryId, category]) => {
      if (category.items && category.items.length > 0) {
        validCategories[categoryId] = category;
      }
    });

    return validCategories;
  };

  // ✅ ENHANCED: Clean up custom items on state change
  useEffect(() => {
    const cleanedCustomItems = customItems.filter(item => {
      if (!item) return false;
      if (!item.name || typeof item.name !== 'string') return false;
      if (!item.name.trim()) return false;
      return true;
    });

    if (cleanedCustomItems.length !== customItems.length) {
      console.log('🧹 Cleaned up invalid custom items');
      setCustomItems(cleanedCustomItems);
    }
  }, [customItems]);

  // ✅ FIX: CONFETTI CELEBRATION - Prevent duplicate celebrations and navigation blocking
  useEffect(() => {
    if (isCompleted && !wasCompleted && totalCount > 0 && !completionProcessedRef.current) {
      completionProcessedRef.current = true;
      
      // ✅ FIX: Clear any existing confetti timeouts first
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
      
      triggerConfettiCelebration();
      setWasCompleted(true);

      // Special completion rewards with rate limiting
      const xpAwarded = addXP(50, '🎉 Shopping list completed!', 'shopping_completed');
      if (xpAwarded) {
        toast.success('🎉 Shopping complete! All items checked off!', {
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        });
      }
    } else if (!isCompleted && wasCompleted) {
      setWasCompleted(false);
      completionProcessedRef.current = false;
      
      // ✅ FIX: Clear confetti when no longer completed
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
        confettiTimeoutRef.current = null;
      }
    }
  }, [isCompleted, wasCompleted, totalCount, addXP]);

  // 🎊 CONFETTI FUNCTION: Multiple bursts with different effects - ✅ FIX: Ensure proper cleanup
  const triggerConfettiCelebration = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 }; // ✅ FIX: Lower zIndex

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    // 🎆 BURST 1: Center explosion
    confetti({
      ...defaults,
      particleCount: 150,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#f59e0b']
    });

    // 🎆 BURST 2: Left side
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 100,
        origin: { x: 0.2, y: 0.6 },
        colors: ['#8b5cf6', '#7c3aed', '#a78bfa', '#c4b5fd', '#e0e7ff']
      });
    }, 300);

    // 🎆 BURST 3: Right side
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 100,
        origin: { x: 0.8, y: 0.6 },
        colors: ['#ef4444', '#dc2626', '#f87171', '#fca5a5', '#fecaca']
      });
    }, 600);

    // 🎆 BURST 4: Top shower effect
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.3 },
        colors: ['#06b6d4', '#0891b2', '#67e8f9', '#a5f3fc', '#cffafe'],
        zIndex: 999
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.3 },
        colors: ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#fed7aa'],
        zIndex: 999
      });
    }, 900);

    // 🎆 BURST 5: Continuous smaller bursts
    const interval = setInterval(() => {
      if (Date.now() > animationEnd) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: randomInRange(10, 30),
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: {
          x: randomInRange(0.1, 0.9),
          y: randomInRange(0.3, 0.7)
        },
        colors: ['#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#fbbf24'],
        zIndex: 999
      });
    }, 200);

    // 🎆 FINAL BURST: Grand finale
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 200,
        origin: { x: 0.5, y: 0.3 },
        spread: 100,
        startVelocity: 45,
        colors: ['#10b981', '#059669', '#34d399', '#fbbf24', '#f59e0b', '#8b5cf6', '#ef4444']
      });
    }, 1200);

    // ✅ FIX: Set cleanup timeout and store reference
    confettiTimeoutRef.current = setTimeout(() => {
      console.log('🎊 Confetti celebration completed, navigation should work normally');
      confettiTimeoutRef.current = null;
    }, duration + 500);
  };

  // ✅ FIX: Prevent duplicate XP notifications
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      const item = {
        name: newItem.trim(),
        amount: '1 piece',
        isCustom: true,
        id: Date.now().toString()
      };
      
      setCustomItems(prev => [...prev, item]);
      setNewItem('');
      
      // ✅ FIX: Only award XP once with proper debouncing
      const currentTime = Date.now();
      if (!lastXPAwardRef.current || (currentTime - lastXPAwardRef.current) > 1000) {
        lastXPAwardRef.current = currentTime;
        const xpAwarded = addXP(2, 'Item added to shopping list', 'item_added');
        if (xpAwarded) {
          toast.success('Item added to shopping list!');
        }
      } else {
        // Just show success without XP
        toast.success('Item added to shopping list!');
      }
    }
  };

  const handleRemoveCustomItem = (itemId) => {
    setCustomItems(prev => prev.filter(item => item.id !== itemId));
    setCheckedItems(prev => {
      const updated = new Set(prev);
      updated.delete(itemId);
      return updated;
    });
  };

  // ✅ FIX: Prevent duplicate progress notifications
  const handleToggleItem = (itemKey) => {
    setCheckedItems(prev => {
      const updated = new Set(prev);
      if (updated.has(itemKey)) {
        updated.delete(itemKey);
      } else {
        updated.add(itemKey);
        
        // ✅ FIX: Only one progress XP notification
        const currentTime = Date.now();
        if (!lastXPAwardRef.current || (currentTime - lastXPAwardRef.current) > 500) {
          lastXPAwardRef.current = currentTime;
          const progressXPAwarded = addShoppingProgressXP();
          
          // 🎉 MINI CELEBRATION: Small confetti for individual items (only if progress XP awarded)
          if (progressXPAwarded && Math.random() > 0.7) { // 30% chance for mini celebration
            confetti({
              particleCount: 20,
              spread: 30,
              origin: { x: 0.5, y: 0.7 },
              colors: ['#10b981', '#34d399', '#6ee7b7'],
              zIndex: 999
            });
          }
        }
      }
      return updated;
    });
  };

  const handleClearCompleted = () => {
    const completedCustomItems = validCustomItems.filter(item => checkedItems.has(item.id));
    
    setCustomItems(prev => prev.filter(item => !checkedItems.has(item.id)));
    setCheckedItems(new Set());
    
    if (completedCustomItems.length > 0) {
      const xpAwarded = addXP(5, 'Cleared completed items', 'items_cleared');
      if (xpAwarded) {
        toast.success(`🎉 Cleared ${completedCustomItems.length} completed items`);
        
        // 🎊 SMALL CELEBRATION: For clearing items
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { x: 0.5, y: 0.6 },
          colors: ['#6b7280', '#9ca3af', '#d1d5db'],
          zIndex: 999
        });
      }
    }
  };

  const handleExportList = () => {
    const listText = allItems
      .map(item => `• ${item.name} - ${item.amount}`)
      .join('\n');
    
    navigator.clipboard.writeText(listText).then(() => {
      toast.success('📋 Shopping list copied to clipboard!');
      addXP(5, 'Shopping list exported', 'list_exported');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const handleShareList = () => {
    if (navigator.share) {
      const listText = allItems
        .map(item => `• ${item.name} - ${item.amount}`)
        .join('\n');
      
      navigator.share({
        title: 'My Smart Shopping List',
        text: `Shopping List (${allItems.length} items):\n\n${listText}\n\nGenerated by Meal Plan App 🍳`
      }).then(() => {
        addXP(10, 'Shopping list shared', 'list_shared');
        toast.success('Shopping list shared successfully!');
      });
    } else {
      handleExportList();
    }
  };

  // 📱 XP Cooldown Warning Component
  const XPCooldownWarning = ({ action, children }) => {
    const onCooldown = isActionOnCooldown(action);
    const remainingTime = getCooldownTimeRemaining(action);
    
    if (!onCooldown) return children;
    
    return (
      <div className="relative group">
        {children}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
          ⏰ {formatCooldownTime(remainingTime)} cooldown
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Completion Celebration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className={`${isCompleted 
            ? 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-500' 
            : 'bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500'
          } rounded-3xl p-8 text-white shadow-2xl glow-effect transition-all duration-1000`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-3 flex items-center">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                      className="mr-4"
                    >
                      <SafeIcon icon={FiAward} className="text-3xl" />
                    </motion.div>
                  ) : (
                    <SafeIcon icon={FiShoppingCart} className="mr-4 text-3xl" />
                  )}
                  {isCompleted ? 'Shopping Complete! 🎉' : 'Smart Shopping List'}
                </h1>
                <p className={`text-lg font-medium ${isCompleted ? 'text-green-100' : 'text-primary-100'}`}>
                  {isCompleted 
                    ? 'Congratulations! All items have been checked off!' 
                    : 'Organized by grocery store aisles - earn XP every 10 items checked!'
                  }
                </p>
              </div>
              
              <div className="hidden md:block text-right">
                <div className="text-4xl font-bold mb-1">
                  {checkedCount}/{totalCount}
                </div>
                <div className={`text-sm font-semibold ${isCompleted ? 'text-green-100' : 'text-primary-100'}`}>
                  Items completed
                </div>
                {isCompleted ? (
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mt-2"
                  >
                    <SafeIcon icon={FiStar} className="text-xl text-yellow-300" />
                  </motion.div>
                ) : (
                  <SafeIcon icon={FiZap} className="text-xl text-yellow-300 mt-2" />
                )}
              </div>
            </div>

            {/* Enhanced Progress Bar with Celebration */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-sm font-medium ${isCompleted ? 'text-green-100' : 'text-primary-100'}`}>
                  Shopping Progress
                </span>
                <span className={`text-sm font-bold ${isCompleted ? 'text-green-100' : 'text-primary-100'}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className={`w-full rounded-full h-3 shadow-inner ${isCompleted ? 'bg-green-400/30' : 'bg-primary-400/30'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`rounded-full h-3 shadow-lg ${isCompleted 
                    ? 'bg-gradient-to-r from-yellow-300 via-green-300 to-emerald-300' 
                    : 'bg-gradient-to-r from-yellow-300 to-white'
                  }`}
                />
              </div>
              {isCompleted && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-green-100 font-bold mt-2"
                >
                  🏆 Perfect Score! You're a shopping champion! 🏆
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Actions & View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Add Custom Item */}
            <form onSubmit={handleAddCustomItem} className="flex-1 flex gap-3">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add custom item..."
                className="flex-1 px-4 py-3 input-modern rounded-xl font-medium text-lg"
              />
              <XPCooldownWarning action="item_added">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors duration-200 flex items-center space-x-2 font-semibold shadow-lg"
                >
                  <SafeIcon icon={FiPlus} />
                  <span>Add</span>
                </motion.button>
              </XPCooldownWarning>
            </form>

            {/* View Toggle & Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('categories')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    viewMode === 'categories' 
                      ? 'bg-white text-primary-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon icon={FiGrid} />
                  <span>Categories</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                    viewMode === 'list' 
                      ? 'bg-white text-primary-600 shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <SafeIcon icon={FiList} />
                  <span>List</span>
                </motion.button>
              </div>

              {/* Action Buttons */}
              <XPCooldownWarning action="items_cleared">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearCompleted}
                  disabled={checkedItems.size === 0}
                  className="px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg"
                >
                  <SafeIcon icon={FiTrash2} />
                  <span>Clear</span>
                </motion.button>
              </XPCooldownWarning>

              <XPCooldownWarning action="list_exported">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportList}
                  className="px-4 py-3 bg-secondary-100 text-secondary-700 rounded-xl hover:bg-secondary-200 transition-colors duration-200 flex items-center space-x-2 font-semibold shadow-lg"
                >
                  <SafeIcon icon={FiDownload} />
                  <span>Export</span>
                </motion.button>
              </XPCooldownWarning>

              <XPCooldownWarning action="list_shared">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShareList}
                  className="px-4 py-3 bg-accent-100 text-accent-700 rounded-xl hover:bg-accent-200 transition-colors duration-200 flex items-center space-x-2 font-semibold shadow-lg"
                >
                  <SafeIcon icon={FiShare2} />
                  <span>Share</span>
                </motion.button>
              </XPCooldownWarning>
            </div>
          </div>
        </motion.div>

        {/* Shopping List Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {allItems.length > 0 ? (
            viewMode === 'categories' ? (
              // 🛒 CATEGORIZED VIEW: Organized by grocery store sections
              Object.entries(categorizedItems()).map(([categoryId, category], categoryIndex) => (
                <motion.div
                  key={categoryId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="glass rounded-2xl shadow-lg overflow-hidden"
                >
                  {/* Category Header */}
                  <div className={`px-6 py-4 bg-gradient-to-r ${category.color} border-b ${category.borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h3 className={`font-bold text-lg ${category.textColor}`}>
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium">
                            {category.description} • {category.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {category.items.filter(item => item.isChecked).length}/{category.items.length}
                        </div>
                        <div className="text-xs text-gray-600 font-semibold">completed</div>
                      </div>
                    </div>
                  </div>

                  {/* Category Items */}
                  <div className="divide-y divide-gray-100">
                    {category.items.map((item, itemIndex) => (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (categoryIndex * 0.1) + (itemIndex * 0.03) }}
                        className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-all duration-200 ${
                          item.isChecked ? 'bg-green-50/80' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleItem(item.key)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                              item.isChecked 
                                ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                                : 'border-gray-300 hover:border-primary-500 hover:shadow-md'
                            }`}
                          >
                            {item.isChecked && <SafeIcon icon={FiCheck} className="text-sm" />}
                          </motion.button>
                          <div className={`${item.isChecked ? 'line-through text-gray-500' : 'text-gray-900'} transition-all duration-200`}>
                            <p className="font-semibold text-lg">{item.name}</p>
                            <p className="text-sm text-gray-600 font-medium">{item.amount}</p>
                          </div>
                        </div>
                        {item.isCustom && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveCustomItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <SafeIcon icon={FiTrash2} className="text-sm" />
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              // 📋 SIMPLE LIST VIEW: Traditional list format
              <div className="glass rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 flex items-center text-lg">
                    <SafeIcon icon={FiList} className="mr-3 text-primary-500" />
                    All Items ({allItems.length} total)
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {allItems.map((item, index) => {
                    const itemKey = item.id || `meal-${item.name}-${index}`;
                    const isChecked = checkedItems.has(itemKey);
                    return (
                      <motion.div
                        key={itemKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-all duration-200 ${
                          isChecked ? 'bg-green-50/80' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleItem(itemKey)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                              isChecked 
                                ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                                : 'border-gray-300 hover:border-primary-500 hover:shadow-md'
                            }`}
                          >
                            {isChecked && <SafeIcon icon={FiCheck} className="text-sm" />}
                          </motion.button>
                          <div className={`${isChecked ? 'line-through text-gray-500' : 'text-gray-900'} transition-all duration-200`}>
                            <p className="font-semibold text-lg">{item.name}</p>
                            <div className="flex items-center space-x-3">
                              <p className="text-sm text-gray-600 font-medium">{item.amount}</p>
                              {/* Category Badge */}
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">
                                {groceryCategories[categorizeItem(item.name)]?.name.replace(/🥕|🥩|🥛|🥫|🧊|🥤|🍿|🛍️/g, '').trim() || 'Other'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {item.isCustom && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemoveCustomItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <SafeIcon icon={FiTrash2} className="text-sm" />
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="glass rounded-2xl p-16 text-center shadow-lg">
              <SafeIcon icon={FiShoppingCart} className="text-6xl text-gray-300 mb-6 mx-auto" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Your shopping list is empty
              </h3>
              <p className="text-gray-600 mb-6 font-medium">
                Plan some meals or add custom items to get started
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNewItem('Add your first item')}
                className="btn-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg"
              >
                Add First Item
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Enhanced Stats with Completion Celebration */}
        {allItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-6"
          >
            <div className={`glass rounded-xl p-6 text-center shadow-lg card-hover ${isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''}`}>
              <div className={`text-3xl font-bold mb-1 ${isCompleted ? 'text-green-600' : 'text-primary-600'}`}>{totalCount}</div>
              <div className="text-sm text-gray-600 font-semibold">Total Items</div>
            </div>
            <div className={`glass rounded-xl p-6 text-center shadow-lg card-hover ${isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''}`}>
              <div className="text-3xl font-bold text-green-600 mb-1 flex items-center justify-center">
                {checkedCount}
                {isCompleted && (
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                    className="ml-1"
                  >
                    🎉
                  </motion.span>
                )}
              </div>
              <div className="text-sm text-gray-600 font-semibold">Completed</div>
            </div>
            <div className={`glass rounded-xl p-6 text-center shadow-lg card-hover ${isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''}`}>
              <div className={`text-3xl font-bold mb-1 ${isCompleted ? 'text-green-600' : 'text-secondary-600'}`}>{mealIngredients.length}</div>
              <div className="text-sm text-gray-600 font-semibold">Meal Ingredients</div>
            </div>
            <div className={`glass rounded-xl p-6 text-center shadow-lg card-hover ${isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''}`}>
              <div className={`text-3xl font-bold mb-1 ${isCompleted ? 'text-green-600' : 'text-accent-600'}`}>{validCustomItems.length}</div>
              <div className="text-sm text-gray-600 font-semibold">Custom Items</div>
            </div>
            <div className={`glass rounded-xl p-6 text-center shadow-lg card-hover ${isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''}`}>
              <div className={`text-3xl font-bold mb-1 ${isCompleted ? 'text-green-600' : 'text-purple-600'}`}>{Object.keys(categorizedItems()).length}</div>
              <div className="text-sm text-gray-600 font-semibold">Active Categories</div>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default ShoppingList;