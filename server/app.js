const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CORS 配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true
}));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 游戏房间管理
const rooms = new Map();

class GameRoom {
  constructor(roomId, creatorId, creatorName) {
    this.roomId = roomId;
    this.players = [
      { id: creatorId, name: creatorName, cards: [], isLandlord: false, isConnected: true }
    ];
    this.gameState = {
      phase: 'waiting', // waiting, bidding, playing, ended
      currentPlayerIndex: 0,
      lastPlayedCards: [],
      bottomCards: [],
      landlordId: null,
      winnerId: null
    };
    this.deck = this.createDeck();
    this.shuffleDeck();
  }

  createDeck() {
    const suits = ['♠', '♥', '♣', '♦'];
    const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    let deck = [];
    
    // 创建普通牌
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push(suit + rank);
      }
    }
    
    // 添加大小王
    deck.push('JOKER_SMALL');
    deck.push('JOKER_BIG');
    
    return deck;
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  addPlayer(playerId, playerName) {
    if (this.players.length < 3) {
      this.players.push({ id: playerId, name: playerName, cards: [], isLandlord: false, isConnected: true });
      return true;
    }
    return false;
  }

  startGame() {
    if (this.players.length !== 3) return false;
    
    // 发牌
    const cardsPerPlayer = 17;
    for (let i = 0; i < 3; i++) {
      this.players[i].cards = this.deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
      this.players[i].cards.sort();
    }
    this.gameState.bottomCards = this.deck.slice(51, 54);
    this.gameState.phase = 'bidding';
    this.gameState.currentPlayerIndex = 0;
    
    return true;
  }

  getPlayerById(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  broadcast(message, senderId = null) {
    this.players.forEach(player => {
      if (player.isConnected && player.id !== senderId) {
        const client = clients.get(player.id);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      }
    });
  }
}

const clients = new Map();

wss.on('connection', (ws) => {
  const playerId = uuidv4();
  clients.set(playerId, ws);
  
  console.log(`新玩家连接: ${playerId}`);
  
  // 发送连接成功消息
  ws.send(JSON.stringify({
    type: 'connected',
    playerId: playerId
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleClientMessage(ws, playerId, message);
    } catch (error) {
      console.error('消息解析错误:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '无效的消息格式'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`玩家断开连接: ${playerId}`);
    // 标记玩家为断开连接
    for (const room of rooms.values()) {
      const player = room.getPlayerById(playerId);
      if (player) {
        player.isConnected = false;
        // 如果房间中所有玩家都断开了，清理房间
        const connectedPlayers = room.players.filter(p => p.isConnected);
        if (connectedPlayers.length === 0) {
          rooms.delete(room.roomId);
        }
      }
    }
    clients.delete(playerId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
  });
});

function handleClientMessage(ws, playerId, message) {
  switch (message.type) {
    case 'set_player_name':
      // 玩家设置名字（在房间消息中处理）
      break;
      
    case 'create_room':
      const roomId = uuidv4();
      const room = new GameRoom(roomId, playerId, message.playerName);
      rooms.set(roomId, room);
      ws.send(JSON.stringify({
        type: 'room_created',
        roomId: roomId,
        players: room.players
      }));
      break;
      
    case 'join_room':
      const targetRoom = rooms.get(message.roomId);
      if (!targetRoom) {
        ws.send(JSON.stringify({
          type: 'error',
          message: '房间不存在'
        }));
        return;
      }
      
      if (targetRoom.players.length >= 3) {
        ws.send(JSON.stringify({
          type: 'error',
          message: '房间已满'
        }));
        return;
      }
      
      targetRoom.addPlayer(playerId, message.playerName);
      const updatedPlayers = targetRoom.players;
      
      // 通知所有玩家房间更新
      targetRoom.broadcast({
        type: 'room_updated',
        players: updatedPlayers
      }, playerId);
      
      // 发送确认给加入的玩家
      ws.send(JSON.stringify({
        type: 'joined_room',
        roomId: message.roomId,
        players: updatedPlayers
      }));
      
      // 如果房间满了，开始游戏
      if (updatedPlayers.length === 3) {
        setTimeout(() => {
          if (targetRoom.startGame()) {
            targetRoom.broadcast({
              type: 'game_started',
              gameState: targetRoom.gameState,
              currentPlayerId: targetRoom.players[targetRoom.gameState.currentPlayerIndex].id,
              bottomCards: targetRoom.gameState.bottomCards
            });
          }
        }, 1000);
      }
      break;
      
    case 'get_rooms':
      const availableRooms = Array.from(rooms.values())
        .filter(room => room.players.length < 3)
        .map(room => ({
          id: room.roomId,
          playerCount: room.players.length,
          isFull: room.players.length >= 3
        }));
      
      ws.send(JSON.stringify({
        type: 'rooms_list',
        rooms: availableRooms
      }));
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `未知的消息类型: ${message.type}`
      }));
  }
}

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`✅ 斗地主 WebSocket 服务器启动成功！`);
  console.log(`🌐 HTTP 服务: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket 服务: ws://localhost:${PORT}`);
  console.log(`🎮 前端地址: http://localhost:3001`);
});