import mongoose from 'mongoose';
import IntakeMeal from '../src/models/IntakeMeal.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_meal_planner');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const sampleMeals = {
  breakfast: [
    { name: 'Oatmeal with Berries', calories: 320, quantity: 1, unit: 'bowl' },
    { name: 'Greek Yogurt with Honey', calories: 180, quantity: 1, unit: 'cup' },
    { name: 'Scrambled Eggs', calories: 220, quantity: 2, unit: 'eggs' }
  ],
  lunch: [
    { name: 'Grilled Chicken Salad', calories: 380, quantity: 1, unit: 'serving' },
    { name: 'Quinoa Bowl', calories: 420, quantity: 1, unit: 'bowl' },
    { name: 'Turkey Sandwich', calories: 350, quantity: 1, unit: 'sandwich' }
  ],
  dinner: [
    { name: 'Grilled Salmon', calories: 450, quantity: 1, unit: 'fillet' },
    { name: 'Chicken Stir Fry', calories: 380, quantity: 1, unit: 'serving' },
    { name: 'Pasta with Marinara', calories: 420, quantity: 1, unit: 'cup' }
  ],
  snack: [
    { name: 'Apple with Peanut Butter', calories: 190, quantity: 1, unit: 'serving' },
    { name: 'Mixed Nuts', calories: 170, quantity: 1, unit: 'oz' },
    { name: 'Protein Bar', calories: 200, quantity: 1, unit: 'bar' }
  ]
};

const getRandomMeals = (mealType, count = 1) => {
  const meals = sampleMeals[mealType];
  const selected = [];
  for (let i = 0; i < count; i++) {
    const randomMeal = meals[Math.floor(Math.random() * meals.length)];
    selected.push({
      ...randomMeal,
      mealType,
      timestamp: new Date()
    });
  }
  return selected;
};

const generateDailyIntake = (userId, date, targetCalories = 2000) => {
  const meals = [
    ...getRandomMeals('breakfast', 2),
    ...getRandomMeals('lunch', 2),
    ...getRandomMeals('dinner', 2),
    ...getRandomMeals('snack', 1)
  ];

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  
  return {
    userId,
    date,
    meals,
    totalCalories,
    dailyCalorieGoal: 2000
  };
};

const addSeptember2025Data = async () => {
  try {
    await connectDB();
    
    const users = await User.find().limit(1);
    
    if (users.length === 0) {
      console.log('No users found. Please create a user first.');
      return;
    }
    
    const user = users[0];
    console.log(`Adding September 2025 data for user: ${user.name} (${user.email})`);
    
    // Generate data for September 1-6, 2025
    for (let day = 1; day <= 6; day++) {
      const date = new Date(2025, 8, day); // Month is 0-indexed, so 8 = September
      date.setHours(0, 0, 0, 0);
      
      // Check if intake already exists for this date
      const existingIntake = await IntakeMeal.findOne({
        userId: user._id,
        date: date
      });
      
      if (!existingIntake) {
        const targetCalories = 1800 + Math.floor(Math.random() * 400); // 1800-2200 calories
        const intakeData = generateDailyIntake(user._id, date, targetCalories);
        
        const intake = new IntakeMeal(intakeData);
        await intake.save();
        
        console.log(`Added data for September ${day}, 2025: ${intakeData.totalCalories} calories`);
      } else {
        console.log(`Data already exists for September ${day}, 2025`);
      }
    }
    
    console.log('September 2025 sample data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample data:', error);
    process.exit(1);
  }
};

addSeptember2025Data();