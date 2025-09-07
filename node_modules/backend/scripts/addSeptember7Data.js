import mongoose from 'mongoose';
import User from '../src/models/User.js';
import IntakeMeal from '../src/models/IntakeMeal.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const addSeptember7Data = async () => {
  try {
    await connectDB();
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    // Create data for September 7, 2025
    const targetDate = new Date('2025-09-07');
    console.log('Adding data for:', targetDate.toISOString().split('T')[0]);
    
    for (const user of users) {
      // Check if data already exists for this date
      const existingData = await IntakeMeal.findOne({
        userId: user._id,
        date: {
          $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
          $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
        }
      });
      
      if (existingData) {
        console.log(`Data already exists for user ${user.email} on ${targetDate.toISOString().split('T')[0]}`);
        continue;
      }
      
      // Calculate daily calorie goal (2000 + random variation)
      const dailyCalorieGoal = 2000 + Math.floor(Math.random() * 400) - 200; // 1800-2200
      
      // Generate random meals for the day
      const meals = [
        {
          name: 'Breakfast Oatmeal',
          calories: 350 + Math.floor(Math.random() * 100),
          protein: 12 + Math.floor(Math.random() * 8),
          carbs: 45 + Math.floor(Math.random() * 15),
          fat: 8 + Math.floor(Math.random() * 5),
          mealType: 'breakfast'
        },
        {
          name: 'Lunch Salad',
          calories: 450 + Math.floor(Math.random() * 150),
          protein: 25 + Math.floor(Math.random() * 10),
          carbs: 35 + Math.floor(Math.random() * 15),
          fat: 15 + Math.floor(Math.random() * 8),
          mealType: 'lunch'
        },
        {
          name: 'Dinner Chicken',
          calories: 600 + Math.floor(Math.random() * 200),
          protein: 40 + Math.floor(Math.random() * 15),
          carbs: 45 + Math.floor(Math.random() * 20),
          fat: 20 + Math.floor(Math.random() * 10),
          mealType: 'dinner'
        },
        {
          name: 'Snack Nuts',
          calories: 200 + Math.floor(Math.random() * 100),
          protein: 8 + Math.floor(Math.random() * 5),
          carbs: 15 + Math.floor(Math.random() * 10),
          fat: 15 + Math.floor(Math.random() * 8),
          mealType: 'snack'
        }
      ];
      
      // Calculate totals
      const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
      const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
      const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
      const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);
      
      // Create intake record
      const intakeData = new IntakeMeal({
        userId: user._id,
        date: targetDate,
        meals: meals,
        totalCalories: totalCalories,
        totalProtein: totalProtein,
        totalCarbs: totalCarbs,
        totalFat: totalFat,
        dailyCalorieGoal: dailyCalorieGoal
      });
      
      await intakeData.save();
      console.log(`Added data for user ${user.email}: ${totalCalories} calories`);
    }
    
    console.log('September 7, 2025 data added successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error adding September 7 data:', error);
    process.exit(1);
  }
};

addSeptember7Data();