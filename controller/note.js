const fs = require("fs/promises");
const { validationResult } = require("express-validator");
const { loadMusicMetadata } = require("music-metadata");

const Note = require("../model/note");
const Subscription = require("../model/subscription");
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
      where: { userId: req.userId },
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
    if (note.userId !== req.userId) {
      return throwError(403, "Access denied", next);
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
  const isRecording = req.body.isRecording === "true" ? true : false;

  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.userId },
    });
    const { uploadsLeft, recordingTimeLeft } = subscription;

    let transcription;
    let audioDuration;
    let audioFilePath = req.file.path;

    if (req.file) {
      console.log(req.file);
      if (!isRecording && !uploadsLeft) {
        // doesn't have any more uploads left
        return throwError(400, "No uploads left", next);
      }
      if (isRecording) {
        audioDuration = await getAudioDuration(audioFilePath);
        console.log(`audio duration: ${audioDuration}`);
      }
      if (recordingTimeLeft - audioDuration < 0) {
        // doesn't have any recording time left
        return throwError(
          400,
          "The length of the recording exceeds the recording time limits",
          next
        );
      }
      transcription = await getTranscription(audioFilePath);

      if (isRecording) subscription.recordingTimeLeft -= audioDuration;
      else subscription.uploadsLeft -= 1;
      await subscription.save();
    } else {
      return throwError(400, "No audio file provided", next);
    }

    try {
      await fs.unlink(audioFilePath);
      console.log("deleted");
    } catch (error) {
      console.error(error);
    }

    let content;

    if (type === "transcription") {
      content = transcription;
    } else if (type === "summary") {
      content = await getSummary(transcription);
    } else if (type === "list-of-ideas") {
      content = await getListOfIdeas(transcription);
    }

    const newNote = await createNewNote(
      req.body.title,
      content,
      type,
      req.userId
    );

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

const getAudioDuration = async (filePath) => {
  try {
    console.log(`file path: ${filePath}`);
    const mm = await loadMusicMetadata();
    const metadata = await mm.parseFile(filePath);

    if (!metadata.format.duration) {
      console.log("No duration in metadata, using fallback calculation");
      const stats = await fs.stat(filePath);
      // Assuming 128kbps audio (16KB per second)
      const estimatedDuration = Math.floor(stats.size / (16 * 1024));
      console.log(estimatedDuration);
      return estimatedDuration;
    }

    return Math.floor(metadata.format.duration);
  } catch (err) {
    console.error("Error getting audio duration:", err);
    throw err;
  }
};
