import http from 'http';
export declare class WebSocketServerManager {
    private wss;
    private roomManager;
    private clients;
    constructor(server: http.Server);
    private handleConnection;
    private handleMessage;
    private handleSetPlayerName;
    private handleCreateRoom;
    private handleJoinRoom;
    private handleGetRooms;
    private handleCallLandlord;
    private handlePlayCards;
    private handlePassTurn;
    private findRoomByPlayer;
    private broadcastToRoom;
    private sendMessage;
    private sendError;
}
