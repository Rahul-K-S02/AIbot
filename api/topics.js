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
  const topics = Object.keys(systemPrompts).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' '),
    description: systemPrompts[key]
  }));

  res.json({ topics });
});

export default router;
