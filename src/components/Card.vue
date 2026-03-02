<template>
  <div 
    class="card"
    :class="{ 
      'card-selected': is-selected,
      'card-face-down': !isFaceUp
    }"
    @click="$emit('click', card)"
  >
    <div v-if="isFaceUp" class="card-content">
      <div class="card-rank">{{ rank }}</div>
      <div class="card-suit">{{ suitSymbol }}</div>
    </div>
    <div v-else class="card-back">
      🃏
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  card: string
  isFaceUp: boolean
  is-selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', card: string): void
}>()

// 解析牌面信息
const rank = computed(() => {
  const card = props.card
  if (card === 'BJ') return '小'
  if (card === 'RJ') return '大'
  
  const rankPart = card.slice(0, -1)
  const rankMap: Record<string, string> = {
    '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
    '9': '9', 'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A', '2': '2'
  }
  return rankMap[rankPart] || rankPart
})

const suitSymbol = computed(() => {
  const card = props.card
  if (card === 'BJ' || card === 'RJ') return ''
  
  const suitPart = card.slice(-1)
  const suitMap: Record<string, string> = {
    'S': '♠', // 黑桃
    'H': '♥', // 红桃
    'D': '♦', // 方块
    'C': '♣'  // 梅花
  }
  return suitMap[suitPart] || ''
})

const cardColor = computed(() => {
  const card = props.card
  if (card === 'BJ') return 'black'
  if (card === 'RJ') return 'red'
  
  const suitPart = card.slice(-1)
  return ['H', 'D'].includes(suitPart) ? 'red' : 'black'
})
</script>

<style scoped>
.card {
  width: 60px;
  height: 84px;
  border: 2px solid #333;
  border-radius: 8px;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px;
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.card.card-selected {
  transform: translateY(-10px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.4);
  border-color: #ff6b6b;
}

.card-face-down {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-rank {
  font-size: 16px;
  font-weight: bold;
}

.card-suit {
  font-size: 20px;
  line-height: 1;
}

.red {
  color: red;
}

.black {
  color: black;
}
</style>