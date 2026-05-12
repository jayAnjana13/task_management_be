import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
declare const projectUsers: Map<string, Set<string>>;
export declare function initializeSocketIO(httpServer: HttpServer): SocketServer;
export { projectUsers };
//# sourceMappingURL=chat.socket.d.ts.map