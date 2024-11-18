const fs = require("fs/promises");
const { validationResult } = require("express-validator");

const Note = require("../model/note");
const {
  getTranscription,
  getSummary,
  getListOfIdeas,
} = require("../util/lemon-fox-transcription");
const { throwError } = require("../util/error");

exports.getNotes = async (req, res, next) => {
  console.log("Fetching notes");
  const page = +req.query.page || 1;
  const notePerPage = +req.query.pageSize || 10;

  try {
    const notes = await Note.findAll({
      where: {
        userId: req.userId,
      },
      offset: (page - 1) * notePerPage,
      limit: notePerPage,
    });
    res.status(200).json({ notes });
  } catch (err) {
    console.error("Error fetching notes:", err);
    throwError(500, "Failed to fetch notes", next);
  }
};

exports.getRecentNotes = async (req, res, next) => {
  console.log("Fetching 3 most recent notes");
  try {
    const recentNotes = await Note.findAll({
      order: [["createdAt", "DESC"]],
      limit: 3,
    });

    res.status(200).json({ notes: recentNotes });
  } catch (err) {
    console.error("Error fetching recent notes", err);
    throwError(500, "Failed to fetch recent notes", next);
  }
};

exports.getNoteById = async (req, res, next) => {
  console.log("Fetching note by id");
  try {
    const note = await Note.findByPk(req.params.noteId);
    if (!note) {
      return throwError(404, "Note not found", next);
    }
    res.status(200).json({ note });
  } catch (err) {
    console.error("Error fetching note:", err);
    throwError(500, "Failed to fetch note", next);
  }
};

exports.createNote = async (req, res, next) => {
  console.log("Creating new note");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    return throwError(400, errorMessage, next);
  }

  const type = req.body.type;

  try {
    let transcription;
    let audioFilePath;

    if (req.file) {
      console.log(req.file);
      audioFilePath = req.file.path;
      transcription = await getTranscription(audioFilePath);
    } else {
      return throwError(400, "No audio file provided", next);
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
        "transcription",
        req.userId
      );
    } else if (type === "summary") {
      const summary = await getSummary(transcription);
      newNote = await createNewNote(
        req.body.title,
        summary,
        "summary",
        req.userId
      );
    } else if (type === "list-of-ideas") {
      const listOfIdeas = await getListOfIdeas(transcription);
      newNote = await createNewNote(
        req.body.title,
        listOfIdeas,
        "list-of-ideas",
        req.userId
      );
    }

    res.status(201).json({ note: newNote });
  } catch (err) {
    console.error("Error creating a note:", err);
    throwError(500, "Failed to create note", next);
  }
};

exports.updateNote = async (req, res, next) => {
  console.log("Updating note");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessage = errors
      .array()
      .map((err) => err.msg)
      .join(", ");
    return throwError(400, errorMessage, next);
  }

  const { noteId } = req.params;

  try {
    const note = await Note.findByPk(noteId);
    if (!note) {
      return throwError(404, "Note not found", next);
    }

    if (note.userId !== req.userId) {
      return throwError(403, "Unauthorized update request", next);
    }

    const title = req.body.title || note.title;
    const content = req.body.content || note.content;

    if (title !== note.title || content !== note.content) {
      note.title = title;
      note.content = content;
      note.updatedAt = new Date();

      await note.save();
    }

    res.status(200).json({ message: "Note updated successfully" });
  } catch (err) {
    console.log(err);
    console.error("Error updating a note:", err);
    throwError(500, "Failed to update note", next);
  }
};

exports.deleteNote = async (req, res, next) => {
  console.log("Deleting a note");
  try {
    const id = req.params.noteId;
    const note = await Note.findByPk(id);
    if (!note) {
      return throwError(404, "Note not found", next);
    }
    if (note.userId !== req.userId) {
      return throwError(403, "Unauthorized delete request", next);
    }
    await note.destroy();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Error deleting a note:", err);
    throwError(500, "Failed to delete note", next);
  }
};

const createNewNote = async (title, content, type, userId) => {
  const newNote = await Note.create({
    title: title || "Untitled Note",
    content,
    type,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return newNote;
};
