import { GameRoom } from './game-room';
import { RoomInfo } from '../types/game';
export declare class RoomManager {
    private rooms;
    createRoom(creatorId: string, creatorName: string): string;
    getRoom(roomId: string): GameRoom | undefined;
    getRoomInfo(): RoomInfo[];
    cleanupEmptyRooms(): void;
    removePlayerFromAllRooms(playerId: string): void;
}
