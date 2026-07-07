import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Imports for routes will go here
import authRoutes from "./server/routes/auth.routes";
import adminRoutes from "./server/routes/admin.routes";
import superAdminRoutes from "./server/routes/superadmin.routes";
import branchRoutes from "./server/routes/branch.routes";
import packagesRoutes from "./server/routes/packages.routes";
import settingsRoutes from "./server/routes/settings.routes";
import paymentRoutes from "./server/routes/payment.routes";
import { initCronJobs } from "./server/cron";

async function startServer() {
  const app = express();
  // const PORT = process.env.PORT || 3000;
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Request logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`[${req.method}] ${req.url} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
  
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Database Connection
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB successfully");
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  } else {
    console.warn("WARNING: MONGODB_URI is not set. Using in-memory MongoDB for demo purposes.");
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log("Connected to In-Memory MongoDB successfully at", mongoUri);
    } catch (error) {
      console.error("Failed to start in-memory MongoDB:", error);
    }
  }

  // Seed default admin if user collection is empty (works for both persistent and in-memory)
  if (mongoose.connection.readyState === 1) {
    const { seedDatabase } = await import("./server/db-seed.js");
    await seedDatabase();
  }

  // Initialize background cron jobs
  initCronJobs();

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/superadmin", superAdminRoutes);
  app.use("/api/branch", branchRoutes);
  app.use("/api/packages", packagesRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/payment", paymentRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

}

startServer();
