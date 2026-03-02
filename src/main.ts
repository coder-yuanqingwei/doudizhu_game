import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'

// 初始化 Pinia store
const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})