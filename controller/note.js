const fs = require("fs/promises");

const Note = require("../model/note");
const {
  getTranscription,
  getSummary,
  getListOfIdeas,
} = require("../util/lemon-fox-transcription");

exports.getNotes = async (req, res, next) => {
  console.log("Fetching notes");
  try {
    const notes = await Note.findAll();
    res.status(200).json({ notes });
  } catch (err) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
};

exports.getRecentNotes = async (req, res, next) => {
  try {
    const recentNotes = await Note.findAll({
      order: [["createdAt", "DESC"]],
      limit: 3,
    });

    console.log("3 Most Recent Notes:", recentNotes);
    res.status(200).json({ notes: recentNotes });
  } catch (error) {
    console.error("Error fetching recent notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
};

exports.getNoteById = async (req, res) => {
  console.log("Fetching note by id");
  try {
    const note = await Note.findByPk(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.status(200).json({ note });
  } catch (err) {
    console.error("Error fetching note:", error);
    res.status(500).json({ error: "Failed to fetch note" });
  }
};

exports.createNote = async (req, res) => {
  console.log("Creating new note");
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  const type = req.body.type || "transcription";

  try {
    let transcription;
    let audioFilePath;

    if (req.file) {
      console.log(req.file);
      audioFilePath = req.file.path;
      if (req.file.size > MAX_FILE_SIZE) {
        try {
          await fs.unlink(audioFilePath);
          console.log("deleted");
        } catch (error) {
          console.error(error);
        }
        return res.status(413).json({ error: "File size too large" });
      }
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

    let newNote;

    if (type === "transcription") {
      newNote = await createNewNote(
        req.body.title,
        transcription,
        "transcription"
      );
    } else if (type === "summary") {
      const summary = await getSummary(transcription);
      newNote = await createNewNote(req.body.title, summary, "summary");
    } else if (type === "list-of-ideas") {
      const listOfIdeas = await getListOfIdeas(transcription);
      newNote = await createNewNote(
        req.body.title,
        listOfIdeas,
        "list-of-ideas"
      );
    }

    res.status(201).json({ note: newNote });
  } catch (err) {
    console.error("Error creating a note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
};

exports.updateNote = async (req, res) => {
  console.log("Updating note");
  const { noteId } = req.params;
  const { title, content } = req.body;

  try {
    const note = await Note.findByPk(noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    const updatedFields = { title, content, updatedAt: new Date() };
    Object.assign(note, updatedFields);

    await note.save();
    res.status(200).json({ message: "Note updated successfully" });
  } catch (err) {
    console.log(err);
    console.error("Error updating a note:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
};

exports.deleteNote = async (req, res) => {
  console.log("Deleting a note");
  try {
    const id = req.params.noteId;
    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    await note.destroy();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Error deleting a note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
};

const createNewNote = async (title, content, type) => {
  const newNote = await Note.create({
    title: title || "Untitled Note",
    content,
    type,
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return newNote;
};
