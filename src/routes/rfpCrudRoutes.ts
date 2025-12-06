import { Request, Response, Router } from "express";
import { RFP } from "../models/model";
import mongoose from "mongoose";

const router = Router();

// Middleware to check MongoDB connection
const checkMongoConnection = (req: Request, res: Response, next: Function) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: "Database unavailable",
      message: "MongoDB is not connected. Please check server configuration.",
    });
  }
  next();
};

// Apply middleware to all routes
router.use(checkMongoConnection);

// ==================== CREATE RFP ====================
router.post("/rfps", async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      rfpId,
      title,
      description,
      budget,
      deliveryTimeline,
      items,
      paymentTerms,
      warranty,
      sentTo,
    } = req.body;

    // Validate required fields
    if (!rfpId || !title || !sentTo || sentTo.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: rfpId, title, and sentTo are required",
      });
    }

    // Create new RFP
    const rfp = new RFP({
      rfpId,
      title,
      description,
      budget,
      deliveryTimeline,
      items,
      paymentTerms,
      warranty,
      sentTo,
      status: "pending",
      createdAt: new Date(),
    });

    await rfp.save();

    return res.status(201).json({
      success: true,
      message: "RFP created successfully",
      data: rfp,
    });
  } catch (err) {
    console.error("Create RFP error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to create RFP",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// ==================== GET ALL RFPs ====================
router.get("/rfps", async (_req: Request, res: Response): Promise<any> => {
  try {
    const rfps = await RFP.find().sort({ createdAt: -1 }); // Newest first

    return res.status(200).json({
      success: true,
      count: rfps.length,
      data: rfps,
    });
  } catch (err) {
    console.error("Get RFPs error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch RFPs",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// ==================== GET SINGLE RFP ====================
router.get("/rfps/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return res.status(404).json({
        success: false,
        error: "RFP not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: rfp,
    });
  } catch (err) {
    console.error("Get RFP error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch RFP",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

// ==================== UPDATE RFP STATUS ====================
router.patch(
  "/rfps/:id/status",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { status, awardedTo } = req.body;

      if (!status || !["pending", "awarded", "closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Invalid status. Must be: pending, awarded, or closed",
        });
      }

      const updateData: any = { status };
      if (status === "awarded" && awardedTo) {
        updateData.awardedTo = awardedTo;
      }

      const rfp = await RFP.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      });

      if (!rfp) {
        return res.status(404).json({
          success: false,
          error: "RFP not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "RFP status updated successfully",
        data: rfp,
      });
    } catch (err) {
      console.error("Update RFP status error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to update RFP status",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

// ==================== DELETE RFP ====================
router.delete(
  "/rfps/:id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const rfp = await RFP.findByIdAndDelete(req.params.id);

      if (!rfp) {
        return res.status(404).json({
          success: false,
          error: "RFP not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "RFP deleted successfully",
      });
    } catch (err) {
      console.error("Delete RFP error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to delete RFP",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

// ==================== GET RFP STATISTICS ====================
router.get(
  "/rfps/stats/summary",
  async (_req: Request, res: Response): Promise<any> => {
    try {
      const total = await RFP.countDocuments();
      const pending = await RFP.countDocuments({ status: "pending" });
      const awarded = await RFP.countDocuments({ status: "awarded" });
      const closed = await RFP.countDocuments({ status: "closed" });

      return res.status(200).json({
        success: true,
        data: {
          total,
          pending,
          awarded,
          closed,
        },
      });
    } catch (err) {
      console.error("Get RFP stats error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch RFP statistics",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

export default router;
