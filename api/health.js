import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "StudyAI Chatbot",
    version: "2.0.0"
  });
});

export default router;
