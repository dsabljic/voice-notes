const express = require("express");
const Note = require("../model/note");

const router = express.Router();

router.get("/", async (req, res, next) => {
  const notes = await Note.findAll();
  res.status(200).send(JSON.stringify({ notes }));
});

router.get("/:noteId", async (req, res, next) => {
  const id = req.params.noteId;
  const note = await Note.findByPk(id);

  if (note) {
    res.status(200).send(JSON.stringify({ note }));
  } else {
    res
      .status(404)
      .send(
        JSON.stringify({ message: "The note with given id doesn't exits" })
      );
  }
});

router.post("/", (req, res, next) => {});

router.put("/:noteId", (req, res, next) => {});

router.delete("/:noteId", (req, res, next) => {});

module.exports = router;
