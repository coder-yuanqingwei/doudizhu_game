import { ref } from 'vue'
import { useGameStore } from './game'

// 从环境变量获取 WebSocket URL，Vercel 部署时会使用这个
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080'

export const useWebSocketStore = () => {
  const ws = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const gameStore = useGameStore()

  const connect = () => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      return
    }

    ws.value = new WebSocket(WEBSOCKET_URL)
    
    ws.value.onopen = () => {
      console.log('WebSocket connected')
      isConnected.value = true
    }

    ws.value.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleServerMessage(message)
    }

    ws.value.onclose = () => {
      console.log('WebSocket disconnected')
      isConnected.value = false
      // 尝试重连
      setTimeout(connect, 3000)
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
    }
  }

  const sendMessage = (message: any) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message))
    }
  }

  const handleServerMessage = (message: any) => {
    switch (message.type) {
      case 'connected':
        gameStore.setPlayerId(message.playerId)
        break
      case 'room_created':
        gameStore.setCurrentRoom(message.roomId)
        gameStore.setPlayers(message.players)
        break
      case 'room_updated':
        gameStore.setPlayers(message.players)
        break
      case 'game_started':
        gameStore.setGameState(message.gameState)
        gameStore.setCurrentPlayerId(message.currentPlayerId)
        gameStore.setBottomCards(message.bottomCards)
        break
      case 'landlord_called':
        gameStore.setGameState(message.gameState)
        gameStore.setCurrentPlayerId(message.currentPlayerId)
        break
      case 'bidding_complete':
        gameStore.setLandlordId(message.landlordId)
        gameStore.setBottomCards(message.bottomCards)
        break
      case 'cards_played':
        gameStore.playCards(message.cards)
        gameStore.setGameState(message.gameState)
        gameStore.setCurrentPlayerId(message.currentPlayerId)
        gameStore.setLastPlayedCards(message.lastPlayedCards)
        break
      case 'turn_passed':
        gameStore.passTurn()
        gameStore.setGameState(message.gameState)
        gameStore.setCurrentPlayerId(message.currentPlayerId)
        gameStore.setLastPlayedCards(message.lastPlayedCards)
        break
      case 'game_ended':
        gameStore.setWinnerId(message.winnerId)
        gameStore.setScores(message.scores)
        break
      case 'error':
        console.error('Server error:', message.message)
        break
      default:
        console.log('Unknown message type:', message.type)
    }
  }

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage
  }
}