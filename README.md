# 三人斗地主游戏 🃏

一个基于 Vue 3 + TypeScript 的在线多人斗地主游戏，支持 WebSocket 实时对战和智能 AI。

## 🎮 游戏特色

- **真实在线对战**：支持 3 人实时在线对战
- **完整规则实现**：标准斗地主规则，包含所有牌型
- **智能 AI 系统**：单机模式下可与 AI 对战
- **响应式设计**：适配桌面和移动设备
- **房间系统**：创建/加入房间，邀请好友对战
- **实时同步**：WebSocket 保证游戏状态实时同步

## 🎯 适用人群

- **年龄限制**：本游戏仅适合60岁以下的玩家
- **推荐人群**：喜欢策略卡牌游戏的年轻玩家

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **状态管理**: Pinia
- **构建工具**: Vite
- **语言**: TypeScript
- **样式**: CSS3 + 响应式设计

### 后端  
- **运行时**: Node.js
- **实时通信**: Socket.IO
- **Web 框架**: Express
- **部署**: Render/Railway

### 部署平台
- **前端**: Vercel (全球 CDN 加速)
- **后端**: Render (免费套餐可用)

## 🚀 快速开始

### 本地开发环境

1. **克隆仓库**
   ```bash
   git clone https://github.com/coder-yuanqingwei/doudizhu_game.git
   cd doudizhu_game
   ```

2. **安装依赖**
   ```bash
   # 安装前端依赖
   npm install
   
   # 安装后端依赖  
   cd server && npm install && cd ..
   ```

3. **启动开发服务器**
   ```bash
   # 终端 1: 启动后端
   cd server && npm run dev
   
   # 终端 2: 启动前端
   npm run dev
   ```

4. **访问游戏**
   - 前端: http://localhost:5173
   - WebSocket: ws://localhost:8080

### 生产环境部署

#### 前端部署 (Vercel)
1. 在 Vercel 创建新项目
2. 连接 GitHub 仓库: `https://github.com/coder-yuanqingwei/doudizhu_game`
3. 配置环境变量:
   - `VITE_WEBSOCKET_URL` = 您的 WebSocket 服务器地址
4. 构建设置:
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### 后端部署 (Render)
1. 在 Render 创建 Web Service
2. 连接相同 GitHub 仓库
3. 配置:
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Port: 8080

## ⚙️ 环境变量

### 前端 (.env.local)
```env
VITE_WEBSOCKET_URL=wss://your-backend.onrender.com
```

### 后端 (Render 环境变量)
```env
PORT=8080
NODE_ENV=production
```

## 🎯 游戏规则

### 基本规则
- **玩家数量**: 3 人
- **牌数**: 54 张（含大小王）
- **发牌**: 每人 17 张，底牌 3 张
- **叫地主**: 抢地主机制，最高分者获胜

### 牌型支持
- 单张、对子、三张、三带一、三带二
- 顺子（5张以上连续单牌）
- 连对（3对以上连续对子）  
- 飞机（2个以上连续三张）
- 炸弹（4张相同点数）
- 王炸（大王+小王，最大牌型）

### 胜负判定
- **地主胜利**: 地主先出完所有手牌
- **农民胜利**: 任意农民先出完所有手牌

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！
1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT License - 详情请查看 [LICENSE](LICENSE) 文件.

---

**Enjoy the game! 🎮**