"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketServer = setSocketServer;
exports.emitToUser = emitToUser;
let socketServer = null;
function setSocketServer(io) {
    socketServer = io;
}
function emitToUser(userId, event, payload) {
    if (!socketServer) {
        return;
    }
    socketServer.to(`user:${userId}`).emit(event, payload);
}
//# sourceMappingURL=socketEmitter.js.map