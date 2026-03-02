export interface Player {
    id: string;
    name: string;
    socketId: string;
    isReady: boolean;
    isLandlord: boolean;
    cards: string[];
    score: number;
}
export interface GameRoom {
    id: string;
    name: string;
    players: Player[];
    gameState: GameState;
    bottomCards: string[];
    lastPlayedCards: string[];
    currentPlayerIndex: number;
    createdAt: number;
    maxPlayers: number;
}
export interface GameState {
    phase: 'waiting' | 'bidding' | 'playing' | 'ended';
    currentTurn: number;
    winner?: string;
}
export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: number;
}
export type ClientMessageType = 'JOIN_ROOM' | 'CREATE_ROOM' | 'READY' | 'CALL_LANDLORD' | 'PLAY_CARDS' | 'PASS_TURN' | 'CHAT_MESSAGE';
export type ServerMessageType = 'ROOM_CREATED' | 'ROOM_JOINED' | 'ROOM_UPDATED' | 'GAME_STARTED' | 'BIDDING_UPDATE' | 'PLAY_UPDATE' | 'GAME_ENDED' | 'CHAT_BROADCAST' | 'ERROR';
