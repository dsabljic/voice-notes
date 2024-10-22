const express = require("express");
const fs = require("fs/promises");
const multer = require("multer");

const Note = require("../model/note");
const {
  getTranscription,
  getDummy,
} = require("../util/lemon-fox-transcription");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.get("/", async (req, res, next) => {
  try {
    const notes = await Note.findAll();
    res.status(200).json({ notes });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

router.get("/:noteId", async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.status(200).json({ note });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

router.post("/", upload.single("audio"), async (req, res) => {
  try {
    let transcription;
    let audioFilePath;

    if (req.file) {
      console.log(req.file);
      audioFilePath = req.file.path;
      transcription = await getTranscription(audioFilePath);
    } else if (req.body.audioData) {
      const audioBuffer = Buffer.from(req.body.audioData, "base64");
      audioFilePath = `uploads/live_audio_${Date.now()}.mp3`;
      await fs.writeFile(audioFilePath, audioBuffer);

      transcription = await getTranscription(audioFilePath);
    } else {
      return res.status(400).json({ error: "No audio data provided" });
    }

    try {
      await fs.unlink(audioFilePath);
      console.log("deleted");
    } catch (error) {
      console.error(error);
    }

    const newNote = await Note.create({
      title: req.body.title || "Untitled Note",
      type: req.body.type || "transcription",
      content: transcription,
      userId: req.user.id,
    });

    res.status(201).json({ note: newNote });
  } catch (err) {
    res.status(500).json({ error: "Failed to create note" });
  }
});

router.put("/:noteId", async (req, res) => {
  const { noteId } = req.params;
  const { title, content, type } = req.body;

  try {
    const note = await Note.findByPk(noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const updatedFields = { title, content, type };
    Object.assign(note, updatedFields);

    await note.save();
    res.status(200).json({ message: "Note updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update note" });
  }
});

router.delete("/:noteId", async (req, res) => {
  try {
    const id = req.params.noteId;
    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    await note.destroy();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

module.exports = router;
