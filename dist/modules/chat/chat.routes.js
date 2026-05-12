"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController = __importStar(require("./chat.controller"));
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const cache_1 = require("../../middleware/cache");
const validation_1 = require("../../utils/validation");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Param validation schemas
const projectIdParamSchema = zod_1.z.object({
    projectId: validation_1.uuidSchema,
});
const directMessageParamSchema = zod_1.z.object({
    projectId: validation_1.uuidSchema,
    memberId: validation_1.uuidSchema,
});
const messageIdParamSchema = zod_1.z.object({
    id: validation_1.uuidSchema,
});
// Get messages for a project
router.get('/projects/:projectId/messages', (0, validate_1.validateParams)(projectIdParamSchema), (0, cache_1.cacheMiddleware)({ ttl: 10, keyPrefix: 'chat:messages' }), chatController.getMessages);
// Create message in a project
router.post('/projects/:projectId/messages', (0, validate_1.validateParams)(projectIdParamSchema), (0, validate_1.validateBody)(validation_1.createMessageSchema), chatController.createMessage);
// Get direct messages between current user and a project member
router.get('/projects/:projectId/direct/:memberId/messages', (0, validate_1.validateParams)(directMessageParamSchema), chatController.getDirectMessages);
// Send direct message to a project member
router.post('/projects/:projectId/direct/:memberId/messages', (0, validate_1.validateParams)(directMessageParamSchema), (0, validate_1.validateBody)(validation_1.createMessageSchema), chatController.createDirectMessage);
// Get single message
router.get('/messages/:id', (0, validate_1.validateParams)(messageIdParamSchema), chatController.getMessageById);
// Update message
router.patch('/messages/:id', (0, validate_1.validateParams)(messageIdParamSchema), (0, validate_1.validateBody)(validation_1.updateMessageSchema), chatController.updateMessage);
// Delete message
router.delete('/messages/:id', (0, validate_1.validateParams)(messageIdParamSchema), chatController.deleteMessage);
// Admin routes - view any project's chat
router.get('/admin/projects/:projectId/messages', (0, auth_1.authorize)('admin'), (0, validate_1.validateParams)(projectIdParamSchema), (0, cache_1.cacheMiddleware)({ ttl: 10, keyPrefix: 'admin:chat:messages' }), chatController.getMessagesAdmin);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map