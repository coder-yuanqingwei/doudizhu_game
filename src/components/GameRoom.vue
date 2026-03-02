<template>
  <div class="game-room">
    <div class="game-header">
      <h2>斗地主房间 #{{ gameStore.currentRoom?.id }}</h2>
      <div class="room-info">
        <span>玩家: {{ gameStore.players.length }}/3</span>
        <span v-if="gameStore.gameState.phase !== 'waiting'">局数: {{ gameStore.gameState.round }}</span>
        <button @click="leaveRoom" class="leave-btn">离开房间</button>
      </div>
    </div>

    <div class="players-section">
      <div 
        v-for="player in gameStore.players" 
        :key="player.id"
        class="player-card"
        :class="{ 
          current: player.id === gameStore.currentPlayerId,
          landlord: player.isLandlord,
          winner: player.isWinner
        }"
      >
        <div class="player-name">{{ player.name }}</div>
        <div class="player-cards-count">{{ player.cardsCount }}张</div>
        <div v-if="player.isLandlord" class="landlord-badge">地主</div>
        <div v-if="player.isWinner" class="winner-badge">获胜!</div>
      </div>
    </div>

    <div class="game-board">
      <!-- 底牌显示 -->
      <div v-if="gameStore.gameState.phase === 'bidding'" class="bottom-cards-section">
        <h3>底牌</h3>
        <div class="bottom-cards">
          <Card 
            v-for="(card, index) in gameStore.bottomCards" 
            :key="index"
            :card="card"
            :is-face-up="true"
          />
        </div>
      </div>

      <!-- 最新出的牌 -->
      <div v-if="gameStore.lastPlayedCards.length > 0" class="last-played-section">
        <div class="last-played-header">
          <span>{{ getLastPlayerName() }} 出的牌:</span>
        </div>
        <div class="last-played-cards">
          <Card 
            v-for="(card, index) in gameStore.lastPlayedCards" 
            :key="index"
            :card="card"
            :is-face-up="true"
          />
        </div>
      </div>

      <!-- 玩家手牌 -->
      <div 
        v-if="gameStore.currentPlayerId === gameStore.localPlayerId && gameStore.gameState.phase === 'playing'"
        class="player-hand"
      >
        <div class="hand-cards">
          <Card 
            v-for="(card, index) in gameStore.localPlayerCards" 
            :key="index"
            :card="card"
            :is-face-up="true"
            :is-selected="selectedCards.includes(card)"
            @click="toggleCardSelection(card)"
          />
        </div>
        <div class="action-buttons">
          <button 
            v-if="canPlaySelectedCards"
            @click="playSelectedCards"
            class="play-btn"
          >
            出牌 ({{ selectedCards.length }})
          </button>
          <button 
            @click="passTurn"
            class="pass-btn"
          >
            不要
          </button>
          <button @click="clearSelection" class="clear-btn">清空</button>
        </div>
      </div>

      <!-- 叫地主阶段 -->
      <div 
        v-if="gameStore.currentPlayerId === gameStore.localPlayerId && gameStore.gameState.phase === 'bidding'"
        class="bidding-section"
      >
        <h3>轮到你叫地主</h3>
        <div class="bidding-buttons">
          <button @click="callLandlord(true)" class="call-btn">叫地主</button>
          <button @click="callLandlord(false)" class="pass-btn">不叫</button>
        </div>
      </div>

      <!-- 等待其他玩家 -->
      <div v-if="gameStore.currentPlayerId !== gameStore.localPlayerId && gameStore.gameState.phase !== 'waiting'" class="waiting-section">
        <p>等待 {{ getCurrentPlayerName() }} 操作...</p>
      </div>

      <!-- 游戏结束 -->
      <div v-if="gameStore.gameState.phase === 'ended'" class="game-ended-section">
        <h2>游戏结束!</h2>
        <div v-if="gameStore.winnerId">
          <p>获胜者: {{ getWinnerName() }}</p>
          <p>得分: {{ gameStore.scores[gameStore.winnerId] || 0 }}</p>
        </div>
        <button @click="startNewRound" class="new-round-btn">开始新局</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'
import Card from '@/components/Card.vue'

const gameStore = useGameStore()
const selectedCards = ref<string[]>([])

const toggleCardSelection = (card: string) => {
  if (gameStore.currentPlayerId !== gameStore.localPlayerId) return
  
  const index = selectedCards.value.indexOf(card)
  if (index > -1) {
    selectedCards.value.splice(index, 1)
  } else {
    selectedCards.value.push(card)
  }
}

