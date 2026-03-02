import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { RoomManager } from './game/room-manager';
import { 
  ClientMessage, 
  ServerMessage, 
  JoinRoomData,
  CreateRoomData,
  PlayCardsData,
  CallLandlordData
} from './types/messages';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketWithPlayer extends WebSocket {
  playerId?: string;
  playerName?: string;
}

export class WebSocketServerManager {
  private wss: WebSocketServer;
  private roomManager: RoomManager;
  private clients: Map<string, WebSocketWithPlayer> = new Map();

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });
    this.roomManager = new RoomManager();
    
    this.wss.on('connection', (ws: WebSocketWithPlayer) => {
      this.handleConnection(ws);
    });

    // 定期清理空房间
    setInterval(() => {
      this.roomManager.cleanupEmptyRooms();
    }, 30000);
  }

  private handleConnection(ws: WebSocketWithPlayer): void {
    const playerId = uuidv4();
    ws.playerId = playerId;
    this.clients.set(playerId, ws);

    ws.on('message', (data: string) => {
      try {
        const message: ClientMessage = JSON.parse(data);
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      console.log(`Player ${ws.playerId} disconnected`);
      if (ws.playerId) {
        this.roomManager.removePlayerFromAllRooms(ws.playerId);
        this.clients.delete(ws.playerId);
      }
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    // 发送连接成功消息
    this.sendMessage(ws, {
      type: 'connected',
      playerId: playerId
    });
  }

  private handleMessage(ws: WebSocketWithPlayer, message: ClientMessage): void {
    switch (message.type) {
      case 'set_player_name':
        this.handleSetPlayerName(ws, message.name);
        break;
      case 'create_room':
        this.handleCreateRoom(ws, message as CreateRoomData);
        break;
      case 'join_room':
        this.handleJoinRoom(ws, message as JoinRoomData);
        break;
      case 'get_rooms':
        this.handleGetRooms(ws);
        break;
      case 'call_landlord':
        this.handleCallLandlord(ws, message as CallLandlordData);
        break;
      case 'play_cards':
        this.handlePlayCards(ws, message as PlayCardsData);
        break;
      case 'pass_turn':
        this.handlePassTurn(ws);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private handleSetPlayerName(ws: WebSocketWithPlayer, name: string): void {
    if (!ws.playerId) return;
    ws.playerName = name;
    console.log(`Player ${ws.playerId} set name to ${name}`);
  }

  private handleCreateRoom(ws: WebSocketWithPlayer, data: CreateRoomData): void {
    if (!ws.playerId || !ws.playerName) {
      this.sendError(ws, 'Player name not set');
      return;
    }

    const roomId = this.roomManager.createRoom(ws.playerId, ws.playerName);
    const room = this.roomManager.getRoom(roomId);
    if (room) {
      this.sendMessage(ws, {
        type: 'room_created',
        roomId: roomId,
        players: room.getPlayers()
      });
    }
  }

  private handleJoinRoom(ws: WebSocketWithPlayer, data: JoinRoomData): void {
    if (!ws.playerId || !ws.playerName) {
      this.sendError(ws, 'Player name not set');
      return;
    }

    const room = this.roomManager.getRoom(data.roomId);
    if (!room) {
      this.sendError(ws, 'Room not found');
      return;
    }

    if (room.getPlayerCount() >= 3) {
      this.sendError(ws, 'Room is full');
      return;
    }

    room.addPlayer(ws.playerId, ws.playerName);
    const players = room.getPlayers();
    
    // 通知所有玩家房间更新
    this.broadcastToRoom(data.roomId, {
      type: 'room_updated',
      players: players
    });

    // 如果房间满3人，开始游戏
    if (players.length === 3) {
      setTimeout(() => {
        room.startGame();
        this.broadcastToRoom(data.roomId, {
          type: 'game_started',
          gameState: room.getGameState(),
          currentPlayerId: room.getCurrentPlayerId(),
          bottomCards: room.getBottomCards()
        });
      }, 1000);
    }
  }

  private handleGetRooms(ws: WebSocketWithPlayer): void {
    const rooms = this.roomManager.getRoomInfo();
    this.sendMessage(ws, {
      type: 'rooms_list',
      rooms: rooms
    });
  }

  private handleCallLandlord(ws: WebSocketWithPlayer, data: CallLandlordData): void {
    if (!ws.playerId) return;
    
    const room = this.findRoomByPlayer(ws.playerId);
    if (!room) {
      this.sendError(ws, 'Not in a room');
      return;
    }

    room.callLandlord(ws.playerId, data.wantsToBeLandlord);
    const gameState = room.getGameState();
    
    this.broadcastToRoom(room.getId(), {
      type: 'landlord_called',
      gameState: gameState,
      currentPlayerId: room.getCurrentPlayerId()
    });

    // 检查是否完成叫地主阶段
    if (gameState.phase === 'playing') {
      this.broadcastToRoom(room.getId(), {
        type: 'bidding_complete',
        landlordId: room.getLandlordId(),
        bottomCards: room.getBottomCards()
      });
    }
  }

  private handlePlayCards(ws: WebSocketWithPlayer, data: PlayCardsData): void {
    if (!ws.playerId) return;
    
    const room = this.findRoomByPlayer(ws.playerId);
    if (!room) {
      this.sendError(ws, 'Not in a room');
      return;
    }

    const success = room.playCards(ws.playerId, data.cards);
    if (!success) {
      this.sendError(ws, 'Invalid play');
      return;
    }

    const gameState = room.getGameState();
    const currentPlayerId = room.getCurrentPlayerId();
    const lastPlayedCards = room.getLastPlayedCards();
    
    this.broadcastToRoom(room.getId(), {
      type: 'cards_played',
      playerId: ws.playerId,
      cards: data.cards,
      gameState: gameState,
      currentPlayerId: currentPlayerId,
      lastPlayedCards: lastPlayedCards
    });

    // 检查游戏是否结束
    if (gameState.phase === 'ended') {
      const winnerId = room.getWinnerId();
      this.broadcastToRoom(room.getId(), {
        type: 'game_ended',
        winnerId: winnerId,
        scores: room.getScores()
      });
    }
  }

  private handlePassTurn(ws: WebSocketWithPlayer): void {
    if (!ws.playerId) return;
    
    const room = this.findRoomByPlayer(ws.playerId);
    if (!room) {
      this.sendError(ws, 'Not in a room');
      return;
    }

    const success = room.passTurn(ws.playerId);
    if (!success) {
      this.sendError(ws, 'Cannot pass turn');
      return;
    }

    const gameState = room.getGameState();
    const currentPlayerId = room.getCurrentPlayerId();
    const lastPlayedCards = room.getLastPlayedCards();
    
    this.broadcastToRoom(room.getId(), {
      type: 'turn_passed',
      playerId: ws.playerId,
      gameState: gameState,
      currentPlayerId: currentPlayerId,
      lastPlayedCards: lastPlayedCards
    });
  }

  private findRoomByPlayer(playerId: string): GameRoom | null {
    for (const room of this.roomManager.rooms.values()) {
      if (room.hasPlayer(playerId)) {
        return room;
      }
    }
    return null;
  }

  private broadcastToRoom(roomId: string, message: ServerMessage): void {
    const room = this.roomManager.getRoom(roomId);
    if (!room) return;

    const players = room.getPlayers();
    for (const player of players) {
      const client = this.clients.get(player.id);
      if (client && client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
      }
    }
  }

  private sendMessage(ws: WebSocketWithPlayer, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocketWithPlayer, message: string): void {
    this.sendMessage(ws, {
      type: 'error',
      message: message
    });
  }
}