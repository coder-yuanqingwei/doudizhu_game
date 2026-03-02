import { v4 as uuidv4 } from 'uuid';
import { GameRoom } from './game-room';
import { RoomInfo, Player } from '../types/game';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  createRoom(creatorId: string, creatorName: string): string {
    const roomId = uuidv4();
    const room = new GameRoom(roomId, creatorId, creatorName);
    this.rooms.set(roomId, room);
    return roomId;
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomInfo(): RoomInfo[] {
    const roomInfos: RoomInfo[] = [];
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

  cleanupEmptyRooms(): void {
    for (const [roomId, room] of this.rooms) {
      room.cleanupDisconnectedPlayers();
      if (room.getPlayerCount() === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  removePlayerFromAllRooms(playerId: string): void {
    for (const room of this.rooms.values()) {
      room.removePlayer(playerId);
    }
  }
}