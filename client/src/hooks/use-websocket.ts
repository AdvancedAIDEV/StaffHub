import { useEffect, useRef } from "react";
import { useAuth } from "./use-auth";
import { queryClient } from "@/lib/queryClient";

type WSMessage = {
  type: string;
  [key: string]: any;
};

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        if (data.type === "new_message") {
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        }
      } catch {}
    };

    socket.onclose = () => {
      setTimeout(() => {
        if (wsRef.current === socket) {
          wsRef.current = null;
        }
      }, 1000);
    };

    wsRef.current = socket;

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [user?.id]);
}
