import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWebSocketStore } from './websocket'
import { createDeck, shuffleDeck, dealCards, isValidPlay } from '@/utils/gameLogic'
import type { Card, Player, GamePhase, GameState } from '@/types/game'

export const useGameStore = defineStore('game', () => {
  const websocketStore = useWebSocketStore()
  
  // 游戏状态
  const gameState = ref<GameState>({
    phase: 'waiting',
    currentPlayerId: '',
    lastPlayedCards: [],
    bottomCards: [],
    winnerId: null,
    isGameOver: false
  })
  
  // 房间信息
  const currentRoom = ref<{ id: string; name: string } | null>(null)
  const players = ref<Player[]>([])
  
  // 本地玩家信息
  const localPlayerId = ref<string>('')
  const localPlayerName = ref<string>('')
  
  // 手牌（仅本地玩家）
  const localPlayerCards = ref<Card[]>([])
  
  // 计算属性
  const currentPlayer = computed(() => 
    players.value.find(p => p.id === gameState.value.currentPlayerId)
  )
  
  const isLocalPlayerTurn = computed(() => 
    gameState.value.currentPlayerId === localPlayerId.value
  )
  
  const canCallLandlord = computed(() => 
    gameState.value.phase === 'bidding' && isLocalPlayerTurn.value
  )
  
  const canPlayCards = computed(() => 
    gameState.value.phase === 'playing' && isLocalPlayerTurn.value
  )
  
  // 初始化游戏
  const initializeGame = (roomId: string, roomName: string, playerId: string, playerName: string) => {
    currentRoom.value = { id: roomId, name: roomName }
    localPlayerId.value = playerId
    localPlayerName.value = playerName
    
    // 重置游戏状态
    gameState.value = {
      phase: 'waiting',
      currentPlayerId: '',
      lastPlayedCards: [],
      bottomCards: [],
      winnerId: null,
      isGameOver: false
    }
    
    players.value = []
    localPlayerCards.value = []
  }
  
  // 处理服务器消息
  const handleServerMessage = (message: any) => {
    switch (message.type) {
      case 'room_joined':
        // 房间加入成功
        break
        
      case 'game_started':
        // 游戏开始
        gameState.value.phase = 'bidding'
        gameState.value.currentPlayerId = message.currentPlayerId
        gameState.value.bottomCards = message.bottomCards
        players.value = message.players
        localPlayerCards.value = message.localPlayerCards || []
        break
        
      case 'landlord_called':
        // 叫地主结果
        const player = players.value.find(p => p.id === message.playerId)
        if (player) {
          player.isLandlord = message.isLandlord
          player.hasCalled = true
        }
        gameState.value.currentPlayerId = message.nextPlayerId
        break
        
      case 'cards_played':
        // 出牌
        gameState.value.lastPlayedCards = message.cards
        gameState.value.currentPlayerId = message.nextPlayerId
        
        // 更新本地玩家手牌
        if (message.playerId === localPlayerId.value) {
          localPlayerCards.value = localPlayerCards.value.filter(
            card => !message.cards.includes(card)
          )
        }
        
        // 更新其他玩家手牌数量
        const playingPlayer = players.value.find(p => p.id === message.playerId)
        if (playingPlayer) {
          playingPlayer.cards = message.remainingCardCount
        }
        break
        
      case 'turn_passed':
        // 不要
        gameState.value.currentPlayerId = message.nextPlayerId
        break
        
      case 'game_over':
        // 游戏结束
        gameState.value.isGameOver = true
        gameState.value.winnerId = message.winnerId
        break
        
      case 'player_joined':
        // 玩家加入
        if (!players.value.some(p => p.id === message.player.id)) {
          players.value.push(message.player)
        }
        break
        
      case 'player_left':
        // 玩家离开
        players.value = players.points.filter(p => p.id !== message.playerId)
        break
    }
  }
  
  // 客户端操作方法
  const joinRoom = (roomId: string, playerName: string) => {
    websocketStore.sendMessage({
      type: 'join_room',
      roomId,
      playerName
    })
  }
  
  const createRoom = (roomName: string, playerName: string) => {
    websocketStore.sendMessage({
      type: 'create_room',
      roomName,
      playerName
    })
  }
  
  const callLandlord = (wantsToBe: boolean) => {
    if (canCallLandlord.value) {
      websocketStore.sendMessage({
        type: 'call_landlord',
        wantsToBe
      })
    }
  }
  
  const playCards = (cards: Card[]) => {
    if (canPlayCards.value && isValidPlay(cards, gameState.value.lastPlayedCards)) {
      websocketStore.sendMessage({
        type: 'play_cards',
        cards
      })
    }
  }
  
  const passTurn = () => {
    if (canPlayCards.value) {
      websocketStore.sendMessage({
        type: 'pass_turn'
      })
    }
  }
  
  const leaveRoom = () => {
    websocketStore.sendMessage({
      type: 'leave_room'
    })
    resetGame()
  }
  
  const resetGame = () => {
    currentRoom.value = null
    players.value = []
    localPlayerId.value = ''
    localPlayerName.value = ''
    localPlayerCards.value = []
    gameState.value = {
      phase: 'waiting',
      currentPlayerId: '',
      lastPlayedCards: [],
      bottomCards: [],
      winnerId: null,
      isGameOver: false
    }
  }
  
  return {
    // 状态
    gameState,
    currentRoom,
    players,
    localPlayerId,
    localPlayerName,
    localPlayerCards,
    currentPlayer,
    isLocalPlayerTurn,
    canCallLandlord,
    canPlayCards,
    
    // 方法
    initializeGame,
    handleServerMessage,
    joinRoom,
    createRoom,
    callLandlord,
    playCards,
    passTurn,
    leaveRoom,
    resetGame
  }
})