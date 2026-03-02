import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServerManager } from './websocket-server';

const app = express();
const server = http.createServer(app);

// CORS 配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// 静态文件服务（可选）
app.use(express.static('../dist'));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动 WebSocket 服务器
const wsServer = new WebSocketServerManager(server);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

server.listen(PORT, () => {
  console.log(`斗地主服务器启动成功！`);
  console.log(`HTTP 服务: http://localhost:${PORT}`);
  console.log(`WebSocket 服务: ws://localhost:${PORT}`);
  console.log(`前端开发服务器: http://localhost:3001`);
});