import express from "express";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/notesController.js';

const router = express.Router();

// @desc    Get all notes
// @route   GET /api/notes
// @access  Private
router.get("/", getNotes);

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
router.post("/", createNote);

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
router.put("/:id", updateNote);

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
router.delete("/:id", deleteNote);

export default router;