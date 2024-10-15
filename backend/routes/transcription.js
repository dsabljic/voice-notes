const express = require("express");
const multer = require("multer");

const { getTranscription } = require("../util/openai-utils");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    const audioFilePath = req.file.path;
    const transcription = await getTranscription(audioFilePath);
    res.status(200).json({ transcription });
  } catch (err) {
    res.status(500).json({ error: "Failed to transcribe the audio" });
  }
});

router.post("/record-audio", async (req, res) => {
  try {
    const { audioData } = req.body;
    const audioBuffer = Buffer.from(audioData, "base64");

    const filePath = `uploads/live_audio_${Date.now()}.mp3`;
    fs.writeFileSync(filePath, audioBuffer);

    const transcription = await getTranscription(filePath);
    res.status(200).json({ transcription });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to transcribe the live audio" });
  }
});

module.exports = router;
