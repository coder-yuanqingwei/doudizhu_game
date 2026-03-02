# 三人斗地主游戏

一个基于 Vue 3 + TypeScript 的在线多人斗地主游戏，支持 WebSocket 实时对战。

## 技术栈

- **前端**: Vue 3, Pinia, Vite, TypeScript
- **后端**: Node.js, Socket.IO, Express
- **部署**: 
  - 前端: Vercel
  - 后端: Render/Railway

## 部署指南

### 1. 前端部署 (Vercel)

1. 在 Vercel 控制台创建新项目
2. 连接 GitHub 仓库: `https://github.com/coder-yuanqingwei/doudizhu_game`
3. 配置环境变量:
   - `VITE_WEBSOCKET_URL` = 你的 WebSocket 服务器地址 (如: `wss://your-server.onrender.com`)
4. 构建设置:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: (留空)

### 2. 后端部署 (Render)

1. 在 Render 控制台创建新 Web Service
2. 连接 GitHub 仓库: `https://github.com/coder-yuanqingwei/doudizhu_game`
3. 设置:
   - Repository: `coder-yuanqingwei/doudizhu_game`
   - Branch: `main`
   - Root Directory: `server`
   - Runtime: Node.js
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Port: 8080 (默认)

### 3. 环境变量配置

**前端 (.env.local)**:
```env
VITE_WEBSOCKET_URL=wss://your-render-app.onrender.com
```

**后端 (Render 环境变量)**:
- PORT=8080 (默认)
- 其他自定义变量（如果需要）

## 本地开发

### 启动前端
```bash
cd doudizhu-game
npm install
npm run dev
```

### 启动后端
```bash
cd server
npm install
npm run dev
```

### 访问游戏
- 前端: http://localhost:3000
- 后端: ws://localhost:8080

## 功能特性

- ✅ 真正的在线多人对战 (3人)
- ✅ 完整的斗地主规则
- ✅ 智能 AI 玩家 (本地模式)
- ✅ 响应式用户界面
- ✅ 实时游戏状态同步
- ✅ 房间创建和加入系统

## 游戏规则

- 标准三人斗地主规则
- 支持所有牌型：单张、对子、顺子、炸弹、王炸等
- 叫地主机制
- 农民 vs 地主对战模式

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License