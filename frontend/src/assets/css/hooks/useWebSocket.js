// hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, onMessage) => {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      socketRef.current = new WebSocket(url);
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        // Re-s'abonner aux événements après reconnexion
        socketRef.current.send(JSON.stringify({
          type: 'SUBSCRIBE',
          channels: ['products', 'stock', 'batches', 'notifications']
        }));
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 3s...');
        // Reconnexion automatique
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }, [url, onMessage]);

  const sendMessage = useCallback((message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return { sendMessage };
};