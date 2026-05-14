import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import net from "net";
import { connectDatabase } from "./config/db.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

dotenv.config();

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5500;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

async function getAvailablePort(startPort) {
  let port = Number.isInteger(startPort) ? startPort : 5500;
  while (port < 65535) {
    const available = await new Promise((resolve) => {
      const tester = net.createServer()
        .once("error", (err) => {
          tester.close();
          resolve(false);
        })
        .once("listening", () => {
          tester.close();
          resolve(true);
        })
        .listen(port, "0.0.0.0");
    });
    if (available) return port;
    port += 1;
  }
  throw new Error("No available ports found between 5500 and 65535.");
}

// Rate limiting for security
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." }
});

// FIX: Improved CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Use the variable instead of a hardcoded string
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true // Required if you use cookies/sessions for auth
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));
app.use("/api/", apiLimiter); // Apply limiter to all API routes

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    const port = await getAvailablePort(DEFAULT_PORT);
    await connectDatabase();
    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    server.on("error", (error) => {
      console.error("Server error:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();