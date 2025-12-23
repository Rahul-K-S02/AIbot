import express from "express";
import dotenv from "dotenv";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

dotenv.config(); // must be before using process.env

const router = express.Router();

// Initialize Cerebras client
const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY
});

// System prompts
const systemPrompts = {
  general: "You are StudyAI, an intelligent learning assistant.",
  programming: "You are StudyAI specializing in programming.",
  math: "You are StudyAI specializing in mathematics.",
  science: "You are StudyAI specializing in science.",
  debug: "You are StudyAI specializing in code debugging.",
  "study-tips": "You are StudyAI specializing in study techniques.",
  interview: "You are StudyAI specializing in interview preparation."
};

router.post("/", async (req, res) => {
  try {
    const { message, topic = "general", temperature = 0.7, max_tokens = 1000 } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ reply: "Please provide a message." });
    }

    const systemPrompt = systemPrompts[topic] || systemPrompts.general;
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ];

    const completion = await cerebras.chat.completions.create({
      model: "llama3.1-8b",
      messages,
      max_tokens,
      temperature
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I didn't get that.";

    res.json({
      reply,
      topic,
      tokens_used: completion.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error("Cerebras API Error:", error);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again." });
  }
});

export default router;
