import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, isAfter, startOfDay } from 'date-fns';

const MealPlanContext = createContext();

export const useMealPlan = () => {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
};

// Utility function to parse ingredient amounts and convert to common units
const parseIngredientAmount = (amount) => {
  if (!amount || typeof amount !== 'string') return { value: 1, unit: 'piece', original: amount || '1 piece' };

  const cleanAmount = amount.toLowerCase().trim();

  // Extract number from the beginning
  const numberMatch = cleanAmount.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)/);
  let value = 1;
  if (numberMatch) {
    const numStr = numberMatch[1];
    if (numStr.includes('/')) {
      const [num, den] = numStr.split('/');
      value = parseFloat(num) / parseFloat(den);
    } else {
      value = parseFloat(numStr);
    }
  }

  // Common unit mappings
  const unitMappings = {
    // Weight
    'g': 'g', 'gram': 'g', 'grams': 'g',
    'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
    'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
    'lb': 'lb', 'pound': 'lb', 'pounds': 'lb',
    // Volume
    'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml',
    'l': 'l', 'liter': 'l', 'liters': 'l',
    'cup': 'cup', 'cups': 'cup',
    'tbsp': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
    'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp',
    'fl oz': 'fl oz', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz',
    // Count
    'piece': 'piece', 'pieces': 'piece',
    'item': 'piece', 'items': 'piece',
    'large': 'piece', 'medium': 'piece', 'small': 'piece',
    'can': 'can', 'cans': 'can',
    'package': 'package', 'packages': 'package',
    'bunch': 'bunch', 'bunches': 'bunch',
    'clove': 'clove', 'cloves': 'clove',
    'head': 'head', 'heads': 'head',
  };

  // Find unit in the string
  let unit = 'piece';
  for (const [key, standardUnit] of Object.entries(unitMappings)) {
    if (cleanAmount.includes(key)) {
      unit = standardUnit;
      break;
    }
  }

  // Handle special cases
  if (cleanAmount.includes('to taste') || cleanAmount.includes('as needed')) {
    return { value: 0, unit: 'to taste', original: amount };
  }

  return { value, unit, original: amount };
};

// ✅ ENHANCED: Function to validate ingredient data
const isValidIngredient = (ingredient) => {
  if (!ingredient) return false;
  if (!ingredient.name || typeof ingredient.name !== 'string') return false;
  if (!ingredient.name.trim()) return false;
  if (ingredient.name.trim().length === 0) return false;
  
  // Additional checks for meaningful ingredients
  const name = ingredient.name.trim().toLowerCase();
  
  // Skip obviously invalid entries
  if (name === '' || name === ' ' || name === 'undefined' || name === 'null') {
    return false;
  }
  
  return true;
};

// ✅ ENHANCED: Function to validate and clean ingredient
const cleanIngredient = (ingredient) => {
  if (!isValidIngredient(ingredient)) return null;
  
  return {
    ...ingredient,
    name: ingredient.name.trim(),
    amount: ingredient.amount && typeof ingredient.amount === 'string' 
      ? ingredient.amount.trim() 
      : ingredient.amount || '1 piece'
  };
};

// Function to combine ingredients with the same name and compatible units
const combineIngredients = (ingredients) => {
  // ✅ FIRST: Filter out all invalid ingredients
  const validIngredients = ingredients
    .map(cleanIngredient)
    .filter(ingredient => ingredient !== null);

  if (validIngredients.length === 0) {
    return [];
  }

  const grouped = {};

  validIngredients.forEach(ingredient => {
    const key = ingredient.name.toLowerCase().trim();
    const parsed = parseIngredientAmount(ingredient.amount);

    if (!grouped[key]) {
      grouped[key] = {
        name: ingredient.name,
        amounts: [],
        totalValue: 0,
        primaryUnit: parsed.unit,
        hasIncompatibleUnits: false
      };
    }

    grouped[key].amounts.push(parsed);

    // Check if units are compatible for addition
    if (parsed.unit === grouped[key].primaryUnit || parsed.unit === 'to taste') {
      if (parsed.unit !== 'to taste') {
        grouped[key].totalValue += parsed.value;
      }
    } else {
      grouped[key].hasIncompatibleUnits = true;
    }
  });

  // Convert back to ingredient format
  return Object.values(grouped).map(item => {
    if (item.hasIncompatibleUnits || item.amounts.length === 1) {
      // If units are incompatible or only one amount, show all amounts
      const amountStr = item.amounts.map(a => a.original).join(' + ');
      return {
        name: item.name,
        amount: amountStr
      };
    } else {
      // If units are compatible, show combined amount
      const hasToTaste = item.amounts.some(a => a.unit === 'to taste');
      let combinedAmount = '';

      if (item.totalValue > 0) {
        combinedAmount = `${item.totalValue}${item.primaryUnit === 'piece' ? '' : ' ' + item.primaryUnit}`;
      }

      if (hasToTaste) {
        combinedAmount += combinedAmount ? ' + to taste' : 'to taste';
      }

      return {
        name: item.name,
        amount: combinedAmount || '1 piece'
      };
    }
  });
};

