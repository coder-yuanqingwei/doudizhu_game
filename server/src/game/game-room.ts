import { v4 as uuidv4 } from 'uuid';
import { 
  GameRoomState, 
  Player, 
  Card, 
  GameAction, 
  PlayerRole,
  GamePhase,
  GameMessage
} from '../../shared/types';

export class GameRoom {
  public id: string;
  public players: Map<string, Player>;
  public gameState: GameRoomState;
  private gameLogic: any; // Will import actual game logic

  constructor() {
    this.id = uuidv4();
    this.players = new Map();
    this.gameState = {
      phase: GamePhase.WAITING,
      currentPlayerId: '',
      lastPlayedCards: [],
      bottomCards: [],
      landlordId: '',
      winnerId: ''
    };
  }

  addPlayer(player: Player): boolean {
    if (this.players.size >= 3) {
      return false;
    }
    this.players.set(player.id, player);
    return true;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  isFull(): boolean {
    return this.players.size === 3;
  }

  startGame(): void {
    if (this.players.size !== 3) {
      throw new Error('Need exactly 3 players to start game');
    }

    // Initialize game state
    this.gameState.phase = GamePhase.DEALING;
    
    // Deal cards logic would go here
    // This is simplified for now
    
    this.gameState.phase = GamePhase.BIDDING;
    const playersArray = Array.from(this.players.values());
    this.gameState.currentPlayerId = playersArray[0].id;
  }

  handleGameAction(playerId: string, action: GameAction): void {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    switch (action.type) {
      case 'CALL_LANDLORD':
        this.handleCallLandlord(playerId, action.data as boolean);
        break;
      case 'PLAY_CARDS':
        this.handlePlayCards(playerId, action.data as Card[]);
        break;
      case 'PASS':
        this.handlePass(playerId);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private handleCallLandlord(playerId: string, wantsToBeLandlord: boolean): void {
    // Simplified logic
    if (wantsToBeLandlord) {
      this.gameState.landlordId = playerId;
      this.assignRoles();
      this.gameState.phase = GamePhase.PLAYING;
    }
    
    // Move to next player or start playing phase
    const players = Array.from(this.players.values());
    const currentIndex = players.findIndex(p => p.id === playerId);
    const nextIndex = (currentIndex + 1) % players.length;
    this.gameState.currentPlayerId = players[nextIndex].id;
  }

  private assignRoles(): void {
    this.players.forEach(player => {
      if (player.id === this.gameState.landlordId) {
        player.role = PlayerRole.LANDLORD;
      } else {
        player.role = PlayerRole.FARMER;
      }
    });
  }

  private handlePlayCards(playerId: string, cards: Card[]): void {
    // Validate play and update game state
    this.gameState.lastPlayedCards = cards;
    this.gameState.currentPlayerId = this.getNextPlayerId(playerId);
  }

  private handlePass(playerId: string): void {
    this.gameState.currentPlayerId = this.getNextPlayerId(playerId);
  }

  private getNextPlayerId(currentPlayerId: string): string {
    const players = Array.from(this.players.values());
    const currentIndex = players.findIndex(p => p.id === currentPlayerId);
    return players[(currentIndex + 1) % players.length].id;
  }

  cleanupDisconnectedPlayers(): void {
    // Remove any disconnected players
    // In a real implementation, we'd track connection status
  }

  toJSON(): any {
    return {
      id: this.id,
      players: Array.from(this.players.values()),
      gameState: this.gameState
    };
  }
}