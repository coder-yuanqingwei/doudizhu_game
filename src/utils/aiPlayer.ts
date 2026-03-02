import { CardValue, Suit, GamePhase, Player } from '@/types/game'
import { 
  generateDeck, 
  shuffleDeck, 
  isValidPlay, 
  getCardType,
  comparePlays,
  CardType
} from '@/utils/gameLogic'

export class AIPlayer {
  private playerId: string
  private playerName: string
  private cards: string[]
  
  constructor(playerId: string, playerName: string) {
    this.playerId = playerId
    this.playerName = playerName
    this.cards = []
  }
  
  setCards(cards: string[]) {
    this.cards = [...cards].sort((a, b) => {
      const cardA = this.parseCard(a)
      const cardB = this.parseCard(b)
      return cardA.value - cardB.value || cardA.suit.charCodeAt(0) - cardB.suit.charCodeAt(0)
    })
  }
  
  private parseCard(card: string): { value: number; suit: string } {
    const suitMap: Record<string, Suit> = {
      '♠': 'spades',
      '♥': 'hearts', 
      '♦': 'diamonds',
      '♣': 'clubs'
    }
    
    let valueStr = card.slice(1)
    let value: number
    
    if (valueStr === 'A') value = 14
    else if (valueStr === 'J') value = 11
    else if (valueStr === 'Q') value = 12  
    else if (valueStr === 'K') value = 13
    else if (valueStr === '小') value = 15
    else if (valueStr === '大') value = 16
    else value = parseInt(valueStr)
    
    return { 
      value, 
      suit: card[0] as string 
    }
  }
  
  // 叫地主决策
  decideCallLandlord(): boolean {
    // 简单策略：如果有炸弹、王炸或很多高牌就叫地主
    const hasBomb = this.hasBomb()
    const hasRocket = this.hasRocket()
    const highCards = this.countHighCards()
    
    if (hasRocket || hasBomb) return true
    if (highCards >= 8) return true
    
    // 随机决策，避免总是不叫
    return Math.random() > 0.7
  }
  
  private hasBomb(): boolean {
    const valueCounts: Record<number, number> = {}
    
    for (const card of this.cards) {
      const parsed = this.parseCard(card)
      valueCounts[parsed.value] = (valueCounts[parsed.value] || 0) + 1
    }
    
    return Object.values(valueCounts).some(count => count >= 4)
  }
  
  private hasRocket(): boolean {
    return this.cards.includes('小王') && this.cards.includes('大王')
  }
  
  private countHighCards(): number {
    return this.cards.filter(card => {
      const parsed = this.parseCard(card)
      return parsed.value >= 10 // 10, J, Q, K, A, 王
    }).length
  }
  
  // 出牌决策
  decidePlay(lastPlayedCards: string[]): string[] | null {
    if (lastPlayedCards.length === 0) {
      // 首出，选择最小的有效牌型
      return this.findBestOpeningPlay()
    }
    
    // 跟牌，尝试找到能压制的最小牌
    return this.findBestResponsePlay(lastPlayedCards)
  }
  
  private findBestOpeningPlay(): string[] | null {
    // 优先出单张小牌
    const singleCards = this.getCardsByCount(1)
    if (singleCards.length > 0) {
      return [singleCards[0]] // 最小的单牌
    }
    
    // 然后是对子
    const pairCards = this.getCardsByCount(2)
    if (pairCards.length >= 2) {
      return [pairCards[0], pairCards[1]]
    }
    
    // 如果有顺子
    const sequences = this.findSequences()
    if (sequences.length > 0) {
      return sequences[0]
    }
    
    // 最后出任意有效牌
    if (this.cards.length > 0) {
      return [this.cards[0]]
    }
    
    return null
  }
  
  private findBestResponsePlay(lastPlayedCards: string[]): string[] | null {
    const lastType = getCardType(lastPlayedCards)
    if (!lastType) return null
    
    // 尝试找到相同类型但更大的牌
    const playableCards = this.findPlayableCards(lastPlayedCards, lastType)
    if (playableCards.length > 0) {
      // 返回最小的有效牌（节省大牌）
      return playableCards[0]
    }
    
    // 如果没有能跟的牌，考虑出炸弹（如果允许）
    if (lastType.type !== 'bomb' && lastType.type !== 'rocket') {
      const bombs = this.findBombs()
      if (bombs.length > 0) {
        return bombs[0] // 最小的炸弹
      }
    }
    
    return null // 不要
  }
  
