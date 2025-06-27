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
  const [userSharedRecipes, setUserSharedRecipes] = useState(new Set());

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
        shared: true,
        shareId: 'carbonara-classic'
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
        shared: true,
        shareId: 'buddha-bowl-healthy'
      }
    ];

    const savedRecipesData = JSON.parse(localStorage.getItem('saved_recipes') || '[]');
    const sharedRecipesData = JSON.parse(localStorage.getItem('shared_recipes') || '[]');
    const userSharedData = new Set(JSON.parse(localStorage.getItem('user_shared_recipes') || '[]'));

    setRecipes(defaultRecipes);
    setSavedRecipes(savedRecipesData);
    setSharedRecipes([...defaultRecipes, ...sharedRecipesData]);
    setUserSharedRecipes(userSharedData);
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
    // Check if user has already shared this recipe
    if (userSharedRecipes.has(recipe.id)) {
      return { success: false, message: 'You have already shared this recipe to the community' };
    }

    const shareId = `${recipe.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const sharedRecipe = {
      ...recipe,
      shared: true,
      sharedAt: new Date().toISOString(),
      shareId
    };
    
    const updatedShared = [...sharedRecipes, sharedRecipe];
    const updatedUserShared = new Set([...userSharedRecipes, recipe.id]);
    
    setSharedRecipes(updatedShared);
    setUserSharedRecipes(updatedUserShared);
    
    localStorage.setItem('shared_recipes', JSON.stringify(updatedShared.filter(r => !r.author)));
    localStorage.setItem('user_shared_recipes', JSON.stringify([...updatedUserShared]));
    
    return { success: true, shareId, message: 'Recipe shared successfully!' };
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
      author: recipe.author || 'Community Chef'
    };
    
    const encodedData = encodeURIComponent(JSON.stringify(shareData));
    return `${baseUrl}/?recipe=${encodedData}`;
  };

  const saveSharedRecipe = (recipeData) => {
    try {
      const recipe = JSON.parse(decodeURIComponent(recipeData));
      const existingRecipe = savedRecipes.find(r => r.title === recipe.title);
      
      if (existingRecipe) {
        return { success: false, message: 'Recipe already in your collection' };
      }
      
      const newRecipe = {
        ...recipe,
        id: uuidv4(),
        savedFromShare: true,
        savedAt: new Date().toISOString()
      };
      
      saveRecipe(newRecipe);
      return { success: true, message: 'Recipe saved to your collection!' };
    } catch (error) {
      return { success: false, message: 'Invalid recipe data' };
    }
  };

  const emailShareRecipe = (recipe) => {
    const shareLink = generateShareableLink(recipe);
    const subject = `Check out this recipe: ${recipe.title}`;
    const body = `Hi! I found this amazing recipe and thought you'd love it:

${recipe.title}
${recipe.description}

Cook Time: ${recipe.cookTime} minutes
Servings: ${recipe.servings}

Click here to view and save the recipe: ${shareLink}

Happy cooking! 🍳`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    
    return shareLink;
  };

  const isRecipeSaved = (recipeId) => {
    return savedRecipes.some(r => r.id === recipeId);
  };

  const hasSharedRecipe = (recipeId) => {
    return userSharedRecipes.has(recipeId);
  };

  const value = {
    recipes,
    savedRecipes,
    sharedRecipes,
    addRecipe,
    saveRecipe,
    unsaveRecipe,
    shareRecipe,
    emailShareRecipe,
    saveSharedRecipe,
    isRecipeSaved,
    hasSharedRecipe
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};