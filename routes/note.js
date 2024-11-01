const express = require("express");
const { body } = require("express-validator");

const notesController = require("../controller/note");

const router = express.Router();

router.get("/", notesController.getNotes);

router.get("/recent", notesController.getRecentNotes);

router.get("/:noteId", notesController.getNoteById);

router.post(
  "/",
  [
    body("title").isLength({ min: 1 }).withMessage("Title is required"),
    body("type")
      .exists()
      .withMessage("Type is required")
      .isIn(["transcription", "summary", "list-of-ideas"])
      .withMessage("Invalid note type"),
  ],
  notesController.createNote
);

router.put(
  "/:noteId",
  [
    body("title").isLength({ min: 1 }).withMessage("Title is required"),
    body("content").isLength({ min: 1 }).withMessage("Content is required"),
    body("type")
      .exists()
      .withMessage("Type is required")
      .isIn(["transcription", "summary", "list-of-ideas"])
      .withMessage("Invalid note type"),
  ],
  notesController.updateNote
);

router.patch(
  "/:noteId",
  [
    body("title")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Title must not be empty"),
    body("content")
      .optional()
      .isLength({ min: 1 })
      .withMessage("Content must not be empty"),
  ],
  notesController.updateNote
);

router.delete("/:noteId", notesController.deleteNote);

module.exports = router;
