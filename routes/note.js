const express = require("express");
const multer = require("multer");

const notesController = require("../controller/note");

const router = express.Router();

const upload = multer({ dest: "uploads/", limits: { fileSize: 20 * 1024 * 1024 } });

router.get("/", notesController.getNotes);

router.get("/recent", notesController.getRecentNotes);

router.get("/:noteId", notesController.getNoteById);

router.post("/", upload.single("audio"), notesController.createNote);

router.put("/:noteId", notesController.updateNote);

router.delete("/:noteId", notesController.deleteNote);

module.exports = router;
