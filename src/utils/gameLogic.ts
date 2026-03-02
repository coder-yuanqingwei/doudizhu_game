import { CardValue, Suit, PlayType } from '@/types/game'
import { getCardValue, compareCards } from './cardUtils'

// 牌面值映射（用于比较大小）
const CARD_VALUES: Record<string, number> = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, 'BJ': 16, 'CJ': 17
}

// 获取牌的数值（用于比较）
export function getCardRank(card: string): number {
  if (card === 'BJ') return 17 // 大王
  if (card === 'CJ') return 16 // 小王
  const value = card.slice(0, -1)
  return CARD_VALUES[value] || 0
}

// 解析手牌为数值数组
export function parseHand(cards: string[]): number[] {
  return cards.map(getCardRank).sort((a, b) => a - b)
}

// 检测牌型
export function detectPlayType(cards: string[]): PlayType | null {
  if (cards.length === 0) return null
  
  const ranks = parseHand(cards)
  
  // 王炸
  if (cards.length === 2 && cards.includes('BJ') && cards.includes('CJ')) {
    return { type: 'rocket', rank: 17 }
  }
  
  // 炸弹
  if (cards.length === 4 && new Set(ranks).size === 1) {
    return { type: 'bomb', rank: ranks[0] }
  }
  
  // 单张
  if (cards.length === 1) {
    return { type: 'single', rank: ranks[0] }
  }
  
  // 对子
  if (cards.length === 2 && new Set(ranks).size === 1) {
    return { type: 'pair', rank: ranks[0] }
  }
  
  // 三张
  if (cards.length === 3 && new Set(ranks).size === 1) {
    return { type: 'triple', rank: ranks[0] }
  }
  
  // 三带一
  if (cards.length === 4) {
    const rankCounts: Record<number, number> = {}
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1)
    const counts = Object.values(rankCounts).sort()
    if (counts.length === 2 && counts[0] === 1 && counts[1] === 3) {
      const tripleRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[parseInt(rank)] === 3)!)
      return { type: 'triple_with_single', rank: tripleRank }
    }
  }
  
  // 三带二（飞机不带翅膀）
  if (cards.length === 5) {
    const rankCounts: Record<number, number> = {}
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1)
    const counts = Object.values(rankCounts).sort()
    if (counts.length === 2 && counts[0] === 2 && counts[1] === 3) {
      const tripleRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[parseInt(rank)] === 3)!)
      return { type: 'triple_with_pair', rank: tripleRank }
    }
  }
  
  // 四带二（两个单张）
  if (cards.length === 6) {
    const rankCounts: Record<number, number> = {}
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1)
    const counts = Object.values(rankCounts).sort()
    if (counts.length === 3 && counts[0] === 1 && counts[1] === 1 && counts[2] === 4) {
      const quadRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[parseInt(rank)] === 4)!)
      return { type: 'quad_with_two_singles', rank: quadRank }
    }
  }
  
  // 四带二对
  if (cards.length === 8) {
    const rankCounts: Record<number, number> = {}
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1)
    const counts = Object.values(rankCounts).sort()
    if (counts.length === 3 && counts[0] === 2 && counts[1] === 2 && counts[2] === 4) {
      const quadRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[parseInt(rank)] === 4)!)
      return { type: 'quad_with_two_pairs', rank: quadRank }
    }
  }
  
  // 顺子（5张或以上连续单牌）
  if (cards.length >= 5) {
    const uniqueRanks = [...new Set(ranks)]
    if (uniqueRanks.length === cards.length && 
        uniqueRanks[uniqueRanks.length - 1] - uniqueRanks[0] === uniqueRanks.length - 1 &&
        uniqueRanks[uniqueRanks.length - 1] <= 14) { // 不能包含2、王
      return { type: 'straight', rank: uniqueRanks[0], length: uniqueRanks.length }
    }
  }
  
  // 连对（3对或以上连续对子）
  if (cards.length >= 6 && cards.length % 2 === 0) {
    const rankCounts: Record<number, number> = {}
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1)
    const pairs = Object.entries(rankCounts)
      .filter(([_, count]) => count === 2)
      .map(([rank]) => parseInt(rank))
      .sort((a, b) => a - b)
    
    if (pairs.length * 2 === cards.length && 
        pairs.length >= 3 &&
        pairs[pairs.length - 1] - pairs[0] === pairs.length - 1 &&
        pairs[pairs.length - 1] <= 13) { // 不能包含A、2、王
      return { type: 'double_straight', rank: pairs[0], length: pairs.length }
    }
  }
  
  // 飞机（2个或以上连续三张）
  if (cards.length >= 6 && cards.length % 3 === 0) {
    const rankCounts: Record<number, number> = {}
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1)
    const triples = Object.entries(rankCounts)
      .filter(([_, count]) => count === 3)
      .map(([rank]) => parseInt(rank))
      .sort((a, b) => a - b)
    
    if (triples.length * 3 === cards.length && 
        triples.length >= 2 &&
        triples[triples.length - 1] - triples[0] === triples.length - 1 &&
        triples[triples.length - 1] <= 13) { // 不能包含A、2、王
      return { type: 'airplane', rank: triples[0], length: triples.length }
    }
  }
  
  // 飞机带翅膀（需要额外处理）
  // 这里简化处理，实际游戏中可以扩展
  
  return null
}

// 比较两个牌型是否可以压制
export function canBeat(play1: PlayType, play2: PlayType): boolean {
  // 王炸最大
  if (play2.type === 'rocket') return true
  if (play1.type === 'rocket') return false
  
  // 炸弹可以压制除王炸外的任何牌
  if (play2.type === 'bomb') {
    if (play1.type !== 'bomb') return true
    return play2.rank > play1.rank
  }
  if (play1.type === 'bomb') return false
  
  // 必须是相同牌型
  if (play1.type !== play2.type) return false
  
  // 比较牌型大小
  if ('length' in play1 && 'length' in play2) {
    // 顺子、连对、飞机等需要长度相同
    if (play1.length !== play2.length) return false
  }
  
  return play2.rank > play1.rank
}

// 验证出牌是否合法
export function isValidPlay(cards: string[], lastPlayed: string[]): boolean {
  if (cards.length === 0) return false
  
  const currentPlay = detectPlayType(cards)
  if (!currentPlay) return false
  
  // 如果是第一手牌，总是合法的
  if (lastPlayed.length === 0) return true
  
  const lastPlay = detectPlayType(lastPlayed)
  if (!lastPlay) return false
  
  return canBeat(lastPlay, currentPlay)
}

// 生成一副完整的扑克牌
export function createDeck(): string[] {
  const suits: Suit[] = ['♠', '♥', '♦', '♣']
  const values: CardValue[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']
  const deck: string[] = []
  
  // 添加普通牌
  for (const suit of suits) {
    for (const value of values) {
      deck.push(`${value}${suit}`)
    }
  }
  
  // 添加大小王
  deck.push('BJ', 'CJ')
  
  return deck
}

// 洗牌
export function shuffleDeck(deck: string[]): string[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 发牌
export function dealCards(deck: string[]): {
  player1: string[]
  player2: string[]
  player3: string[]
  bottom: string[]
} {
  const player1 = deck.slice(0, 17)
  const player2 = deck.slice(17, 34)
  const player3 = deck.slice(34, 51)
  const bottom = deck.slice(51, 54)
  
  return { player1, player2, player3, bottom }
}