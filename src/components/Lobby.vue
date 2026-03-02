<template>
  <div class="lobby">
    <div class="lobby-header">
      <h1>斗地主大厅</h1>
    </div>
    
    <div class="lobby-content">
      <!-- 创建房间 -->
      <div class="create-room-section">
        <h2>创建游戏房间</h2>
        <div class="room-form">
          <input 
            v-model="roomName" 
            placeholder="房间名称（可选）"
            maxlength="20"
          />
          <button @click="createRoom" :disabled="isCreatingRoom">
            {{ isCreatingRoom ? '创建中...' : '创建房间' }}
          </button>
        </div>
      </div>

      <!-- 加入房间 -->
      <div class="join-room-section">
        <h2>加入游戏房间</h2>
        <div class="room-form">
          <input 
            v-model="roomIdToJoin" 
            placeholder="输入房间ID"
            maxlength="10"
          />
          <button @click="joinRoom" :disabled="isJoiningRoom">
            {{ isJoiningRoom ? '加入中...' : '加入房间' }}
          </button>
        </div>
      </div>

      <!-- 游戏状态提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { useWebSocketStore } from '@/stores/websocket'

const gameStore = useGameStore()
const websocketStore = useWebSocketStore()

const roomName = ref('')
const roomIdToJoin = ref('')
const isCreatingRoom = ref(false)
const isJoiningRoom = ref(false)
const error = ref('')
const success = ref('')

// 清除消息
const clearMessages = () => {
  error.value = ''
  success.value = ''
}

// 创建房间
const createRoom = async () => {
  if (isCreatingRoom.value) return
  
  clearMessages()
  isCreatingRoom.value = true
  
  try {
    await websocketStore.connect()
    await gameStore.createRoom(roomName.value.trim() || '斗地主房间')
    success.value = '房间创建成功！'
  } catch (err: any) {
    error.value = err.message || '创建房间失败'
    console.error('Create room error:', err)
  } finally {
    isCreatingRoom.value = false
  }
}

// 加入房间
const joinRoom = async () => {
  if (isJoiningRoom.value || !roomIdToJoin.value.trim()) return
  
  clearMessages()
  isJoiningRoom.value = true
  
  try {
    await websocketStore.connect()
    await gameStore.joinRoom(roomIdToJoin.value.trim())
    success.value = '成功加入房间！'
  } catch (err: any) {
    error.value = err.message || '加入房间失败'
    console.error('Join room error:', err)
  } finally {
    isJoiningRoom.value = false
  }
}

// 监听 WebSocket 状态变化
onMounted(() => {
  // 如果已经连接，清除之前的房间状态
  if (websocketStore.isConnected) {
    gameStore.reset()
  }
})

onUnmounted(() => {
  // 组件销毁时不需要断开连接，因为可能切换到游戏房间
})
</script>

<style scoped>
.lobby {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
}

.lobby-header {
  text-align: center;
  margin-bottom: 30px;
}

.lobby-header h1 {
  font-size: 2.5rem;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.lobby-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
  max-width: 500px;
  margin: 0 auto;
}

.create-room-section,
.join-room-section {
  background: rgba(255, 255, 255, 0.9);
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.create-room-section h2,
.join-room-section h2 {
  margin-bottom: 20px;
  color: #333;
  font-size: 1.5rem;
}

.room-form {
  display: flex;
  gap: 10px;
  align-items: center;
}

.room-form input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s;
}

.room-form input:focus {
  border-color: #667eea;
}

.room-form button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.room-form button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.room-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin-top: 10px;
  border-left: 4px solid #c62828;
}

.success-message {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 12px;
  border-radius: 8px;
  margin-top: 10px;
  border-left: 4px solid #2e7d32;
}
</style>