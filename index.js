import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// API routes
import chatRoute from "./api/chat.js";
import healthRoute from "./api/health.js";
import topicsRoute from "./api/topics.js";
import statsRoute from "./api/stats.js";

dotenv.config();
const app = express();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
const frontendPath = path.join(__dirname, "frontend");
app.use(express.static(frontendPath));

// Mount API routes
const routes = [
  { path: "/api/chat", router: chatRoute },
  { path: "/api/health", router: healthRoute },
  { path: "/api/topics", router: topicsRoute },
  { path: "/api/stats", router: statsRoute },
];

routes.forEach(route => app.use(route.path, route.router));

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Catch-all route for SPA routing
app.get(/^((?!api).)*$/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Serving frontend from: ${frontendPath}`);
  console.log("📡 Available API routes:");
  routes.forEach(route => console.log(`   - ${route.path}`));
});
