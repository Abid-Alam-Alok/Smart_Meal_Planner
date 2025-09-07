import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import notesRoutes from "./routes/notesRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import mealRoutes from "./routes/mealRoutes.js";
import intakeMealsRoutes from "./routes/intakeMeals.js";
import historyRoutes from "./routes/historyRoutes.js";
import { connectDB } from "./config/database.js";
import { ratelimit } from "./config/upstash.js";
import rateLimiter from "./middlewares/rateLimiter.js";

// Configure dotenv to use .env file from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:5175', 
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:3000'
  ], // Multiple frontend instances and dev servers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Temporarily disable rate limiter due to Redis configuration issues
// app.use(rateLimiter);

// Routes
app.use("/api/notes", notesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/intake", intakeMealsRoutes);
app.use("/api/history", historyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Meal Planner API is running',
    timestamp: new Date().toISOString()
  });
});

// Connect to database and start server
const PORT = process.env.PORT || 5001;
connectDB().then(()=>{
    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });
});


