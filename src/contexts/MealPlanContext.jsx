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

  const addMealToDay = (date, mealType, recipe) => {
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    
    setMealPlan(prev => {
      const updatedPlan = {
        ...prev,
        [dateStr]: {
          ...prev[dateStr],
          [mealType]: recipe
        }
      };
      localStorage.setItem('meal_plan', JSON.stringify(updatedPlan));
      return updatedPlan;
    });
  };

  const removeMealFromDay = (date, mealType) => {
    const dateStr = format(new Date(date), 'yyyy-MM-dd');
    
    setMealPlan(prev => {
      const updatedPlan = { ...prev };
      if (updatedPlan[dateStr]) {
        delete updatedPlan[dateStr][mealType];
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

  const getAllIngredients = () => {
    const ingredients = {};
    
    Object.values(mealPlan).forEach(dayMeals => {
      Object.values(dayMeals).forEach(recipe => {
        if (recipe && recipe.ingredients) {
          recipe.ingredients.forEach(ingredient => {
            const key = ingredient.name.toLowerCase();
            if (ingredients[key]) {
              // Simple addition - in a real app, you'd want to handle unit conversions
              ingredients[key] = {
                name: ingredient.name,
                amount: `${ingredients[key].amount} + ${ingredient.amount}`
              };
            } else {
              ingredients[key] = { ...ingredient };
            }
          });
        }
      });
    });
    
    return Object.values(ingredients);
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