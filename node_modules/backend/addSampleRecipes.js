import jwt from 'jsonwebtoken';

// Generate admin token
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const adminToken = jwt.sign(
  { userId: 'admin', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const sampleRecipes = [
  {
    name: "Grilled Chicken Salad",
    description: "A healthy and delicious grilled chicken salad with mixed greens",
    calories: 350,
    ingredients: [
      { name: "Chicken breast", quantity: 150, unit: "g" },
      { name: "Mixed greens", quantity: 100, unit: "g" },
      { name: "Cherry tomatoes", quantity: 50, unit: "g" },
      { name: "Cucumber", quantity: 50, unit: "g" },
      { name: "Olive oil", quantity: 1, unit: "tbsp" }
    ],
    instructions: [
      { step: 1, description: "Season chicken breast with salt and pepper" },
      { step: 2, description: "Grill chicken for 6-8 minutes per side" },
      { step: 3, description: "Let chicken rest for 5 minutes, then slice" },
      { step: 4, description: "Combine mixed greens, tomatoes, and cucumber" },
      { step: 5, description: "Top with sliced chicken and drizzle with olive oil" }
    ],
    difficulty: "easy",
    dietType: "normal",
    prepTime: 15,
    cookTime: 15,
    servings: 1,
    tags: ["healthy", "protein", "low-carb"]
  },
  {
    name: "Vegetarian Pasta",
    description: "Delicious pasta with fresh vegetables and herbs",
    calories: 450,
    ingredients: [
      { name: "Pasta", quantity: 100, unit: "g" },
      { name: "Bell peppers", quantity: 80, unit: "g" },
      { name: "Zucchini", quantity: 80, unit: "g" },
      { name: "Tomatoes", quantity: 100, unit: "g" },
      { name: "Garlic", quantity: 2, unit: "piece" },
      { name: "Olive oil", quantity: 2, unit: "tbsp" }
    ],
    instructions: [
      { step: 1, description: "Cook pasta according to package instructions" },
      { step: 2, description: "Heat olive oil in a large pan" },
      { step: 3, description: "Sauté garlic until fragrant" },
      { step: 4, description: "Add vegetables and cook until tender" },
      { step: 5, description: "Toss with cooked pasta and serve" }
    ],
    difficulty: "easy",
    dietType: "vegetarian",
    prepTime: 10,
    cookTime: 20,
    servings: 2,
    tags: ["vegetarian", "pasta", "quick"]
  },
  {
    name: "Salmon with Quinoa",
    description: "Baked salmon served with fluffy quinoa and steamed vegetables",
    calories: 520,
    ingredients: [
      { name: "Salmon fillet", quantity: 150, unit: "g" },
      { name: "Quinoa", quantity: 80, unit: "g" },
      { name: "Broccoli", quantity: 100, unit: "g" },
      { name: "Lemon", quantity: 1, unit: "piece" },
      { name: "Olive oil", quantity: 1, unit: "tbsp" }
    ],
    instructions: [
      { step: 1, description: "Preheat oven to 200°C" },
      { step: 2, description: "Season salmon with salt, pepper, and lemon" },
      { step: 3, description: "Bake salmon for 12-15 minutes" },
      { step: 4, description: "Cook quinoa according to package instructions" },
      { step: 5, description: "Steam broccoli until tender" },
      { step: 6, description: "Serve salmon over quinoa with broccoli" }
    ],
    difficulty: "medium",
    dietType: "normal",
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    tags: ["healthy", "protein", "omega-3"]
  }
];

async function addSampleRecipes() {
  console.log('Adding sample recipes...');
  
  for (const recipe of sampleRecipes) {
    try {
      const response = await fetch('http://localhost:5001/api/meals/admin/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recipe)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✓ Added recipe: ${recipe.name}`);
      } else {
        console.error(`✗ Failed to add recipe: ${recipe.name}`, result.message);
      }
    } catch (error) {
      console.error(`✗ Error adding recipe: ${recipe.name}`, error.message);
    }
  }
  
  console.log('Sample recipes addition completed!');
}

addSampleRecipes();