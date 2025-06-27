import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

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

  useEffect(() => {
    // Load initial data
    const defaultRecipes = [
      {
        id: '1',
        title: 'Classic Spaghetti Carbonara',
        description: 'Creamy Italian pasta with eggs, cheese, and pancetta',
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500',
        cookTime: 20,
        servings: 4,
        difficulty: 'Medium',
        ingredients: [
          { name: 'Spaghetti', amount: '400g' },
          { name: 'Pancetta', amount: '150g' },
          { name: 'Eggs', amount: '3 large' },
          { name: 'Parmesan cheese', amount: '100g' },
          { name: 'Black pepper', amount: 'to taste' },
          { name: 'Salt', amount: 'to taste' }
        ],
        steps: [
          'Cook spaghetti in salted boiling water until al dente',
          'Fry pancetta until crispy',
          'Beat eggs with grated parmesan and black pepper',
          'Drain pasta, reserving some pasta water',
          'Mix hot pasta with pancetta and egg mixture',
          'Add pasta water if needed for creaminess',
          'Serve immediately with extra parmesan'
        ],
        tags: ['Italian', 'Pasta', 'Quick'],
        author: 'Chef Mario',
        shared: true
      },
      {
        id: '2',
        title: 'Healthy Buddha Bowl',
        description: 'Nutritious bowl with quinoa, vegetables, and tahini dressing',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
        cookTime: 30,
        servings: 2,
        difficulty: 'Easy',
        ingredients: [
          { name: 'Quinoa', amount: '1 cup' },
          { name: 'Sweet potato', amount: '1 large' },
          { name: 'Chickpeas', amount: '1 can' },
          { name: 'Spinach', amount: '2 cups' },
          { name: 'Avocado', amount: '1 ripe' },
          { name: 'Tahini', amount: '3 tbsp' },
          { name: 'Lemon juice', amount: '2 tbsp' }
        ],
        steps: [
          'Cook quinoa according to package instructions',
          'Roast cubed sweet potato at 400°F for 25 minutes',
          'Drain and rinse chickpeas',
          'Make tahini dressing with tahini, lemon, and water',
          'Arrange all ingredients in bowls',
          'Drizzle with dressing and serve'
        ],
        tags: ['Healthy', 'Vegetarian', 'Bowl'],
        author: 'Wellness Chef',
        shared: true
      }
    ];

    const savedRecipesData = JSON.parse(localStorage.getItem('saved_recipes') || '[]');
    const sharedRecipesData = JSON.parse(localStorage.getItem('shared_recipes') || '[]');

    setRecipes(defaultRecipes);
    setSavedRecipes(savedRecipesData);
    setSharedRecipes([...defaultRecipes, ...sharedRecipesData]);
  }, []);

  const addRecipe = (recipe) => {
    const newRecipe = {
      ...recipe,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  };

  const saveRecipe = (recipe) => {
    const updatedSaved = [...savedRecipes, recipe];
    setSavedRecipes(updatedSaved);
    localStorage.setItem('saved_recipes', JSON.stringify(updatedSaved));
  };

  const unsaveRecipe = (recipeId) => {
    const updatedSaved = savedRecipes.filter(r => r.id !== recipeId);
    setSavedRecipes(updatedSaved);
    localStorage.setItem('saved_recipes', JSON.stringify(updatedSaved));
  };

  const shareRecipe = (recipe) => {
    const sharedRecipe = {
      ...recipe,
      shared: true,
      sharedAt: new Date().toISOString()
    };
    
    const updatedShared = [...sharedRecipes, sharedRecipe];
    setSharedRecipes(updatedShared);
    localStorage.setItem('shared_recipes', JSON.stringify(updatedShared));
    
    return sharedRecipe;
  };

  const isRecipeSaved = (recipeId) => {
    return savedRecipes.some(r => r.id === recipeId);
  };

  const value = {
    recipes,
    savedRecipes,
    sharedRecipes,
    addRecipe,
    saveRecipe,
    unsaveRecipe,
    shareRecipe,
    isRecipeSaved
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};