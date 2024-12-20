import { WSClientMessage } from '../types';
import { WebSocket } from 'ws';

export const createWebSocketServer = () => {
  const clients = {
    createFun: new Set<WebSocket>(),
    tradeCall: new Set<WebSocket>(),
    commentCreated: new Set<WebSocket>(),
    candle1MUpdate: new Map<string, Set<WebSocket>>()
  };

  const checkConnections = (clientSet: Set<WebSocket>) => {
    clientSet.forEach(client => {
      if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
        clientSet.delete(client);
      } else {
        try {
          client.ping();
        } catch (error) {
          console.error('Ping failed:', error);
          clientSet.delete(client);
        }
      }
    });
  };

  const checkCandleConnections = (clientSetMap: Map<string, Set<WebSocket>>) => {
    clientSetMap.forEach((subscribers, token) => {
      checkConnections(subscribers);
      if (subscribers.size === 0) {
        clients.candle1MUpdate.delete(token);
      }
    });
  };

  const broadcast = (clientSet: Set<WebSocket>, data: any) => {

    const deadClients = new Set<WebSocket>();

    clientSet.forEach(client => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        } else {
          deadClients.add(client);
        }
      } catch (error) {
        console.error('Broadcast error:', error);
        deadClients.add(client);
      }
    });

    deadClients.forEach(client => clientSet.delete(client));
  };

  const setupWebSocket = (ws: WebSocket, clientSet: Set<WebSocket>) => {
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('close', () => {
      clientSet.delete(ws);
      console.log(`Client disconnected. Remaining clients: ${clientSet.size}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clientSet.delete(ws);
    });

    clientSet.add(ws);
    console.log(`New client connected. Total clients: ${clientSet.size}`);
  };

  const setupCandleWebSocket = (ws: WebSocket) => {

    ws.on("message", (message) => {
      try {
        const data: WSClientMessage = JSON.parse(message.toString());

        if (!data.token_address) {
          ws.send(JSON.stringify({
            error: 'Missing token_address'
          }));
          return;
        }

        const normalizedAddress = data.token_address.toLowerCase();

        switch (data.type) {
          case 'SUBSCRIBE_CANDLE':
            clients.candle1MUpdate.forEach((subscribers, token) => {
              if (subscribers.has(ws)) {
                  console.log(`Client already subscribed to ${token}, unsubscribing...`);
                  unsubscribeFromCandleUpdates(ws, token);
              }
          });
            subscribeToCandleUpdates(ws, normalizedAddress);
            break;
          case 'UNSUBSCRIBE_CANDLE':
            clients.candle1MUpdate.forEach((subscribers, token) => {
              if (subscribers.has(ws)) {
                unsubscribeFromCandleUpdates(ws, token);
              }
            });
            break;
          default:
            ws.send(JSON.stringify({
              error: 'Invalid message type'
            }));
        }

      }
      catch (error) {
        console.error('Error handling message:', error);
        ws.send(JSON.stringify({
          error: 'Invalid message format'
        }));
      }
    });

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('close', () => {
      clients.candle1MUpdate.forEach((subscribers, token) => {
        if (subscribers.has(ws)) {
          unsubscribeFromCandleUpdates(ws, token);
        }
      });
      console.log(`Client disconnected. Remaining clients: ${clients.candle1MUpdate.size}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.candle1MUpdate.forEach((subscribers, token) => {
        if (subscribers.has(ws)) {
          unsubscribeFromCandleUpdates(ws, token);
        }
      });

    });
  };

  const subscribeToCandleUpdates = (ws: WebSocket, token_address: string) => {
    if (!clients.candle1MUpdate.has(token_address)) {
      clients.candle1MUpdate.set(token_address, new Set());
    }
    clients.candle1MUpdate.get(token_address)!.add(ws);
    console.log(`Client subscribed to candles for ${token_address}. Total subscribers: ${clients.candle1MUpdate.get(token_address)!.size}`);
  };

  const unsubscribeFromCandleUpdates = (ws: WebSocket, token_address: string) => {
    const subscribers = clients.candle1MUpdate.get(token_address);
    if (subscribers) {
      subscribers.delete(ws);
      if (subscribers.size === 0) {
        clients.candle1MUpdate.delete(token_address);
      }
      console.log(`Client unsubscribed from candles for ${token_address}. Remaining subscribers: ${subscribers.size}`);
    }
  };

  setInterval(() => {
    checkConnections(clients.createFun);
    checkConnections(clients.tradeCall);
    checkConnections(clients.commentCreated);
    checkCandleConnections(clients.candle1MUpdate);
  }, 30000);


  return {
    addTokenClient: (ws: WebSocket) => {
      setupWebSocket(ws, clients.createFun);
    },

    addTradeClient: (ws: WebSocket) => {
      setupWebSocket(ws, clients.tradeCall);
    },

    addReplyClient: (ws: WebSocket) => {
      setupWebSocket(ws, clients.commentCreated);
    },

    addcandle1MClient: (ws: WebSocket) => {
      setupCandleWebSocket(ws);
    },

    broadcastFunCreated: (data: any) => {
      console.log(`Broadcasting fun created to ${clients.createFun.size} clients`);
      broadcast(clients.createFun, data);
    },

    broadcastTradeCall: (data: any) => {
      console.log(`Broadcasting trade call to ${clients.tradeCall.size} clients`);
      broadcast(clients.tradeCall, data);
    },

    broadcastCommentCreated: (data: any) => {
      console.log(`Broadcasting reply call to ${clients.commentCreated.size} clients`);
      broadcast(clients.commentCreated, data);
    },

    broadcastCandle1MUpdated: (data: any) => {
      console.log(`Broadcasting candle1M update to ${clients.candle1MUpdate.size} clients`);
      const subscribers = clients.candle1MUpdate.get(data.data.token_address.toLowerCase());
      if (subscribers && subscribers.size > 0) {
        console.log(`Broadcasting candle1M update for ${data.data.token_address} to ${subscribers.size} clients`);
        broadcast(subscribers, data);
      }
    },

    getStats: () => ({
      funClientsCount: clients.createFun.size,
      tradeClientsCount: clients.tradeCall.size,
      replyClientsCount: clients.commentCreated.size,
      candle1MClientsCount: clients.candle1MUpdate.size
    })
  };
};