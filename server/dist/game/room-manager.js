"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const uuid_1 = require("uuid");
const game_room_1 = require("./game-room");
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(creatorId, creatorName) {
        const roomId = (0, uuid_1.v4)();
        const room = new game_room_1.GameRoom(roomId, creatorId, creatorName);
        this.rooms.set(roomId, room);
        return roomId;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    getRoomInfo() {
        const roomInfos = [];
        for (const [roomId, room] of this.rooms) {
            const playerCount = room.getPlayerCount();
            if (playerCount > 0) {
                roomInfos.push({
                    id: roomId,
                    playerCount,
                    isFull: playerCount >= 3,
                    status: room.getStatus()
                });
            }
        }
        return roomInfos;
    }
    cleanupEmptyRooms() {
        for (const [roomId, room] of this.rooms) {
            room.cleanupDisconnectedPlayers();
            if (room.getPlayerCount() === 0) {
                this.rooms.delete(roomId);
            }
        }
    }
    removePlayerFromAllRooms(playerId) {
        for (const room of this.rooms.values()) {
            room.removePlayer(playerId);
        }
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=room-manager.js.map