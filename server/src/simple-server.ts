import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// 简单的游戏房间结构
interface Player {
  id: string;
  name: string;
  cards: string[];
  isLandlord: boolean;
}

interface Room {
  id: string;
  players: Player[];
  gameState: 'waiting' | 'bidding' | 'playing' | 'ended';
  currentPlayerIndex: number;
  bottomCards: string[];
  landlordId: string | null;
  lastPlayedCards: string[];
}

class SimpleGameServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });
    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });
  }

  private handleConnection(ws: WebSocket & { id?: string }): void {
    const playerId = uuidv4();
    ws.id = playerId;

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Message parse error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }));
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(playerId);
    });

    // 发送连接确认
    ws.send(JSON.stringify({ type: 'connected', playerId }));
  }

  private handleMessage(ws: WebSocket & { id?: string }, message: any): void {
    if (!ws.id) return;

    switch (message.type) {
      case 'create_room':
        this.createRoom(ws.id, message.playerName);
        break;
      case 'join_room':
        this.joinRoom(ws.id, message.roomId, message.playerName);
        break;
      case 'get_rooms':
        this.sendRoomsList(ws);
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown command' }));
    }
  }

  private createRoom(playerId: string, playerName: string): void {
    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      players: [{ id: playerId, name: playerName, cards: [], isLandlord: false }],
      gameState: 'waiting',
      currentPlayerIndex: 0,
      bottomCards: [],
      landlordId: null,
      lastPlayedCards: []
    };
    
    this.rooms.set(roomId, room);
    this.playerToRoom.set(playerId, roomId);
    
    // 找到对应的 WebSocket 并发送响应
    const ws = this.findWebSocket(playerId);
    if (ws) {
      ws.send(JSON.stringify({ 
        type: 'room_created', 
        roomId,
        players: room.players 
      }));
    }
  }

  private joinRoom(playerId: string, roomId: string, playerName: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      const ws = this.findWebSocket(playerId);
      if (ws) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
      }
      return;
    }

    if (room.players.length >= 3) {
      const ws = this.findWebSocket(playerId);
      if (ws) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }));
      }
      return;
    }

    room.players.push({ id: playerId, name: playerName, cards: [], isLandlord: false });
    this.playerToRoom.set(playerId, roomId);

    // 通知所有房间成员
    this.broadcastToRoom(roomId, { 
      type: 'room_updated', 
      players: room.players 
    });

    // 如果房间满了，开始游戏
    if (room.players.length === 3) {
      setTimeout(() => {
        this.startGame(roomId);
      }, 1000);
    }
  }

  private startGame(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length !== 3) return;

    // 简单的发牌逻辑（实际应该使用完整的游戏逻辑）
    const allCards = this.generateDeck();
    this.shuffleArray(allCards);
    
    // 发牌
    for (let i = 0; i < 17; i++) {
      room.players[0].cards.push(allCards[i]);
      room.players[1].cards.push(allCards[i + 17]);
      room.players[2].cards.push(allCards[i + 34]);
    }
    room.bottomCards = [allCards[51], allCards[52], allCards[53]];
    
    room.gameState = 'bidding';
    room.currentPlayerIndex = 0;
    
    this.broadcastToRoom(roomId, {
      type: 'game_started',
      players: room.players.map(p => ({ ...p, cards: p.cards })),
      bottomCards: room.bottomCards,
      currentPlayerId: room.players[room.currentPlayerIndex].id
    });
  }

  private generateDeck(): string[] {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const deck: string[] = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(`${suit}${rank}`);
      }
    }
    deck.push('🃏'); // 小王
    deck.push('🃏'); // 大王
    
    return deck;
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private sendRoomsList(ws: WebSocket): void {
    const roomsList = Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      playerCount: room.players.length,
      isFull: room.players.length >= 3
    }));
    ws.send(JSON.stringify({ type: 'rooms_list', rooms: roomsList }));
  }

  private broadcastToRoom(roomId: string, message: any): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const player of room.players) {
      const ws = this.findWebSocket(player.id);
      if (ws) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  private findWebSocket(playerId: string): (WebSocket & { id?: string }) | undefined {
    // 这里需要维护 WebSocket 列表，简化处理
    // 实际项目中应该维护一个 Map<string, WebSocket>
    return undefined; // 简化版本，实际需要实现
  }

  private handleDisconnect(playerId: string): void {
    const roomId = this.playerToRoom.get(playerId);
    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== playerId);
        if (room.players.length === 0) {
          this.rooms.delete(roomId);
        } else {
          this.broadcastToRoom(roomId, { 
            type: 'player_left', 
            playerId,
            players: room.players 
          });
        }
      }
      this.playerToRoom.delete(playerId);
    }
  }
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('斗地主 WebSocket 服务器运行中...\n');
});

// 启动 WebSocket 服务器
const gameServer = new SimpleGameServer(server);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
server.listen(PORT, () => {
  console.log(`✅ 斗地主在线多人服务器启动成功！`);
  console.log(`🌐 WebSocket 地址: ws://localhost:${PORT}`);
  console.log(`🎮 前端地址: http://localhost:3001`);
});