  private getCardsByCount(targetCount: number): string[] {
    const valueGroups: Record<number, string[]> = {}
    
    for (const card of this.cards) {
      const parsed = this.parseCard(card)
      if (!valueGroups[parsed.value]) {
        valueGroups[parsed.value] = []
      }
      valueGroups[parsed.value].push(card)
    }
    
    const result: string[] = []
    for (const group of Object.values(valueGroups)) {
      if (group.length >= targetCount) {
        result.push(...group.slice(0, targetCount))
      }
    }
    
    return result.sort((a, b) => {
      const cardA = this.parseCard(a)
      const cardB = this.parseCard(b)
      return cardA.value - cardB.value
    })
  }
  
  private findSequences(): string[][] {
    // 简化的顺子查找（只找5张以上的顺子）
    const values: number[] = []
    const cardMap: Record<number, string> = {}
    
    for (const card of this.cards) {
      const parsed = this.parseCard(card)
      if (parsed.value <= 13) { // 只考虑普通牌，不含王
        if (!cardMap[parsed.value]) {
          values.push(parsed.value)
          cardMap[parsed.value] = card
        }
      }
    }
    
    values.sort((a, b) => a - b)
    
    const sequences: string[][] = []
    let currentSeq: number[] = []
    
    for (let i = 0; i < values.length; i++) {
      if (currentSeq.length === 0 || values[i] === currentSeq[currentSeq.length - 1] + 1) {
        currentSeq.push(values[i])
      } else {
        if (currentSeq.length >= 5) {
          sequences.push(currentSeq.map(v => cardMap[v]))
        }
        currentSeq = [values[i]]
      }
    }
    
    if (currentSeq.length >= 5) {
      sequences.push(currentSeq.map(v => cardMap[v]))
    }
    
    return sequences
  }
  
  private findBombs(): string[][] {
    const valueGroups: Record<number, string[]> = {}
    
    for (const card of this.cards) {
      const parsed = this.parseCard(card)
      if (!valueGroups[parsed.value]) {
        valueGroups[parsed.value] = []
      }
      valueGroups[parsed.value].push(card)
    }
    
    const bombs: string[][] = []
    for (const group of Object.values(valueGroups)) {
      if (group.length >= 4) {
        bombs.push([...group])
      }
    }
    
    // 添加王炸
    if (this.cards.includes('小王') && this.cards.includes('大王')) {
      bombs.push(['小王', '大王'])
    }
    
    return bombs.sort((a, b) => {
      const cardA = this.parseCard(a[0])
      const cardB = this.parseCard(b[0])
      return cardA.value - cardB.value
    })
  }
  
  private findPlayableCards(lastPlayedCards: string[], lastType: CardType): string[][] {
    const playable: string[][] = []
    
    // 根据牌型生成所有可能的出牌
    if (lastType.type === 'single') {
      // 单牌
      for (const card of this.cards) {
        if (isValidPlay([card], lastPlayedCards)) {
          playable.push([card])
        }
      }
    } else if (lastType.type === 'pair') {
      // 对子
      const pairs = this.getCardsByCount(2)
      for (let i = 0; i < pairs.length; i += 2) {
        if (i + 1 < pairs.length) {
          const play = [pairs[i], pairs[i + 1]]
          if (isValidPlay(play, lastPlayedCards)) {
            playable.push(play)
          }
        }
      }
    } else if (lastType.type === 'triple') {
      // 三张
      const triples = this.getCardsByCount(3)
      for (let i = 0; i < triples.length; i += 3) {
        if (i + 2 < triples.length) {
          const play = [triples[i], triples[i + 1], triples[i + 2]]
          if (isValidPlay(play, lastPlayedCards)) {
            playable.push(play)
          }
        }
      }
    } else if (lastType.type === 'sequence') {
      // 顺子
      const sequences = this.findSequences()
      for (const seq of sequences) {
        if (seq.length === lastPlayedCards.length && isValidPlay(seq, lastPlayedCards)) {
          playable.push(seq)
        }
      }
    }
    
    // 按牌面大小排序，返回最小的有效牌
    return playable.sort((a, b) => {
      const cardA = this.parseCard(a[0])
      const cardB = this.parseCard(b[0])
      return cardA.value - cardB.value
    })
  }
  
  // 不要
  pass(): null {
    return null
  }
}