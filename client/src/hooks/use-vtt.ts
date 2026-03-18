import { useEffect, useRef, useState } from "react";
import { useAuth } from "./use-auth";

interface VTTWebSocketHook {
  sendMessage: (msg: any) => void;
  lastMessage: any;
  isConnected: boolean;
}

export function useVTTWebSocket(gameId: number | undefined, characterId: number | null = null): VTTWebSocketHook {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!gameId || !user) return;

    // Connect to websocket relative to current origin
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/vtt`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      // Immediately send join event
      ws.current?.send(JSON.stringify({
        type: "join",
        gameId,
        userId: user.id,
        characterId
      }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [gameId, user?.id, characterId]); // Removed user object from deps to prevent re-renders, mapped to user.id

  const sendMessage = (msg: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  };

  return { sendMessage, lastMessage, isConnected };
}
