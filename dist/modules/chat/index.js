"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketIO = exports.chatRoutes = exports.chatService = void 0;
var chat_service_1 = require("./chat.service");
Object.defineProperty(exports, "chatService", { enumerable: true, get: function () { return chat_service_1.chatService; } });
var chat_routes_1 = require("./chat.routes");
Object.defineProperty(exports, "chatRoutes", { enumerable: true, get: function () { return __importDefault(chat_routes_1).default; } });
var chat_socket_1 = require("./chat.socket");
Object.defineProperty(exports, "initializeSocketIO", { enumerable: true, get: function () { return chat_socket_1.initializeSocketIO; } });
//# sourceMappingURL=index.js.map