export const MealPlanProvider = ({ children }) => {
  const [mealPlan, setMealPlan] = useState({});

  useEffect(() => {
    // Load meal plan from localStorage
    const savedMealPlan = JSON.parse(localStorage.getItem('meal_plan') || '{}');

    // Remove past dates
    const today = startOfDay(new Date());
    const filteredMealPlan = {};

    Object.keys(savedMealPlan).forEach(date => {
      if (isAfter(new Date(date), today) || format(today, 'yyyy-MM-dd') === date) {
        filteredMealPlan[date] = savedMealPlan[date];
      }
    });

    setMealPlan(filteredMealPlan);
    localStorage.setItem('meal_plan', JSON.stringify(filteredMealPlan));
  }, []);

  const addMealToDay = (date, mealType, recipe, snackIndex = null) => {
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    setMealPlan(prev => {
      const updatedPlan = { ...prev };

      if (!updatedPlan[dateStr]) {
        updatedPlan[dateStr] = {};
      }

      if (mealType === 'snacks') {
        // Handle snacks as an array
        if (!updatedPlan[dateStr].snacks) {
          updatedPlan[dateStr].snacks = [];
        }
        if (snackIndex !== null) {
          // Replace specific snack
          updatedPlan[dateStr].snacks[snackIndex] = recipe;
        } else {
          // Add new snack
          updatedPlan[dateStr].snacks.push(recipe);
        }
      } else {
        // Handle regular meals (breakfast, lunch, dinner)
        updatedPlan[dateStr][mealType] = recipe;
      }

      localStorage.setItem('meal_plan', JSON.stringify(updatedPlan));
      return updatedPlan;
    });
  };

  const removeMealFromDay = (date, mealType, snackIndex = null) => {
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    setMealPlan(prev => {
      const updatedPlan = { ...prev };

      if (updatedPlan[dateStr]) {
        if (mealType === 'snacks' && snackIndex !== null) {
          // Remove specific snack
          if (updatedPlan[dateStr].snacks) {
            updatedPlan[dateStr].snacks.splice(snackIndex, 1);
            // Clean up empty snacks array
            if (updatedPlan[dateStr].snacks.length === 0) {
              delete updatedPlan[dateStr].snacks;
            }
          }
        } else {
          // Remove regular meal or all snacks
          delete updatedPlan[dateStr][mealType];
        }

        // Clean up empty date
        if (Object.keys(updatedPlan[dateStr]).length === 0) {
          delete updatedPlan[dateStr];
        }
      }

      localStorage.setItem('meal_plan', JSON.stringify(updatedPlan));
      return updatedPlan;
    });
  };

  const getMealsForDay = (date) => {
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    return mealPlan[dateStr] || {};
  };

  // ✅ ENHANCED: Get all ingredients with proper validation and filtering
  const getAllIngredients = () => {
    const allIngredients = [];

    // Collect all ingredients from all planned meals
    Object.values(mealPlan).forEach(dayMeals => {
      // Handle regular meals
      ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
        const meal = dayMeals[mealType];
        if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
          // ✅ FILTER: Only add valid ingredients
          const validMealIngredients = meal.ingredients.filter(isValidIngredient);
          allIngredients.push(...validMealIngredients);
        }
      });

      // Handle snacks array
      if (dayMeals.snacks && Array.isArray(dayMeals.snacks)) {
        dayMeals.snacks.forEach(snack => {
          if (snack && snack.ingredients && Array.isArray(snack.ingredients)) {
            // ✅ FILTER: Only add valid ingredients
            const validSnackIngredients = snack.ingredients.filter(isValidIngredient);
            allIngredients.push(...validSnackIngredients);
          }
        });
      }
    });

    // ✅ FINAL FILTER: Remove any ingredients that somehow made it through
    const filteredIngredients = allIngredients.filter(isValidIngredient);

    // Combine ingredients intelligently
    return combineIngredients(filteredIngredients);
  };

  const value = {
    mealPlan,
    addMealToDay,
    removeMealFromDay,
    getMealsForDay,
    getAllIngredients
  };

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
};