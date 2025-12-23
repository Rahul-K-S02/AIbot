import express from "express";

const router = express.Router();

const systemPrompts = {
  general: "General learning",
  programming: "Programming concepts",
  math: "Mathematics",
  science: "Science",
  debug: "Debugging code",
  "study-tips": "Study techniques",
  interview: "Interview preparation"
};

router.get("/", (req, res) => {
  res.json({
    total_requests: 0, // You can implement request tracking here
    active_topics: Object.keys(systemPrompts),
    model: "llama3.1-8b",
    max_tokens: 4096
  });
});

export default router;
