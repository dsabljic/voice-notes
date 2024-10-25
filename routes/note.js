const express = require("express");
const multer = require("multer");

const notesController = require("../controller/note");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/", notesController.getNotes);

router.get("/:noteId", notesController.getNoteById);

router.post("/", upload.single("audio"), notesController.createNote);

router.put("/:noteId", notesController.updateNote);

router.delete("/:noteId", notesController.deleteNote);

module.exports = router;
