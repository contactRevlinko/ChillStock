import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Imports for routes
import authRoutes from "./server/routes/auth.routes";
import adminRoutes from "./server/routes/admin.routes";
import superAdminRoutes from "./server/routes/superadmin.routes";
import branchRoutes from "./server/routes/branch.routes";
import packagesRoutes from "./server/routes/packages.routes";
import settingsRoutes from "./server/routes/settings.routes";
import paymentRoutes from "./server/routes/payment.routes";
import { initCronJobs } from "./server/cron";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection Logic (Serverless Compatible)
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) return;
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      isConnected = true;
      console.log("Connected to MongoDB successfully");
      const { seedDatabase } = await import("./server/db-seed.js");
      await seedDatabase();
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  }
};

// Ensure DB is connected for every API request
app.use(async (req, res, next) => {
  if (req.url.startsWith('/api')) {
    await connectDB();
  }
  next();
});

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

// Start server logic (Only for local dev or Railway, NOT Vercel)
const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  if (process.env.NODE_ENV !== "production") {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then(vite => {
      app.use(vite.middlewares);
      startListening();
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    startListening();
  }

  function startListening() {
    connectDB().then(() => {
      initCronJobs();
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  }
}

// Export the app for Vercel Serverless
export default app;
