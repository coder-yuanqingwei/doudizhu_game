// 扑克牌工具函数
export const CARD_VALUES: Record<string, number> = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, 'BJ': 16, 'RJ': 17
}

export const CARD_SUITS = ['♠', '♥', '♦', '♣'] as const
export type CardSuit = typeof CARD_SUITS[number]

export interface Card {
  value: string
  suit: CardSuit | null // null for jokers
  display: string
}

export function createDeck(): Card[] {
  const deck: Card[] = []
  
  // 普通牌
  for (const suit of CARD_SUITS) {
    for (const [value, display] of Object.entries({
      '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', 
      '10': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A', '2': '2'
    })) {
      deck.push({ value, suit, display: `${suit}${display}` })
    }
  }
  
  // 王牌
  deck.push({ value: 'BJ', suit: null, display: '🃏' }) // 小王
  deck.push({ value: 'RJ', suit: null, display: '🃏' }) // 大王
  
  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function getCardValue(card: Card): number {
  return CARD_VALUES[card.value]
}

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => getCardValue(a) - getCardValue(b))
}