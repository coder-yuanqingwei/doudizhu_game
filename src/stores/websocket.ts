import { ref, onUnmounted } from 'vue'
import { useGameStore } from './game'

const ws = ref<WebSocket | null>(null)
const isConnected = ref(false)
const playerId = ref<string | null>(null)

export function useWebSocket() {
  const gameStore = useGameStore()

  const connect = () => {
    if (ws.value) {
      ws.value.close()
    }

    // 连接到 WebSocket 服务器
    ws.value = new WebSocket('ws://localhost:8080')
    
    ws.value.onopen = () => {
      console.log('WebSocket connected')
      isConnected.value = true
    }

    ws.value.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleMessage(message)
    }

    ws.value.onclose = () => {
      console.log('WebSocket disconnected')
      isConnected.value = false
      setTimeout(connect, 3000) // 重连
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  const send = (message: any) => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(message))
    }
  }

  const setPlayerName = (name: string) => {
    send({
      type: 'set_player_name',
      name: name
    })
  }

  const createRoom = () => {
    send({
      type: 'create_room'
    })
  }

  const joinRoom = (roomId: string) => {
    send({
      type: 'join_room',
      roomId: roomId
    })
  }

  const getRooms = () => {
    send({
      type: 'get_rooms'
    })
  }

  const callLandlord = (wantsToBe: boolean) => {
    send({
      type: 'call_landlord',
      wantsToBeLandlord: wantsToBe
    })
  }

  const playCards = (cards: string[]) => {
    send({
      type: 'play_cards',
      cards: cards
    })
  }

  const passTurn = () => {
    send({
      type: 'pass_turn'
    })
  }

  const handleMessage = (message: any) => {
    switch (message.type) {
      case 'connected':
        playerId.value = message.playerId
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
        gameStore.setGameState(message.gameState)
        gameStore.setCurrentPlayerId(message.currentPlayerId)
        gameStore.setLastPlayedCards(message.lastPlayedCards)
        break
      case 'turn_passed':
        gameStore.setGameState(message.gameState)
        gameStore.setCurrentPlayerId(message.currentPlayerId)
        gameStore.setLastPlayedCards(message.lastPlayedCards)
        break
      case 'game_ended':
        gameStore.setWinnerId(message.winnerId)
        gameStore.setScores(message.scores)
        break
      case 'rooms_list':
        gameStore.setAvailableRooms(message.rooms)
        break
      case 'error':
        console.error('Server error:', message.message)
        alert(message.message)
        break
    }
  }

  onUnmounted(() => {
    if (ws.value) {
      ws.value.close()
    }
  })

  return {
    isConnected,
    playerId,
    connect,
    setPlayerName,
    createRoom,
    joinRoom,
    getRooms,
    callLandlord,
    playCards,
    passTurn
  }
}