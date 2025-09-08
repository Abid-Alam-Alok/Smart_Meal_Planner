import dotenv from 'dotenv';
import mongoose from 'mongoose';
import IntakeMeal from '../src/models/IntakeMeal.js';
import User from '../src/models/User.js';

// Load environment variables
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

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

const sampleMeals = {
  breakfast: [
    { name: 'Oatmeal with Berries', calories: 320 },
    { name: 'Greek Yogurt with Granola', calories: 280 },
    { name: 'Scrambled Eggs with Toast', calories: 350 },
    { name: 'Smoothie Bowl', calories: 290 },
    { name: 'Avocado Toast', calories: 310 },
    { name: 'Pancakes with Syrup', calories: 420 },
    { name: 'Cereal with Milk', calories: 250 },
    { name: 'Bagel with Cream Cheese', calories: 380 },
    { name: 'French Toast', calories: 400 },
    { name: 'Protein Smoothie', calories: 300 }
  ],
  lunch: [
    { name: 'Grilled Chicken Salad', calories: 450 },
    { name: 'Turkey Sandwich', calories: 520 },
    { name: 'Quinoa Bowl', calories: 480 },
    { name: 'Pasta with Marinara', calories: 550 },
    { name: 'Sushi Roll Set', calories: 420 },
    { name: 'Chicken Caesar Wrap', calories: 490 },
    { name: 'Vegetable Stir Fry', calories: 380 },
    { name: 'Fish Tacos', calories: 460 },
    { name: 'Buddha Bowl', calories: 500 },
    { name: 'Chicken Burrito', calories: 580 }
  ],
  dinner: [
    { name: 'Grilled Salmon with Rice', calories: 580 },
    { name: 'Beef Stir Fry', calories: 620 },
    { name: 'Chicken Curry with Naan', calories: 650 },
    { name: 'Pork Chops with Vegetables', calories: 590 },
    { name: 'Vegetarian Pizza', calories: 520 },
    { name: 'Lamb with Couscous', calories: 680 },
    { name: 'Shrimp Pasta', calories: 560 },
    { name: 'Turkey Meatballs with Pasta', calories: 610 },
    { name: 'Grilled Chicken with Sweet Potato', calories: 540 },
    { name: 'Fish and Chips', calories: 720 }
  ],
  snack: [
    { name: 'Apple with Peanut Butter', calories: 180 },
    { name: 'Mixed Nuts', calories: 160 },
    { name: 'Protein Bar', calories: 200 },
    { name: 'Greek Yogurt', calories: 120 },
    { name: 'Banana', calories: 105 },
    { name: 'Crackers with Cheese', calories: 150 },
    { name: 'Trail Mix', calories: 170 },
    { name: 'Granola Bar', calories: 140 },
    { name: 'Hummus with Carrots', calories: 130 },
    { name: 'Dark Chocolate', calories: 110 }
  ]
};

const getRandomMeal = (mealType) => {
  const meals = sampleMeals[mealType];
  return meals[Math.floor(Math.random() * meals.length)];
};

