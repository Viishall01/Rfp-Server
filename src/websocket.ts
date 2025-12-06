import { WebSocketServer } from "ws";
import { checkInbox } from "./email";

export const startWebSocketServer = () => {
  const wss = new WebSocketServer({ port: 8080 });

  console.log("WebSocket server running on ws://localhost:8080");

  setInterval(async () => {
    const newEmails = await checkInbox();
    if (newEmails.length > 0) {
      wss.clients.forEach(client => {
        client.send(JSON.stringify(newEmails));
      });
    }
  }, 15000); // every 15 sec
};
