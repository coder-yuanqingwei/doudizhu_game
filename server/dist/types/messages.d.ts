export interface WebSocketMessage {
    type: string;
    data?: any;
}
export interface JoinRoomMessage extends WebSocketMessage {
    type: 'join-room';
    data: {
        roomId: string;
        playerName: string;
    };
}
export interface CreateRoomMessage extends WebSocketMessage {
    type: 'create-room';
    data: {
        playerName: string;
    };
}
export interface CallLandlordMessage extends WebSocketMessage {
    type: 'call-landlord';
    data: {
        wantsToBe: boolean;
    };
}
export interface PlayCardsMessage extends WebSocketMessage {
    type: 'play-cards';
    data: {
        cards: string[];
    };
}
export interface PassTurnMessage extends WebSocketMessage {
    type: 'pass-turn';
}
export interface RoomCreatedMessage extends WebSocketMessage {
    type: 'room-created';
    data: {
        roomId: string;
        playerId: string;
    };
}
export interface PlayerJoinedMessage extends WebSocketMessage {
    type: 'player-joined';
    data: {
        playerId: string;
        playerName: string;
        isHost: boolean;
    };
}
export interface GameStartedMessage extends WebSocketMessage {
    type: 'game-started';
    data: {
        players: Array<{
            id: string;
            name: string;
            isHost: boolean;
        }>;
        currentPlayerId: string;
    };
}
export interface CardsDealtMessage extends WebSocketMessage {
    type: 'cards-dealt';
    data: {
        handCards: string[];
        bottomCards: string[];
    };
}
export interface BiddingUpdateMessage extends WebSocketMessage {
    type: 'bidding-update';
    data: {
        currentPlayerId: string;
        currentCall: number;
    };
}
export interface LandlordDeterminedMessage extends WebSocketMessage {
    type: 'landlord-determined';
    data: {
        landlordId: string;
        bottomCards: string[];
    };
}
export interface PlayUpdateMessage extends WebSocketMessage {
    type: 'play-update';
    data: {
        playerId: string;
        playedCards: string[];
        lastPlayedCards: string[];
        currentPlayerId: string;
        playerCardsCount: Map<string, number>;
    };
}
export interface GameEndedMessage extends WebSocketMessage {
    type: 'game-ended';
    data: {
        winnerId: string;
        winnerTeam: 'landlord' | 'peasants';
        scores: Map<string, number>;
    };
}
export interface ErrorMessage extends WebSocketMessage {
    type: 'error';
    data: {
        message: string;
    };
}
