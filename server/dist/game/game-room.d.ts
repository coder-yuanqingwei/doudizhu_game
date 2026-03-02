import { GameRoomState, Player, GameAction } from '../../shared/types';
export declare class GameRoom {
    id: string;
    players: Map<string, Player>;
    gameState: GameRoomState;
    private gameLogic;
    constructor();
    addPlayer(player: Player): boolean;
    removePlayer(playerId: string): void;
    getPlayerCount(): number;
    isFull(): boolean;
    startGame(): void;
    handleGameAction(playerId: string, action: GameAction): void;
    private handleCallLandlord;
    private assignRoles;
    private handlePlayCards;
    private handlePass;
    private getNextPlayerId;
    cleanupDisconnectedPlayers(): void;
    toJSON(): any;
}
