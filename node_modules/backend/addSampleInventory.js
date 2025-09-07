import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Inventory from './src/models/Inventory.js';
import User from './src/models/User.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Sample inventory data
const sampleInventory = [
  {
    name: 'Salmon',
    category: 'proteins',
    quantity: 2,
    unit: 'pieces',
    storageLocation: 'freezer'
  },
  {
    name: 'Quinoa',
    category: 'grains',
    quantity: 500,
    unit: 'g',
    storageLocation: 'pantry'
  },
  {
    name: 'Broccoli',
    category: 'vegetables',
    quantity: 1,
    unit: 'pieces',
    storageLocation: 'refrigerator'
  },
  {
    name: 'Chicken breast',
    category: 'proteins',
    quantity: 4,
    unit: 'pieces',
    storageLocation: 'refrigerator'
  },
  {
    name: 'Tomatoes',
    category: 'vegetables',
    quantity: 6,
    unit: 'pieces',
    storageLocation: 'counter'
  },
  {
    name: 'Onions',
    category: 'vegetables',
    quantity: 3,
    unit: 'pieces',
    storageLocation: 'pantry'
  },
  {
    name: 'Garlic',
    category: 'vegetables',
    quantity: 1,
    unit: 'pieces',
    storageLocation: 'pantry'
  },
  {
    name: 'Olive oil',
    category: 'oils-fats',
    quantity: 500,
    unit: 'ml',
    storageLocation: 'pantry'
  },
  {
    name: 'Salt',
    category: 'herbs-spices',
    quantity: 1,
    unit: 'kg',
    storageLocation: 'pantry'
  },
  {
    name: 'Black pepper',
    category: 'herbs-spices',
    quantity: 100,
    unit: 'g',
    storageLocation: 'pantry'
  }
];

const addSampleInventory = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find any user
    const user = await User.findOne();
    if (!user) {
      console.log('No user found. Please create a user first.');
      process.exit(1);
    }

    console.log(`Adding inventory for user: ${user.email}`);

    // Clear existing inventory for this user
    await Inventory.deleteMany({ userId: user._id });
    console.log('Cleared existing inventory');

    // Add sample inventory items
    const inventoryItems = sampleInventory.map(item => ({
      ...item,
      userId: user._id
    }));

    await Inventory.insertMany(inventoryItems);
    console.log(`Added ${inventoryItems.length} inventory items`);

    console.log('Sample inventory added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample inventory:', error);
    process.exit(1);
  }
};

addSampleInventory();