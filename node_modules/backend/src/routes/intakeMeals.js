import express from 'express';
import IntakeMeal from '../models/IntakeMeal.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Get today's intake for the authenticated user
router.get('/today', auth, async (req, res) => {
  try {
    const intake = await IntakeMeal.getTodaysIntake(req.user.id);
    res.json(intake);
  } catch (error) {
    console.error('Error fetching today\'s intake:', error);
    res.status(500).json({ message: 'Server error while fetching intake data' });
  }
});

// Get intake for a specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const intake = await IntakeMeal.getIntakeByDate(req.user.id, date);
    
    if (!intake) {
      return res.status(404).json({ message: 'No intake data found for this date' });
    }
    
    res.json(intake);
  } catch (error) {
    console.error('Error fetching intake by date:', error);
    res.status(500).json({ message: 'Server error while fetching intake data' });
  }
});

// Get intake history for a date range
router.get('/history', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    
    let query = { userId: req.user.id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const intakes = await IntakeMeal.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.json(intakes);
  } catch (error) {
    console.error('Error fetching intake history:', error);
    res.status(500).json({ message: 'Server error while fetching intake history' });
  }
});

// Add a meal to today's intake
router.post('/meal', auth, async (req, res) => {
  try {
    const { name, calories, quantity = 1, unit = 'serving', mealType } = req.body;
    
    // Validation
    if (!name || !calories || !mealType) {
      return res.status(400).json({ 
        message: 'Name, calories, and meal type are required' 
      });
    }
    
    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return res.status(400).json({ 
        message: 'Invalid meal type. Must be breakfast, lunch, dinner, or snack' 
      });
    }
    
    if (calories < 0 || quantity < 0) {
      return res.status(400).json({ 
        message: 'Calories and quantity must be positive numbers' 
      });
    }
    
    const intake = await IntakeMeal.getTodaysIntake(req.user.id);
    
    const mealData = {
      name: name.trim(),
      calories: Number(calories),
      quantity: Number(quantity),
      unit: unit.trim(),
      mealType,
      timeConsumed: new Date()
    };
    
    await intake.addMeal(mealData);
    
    res.status(201).json({
      message: 'Meal added successfully',
      intake
    });
  } catch (error) {
    console.error('Error adding meal:', error);
    res.status(500).json({ message: 'Server error while adding meal' });
  }
});

// Update a specific meal
router.put('/meal/:mealId', auth, async (req, res) => {
  try {
    const { mealId } = req.params;
    const { name, calories, quantity, unit, mealType } = req.body;
    
    const intake = await IntakeMeal.getTodaysIntake(req.user.id);
    const meal = intake.meals.id(mealId);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    // Update meal properties if provided
    if (name !== undefined) meal.name = name.trim();
    if (calories !== undefined) meal.calories = Number(calories);
    if (quantity !== undefined) meal.quantity = Number(quantity);
    if (unit !== undefined) meal.unit = unit.trim();
    if (mealType !== undefined) meal.mealType = mealType;
    
    await intake.save();
    
    res.json({
      message: 'Meal updated successfully',
      intake
    });
  } catch (error) {
    console.error('Error updating meal:', error);
    res.status(500).json({ message: 'Server error while updating meal' });
  }
});

// Delete a specific meal
router.delete('/meal/:mealId', auth, async (req, res) => {
  try {
    const { mealId } = req.params;
    
    const intake = await IntakeMeal.getTodaysIntake(req.user.id);
    const meal = intake.meals.id(mealId);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    await intake.removeMeal(mealId);
    
    res.json({
      message: 'Meal deleted successfully',
      intake
    });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ message: 'Server error while deleting meal' });
  }
});

// Update daily calorie goal
router.put('/goal', auth, async (req, res) => {
  try {
    const { dailyCalorieGoal } = req.body;
    
    if (!dailyCalorieGoal || dailyCalorieGoal < 1000 || dailyCalorieGoal > 5000) {
      return res.status(400).json({ 
        message: 'Daily calorie goal must be between 1000 and 5000 calories' 
      });
    }
    
    const intake = await IntakeMeal.getTodaysIntake(req.user.id);
    await intake.updateCalorieGoal(Number(dailyCalorieGoal));
    
    res.json({
      message: 'Daily calorie goal updated successfully',
      intake
    });
  } catch (error) {
    console.error('Error updating calorie goal:', error);
    res.status(500).json({ message: 'Server error while updating calorie goal' });
  }
});

// Add notes to today's intake
router.put('/notes', auth, async (req, res) => {
  try {
    const { notes } = req.body;
    
    if (notes && notes.length > 500) {
      return res.status(400).json({ 
        message: 'Notes cannot exceed 500 characters' 
      });
    }
    
    const intake = await IntakeMeal.getTodaysIntake(req.user.id);
    intake.notes = notes || '';
    await intake.save();
    
    res.json({
      message: 'Notes updated successfully',
      intake
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({ message: 'Server error while updating notes' });
  }
});

// Get nutrition summary for a date range
router.get('/summary', auth, async (req, res) => {
  try {
    const { days = 7, startDate: queryStartDate, endDate: queryEndDate } = req.query;
    
    let startDate, endDate;
    
    if (queryStartDate && queryEndDate) {
      // Use provided date range
      startDate = new Date(queryStartDate);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(queryEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Use days parameter for backward compatibility
      const daysCount = Math.min(parseInt(days), 30); // Limit to 30 days
      
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysCount + 1);
      startDate.setHours(0, 0, 0, 0);
    }
    
    // Calculate actual days for summary
    const daysCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const intakes = await IntakeMeal.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });
    
    const summary = {
      totalDays: daysCount,
      daysWithData: intakes.length,
      averageCalories: 0,
      totalCalories: 0,
      averageGoalAchievement: 0,
      daysOverGoal: 0,
      daysUnderGoal: 0
    };
    
    if (intakes.length > 0) {
      summary.totalCalories = intakes.reduce((sum, intake) => sum + intake.totalCalories, 0);
      summary.averageCalories = Math.round(summary.totalCalories / intakes.length);
      
      const goalAchievements = intakes.map(intake => intake.goalPercentage);
      summary.averageGoalAchievement = Math.round(
        goalAchievements.reduce((sum, pct) => sum + pct, 0) / intakes.length
      );
      
      summary.daysOverGoal = intakes.filter(intake => intake.totalCalories > intake.dailyCalorieGoal).length;
      summary.daysUnderGoal = intakes.filter(intake => intake.totalCalories < intake.dailyCalorieGoal).length;
    }
    
    res.json({
      summary,
      dailyData: intakes
    });
  } catch (error) {
    console.error('Error fetching nutrition summary:', error);
    res.status(500).json({ message: 'Server error while fetching nutrition summary' });
  }
});

export default router;