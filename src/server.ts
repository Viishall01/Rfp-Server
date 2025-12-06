import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { startWebSocketServer } from "./websocket";
import rfpRoutes from "./routes/rfpRoutes";
import rfpCrudRoutes from "./routes/rfpCrudRoutes";
import { convertTextToRFP } from "./routes/textToRfp";

dotenv.config();

const app = express();

// Enable CORS for frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

startWebSocketServer();

const PORT = process.env.PORT || 5000;

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn("⚠️  MONGO_URI is not defined - MongoDB features disabled");
      console.warn(
        "   RFPs will not be persisted. Please configure MongoDB Atlas:"
      );
      console.warn("   1. Go to https://cloud.mongodb.com");
      console.warn("   2. Add your IP address to Network Access whitelist");
      console.warn("   3. Or allow access from anywhere (0.0.0.0/0)");
      return;
    }

    console.log("🔄 Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log("✅ MongoDB Connected Successfully");
    if (mongoose.connection.db) {
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    }
  } catch (error: any) {
    console.error("❌ MongoDB Connection Error:");

    if (error.message?.includes("IP") || error.message?.includes("whitelist")) {
      console.error("   Your IP address is not whitelisted in MongoDB Atlas.");
      console.error("   To fix this:");
      console.error("   1. Go to https://cloud.mongodb.com");
      console.error("   2. Select your cluster");
      console.error("   3. Click 'Network Access' in the left sidebar");
      console.error("   4. Click 'Add IP Address'");
      console.error("   5. Either:");
      console.error("      - Click 'Add Current IP Address', or");
      console.error(
        "      - Enter 0.0.0.0/0 to allow all IPs (not recommended for production)"
      );
    } else {
      console.error("   Error:", error.message);
    }

    console.warn("⚠️  Server will continue without MongoDB.");
    console.warn("   RFP persistence features will be disabled.");
  }
};

// Connect to MongoDB (non-blocking)
connectDB();

// Routes
app.use("/api", rfpRoutes); // Email routes (send-rfp, check-inbox)
app.use("/api", rfpCrudRoutes); // CRUD routes for RFPs
app.post("/ai", convertTextToRFP);

app.get("/health", (_req: Request, res: Response): any => {
  return res.status(200).json({
    success: true,
    message: "Server is running",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Gmail User: ${process.env.GMAIL_USER}`);
  console.log(`✅ Ready to send and receive emails`);
});
