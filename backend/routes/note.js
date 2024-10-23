const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");

const notesController = require("../controllers/notes");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/", notesController.getNotes);

router.get("/:noteId", notesController.getNoteById);

router.post("/", upload.single("audio"), notesController.createNote);

router.put("/:noteId", notesController.updateNote);

router.delete("/:noteId", notesController.deleteNote);

module.exports = router;
