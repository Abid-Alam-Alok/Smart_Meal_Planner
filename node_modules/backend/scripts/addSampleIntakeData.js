import mongoose from 'mongoose';
import IntakeMeal from '../src/models/IntakeMeal.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample meal data for different meal types
const sampleMeals = {
  breakfast: [
    { name: 'Oatmeal with Berries', calories: 320, quantity: 1, unit: 'bowl' },
    { name: 'Greek Yogurt with Honey', calories: 180, quantity: 1, unit: 'cup' },
    { name: 'Scrambled Eggs', calories: 220, quantity: 2, unit: 'eggs' },
    { name: 'Whole Wheat Toast', calories: 140, quantity: 2, unit: 'slices' },
    { name: 'Banana', calories: 105, quantity: 1, unit: 'piece' },
    { name: 'Coffee with Milk', calories: 50, quantity: 1, unit: 'cup' }
  ],
  lunch: [
    { name: 'Grilled Chicken Salad', calories: 380, quantity: 1, unit: 'serving' },
    { name: 'Quinoa Bowl', calories: 420, quantity: 1, unit: 'bowl' },
    { name: 'Turkey Sandwich', calories: 350, quantity: 1, unit: 'sandwich' },
    { name: 'Vegetable Soup', calories: 180, quantity: 1, unit: 'cup' },
    { name: 'Brown Rice', calories: 220, quantity: 1, unit: 'cup' },
    { name: 'Steamed Broccoli', calories: 55, quantity: 1, unit: 'cup' }
  ],
  dinner: [
    { name: 'Grilled Salmon', calories: 450, quantity: 1, unit: 'fillet' },
    { name: 'Baked Sweet Potato', calories: 180, quantity: 1, unit: 'medium' },
    { name: 'Chicken Stir Fry', calories: 380, quantity: 1, unit: 'serving' },
    { name: 'Pasta with Marinara', calories: 420, quantity: 1, unit: 'cup' },
    { name: 'Lean Beef', calories: 350, quantity: 4, unit: 'oz' },
    { name: 'Green Beans', calories: 70, quantity: 1, unit: 'cup' }
  ],
  snack: [
    { name: 'Apple with Peanut Butter', calories: 190, quantity: 1, unit: 'serving' },
    { name: 'Mixed Nuts', calories: 170, quantity: 1, unit: 'oz' },
    { name: 'Protein Bar', calories: 200, quantity: 1, unit: 'bar' },
    { name: 'Carrot Sticks', calories: 25, quantity: 10, unit: 'sticks' },
    { name: 'Greek Yogurt', calories: 130, quantity: 1, unit: 'cup' },
    { name: 'Dark Chocolate', calories: 150, quantity: 1, unit: 'oz' }
  ]
};

// Function to get random meals for a meal type
const getRandomMeals = (mealType, count = 1) => {
  const meals = sampleMeals[mealType];
  const selectedMeals = [];
  
  for (let i = 0; i < count; i++) {
    const randomMeal = meals[Math.floor(Math.random() * meals.length)];
    selectedMeals.push({
      ...randomMeal,
      mealType,
      timeConsumed: new Date()
    });
  }
  
  return selectedMeals;
};

// Function to generate realistic daily intake
const generateDailyIntake = (userId, date, targetCalories = 2000) => {
  const meals = [];
  
  // Breakfast (20-25% of daily calories)
  const breakfastCalories = Math.floor(targetCalories * 0.225);
  let currentCalories = 0;
  
  // Add 1-2 breakfast items
  const breakfastItems = getRandomMeals('breakfast', Math.random() > 0.5 ? 2 : 1);
  breakfastItems.forEach(meal => {
    if (currentCalories + meal.calories <= breakfastCalories + 100) {
      meals.push(meal);
      currentCalories += meal.calories;
    }
  });
  
  // Lunch (30-35% of daily calories)
  const lunchCalories = Math.floor(targetCalories * 0.325);
  currentCalories = 0;
  
  // Add 1-3 lunch items
  const lunchItems = getRandomMeals('lunch', Math.floor(Math.random() * 3) + 1);
  lunchItems.forEach(meal => {
    if (currentCalories + meal.calories <= lunchCalories + 150) {
      meals.push(meal);
      currentCalories += meal.calories;
    }
  });
  
  // Dinner (30-35% of daily calories)
  const dinnerCalories = Math.floor(targetCalories * 0.325);
  currentCalories = 0;
  
  // Add 1-3 dinner items
  const dinnerItems = getRandomMeals('dinner', Math.floor(Math.random() * 3) + 1);
  dinnerItems.forEach(meal => {
    if (currentCalories + meal.calories <= dinnerCalories + 150) {
      meals.push(meal);
      currentCalories += meal.calories;
    }
  });
  
  // Snacks (10-15% of daily calories)
  const snackCalories = Math.floor(targetCalories * 0.125);
  currentCalories = 0;
  
  // Add 0-2 snacks
  const snackCount = Math.floor(Math.random() * 3);
  if (snackCount > 0) {
    const snackItems = getRandomMeals('snack', snackCount);
    snackItems.forEach(meal => {
      if (currentCalories + meal.calories <= snackCalories + 100) {
        meals.push(meal);
        currentCalories += meal.calories;
      }
    });
  }
  
  return {
    userId,
    date,
    meals,
    dailyCalorieGoal: targetCalories,
    notes: Math.random() > 0.7 ? 'Had a great day with balanced meals!' : ''
  };
};

// Main function to add sample data
const addSampleIntakeData = async () => {
  try {
    await connectDB();
    
    // Find a user to add data for (you can modify this to use a specific user)
    const users = await User.find().limit(5);
    
    if (users.length === 0) {
      console.log('No users found. Please create a user first.');
      return;
    }
    
    console.log(`Found ${users.length} users. Adding sample data...`);
    
    // Generate data for the last 30 days for each user
    const promises = [];
    
    for (const user of users) {
      console.log(`Adding data for user: ${user.name} (${user.email})`);
      
      for (let i = 1; i <= 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        // Skip some days randomly to make it more realistic
        if (Math.random() > 0.85) continue;
        
        // Vary calorie goals slightly
        const baseGoal = user.primaryGoal === 'lose-weight' ? 1800 : 
                        user.primaryGoal === 'gain-muscle' ? 2400 : 2000;
        const targetCalories = baseGoal + Math.floor(Math.random() * 400) - 200;
        
        const intakeData = generateDailyIntake(user._id, date, targetCalories);
        
        // Check if intake already exists for this date
        const existingIntake = await IntakeMeal.findOne({
          userId: user._id,
          date: date
        });
        
        if (!existingIntake) {
          promises.push(IntakeMeal.create(intakeData));
        }
      }
    }
    
    const results = await Promise.all(promises);
    console.log(`Successfully added ${results.length} intake records!`);
    
    // Display summary
    for (const user of users) {
      const userIntakes = await IntakeMeal.find({ userId: user._id }).sort({ date: -1 });
      console.log(`\n${user.name}: ${userIntakes.length} days of data`);
      
      if (userIntakes.length > 0) {
        const avgCalories = Math.round(
          userIntakes.reduce((sum, intake) => sum + intake.totalCalories, 0) / userIntakes.length
        );
        console.log(`  Average daily calories: ${avgCalories}`);
        console.log(`  Date range: ${userIntakes[userIntakes.length - 1].date.toDateString()} to ${userIntakes[0].date.toDateString()}`);
      }
    }
    
  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
addSampleIntakeData();