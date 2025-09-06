import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import notesRoutes from "./routes/notesRoutes.js";
import { connectDB } from "./config/database.js";
import { ratelimit } from "./config/upstash.js";
import rateLimiter from "./middlewares/rateLimiter.js";

// Configure dotenv to use .env file from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();

// Middleware
app.use(express.json());
app.use(rateLimiter);

// Routes
app.use("/api/notes", notesRoutes);

// Connect to database and start server
connectDB().then(()=>{
    app.listen(5001, () => {
        console.log("Server started on port 5001");
    });
});
