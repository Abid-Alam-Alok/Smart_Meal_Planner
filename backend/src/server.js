import express from "express";
import dotenv from "dotenv";
dotenv.config();
import notesRoutes from "./routes/notesRoutes.js";
import { connectDB } from "./config/database.js";

const app = express();

app.use("/api/notes", notesRoutes);

app.listen(5001, () => {
    console.log("Server started on port 5001");
});

connectDB();