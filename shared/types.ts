export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isConnected: boolean;
}

export interface GameRoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isFull: boolean;
  status: 'waiting' | 'playing' | 'finished';
}