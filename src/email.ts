import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { simpleParser, ParsedMail, AddressObject } from "mailparser";

interface ParsedEmail {
  uid: number;
  messageId: string | undefined;
  from:
    | {
        name: string | undefined;
        address: string | undefined;
      }
    | undefined;
  to:
    | {
        name: string | undefined;
        address: string | undefined;
      }[]
    | undefined;
  subject: string | undefined;
  date: Date | undefined;
  textBody: string | undefined;
  htmlBody: string | undefined;
  attachments:
    | {
        filename: string | undefined;
        contentType: string | undefined;
        size: number | undefined;
      }[]
    | undefined;
}

// -----------------------------
// SEND EMAIL
// -----------------------------
export const sendRFPEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<string> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
  });

  return info.messageId;
};

// -----------------------------
// RECEIVE EMAILS (IMAP)
// -----------------------------
export const checkInbox = async (): Promise<ParsedEmail[]> => {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
    logger: false,
  });

  try {
    await client.connect();

    // Lock the mailbox for changes
    const lock = await client.getMailboxLock("INBOX");

    try {
      const result: ParsedEmail[] = [];

      // Find all messages (remove the seen: false filter to get all emails)
      // You can also use { seen: false } to get only unread emails
      const searchResult = await client.search({ all: true }, { uid: true });

      // Handle the case where search returns false (no messages)
      if (searchResult && Array.isArray(searchResult)) {
        // Get the last 10 messages (or adjust as needed)
        const recentMessages = searchResult.slice(-10);

        for (const uid of recentMessages) {
          // Download the message
          const message = await client.fetchOne(String(uid), { source: true });

          if (message && typeof message !== "boolean" && message.source) {
            const raw = message.source.toString();

            // Parse the raw email into readable format
            const parsed: ParsedMail = await simpleParser(raw);

            // Extract sender info
            const fromAddress = parsed.from as AddressObject | undefined;
            const from = fromAddress?.value[0]
              ? {
                  name: fromAddress.value[0].name || undefined,
                  address: fromAddress.value[0].address || undefined,
                }
              : undefined;

            // Extract recipient info
            const toAddress = parsed.to as
              | AddressObject
              | AddressObject[]
              | undefined;
            const toArray = Array.isArray(toAddress)
              ? toAddress
              : toAddress
              ? [toAddress]
              : [];
            const to = toArray.flatMap((addr: AddressObject) =>
              addr.value.map((v: any) => ({
                name: v.name || undefined,
                address: v.address || undefined,
              }))
            );

            // Extract attachments info
            const attachments = parsed.attachments?.map((att: any) => ({
              filename: att.filename || undefined,
              contentType: att.contentType || undefined,
              size: att.size || undefined,
            }));

            result.push({
              uid,
              messageId: parsed.messageId,
              from,
              to,
              subject: parsed.subject,
              date: parsed.date,
              textBody: parsed.text,
              htmlBody: parsed.html
                ? parsed.html.substring(0, 500) + "..."
                : undefined,
              attachments,
            });

            // Optionally mark email as read (commented out by default)
            // await client.messageFlagsAdd(String(uid), ["\\Seen"]);
          }
        }
      }

      return result;
    } finally {
      // Release the lock
      lock.release();
    }
  } catch (error) {
    console.error("IMAP Error:", error);
    throw error;
  } finally {
    await client.logout();
  }
};
