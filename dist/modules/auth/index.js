"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = exports.authService = void 0;
var auth_service_1 = require("./auth.service");
Object.defineProperty(exports, "authService", { enumerable: true, get: function () { return auth_service_1.authService; } });
var auth_routes_1 = require("./auth.routes");
Object.defineProperty(exports, "authRoutes", { enumerable: true, get: function () { return __importDefault(auth_routes_1).default; } });
//# sourceMappingURL=index.js.map