import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { startWebSocketServer } from "./websocket";
import rfpRoutes from "./routes/rfpRoutes";
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

app.use("/api", rfpRoutes);
app.post("/ai", convertTextToRFP);

app.get("/health", (_req: Request, res: Response): any => {
  return res.status(200).json({
    success: true,
    message: "Server is running",
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
