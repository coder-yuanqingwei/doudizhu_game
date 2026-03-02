"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const websocket_server_1 = require("./websocket-server");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// CORS 配置
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
// 静态文件服务（可选）
app.use(express_1.default.static('../dist'));
// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 启动 WebSocket 服务器
const wsServer = new websocket_server_1.WebSocketServerManager(server);
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
server.listen(PORT, () => {
    console.log(`斗地主服务器启动成功！`);
    console.log(`HTTP 服务: http://localhost:${PORT}`);
    console.log(`WebSocket 服务: ws://localhost:${PORT}`);
    console.log(`前端开发服务器: http://localhost:3001`);
});
//# sourceMappingURL=index.js.map