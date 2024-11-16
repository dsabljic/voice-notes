const express = require("express");
const { body } = require("express-validator");

const notesController = require("../controller/note");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/", isAuth, notesController.getNotes);

router.get("/recent", isAuth, notesController.getRecentNotes);

router.get("/:noteId", isAuth, notesController.getNoteById);

router.post(
  "/",
  isAuth,
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
  isAuth,
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
  isAuth,
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

router.delete("/:noteId", isAuth, notesController.deleteNote);

module.exports = router;