const generateDailyIntake = (userId, date, calorieGoal) => {
  const meals = [];
  let totalCalories = 0;
  
  // Determine how many meals to have (2-4 meals per day)
  const numMeals = Math.floor(Math.random() * 3) + 2;
  const selectedMealTypes = [];
  
  // Always include breakfast and lunch
  selectedMealTypes.push('breakfast', 'lunch');
  
  // Randomly add dinner and/or snack
  if (numMeals >= 3) selectedMealTypes.push('dinner');
  if (numMeals === 4) selectedMealTypes.push('snack');
  
  // Generate meals with realistic times
  selectedMealTypes.forEach((mealType, index) => {
    const meal = getRandomMeal(mealType);
    // Add some variation to calories (±20%)
    const calorieVariation = 0.8 + (Math.random() * 0.4);
    const adjustedCalories = Math.round(meal.calories * calorieVariation);
    
    // Set realistic times for each meal
    let mealTime = new Date(date);
    switch (mealType) {
      case 'breakfast':
        mealTime.setHours(7 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60)); // 7-9 AM
        break;
      case 'lunch':
        mealTime.setHours(12 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60)); // 12-1 PM
        break;
      case 'dinner':
        mealTime.setHours(18 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60)); // 6-8 PM
        break;
      case 'snack':
        mealTime.setHours(15 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60)); // 3-5 PM
        break;
    }
    
    meals.push({
      name: meal.name,
      calories: adjustedCalories,
      quantity: 1,
      unit: 'serving',
      mealType: mealType,
      timeConsumed: mealTime
    });
    
    totalCalories += adjustedCalories;
  });
  
  return {
    userId: userId,
    date: new Date(date.getFullYear(), date.getMonth(), date.getDate()), // Set to midnight
    meals: meals,
    totalCalories: totalCalories,
    dailyCalorieGoal: calorieGoal,
    notes: Math.random() > 0.7 ? 'Great day with balanced meals!' : '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

const addMealsForAUser = async () => {
  try {
    await connectDB();
    
    // Find the specific user with email a@gmail.com
    const user = await User.findOne({ email: 'a@gmail.com' });
    if (!user) {
      console.log('User with email a@gmail.com not found');
      return;
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Set calorie goal based on user's primary goal
    let calorieGoal;
    switch (user.primaryGoal) {
      case 'lose-weight':
        calorieGoal = 1800;
        break;
      case 'gain-muscle':
        calorieGoal = 2500;
        break;
      case 'maintain-fitness':
      default:
        calorieGoal = 2200;
        break;
    }
    
    console.log(`Calorie goal for ${user.primaryGoal}: ${calorieGoal}`);
    
    // Generate data for the last 45 days (more historical data)
    const intakeRecords = [];
    const today = new Date();
    
    for (let i = 44; i >= 1; i--) { // Start from 44 days ago, stop at yesterday
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Check if data already exists for this date
      const existingIntake = await IntakeMeal.findOne({
        userId: user._id,
        date: {
          $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      });
      
      if (existingIntake) {
        console.log(`Data already exists for ${date.toDateString()}, skipping`);
        continue;
      }
      
      // Skip some days randomly (about 15% chance) to make it more realistic
      if (Math.random() < 0.15) {
        console.log(`Randomly skipping ${date.toDateString()}`);
        continue;
      }
      
      const dailyIntake = generateDailyIntake(user._id, date, calorieGoal);
      intakeRecords.push(dailyIntake);
      
      console.log(`Generated data for ${date.toDateString()}: ${dailyIntake.totalCalories} calories, ${dailyIntake.meals.length} meals`);
    }
    
    // Insert all records
    if (intakeRecords.length > 0) {
      await IntakeMeal.insertMany(intakeRecords);
      console.log(`\n✅ Successfully added ${intakeRecords.length} intake records for user ${user.name} (${user.email})`);
      
      // Calculate some stats
      const totalCalories = intakeRecords.reduce((sum, record) => sum + record.totalCalories, 0);
      const avgCalories = Math.round(totalCalories / intakeRecords.length);
      const totalMeals = intakeRecords.reduce((sum, record) => sum + record.meals.length, 0);
      
      console.log(`📊 Stats:`);
      console.log(`   - Total days with data: ${intakeRecords.length}`);
      console.log(`   - Total calories logged: ${totalCalories}`);
      console.log(`   - Average calories per day: ${avgCalories}`);
      console.log(`   - Total meals logged: ${totalMeals}`);
      console.log(`   - Calorie goal: ${calorieGoal}`);
      
      // Show date range
      if (intakeRecords.length > 0) {
        const dates = intakeRecords.map(r => r.date).sort((a, b) => a - b);
        console.log(`   - Date range: ${dates[0].toDateString()} to ${dates[dates.length - 1].toDateString()}`);
      }
    } else {
      console.log('No new records were generated (all dates already have data)');
    }
    
  } catch (error) {
    console.error('Error adding sample intake data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
  }
};

// Run the script
addMealsForAUser();