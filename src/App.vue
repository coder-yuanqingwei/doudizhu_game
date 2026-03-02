<template>
  <div id="app">
    <GameRoom v-if="gameStore.currentRoom" />
    <Lobby v-else />
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game'
import GameRoom from '@/components/GameRoom.vue'
import Lobby from '@/components/Lobby.vue'

const gameStore = useGameStore()
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>