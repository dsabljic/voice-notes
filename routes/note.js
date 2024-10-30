const express = require("express");
const multer = require("multer");
const { body } = require("express-validator");

const notesController = require("../controller/note");

const router = express.Router();

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["audio/mp3", "audio/wav", "video/mp4"];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error(
        "Invalid file type, only .mp3, .mp4 and .wav files are allowed!"
      );
      error.status = 400;
      return cb(error, false);
    }
    cb(null, true);
  },
});

const noteValidationRules = [
  body("title").isLength({ min: 1 }).withMessage("Title is required"),
  body("content").isLength({ min: 1 }).withMessage("Content is required"),
  body("type")
    .exists()
    .withMessage("Type is required")
    .isIn(["transcription", "summary", "list-of-ideas"])
    .withMessage("Invalid note type"),
];

router.get("/", notesController.getNotes);

router.get("/recent", notesController.getRecentNotes);

router.get("/:noteId", notesController.getNoteById);

router.post(
  "/",
  upload.single("audio"),
  noteValidationRules,
  notesController.createNote
);

router.put("/:noteId", noteValidationRules, notesController.updateNote);

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
