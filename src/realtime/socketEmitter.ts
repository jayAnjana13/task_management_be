import { Server as SocketServer } from 'socket.io';

let socketServer: SocketServer | null = null;

export function setSocketServer(io: SocketServer): void {
  socketServer = io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!socketServer) {
    return;
  }

  socketServer.to(`user:${userId}`).emit(event, payload);
}
