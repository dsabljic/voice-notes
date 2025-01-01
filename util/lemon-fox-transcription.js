const OpenAI = require("openai");
const fs = require("fs");
require("dotenv").config();

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
  } catch (error) {
    console.error("Error getting transcription:", error);
    throw error;
  }
};

exports.getSummary = async (transcription) => {
  try {
    const summary =
      await getCompletions(`Please summarize the following transcription in a clear and concise way, focusing only on the main points 
                                            and key information. Do not include unnecessary details or any additional content beyond 
                                            the core message. Avoid using interpretive language or any additional details beyond the 
                                            core message. Transcription: ${transcription}`);

    return summary;
  } catch (error) {
    console.error("Error getting summary:", error);
    throw error;
  }
};

exports.getListOfIdeas = async (transcription) => {
  try {
    const ideas =
      await getCompletions(`Please extract the key ideas from the following transcription and present them as a concise 
                                              bullet-point list. Focus only on the most important points and avoid using
                                              interpretive language or adding any additional content beyond the requested 
                                              list. Transcription: ${transcription}`);

    return ideas;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getCompletions = async (prompt) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "llama-70b-chat",
      messages: [
        {
          role: "system",
          content: `You are an advanced AI assistant specializing in processing and summarizing audio transcriptions. Your tasks include summarizing long text into concise and informative summaries, extracting the main ideas from the text in a structured list, and providing detailed transcriptions when required. You must generate output that is clear, accurate, and easy to understand, following these specific instructions for each task:

                    For summaries: Provide only the concise summary text, focusing solely on the main points without adding any introductory phrases or explanations like 'Here is a concise summary' or 'The following is a summary.' The summary should reflect the core content directly without additional framing.

                    Example:
                    User Prompt: "Summarize the following text: [Insert text]"
                    System Response without additional commentary and with original perspective preserved (so if a transcription is in first person you should keep it that way), so just the summary: "[Direct summary content in a few concise sentences]"
                    For lists of main ideas: Break down the transcription into a bullet-point list of key ideas, highlighting actionable or important information. Only include the key points requested and avoid any interpretive or additional content.

                    Example:
                    User Prompt: "Extract the key ideas from the following text: [Insert text]"
                    System Response:
                    [Main idea 1]
                    [Main idea 2]
                    [Main idea 3]
                    For transcriptions: Provide an accurate transcription that faithfully captures the spoken words without adding or interpreting additional meaning.

                    You must strictly return only the content requested—either a summary, a list of main ideas, or a transcription. Do not provide any additional information, subjective interpretations, or explanations beyond the requested task. You should preserve the original perspective of the transcription (if the transcription is written in first person you should return the summary or list of ideas in first person). Avoid any introductory phrases, framing statements, or unnecessary meta-commentary.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error getting completion:", error);
    throw error;
  }
};
