const OpenAI = require("openai");
const fs = require("fs");

const openai = new OpenAI({
  apiKey: process.env.LEMONFOX_API_KEY,
  baseURL: "https://api.lemonfox.ai/v1",
});

exports.getTranscription = async (audioPath) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });
    return transcription.text;
  } catch (err) {
    console.error("Error getting transcription:", err);
    throw err;
  }
};
