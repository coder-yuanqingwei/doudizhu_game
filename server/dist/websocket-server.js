"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServerManager = void 0;
const ws_1 = __importStar(require("ws"));
const room_manager_1 = require("./game/room-manager");
const uuid_1 = require("uuid");
class WebSocketServerManager {
    constructor(server) {
        this.clients = new Map();
        this.wss = new ws_1.WebSocketServer({ server });
        this.roomManager = new room_manager_1.RoomManager();
        this.wss.on('connection', (ws) => {
            this.handleConnection(ws);
        });
        // 定期清理空房间
        setInterval(() => {
            this.roomManager.cleanupEmptyRooms();
        }, 30000);
    }
    handleConnection(ws) {
        const playerId = (0, uuid_1.v4)();
        ws.playerId = playerId;
        this.clients.set(playerId, ws);
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(ws, message);
            }
            catch (error) {
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
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        // 发送连接成功消息
        this.sendMessage(ws, {
            type: 'connected',
            playerId: playerId
        });
    }
    handleMessage(ws, message) {
        switch (message.type) {
            case 'set_player_name':
                this.handleSetPlayerName(ws, message.name);
                break;
            case 'create_room':
                this.handleCreateRoom(ws, message);
                break;
            case 'join_room':
                this.handleJoinRoom(ws, message);
                break;
            case 'get_rooms':
                this.handleGetRooms(ws);
                break;
            case 'call_landlord':
                this.handleCallLandlord(ws, message);
                break;
            case 'play_cards':
                this.handlePlayCards(ws, message);
                break;
            case 'pass_turn':
                this.handlePassTurn(ws);
                break;
            default:
                this.sendError(ws, `Unknown message type: ${message.type}`);
        }
    }
    handleSetPlayerName(ws, name) {
        if (!ws.playerId)
            return;
        ws.playerName = name;
        console.log(`Player ${ws.playerId} set name to ${name}`);
    }
    handleCreateRoom(ws, data) {
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
    handleJoinRoom(ws, data) {
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
    handleGetRooms(ws) {
        const rooms = this.roomManager.getRoomInfo();
        this.sendMessage(ws, {
            type: 'rooms_list',
            rooms: rooms
        });
    }
    handleCallLandlord(ws, data) {
        if (!ws.playerId)
            return;
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
    handlePlayCards(ws, data) {
        if (!ws.playerId)
            return;
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
    handlePassTurn(ws) {
        if (!ws.playerId)
            return;
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
    findRoomByPlayer(playerId) {
        for (const room of this.roomManager.rooms.values()) {
            if (room.hasPlayer(playerId)) {
                return room;
            }
        }
        return null;
    }
    broadcastToRoom(roomId, message) {
        const room = this.roomManager.getRoom(roomId);
        if (!room)
            return;
        const players = room.getPlayers();
        for (const player of players) {
            const client = this.clients.get(player.id);
            if (client && client.readyState === ws_1.default.OPEN) {
                this.sendMessage(client, message);
            }
        }
    }
    sendMessage(ws, message) {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    sendError(ws, message) {
        this.sendMessage(ws, {
            type: 'error',
            message: message
        });
    }
}
exports.WebSocketServerManager = WebSocketServerManager;
//# sourceMappingURL=websocket-server.js.map