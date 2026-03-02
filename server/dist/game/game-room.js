"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../../shared/types");
class GameRoom {
    constructor() {
        this.id = (0, uuid_1.v4)();
        this.players = new Map();
        this.gameState = {
            phase: types_1.GamePhase.WAITING,
            currentPlayerId: '',
            lastPlayedCards: [],
            bottomCards: [],
            landlordId: '',
            winnerId: ''
        };
    }
    addPlayer(player) {
        if (this.players.size >= 3) {
            return false;
        }
        this.players.set(player.id, player);
        return true;
    }
    removePlayer(playerId) {
        this.players.delete(playerId);
    }
    getPlayerCount() {
        return this.players.size;
    }
    isFull() {
        return this.players.size === 3;
    }
    startGame() {
        if (this.players.size !== 3) {
            throw new Error('Need exactly 3 players to start game');
        }
        // Initialize game state
        this.gameState.phase = types_1.GamePhase.DEALING;
        // Deal cards logic would go here
        // This is simplified for now
        this.gameState.phase = types_1.GamePhase.BIDDING;
        const playersArray = Array.from(this.players.values());
        this.gameState.currentPlayerId = playersArray[0].id;
    }
    handleGameAction(playerId, action) {
        const player = this.players.get(playerId);
        if (!player) {
            throw new Error('Player not found');
        }
        switch (action.type) {
            case 'CALL_LANDLORD':
                this.handleCallLandlord(playerId, action.data);
                break;
            case 'PLAY_CARDS':
                this.handlePlayCards(playerId, action.data);
                break;
            case 'PASS':
                this.handlePass(playerId);
                break;
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
    handleCallLandlord(playerId, wantsToBeLandlord) {
        // Simplified logic
        if (wantsToBeLandlord) {
            this.gameState.landlordId = playerId;
            this.assignRoles();
            this.gameState.phase = types_1.GamePhase.PLAYING;
        }
        // Move to next player or start playing phase
        const players = Array.from(this.players.values());
        const currentIndex = players.findIndex(p => p.id === playerId);
        const nextIndex = (currentIndex + 1) % players.length;
        this.gameState.currentPlayerId = players[nextIndex].id;
    }
    assignRoles() {
        this.players.forEach(player => {
            if (player.id === this.gameState.landlordId) {
                player.role = types_1.PlayerRole.LANDLORD;
            }
            else {
                player.role = types_1.PlayerRole.FARMER;
            }
        });
    }
    handlePlayCards(playerId, cards) {
        // Validate play and update game state
        this.gameState.lastPlayedCards = cards;
        this.gameState.currentPlayerId = this.getNextPlayerId(playerId);
    }
    handlePass(playerId) {
        this.gameState.currentPlayerId = this.getNextPlayerId(playerId);
    }
    getNextPlayerId(currentPlayerId) {
        const players = Array.from(this.players.values());
        const currentIndex = players.findIndex(p => p.id === currentPlayerId);
        return players[(currentIndex + 1) % players.length].id;
    }
    cleanupDisconnectedPlayers() {
        // Remove any disconnected players
        // In a real implementation, we'd track connection status
    }
    toJSON() {
        return {
            id: this.id,
            players: Array.from(this.players.values()),
            gameState: this.gameState
        };
    }
}
exports.GameRoom = GameRoom;
//# sourceMappingURL=game-room.js.map