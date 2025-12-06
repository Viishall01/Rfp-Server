import { Request, Response, Router } from "express";
import { checkInbox, sendRFPEmail } from "../email";

const router = Router();

router.post("/send-rfp", async (req: Request, res: Response): Promise<any> => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res
        .status(400)
        .json({ error: "Missing required fields: to, subject, html" });
    }

    const messageId = await sendRFPEmail(to, subject, html);

    return res.status(200).json({
      success: true,
      message: "RFP email sent successfully",
      messageId: messageId,
    });
  } catch (err) {
    console.error("Send email error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to send RFP email",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

router.get(
  "/check-inbox",
  async (_req: Request, res: Response): Promise<any> => {
    try {
      const messages = await checkInbox();

      return res.status(200).json({
        success: true,
        count: messages.length,
        messages,
      });
    } catch (err) {
      console.error("Check inbox error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to read inbox",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

// Get emails for a specific RFP
router.get(
  "/rfp-emails/:rfpId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { rfpId } = req.params;

      if (!rfpId) {
        return res.status(400).json({
          success: false,
          error: "RFP ID is required",
        });
      }

      const allMessages = await checkInbox();

      // Filter emails that are replies to this specific RFP
      const rfpEmails = allMessages.filter((email) => {
        const subject = email.subject?.toLowerCase() || "";
        // Match emails with "Re:" and the RFP ID in subject
        return subject.includes("re:") && subject.includes(rfpId.toLowerCase());
      });

      return res.status(200).json({
        success: true,
        count: rfpEmails.length,
        rfpId,
        messages: rfpEmails,
      });
    } catch (err) {
      console.error("Fetch RFP emails error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch RFP emails",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

export default router;
