import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

export interface VTTClient extends WebSocket {
  gameId?: number;
  userId?: string;
  characterId?: number | null;
}

export function setupVTTWebSockets(server: Server) {
  const wss = new WebSocketServer({ server, path: "/vtt" });

  wss.on("connection", (ws: VTTClient) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "join") {
          // Map connection to a game room
          ws.gameId = data.gameId;
          ws.userId = data.userId;
          ws.characterId = data.characterId;
          
          // Optional: broadcast system message that someone connected
          broadcastToGame(wss, ws.gameId!, {
            type: "system",
            content: `${data.userId} connected to table.`
          }, ws);
        } else if (ws.gameId) {
          // Normal broadcast for token movements, map changes, pings, chat inserts
          broadcastToGame(wss, ws.gameId, data, ws);
        }
      } catch (e) {
        console.error("VTT WebSocket message parse error", e);
      }
    });

    ws.on("close", () => {
      if (ws.gameId) {
        // Optional disconnect broadcast
      }
    });
  });
}

function broadcastToGame(wss: WebSocketServer, gameId: number, data: any, senderWs: VTTClient | null = null) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    const c = client as VTTClient;
    // Broadcast to everyone in the same game, excluding the sender
    if (c !== senderWs && c.readyState === WebSocket.OPEN && c.gameId === gameId) {
      c.send(message);
    }
  });
}
