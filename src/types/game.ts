export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker'
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2'

export interface Card {
  id: string
  suit: Suit
  rank: Rank | 'small' | 'big' // for jokers
  value: number // numeric value for comparison
}

export type PlayerRole = 'landlord' | 'peasant'
export type GameStatus = 'waiting' | 'bidding' | 'playing' | 'finished'

export interface Player {
  id: string
  name: string
  role: PlayerRole | null
  cards: Card[]
  isReady: boolean
  isCurrentTurn: boolean
}

export interface Room {
  id: string
  players: Player[]
  status: GameStatus
  currentTurn: string | null
  landlordId: string | null
  lastPlayedCards: Card[]
  callScore: number // 0, 1, 2, 3 (3 means no one called)
}