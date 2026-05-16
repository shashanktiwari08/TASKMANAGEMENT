import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);

      // Auto-allow Railway, Vercel, Render, and local dev origins
      const allowedPatterns = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https:\/\/.*\.railway\.app$/,
        /^https:\/\/.*\.vercel\.app$/,
        /^https:\/\/.*\.onrender\.com$/,
        /^https:\/\/.*\.netlify\.app$/,
      ];

      const envAllowed = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
      if (envAllowed.includes(origin) || allowedPatterns.some((p) => p.test(origin))) {
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet({
  contentSecurityPolicy: false,
}));
console.log("Unified Backend Version 2.0.0 Online");
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Serve static files from the React frontend app
// Try multiple possible paths for Railway deployment
const possibleDistPaths = [
  path.join(__dirname, "../frontend/dist"),
  path.join(__dirname, "../../frontend/dist"),
  path.join(process.cwd(), "frontend/dist"),
  path.join(process.cwd(), "dist"),
];

let distPath = possibleDistPaths.find((p) => {
  try {
    return require("fs").existsSync(p);
  } catch {
    return false;
  }
});

if (!distPath) {
  console.warn("[WARN] frontend/dist not found. Possible paths checked:");
  possibleDistPaths.forEach((p) => console.warn("  -", p));
  distPath = possibleDistPaths[0]; // fallback
}

console.log("[SERVE] Static files from:", distPath);
app.use(express.static(distPath));

// The "catchall" handler: for any non-API request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    // API 404s should return JSON, not HTML
    return res.status(404).json({ message: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ message });
});

async function main() {
  // Validate critical env vars before starting
  const required = ["JWT_SECRET"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`[FATAL] Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  const dbUri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL || process.env.DATABASE_URL;
  if (!dbUri) {
    console.error("[FATAL] No MongoDB connection string found. Set MONGODB_URI, MONGO_URL, or DATABASE_URL.");
    process.exit(1);
  }
  console.log(`[BOOT] JWT_SECRET: ${process.env.JWT_SECRET ? "✓ set" : "✗ missing"}`);
  console.log(`[BOOT] MongoDB URI: ${dbUri.replace(/:.*@/, ":****@")}`);
  console.log(`[BOOT] PORT: ${PORT}`);
  console.log(`[BOOT] NODE_ENV: ${process.env.NODE_ENV || "development"}`);

  await connectDB();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BOOT] Server listening on port ${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