const clearSelection = () => {
  selectedCards.value = []
}

const callLandlord = (wantsToBe: boolean) => {
  if (gameStore.currentPlayerId !== gameStore.localPlayerId) return
  gameStore.callLandlord(wantsToBe)
}

const canPlaySelectedCards = computed(() => {
  if (selectedCards.value.length === 0) return false
  if (gameStore.currentPlayerId !== gameStore.localPlayerId) return false
  return gameStore.isValidPlay(selectedCards.value)
})

const playSelectedCards = () => {
  if (canPlaySelectedCards.value) {
    gameStore.playCards([...selectedCards.value])
    clearSelection()
  }
}

const passTurn = () => {
  if (gameStore.currentPlayerId !== gameStore.localPlayerId) return
  gameStore.passTurn()
}

const leaveRoom = () => {
  gameStore.leaveRoom()
}

const startNewRound = () => {
  gameStore.startNewRound()
}

const getLastPlayerName = () => {
  const lastPlayer = gameStore.players.find(p => p.id === gameStore.lastPlayerId)
  return lastPlayer ? lastPlayer.name : '未知玩家'
}

const getCurrentPlayerName = () => {
  const currentPlayer = gameStore.players.find(p => p.id === gameStore.currentPlayerId)
  return currentPlayer ? currentPlayer.name : '未知玩家'
}

const getWinnerName = () => {
  const winner = gameStore.players.find(p => p.id === gameStore.winnerId)
  return winner ? winner.name : '未知玩家'
}
</script>

<style scoped>
.game-room {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 10px;
}

.room-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.leave-btn {
  padding: 8px 16px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.leave-btn:hover {
  background: #ff2e43;
}

.players-section {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.player-card {
  background: rgba(255, 255, 255, 0.8);
  padding: 15px;
  border-radius: 15px;
  min-width: 120px;
  text-align: center;
  transition: all 0.3s ease;
}

.player-card.current {
  background: linear-gradient(135deg, #ffd700, #ffa500);
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(255, 165, 0, 0.4);
}

.player-card.landlord {
  border: 3px solid #ff0000;
}

.player-card.winner {
  background: linear-gradient(135deg, #00ff00, #00cc00);
  animation: winnerGlow 2s infinite alternate;
}

@keyframes winnerGlow {
  from { box-shadow: 0 0 10px #00ff00; }
  to { box-shadow: 0 0 25px #00cc00; }
}

.player-name {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 16px;
}

.player-cards-count {
  font-size: 14px;
  color: #666;
}

.landlord-badge {
  background: #ff0000;
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-top: 5px;
  display: inline-block;
}

.winner-badge {
  background: #00ff00;
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-top: 5px;
  display: inline-block;
}

.game-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.bottom-cards-section, .last-played-section {
  background: rgba(255, 255, 255, 0.7);
  padding: 15px;
  border-radius: 10px;
  width: 100%;
  max-width: 800px;
}

.bottom-cards, .last-played-cards {
  display: flex;
  gap: 5px;
  justify-content: center;
  flex-wrap: wrap;
}

.last-played-header {
  margin-bottom: 10px;
  font-weight: bold;
  color: #333;
}

.player-hand {
  width: 100%;
  max-width: 1000px;
}

.hand-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.bidding-section, .waiting-section {
  background: rgba(255, 255, 255, 0.7);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  width: 100%;
  max-width: 600px;
}

.bidding-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 15px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 15px;
}

.play-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.play-btn:hover {
  background: #45a049;
}

.pass-btn {
  padding: 12px 24px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.pass-btn:hover {
  background: #da190b;
}

.clear-btn {
  padding: 12px 24px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.clear-btn:hover {
  background: #5a6268;
}

.call-btn {
  padding: 12px 24px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.call-btn:hover {
  background: #1976D2;
}

.new-round-btn {
  padding: 15px 30px;
  background: #9C27B0;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  margin-top: 20px;
}

.new-round-btn:hover {
  background: #7B1FA2;
}

.game-ended-section {
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  padding: 30px;
  border-radius: 15px;
  width: 100%;
  max-width: 600px;
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .players-section {
    flex-direction: column;
    align-items: center;
  }
  
  .player-card {
    width: 90%;
  }
}
</style>